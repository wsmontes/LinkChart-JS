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
        this.cy = null; // Cytoscape instance
        this.sourceNodes = {};
        this.sourceLinks = [];
    }
    
    /**
     * Initialize the component
     */
    init() {
        // Convert the source grid to a cytoscape container
        this.sourceGrid.innerHTML = '';
        this.sourceGrid.style.height = '100%';
        
        // Initialize Cytoscape
        this.initCytoscape();
        
        // Setup default data sources
        this.setupDefaultDataSources();
    }
    
    /**
     * Initialize Cytoscape instance for sources visualization
     */
    initCytoscape() {
        this.cy = cytoscape({
            container: this.sourceGrid,
            style: [
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'color': '#fff',
                        'font-size': '12px',
                        'text-valign': 'bottom',
                        'text-margin-y': '10px',
                        'background-color': 'data(color)',
                        'border-width': 2,
                        'border-color': '#fff',
                        'border-opacity': 0.7,
                        'width': 80,
                        'height': 80
                    }
                },
                {
                    selector: 'node[type="imported"]',
                    style: {
                        'text-background-color': '#f8f9fa',
                        'text-background-opacity': 0.8,
                        'text-background-padding': '3px',
                        'text-background-shape': 'roundrectangle'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#ccc',
                        'curve-style': 'bezier',
                        'opacity': 0.6
                    }
                },
                {
                    selector: ':selected',
                    style: {
                        'border-width': 4,
                        'border-color': '#3498db'
                    }
                }
                // Removing the invalid node:hover selector
                // Instead, we'll use the mouseover/mouseout event handlers below
            ],
            layout: {
                name: 'cose',
                fit: true,
                padding: 50,
                nodeOverlap: 20,
                idealEdgeLength: 150,
                edgeElasticity: 100,
                animate: true
            }
        });
        
        // Handle click events on nodes
        this.cy.on('tap', 'node', (event) => {
            const sourceId = event.target.id();
            this.openDataSource(sourceId);
        });
        
        // Add mouse interaction
        this.cy.on('mouseover', 'node', (event) => {
            const node = event.target;
            node.style({
                'border-width': 3,
                'border-color': '#3498db'
            });
        });
        
        this.cy.on('mouseout', 'node', (event) => {
            const node = event.target;
            if (!node.selected()) {
                node.style({
                    'border-width': 2,
                    'border-color': '#fff'
                });
            }
        });
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
            color: '#3498db',
            position: { x: 0, y: -150 }
        });
        
        this.addDataSource({
            id: 'csv-import',
            name: 'CSV Import',
            type: 'file',
            icon: 'fa-file-csv',
            color: '#2ecc71',
            position: { x: -150, y: 0 }
        });
        
        this.addDataSource({
            id: 'json-import',
            name: 'JSON Import',
            type: 'file',
            icon: 'fa-file-code',
            color: '#e74c3c',
            position: { x: 0, y: 150 }
        });
        
        this.addDataSource({
            id: 'api-import',
            name: 'API Connection',
            type: 'api',
            icon: 'fa-cloud',
            color: '#9b59b6',
            position: { x: 150, y: 0 }
        });
        
        this.addDataSource({
            id: 'excel-import',
            name: 'Excel Import',
            type: 'file',
            icon: 'fa-file-excel',
            color: '#f39c12',
            position: { x: -100, y: -100 }
        });
        
        this.addDataSource({
            id: 'database-connection',
            name: 'Database',
            type: 'database',
            icon: 'fa-database',
            color: '#16a085',
            position: { x: 100, y: 100 }
        });
        
        // Apply layout
        this.applyLayout();
    }
    
    /**
     * Apply layout to the source chart
     * @param {string} layoutName - Name of the layout to apply
     */
    applyLayout(layoutName = 'cose') {
        const layout = this.cy.layout({ 
            name: layoutName,
            fit: true,
            padding: 50,
            animate: true,
            animationDuration: 500,
            randomize: false, // Use existing positions if available
            nodeOverlap: 20,
            idealEdgeLength: 150,
        });
        layout.run();
    }
    
    /**
     * Add a data source
     * @param {Object} source - Source configuration
     */
    addDataSource(source) {
        // Add to state
        this.parent.state.dataSources[source.id] = source;
        
        // Create node for the source
        const badge = source.type === 'imported' && source.metadata && source.metadata.entityCount 
            ? `${source.metadata.entityCount} entities` 
            : '';
        
        // Add to Cytoscape
        const node = {
            group: 'nodes',
            data: {
                id: source.id,
                label: source.name,
                type: source.type,
                color: source.color,
                icon: source.icon,
                badge: badge
            },
            position: source.position || { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 }
        };
        
        this.cy.add(node);
        this.sourceNodes[source.id] = node;
        
        // If this is an imported data source, add links to the parent sources
        if (source.type === 'imported' && source.parentSource) {
            const edge = {
                group: 'edges',
                data: {
                    id: `edge-${source.parentSource}-${source.id}`,
                    source: source.parentSource,
                    target: source.id
                }
            };
            this.cy.add(edge);
            this.sourceLinks.push(edge);
        }
        
        // Update items count
        this.parent.updateItemCount(Object.keys(this.parent.state.dataSources).length);
        
        // Add icon to the node
        this.addIconToNode(source);
        
        return node;
    }
    
    /**
     * Add icon to source node
     * @param {Object} source - Source configuration
     */
    addIconToNode(source) {
        // Use afterRender event to add custom HTML to the node
        const node = this.cy.getElementById(source.id);
        if (!node || !node.length) return;
        
        // Use Cytoscape's built-in background-image property for the icon
        node.style({
            'background-image': this.getIconDataUrl(source.icon, source.color),
            'background-fit': 'cover',
            'background-width': '50%',
            'background-height': '50%',
            'background-position-x': '50%',
            'background-position-y': '40%'
        });
        
        // If this source has a badge (imported data), add it
        if (source.type === 'imported' && source.metadata && source.metadata.entityCount) {
            // Add badge as overlay (handled by CSS)
            node.addClass('has-badge');
            node.data('badgeText', `${source.metadata.entityCount}`);
        }
    }
    
    /**
     * Get data URL for an icon
     * @param {string} iconClass - FontAwesome icon class
     * @param {string} color - Color for the icon
     * @returns {string} Data URL for the icon
     */
    getIconDataUrl(iconClass, color) {
        // Create a canvas to draw the icon
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Load FontAwesome CSS if not already loaded
        const faStyle = document.querySelector('link[href*="font-awesome"]');
        if (!faStyle) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css';
            document.head.appendChild(link);
        }
        
        // Draw icon (approximate solution - in a real app we'd use a proper icon rendering library)
        ctx.fillStyle = color || '#ffffff';
        ctx.font = '32px "Font Awesome 5 Free"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Use a base icon (text representation) - not ideal but works as fallback
        let iconChar = '';
        
        // Map common FontAwesome icons to characters
        const iconMap = {
            'fa-hdd': '\uf0A0',
            'fa-file-csv': '\uf6DD',
            'fa-file-code': '\uf1C9',
            'fa-cloud': '\uf0C2',
            'fa-file-excel': '\uf1C3',
            'fa-database': '\uf1C0',
            'fa-table': '\uf0CE'
        };
        
        iconChar = iconMap[iconClass] || '\uf059'; // Default to question mark
        
        ctx.fillText(iconChar, 32, 32);
        
        return canvas.toDataURL();
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
                // Create imported data source node linked to the parent
                const importedSourceId = `imported-${sourceId}-${Date.now()}`;
                this.addDataSource({
                    id: importedSourceId,
                    name: `Imported Data (${result.entities.length} items)`,
                    type: 'imported',
                    icon: 'fa-table',
                    color: source.color,
                    parentSource: sourceId,
                    metadata: {
                        imported: new Date().toISOString(),
                        entityCount: result.entities.length,
                        linkCount: result.links ? result.links.length : 0,
                        fileType: fileType
                    }
                });
                
                // Apply layout to show the connection
                this.applyLayout();
                
                // Load the entities
                universalViewerController.loadEntities(importedSourceId, result.entities);
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
            // Show all nodes
            this.cy.nodes().removeClass('filtered');
            return;
        }
        
        term = term.toLowerCase();
        
        // Filter nodes
        this.cy.nodes().forEach(node => {
            const label = node.data('label').toLowerCase();
            const type = node.data('type').toLowerCase();
            
            if (label.includes(term) || type.includes(term)) {
                node.removeClass('filtered');
            } else {
                node.addClass('filtered');
            }
        });
    }
    
    /**
     * Handle view mode change
     */
    onViewModeChange() {
        // Toggle between different layouts
        if (this.currentLayout === 'cose') {
            this.applyLayout('grid');
            this.currentLayout = 'grid';
        } else {
            this.applyLayout('cose');
            this.currentLayout = 'cose';
        }
    }
}
