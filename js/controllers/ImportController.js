/**
 * Controller managing import operations
 */
class ImportController {
    constructor(graphController) {
        this.graphController = graphController;
        this.setupEventListeners();
        this.importInProgress = false;
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Main import data event - now routes to UniversalViewer
        eventBus.on('import:data', (data) => {
            // If the merge flag is true, we'll process at the graph level
            if (data.merge) {
                this.importData(data.data, data.merge);
            }
            // Otherwise, data is automatically sent to universalViewerController via event bus
            // Our DataProcessorModule will intercept this event before it reaches the universalViewerController
        });
        
        // Show import file type modal
        eventBus.on('import:showModal', (importType) => {
            importModal.showImportModal(importType || 'file');
        });
        
        // Progress tracking events
        eventBus.on('import:progress', (data) => {
            this.updateImportProgress(data.message, data.percentage);
        });
        
        // Error handling
        eventBus.on('import:error', (error) => {
            this.handleImportError(error);
        });
        
        // Graph creation from UniversalViewer
        eventBus.on('graph:create', (data) => {
            this.createGraphFromSelection(data);
        });
    }
    
    /**
     * Import data into the graph (used for merging into existing graph)
     * @param {Object} data - Data containing entities and links
     * @param {boolean} merge - Whether to merge with existing data
     */
    importData(data, merge = false) {
        try {
            // Clear existing data if not merging
            if (!merge) {
                this.graphController.clearGraph();
            }
            
            // Track progress
            let entitiesImported = 0;
            const totalEntities = Object.keys(data.entities || {}).length;
            
            // Import entities
            if (data.entities) {
                Object.values(data.entities).forEach((entity, index) => {
                    // Check if entity already exists when merging
                    if (merge && this.graphController.entities[entity.id]) {
                        // Update existing entity
                        const existingEntity = this.graphController.entities[entity.id];
                        existingEntity.label = entity.label;
                        existingEntity.properties = { ...existingEntity.properties, ...entity.properties };
                        
                        // Update in view
                        this.graphController.graphView.updateNode(entity.id, {
                            label: existingEntity.label,
                            properties: existingEntity.properties
                        });
                    } else {
                        // Create proper Entity instance if needed
                        if (!(entity instanceof Entity)) {
                            entity = new Entity(
                                entity.id,
                                entity.type,
                                entity.label,
                                entity.position,
                                entity.properties
                            );
                        }
                        
                        // Add new entity
                        this.graphController.addExistingEntity(entity);
                    }
                    
                    // Update progress every 10 entities
                    entitiesImported++;
                    if (entitiesImported % 10 === 0 || entitiesImported === totalEntities) {
                        eventBus.emit('import:progress', {
                            message: `Importing entities (${entitiesImported}/${totalEntities})`,
                            percentage: Math.round((entitiesImported / totalEntities) * 100)
                        });
                    }
                });
            }
            
            // Track link progress
            let linksImported = 0;
            const totalLinks = Object.keys(data.links || {}).length;
            
            // Import links
            if (data.links) {
                Object.values(data.links).forEach((link, index) => {
                    // Skip links that reference non-existent entities
                    if (!this.graphController.entities[link.source] || 
                        !this.graphController.entities[link.target]) {
                        console.warn(`Skipping link ${link.id} - missing source or target entity`);
                        return;
                    }
                    
                    // Check if link already exists when merging
                    if (merge && this.graphController.links[link.id]) {
                        // Update existing link
                        const existingLink = this.graphController.links[link.id];
                        existingLink.properties = { ...existingLink.properties, ...link.properties };
                        
                        // Update in view
                        this.graphController.graphView.updateEdge(link.id, {
                            properties: existingLink.properties
                        });
                    } else {
                        // Create proper Link instance if needed
                        if (!(link instanceof Link)) {
                            link = new Link(
                                link.id,
                                link.source,
                                link.target,
                                link.type,
                                link.properties
                            );
                        }
                        
                        // Add new link
                        this.graphController.addExistingLink(link);
                    }
                    
                    // Update progress every 10 links
                    linksImported++;
                    if (linksImported % 10 === 0 || linksImported === totalLinks) {
                        eventBus.emit('import:progress', {
                            message: `Importing links (${linksImported}/${totalLinks})`,
                            percentage: Math.round((linksImported / totalLinks) * 100)
                        });
                    }
                });
            }
            
            // Apply layout if new data was added
            if (Object.keys(data.entities || {}).length > 0 || 
                Object.keys(data.links || {}).length > 0) {
                this.graphController.graphView.applyLayout('cose');
                eventBus.emit('import:complete', {
                    entities: entitiesImported,
                    links: linksImported
                });
                
                // Display success notification
                this.showNotification(
                    'success', 
                    `Import completed: ${entitiesImported} entities and ${linksImported} links imported successfully.`
                );
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            eventBus.emit('import:error', error);
            return false;
        }
    }
    
    /**
     * Create a graph from data selected in the Universal Viewer
     * @param {Object} data - Data containing selected entities and links
     */
    createGraphFromSelection(data) {
        try {
            // Clear existing graph
            this.graphController.clearGraph();
            
            // Track progress
            let entitiesImported = 0;
            const totalEntities = Object.keys(data.entities || {}).length;
            
            // Import entities
            if (data.entities) {
                Object.values(data.entities).forEach((entity, index) => {
                    // Create proper Entity instance
                    const graphEntity = new Entity(
                        entity.id,
                        entity.type,
                        entity.label,
                        { x: 100 + (index % 5) * 100, y: 100 + Math.floor(index / 5) * 100 }, // Set initial positions in a grid
                        entity.properties
                    );
                    
                    // Add entity to graph
                    this.graphController.addExistingEntity(graphEntity);
                    
                    // Update progress every 10 entities
                    entitiesImported++;
                    if (entitiesImported % 10 === 0 || entitiesImported === totalEntities) {
                        eventBus.emit('import:progress', {
                            message: `Creating entities (${entitiesImported}/${totalEntities})`,
                            percentage: Math.round((entitiesImported / totalEntities) * 100)
                        });
                    }
                });
            }
            
            // Track link progress
            let linksImported = 0;
            const totalLinks = Object.keys(data.links || {}).length;
            
            // Import links
            if (data.links) {
                Object.values(data.links).forEach((link, index) => {
                    // Skip links that reference non-existent entities
                    if (!this.graphController.entities[link.source] || 
                        !this.graphController.entities[link.target]) {
                        console.warn(`Skipping link ${link.id} - missing source or target entity`);
                        return;
                    }
                    
                    // Create proper Link instance
                    const graphLink = new Link(
                        link.id,
                        link.source,
                        link.target,
                        link.type,
                        link.properties
                    );
                    
                    // Add link to graph
                    this.graphController.addExistingLink(graphLink);
                    
                    // Update progress
                    linksImported++;
                    if (linksImported % 10 === 0 || linksImported === totalLinks) {
                        eventBus.emit('import:progress', {
                            message: `Creating links (${linksImported}/${totalLinks})`,
                            percentage: Math.round((linksImported / totalLinks) * 100)
                        });
                    }
                });
            }
            
            // Apply layout
            this.graphController.graphView.applyLayout('cose');
            
            // Display success notification
            this.showNotification(
                'success', 
                `Link chart created with ${entitiesImported} entities and ${linksImported} links.`
            );
            
            return true;
        } catch (error) {
            console.error('Error creating graph:', error);
            eventBus.emit('import:error', error);
            return false;
        }
    }
    
    /**
     * Update import progress
     * @param {string} message - Progress message
     * @param {number} percentage - Progress percentage
     */
    updateImportProgress(message, percentage) {
        // Create or update progress bar if not exists
        let progressContainer = document.getElementById('import-progress-container');
        
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'import-progress-container';
            progressContainer.className = 'position-fixed bottom-0 start-0 p-3 w-100';
            progressContainer.style.zIndex = '1050';
            
            progressContainer.innerHTML = `
                <div class="toast show w-100" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header">
                        <strong class="me-auto">Importing Data</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        <p id="import-message">${message}</p>
                        <div class="progress">
                            <div id="import-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated" 
                                role="progressbar" style="width: ${percentage}%;" 
                                aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
                                ${percentage}%
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(progressContainer);
            
            // Set up close button
            const closeBtn = progressContainer.querySelector('.btn-close');
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(progressContainer);
            });
        } else {
            // Update existing progress
            document.getElementById('import-message').textContent = message;
            const progressBar = document.getElementById('import-progress-bar');
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
            progressBar.textContent = `${percentage}%`;
            
            // Auto-remove when complete
            if (percentage >= 100) {
                setTimeout(() => {
                    if (progressContainer.parentNode) {
                        progressContainer.parentNode.removeChild(progressContainer);
                    }
                }, 2000);
            }
        }
    }
    
    /**
     * Handle import errors
     * @param {Error} error - The error object
     */
    handleImportError(error) {
        console.error('Import error:', error);
        this.showNotification('error', `Import failed: ${error.message}`);
    }
    
    /**
     * Show notification toast
     * @param {string} type - Notification type ('success', 'error', etc.)
     * @param {string} message - Notification message
     */
    showNotification(type, message) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1050';
        
        const bgColor = type === 'success' ? 'bg-success' : 
                        type === 'error' ? 'bg-danger' : 
                        'bg-primary';
        
        toastContainer.innerHTML = `
            <div class="toast align-items-center text-white ${bgColor} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        document.body.appendChild(toastContainer);
        
        const toastElement = toastContainer.querySelector('.toast');
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        
        toast.show();
        
        // Remove from DOM after hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(toastContainer);
        });
    }
}
