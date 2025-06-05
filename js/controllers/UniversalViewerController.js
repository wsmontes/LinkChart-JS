/**
 * Controller for managing the Universal Viewer component
 */
class UniversalViewerController {
    /**
     * Initialize the Universal Viewer controller
     * @param {HTMLElement} containerElement - The container element for the Universal Viewer
     */
    constructor(containerElement = 'universal-viewer-container') {
        // Initialize the Universal Viewer component
        this.viewer = new UniversalViewer(containerElement);
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for import:data events and redirect to Universal Viewer
        eventBus.on('import:data', (data) => {
            this.processImportedData(data.data, data.sourceId || 'import');
        });
        
        // Listen for import:complete events from import modal
        eventBus.on('import:complete', (result) => {
            if (result && result.entities) {
                const sourceId = result.sourceId || 'import';
                this.loadEntities(sourceId, result.entities, result.links);
            }
        });
    }
    
    /**
     * Process imported data and route to Universal Viewer
     * @param {Object} data - The imported data with entities and links
     * @param {string} sourceId - ID of the data source
     */
    processImportedData(data, sourceId) {
        // Add imported data as a data source if it doesn't exist
        this.addImportedDataSource(sourceId, data);
        
        // Extract entities from the imported data
        const entities = Object.values(data.entities || {}).map(entity => {
            // Convert to Universal Viewer entity format if needed
            return {
                id: entity.id,
                type: entity.type,
                label: entity.label,
                properties: entity.properties || {},
                sourceId: sourceId,
                sourceName: this.viewer.state.dataSources[sourceId]?.name || 'Import',
                sourceColor: this.viewer.state.dataSources[sourceId]?.color || '#999'
            };
        });
        
        // Extract links for potential use in relationship viewer
        const links = Object.values(data.links || {});
        
        // Load the entities into the Universal Viewer
        this.loadEntities(sourceId, entities, links);
    }
    
    /**
     * Add imported data as a data source with appropriate icon
     * @param {string} sourceId - ID of the data source
     * @param {Object} data - The imported data
     */
    addImportedDataSource(sourceId, data) {
        // Skip if this data source already exists
        if (this.viewer.state.dataSources[sourceId]) return;
        
        // Create an appropriate name
        let name = 'Imported Data';
        if (sourceId === 'json-import') name = 'JSON Import';
        else if (sourceId === 'csv-import') name = 'CSV Import';
        else if (sourceId === 'excel-import') name = 'Excel Import';
        else if (sourceId === 'graphml-import') name = 'GraphML Import';
        else if (sourceId === 'gexf-import') name = 'GEXF Import';
        else if (sourceId === 'api-import') name = 'API Import';
        
        // Get entity count
        const entityCount = Object.keys(data.entities || {}).length;
        const linkCount = Object.keys(data.links || {}).length;
        
        // Create data source configuration with table icon
        const dataSource = {
            id: sourceId,
            name: name,
            type: 'imported',
            icon: 'fa-table',
            color: this.getColorForSourceId(sourceId),
            metadata: {
                imported: new Date().toISOString(),
                entityCount,
                linkCount
            }
        };
        
        // Add the data source to the viewer
        this.viewer.sourcesViewer.addDataSource(dataSource);
    }
    
    /**
     * Get color for source ID
     * @param {string} sourceId - Source ID
     * @returns {string} Color hex code
     */
    getColorForSourceId(sourceId) {
        const colorMap = {
            'json-import': '#e74c3c',
            'csv-import': '#2ecc71',
            'excel-import': '#f39c12',
            'graphml-import': '#3498db',
            'gexf-import': '#9b59b6',
            'api-import': '#1abc9c'
        };
        
        return colorMap[sourceId] || '#34495e';
    }
    
    /**
     * Load entities into the Universal Viewer
     * @param {string} sourceId - ID of the data source
     * @param {Array} entities - Array of entities to load
     * @param {Array} links - Array of links to load (optional)
     */
    loadEntities(sourceId, entities, links = []) {
        // Add entities to the Universal Viewer's state
        this.viewer.state.allEntities = [...this.viewer.state.allEntities, ...entities];
        
        // Analyze relationships if links are provided
        if (links.length > 0) {
            this.viewer.relationshipsViewer.incorporateExistingLinks(links);
        }
        
        // Populate the entity table in the entities viewer
        this.viewer.entitiesViewer.populateEntityTable(this.viewer.state.allEntities);
        
        // Enable entities tab in breadcrumb
        this.viewer.enableBreadcrumb('entities');
        
        // Switch to entities view
        this.viewer.switchView('entities');
        
        // Setup filters
        this.viewer.entitiesViewer.setupFilters();
        
        // Analyze relationships
        this.viewer.relationshipsViewer.analyzeRelationships(this.viewer.state.allEntities);
        
        // Show notification
        this.showNotification(`Loaded ${entities.length} entities from ${this.viewer.state.dataSources[sourceId]?.name || 'Import'}`);
    }
    
    /**
     * Generate a link chart from selected data in the Universal Viewer
     * @param {Object} selectedData - Object with selected entities and links
     */
    generateLinkChart(selectedData) {
        // Check if we have selected entities
        if (Object.keys(selectedData.entities).length === 0) {
            alert('Please select one or more entities to generate a link chart.');
            return;
        }
        
        // Send the data to the graph controller to create a link chart
        eventBus.emit('graph:create', {
            entities: selectedData.entities,
            links: selectedData.links || {}
        });
        
        // Show notification
        this.showNotification(`Generated link chart with ${Object.keys(selectedData.entities).length} entities.`);
    }
    
    /**
     * Open API connection modal for data import
     * @param {string} sourceId - ID of the data source
     */
    openApiConnectionModal(sourceId) {
        // Create modal for API import
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'apiConnectionModal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">API Connection</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="apiUrl" class="form-label">API URL</label>
                            <input type="text" class="form-control" id="apiUrl" placeholder="https://api.example.com/data">
                        </div>
                        <div class="mb-3">
                            <label for="apiKey" class="form-label">API Key (optional)</label>
                            <input type="password" class="form-control" id="apiKey">
                        </div>
                        <div class="mb-3">
                            <label for="apiMethod" class="form-label">Method</label>
                            <select class="form-select" id="apiMethod">
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="apiBody" class="form-label">Request Body (for POST)</label>
                            <textarea class="form-control" id="apiBody" rows="4"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="fetchApiBtn">Fetch Data</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize the modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        // Add fetch functionality
        document.getElementById('fetchApiBtn').addEventListener('click', async () => {
            const url = document.getElementById('apiUrl').value.trim();
            const apiKey = document.getElementById('apiKey').value.trim();
            const method = document.getElementById('apiMethod').value;
            const body = document.getElementById('apiBody').value;
            
            if (!url) {
                alert('Please enter an API URL.');
                return;
            }
            
            try {
                const headers = new Headers();
                if (apiKey) {
                    headers.append('Authorization', `Bearer ${apiKey}`);
                }
                headers.append('Content-Type', 'application/json');
                
                const response = await fetch(url, {
                    method,
                    headers,
                    body: method === 'POST' ? body : undefined
                });
                
                if (!response.ok) {
                    throw new Error(`API responded with status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Process imported data
                this.handleApiData(data, sourceId);
                
                // Close modal
                modalInstance.hide();
            } catch (error) {
                alert(`Error fetching data: ${error.message}`);
            }
        });
        
        // Remove modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }
    
    /**
     * Handle data received from API
     * @param {Object} data - Data received from API
     * @param {string} sourceId - ID of the data source
     */
    handleApiData(data, sourceId) {
        // Try to determine the data structure
        let entities = [];
        
        // Check if data is an array
        if (Array.isArray(data)) {
            entities = data.map((item, index) => this.convertToEntity(item, index, sourceId));
        } 
        // Check if data has a nodes/entities property
        else if (data.nodes || data.entities) {
            const items = data.nodes || data.entities;
            entities = Array.isArray(items) ? 
                items.map((item, index) => this.convertToEntity(item, index, sourceId)) :
                Object.values(items).map((item, index) => this.convertToEntity(item, index, sourceId));
        }
        // Try to extract from data object directly
        else if (typeof data === 'object') {
            entities = Object.values(data).map((item, index) => this.convertToEntity(item, index, sourceId));
        }
        
        // Extract links if available
        let links = [];
        if (data.edges || data.links) {
            links = Object.values(data.edges || data.links || {});
        }
        
        // Load the entities into the Universal Viewer
        this.loadEntities(sourceId, entities, links);
    }
    
    /**
     * Convert an object to entity format
     * @param {Object} item - Data item
     * @param {number} index - Index of the item
     * @param {string} sourceId - ID of the data source
     * @returns {Object} Formatted entity
     */
    convertToEntity(item, index, sourceId) {
        // Try to determine entity type from data
        let type = 'person'; // Default type
        if (item.type) {
            type = item.type.toLowerCase();
        } else if (item.entityType) {
            type = item.entityType.toLowerCase();
        } else if (item.label && typeof item.label === 'string') {
            // Try to guess based on common words
            const label = item.label.toLowerCase();
            if (label.includes('company') || label.includes('corp') || label.includes('inc')) {
                type = 'organization';
            } else if (label.includes('street') || label.includes('ave') || label.includes('city')) {
                type = 'location';
            }
        }
        
        // Make sure type is a supported type
        if (!ENTITY_TYPES[type]) {
            type = 'person'; // Default to person if not recognized
        }
        
        // Get label
        let label = item.label || item.name || item.title || `Item ${index + 1}`;
        
        // Extract properties
        const properties = { ...item };
        delete properties.id;
        delete properties.type;
        delete properties.label;
        delete properties.name;
        
        return {
            id: item.id || `api_${sourceId}_${index}`,
            type,
            label,
            properties,
            sourceId: sourceId,
            sourceName: this.viewer.state.dataSources[sourceId]?.name || 'API Import',
            sourceColor: this.viewer.state.dataSources[sourceId]?.color || '#9b59b6'
        };
    }
    
    /**
     * Open database connection modal
     * @param {string} sourceId - ID of the data source
     */
    openDatabaseConnectionModal(sourceId) {
        // Create modal for database connection
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'databaseConnectionModal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Database Connection</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            This feature requires a server-side component to securely handle database connections.
                            Contact your administrator for details.
                        </div>
                        <div class="mb-3">
                            <label for="dbType" class="form-label">Database Type</label>
                            <select class="form-select" id="dbType">
                                <option value="mysql">MySQL</option>
                                <option value="postgres">PostgreSQL</option>
                                <option value="neo4j">Neo4j</option>
                                <option value="mongodb">MongoDB</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="connectionString" class="form-label">Connection String</label>
                            <input type="text" class="form-control" id="connectionString">
                        </div>
                        <div class="mb-3">
                            <label for="query" class="form-label">Query</label>
                            <textarea class="form-control" id="query" rows="4"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <div class="text-danger me-auto">⚠️ Database connections require server-side setup</div>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary disabled" id="connectDbBtn">Connect</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize the modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        // Remove modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }
    
    /**
     * Show notification
     * @param {string} message - Notification message
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'uv-notification';
        notification.innerHTML = `
            <div class="uv-notification-message">
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add styles
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#333';
        notification.style.color = 'white';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notification.style.zIndex = '9999';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        notification.style.transition = 'opacity 0.3s, transform 0.3s';
        
        // Show notification
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Hide and remove notification after 3s
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Create singleton instance
const universalViewerController = new UniversalViewerController();
