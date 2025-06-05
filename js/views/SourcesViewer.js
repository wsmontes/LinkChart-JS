/**
 * Component for displaying and interacting with data sources
 */
class SourcesViewer {
    /**
     * Initialize the sources viewer
     * @param {UniversalViewer} parent - Parent universal viewer
     */
    constructor(parent) {
        this.parent = parent;
        this.container = parent.container.querySelector('.uv-sources-view');
        this.sourceGrid = this.container.querySelector('.uv-source-grid');
    }
    
    /**
     * Initialize the component
     */
    init() {
        this.setupDefaultDataSources();
    }
    
    /**
     * Set up default data sources
     */
    setupDefaultDataSources() {
        // Add sample data sources
        this.addDataSource({
            id: 'local-storage',
            name: 'Local Storage',
            type: 'storage',
            icon: 'fa-hdd',
            color: '#3498db'
        });
        
        this.addDataSource({
            id: 'csv-import',
            name: 'CSV Import',
            type: 'file',
            icon: 'fa-file-csv',
            color: '#2ecc71'
        });
        
        this.addDataSource({
            id: 'json-import',
            name: 'JSON Import',
            type: 'file',
            icon: 'fa-file-code',
            color: '#e74c3c'
        });
        
        this.addDataSource({
            id: 'api-import',
            name: 'API Connection',
            type: 'api',
            icon: 'fa-cloud',
            color: '#9b59b6'
        });
        
        this.addDataSource({
            id: 'excel-import',
            name: 'Excel Import',
            type: 'file',
            icon: 'fa-file-excel',
            color: '#f39c12'
        });
        
        this.addDataSource({
            id: 'database-connection',
            name: 'Database',
            type: 'database',
            icon: 'fa-database',
            color: '#16a085'
        });
    }
    
    /**
     * Add a data source
     * @param {Object} source - Source configuration
     */
    addDataSource(source) {
        // Add to state
        this.parent.state.dataSources[source.id] = source;
        
        // Create UI element
        const sourceElement = document.createElement('div');
        sourceElement.className = 'uv-source-item';
        sourceElement.dataset.sourceId = source.id;
        
        // Create badge for data tables that have been imported
        let badge = '';
        if (source.type === 'imported' && source.metadata && source.metadata.entityCount) {
            badge = `<span class="uv-source-badge">${source.metadata.entityCount} entities</span>`;
        }
        
        sourceElement.innerHTML = `
            <div class="uv-source-icon" style="color: ${source.color}">
                <i class="fas ${source.icon}"></i>
            </div>
            <div class="uv-source-name">${source.name}</div>
            <div class="uv-source-type">${source.type}</div>
            ${badge}
        `;
        
        sourceElement.addEventListener('click', () => {
            this.openDataSource(source.id);
        });
        
        this.sourceGrid.appendChild(sourceElement);
        
        // Update items count
        this.parent.updateItemCount(Object.keys(this.parent.state.dataSources).length);
    }
    
    /**
     * Open a data source
     * @param {string} sourceId - Source ID
     */
    openDataSource(sourceId) {
        const source = this.parent.state.dataSources[sourceId];
        if (!source) return;
        
        // Handle different source types
        if (source.type === 'storage') {
            this.loadFromLocalStorage(sourceId);
        } else if (source.type === 'file') {
            this.showFileImportModal(sourceId);
        } else if (source.type === 'api') {
            this.showApiConnectionModal(sourceId);
        } else if (source.type === 'database') {
            this.showDatabaseConnectionModal(sourceId);
        } else if (source.type === 'imported') {
            // For imported data, switch to entities view and filter by source
            this.viewImportedData(sourceId);
        }
    }
    
    /**
     * View imported data by switching to entities view and filtering by source
     * @param {string} sourceId - Source ID
     */
    viewImportedData(sourceId) {
        // Filter entities from this source
        const filteredEntities = this.parent.state.allEntities.filter(entity => entity.sourceId === sourceId);
        
        // Switch to entities view
        this.parent.switchView('entities');
        
        // Apply filter for this source
        if (this.parent.entitiesViewer.setupSourceFilter) {
            this.parent.entitiesViewer.setupSourceFilter(sourceId);
        } else {
            // Fallback if setupSourceFilter doesn't exist
            this.parent.entitiesViewer.populateEntityTable(filteredEntities);
        }
    }
    
    /**
     * Load data from local storage
     * @param {string} sourceId - Source ID
     */
    loadFromLocalStorage(sourceId) {
        const data = storageService.loadFromLocalStorage();
        if (data && data.entities) {
            universalViewerController.loadEntities(sourceId, data.entities);
        } else {
            alert('No data found in local storage.');
        }
    }
    
    /**
     * Show file import modal
     * @param {string} sourceId - Source ID
     */
    showFileImportModal(sourceId) {
        const source = this.parent.state.dataSources[sourceId];
        let fileType = '';
        
        switch (sourceId) {
            case 'csv-import': fileType = 'csv'; break;
            case 'json-import': fileType = 'json'; break;
            case 'excel-import': fileType = 'excel'; break;
            default: fileType = 'file';
        }
        
        // Use the existing import modal with callback to load into Universal Viewer
        eventBus.once('import:complete', (result) => {
            if (result && result.entities) {
                universalViewerController.loadEntities(sourceId, result.entities);
            }
        });
        
        // Show import modal
        eventBus.emit('import:showModal', fileType);
    }
    
    /**
     * Show API connection modal
     * @param {string} sourceId - Source ID
     */
    showApiConnectionModal(sourceId) {
        universalViewerController.openApiConnectionModal(sourceId);
    }
    
    /**
     * Show database connection modal
     * @param {string} sourceId - Source ID
     */
    showDatabaseConnectionModal(sourceId) {
        universalViewerController.openDatabaseConnectionModal(sourceId);
    }
    
    /**
     * Apply search filtering to sources
     * @param {string} term - Search term
     */
    applySearch(term) {
        if (!term) {
            // Show all sources
            this.container.querySelectorAll('.uv-source-item').forEach(item => {
                item.style.display = 'block';
            });
            return;
        }
        
        term = term.toLowerCase();
        
        // Filter sources
        this.container.querySelectorAll('.uv-source-item').forEach(item => {
            const sourceName = item.querySelector('.uv-source-name').textContent.toLowerCase();
            const sourceType = item.querySelector('.uv-source-type').textContent.toLowerCase();
            
            if (sourceName.includes(term) || sourceType.includes(term)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    /**
     * Handle view mode change
     */
    onViewModeChange() {
        if (this.sourceGrid.classList.contains('grid-view')) {
            this.sourceGrid.classList.remove('grid-view');
            this.sourceGrid.classList.add('list-view');
        } else {
            this.sourceGrid.classList.remove('list-view');
            this.sourceGrid.classList.add('grid-view');
        }
    }
}
