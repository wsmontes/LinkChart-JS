/**
 * Controller managing the graph data and operations
 */
class GraphController {
    /**
     * Initialize the graph controller
     * @param {GraphView} graphView - The graph view instance
     */
    constructor(graphView) {
        this.graphView = graphView;
        this.entities = {}; // Map of entity ID to Entity object
        this.links = {};    // Map of link ID to Link object
        this.activeFilters = null;
        this.searchResults = [];
        this.highlightedPath = null;
        this.setupEventListeners();
        
        // Register with dataService
        dataService.setGraphController(this);
        
        // Initialize import controller
        this.importController = new ImportController(this);
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Entity and property management events
        eventBus.on('entity:update', (data) => {
            this.updateEntity(data.id, data.field, data.value);
        });
        
        eventBus.on('entity:property:rename', (data) => {
            this.renameEntityProperty(data.id, data.oldName, data.newName);
        });
        
        eventBus.on('entity:property:remove', (data) => {
            this.removeEntityProperty(data.id, data.name);
        });
        
        eventBus.on('entity:select', (id) => {
            this.selectEntity(id);
        });
        
        // Search and filter events
        eventBus.on('search:query', (data) => {
            const results = this.searchEntities(
                data.term,
                data.filters,
                data.fields
            );
            this.searchResults = results;
            data.callback(results);
        });
        
        eventBus.on('search:selectAll', () => {
            this.selectAllSearchResults();
        });
        
        eventBus.on('filter:apply', (filters) => {
            this.applyFilters(filters);
        });
        
        eventBus.on('filter:reset', () => {
            this.resetFilters();
        });
        
        // Investigation management events
        eventBus.on('investigation:new', () => {
            this.clearGraph();
        });
        
        eventBus.on('investigation:save', () => {
            const data = dataService.getInvestigationData();
            storageService.saveToLocalStorage(data);
            alert('Investigation saved successfully');
        });
        
        eventBus.on('investigation:open', () => {
            const data = storageService.loadFromLocalStorage();
            if (data) {
                dataService.loadInvestigationData(data);
                alert('Investigation loaded successfully');
            } else {
                alert('No saved investigation found');
            }
        });
        
        // Export events
        eventBus.on('export:json', () => {
            const data = dataService.getInvestigationData();
            storageService.exportAsJSON(data);
        });
        
        eventBus.on('export:csv', () => {
            storageService.exportAsCSV(this.entities, this.links);
        });
        
        eventBus.on('export:image', () => {
            storageService.exportAsImage(this.graphView.cy);
        });
        
        // Import events
        eventBus.on('import:file', () => {
            eventBus.emit('import:showModal', 'file');
        });
        
        eventBus.on('import:json', (file) => {
            if (file instanceof File) {
                this.handleJsonImport(file);
            } else {
                eventBus.emit('import:showModal', 'json');
            }
        });
        
        eventBus.on('import:csv', (data) => {
            if (data && data.entitiesFile) {
                this.handleCsvImport(data);
            } else {
                eventBus.emit('import:showModal', 'csv');
            }
        });
        
        eventBus.on('import:excel', () => {
            eventBus.emit('import:showModal', 'excel');
        });
        
        eventBus.on('import:graphml', () => {
            eventBus.emit('import:showModal', 'graphml');
        });
        
        eventBus.on('import:gexf', () => {
            eventBus.emit('import:showModal', 'gexf');
        });
        
        eventBus.on('import:cypher', () => {
            eventBus.emit('import:showModal', 'cypher');
        });
        
        eventBus.on('import:api', (data) => {
            this.handleApiImport(data);
        });
        
        // Analytics events
        eventBus.on('analytics:getData', (data) => {
            const stats = dataService.getGraphStatistics();
            data.callback(stats);
        });
        
        eventBus.on('analytics:getEntities', (data) => {
            const entityList = Object.values(this.entities).map(entity => ({
                id: entity.id,
                label: entity.label,
                type: entity.type
            }));
            data.callback(entityList);
        });
        
        eventBus.on('analytics:findPath', (data) => {
            const path = dataService.findPath(data.sourceId, data.targetId);
            data.callback(path, this.entities);
        });
        
        eventBus.on('graph:highlightPath', (path) => {
            this.highlightPath(path);
        });
        
        eventBus.on('graph:applyLayout', (layoutName) => {
            this.graphView.applyLayout(layoutName);
        });
        
        // Map view events
        eventBus.on('entity:getLocations', (data) => {
            const locations = this.getLocationEntities();
            data.callback(locations);
        });
        
        // Report events
        eventBus.on('report:generate', () => {
            this.generateReport();
        });
    }
    
    /**
     * Add a new entity to the graph
     * @param {string} type - Entity type
     * @param {Object} position - X,Y coordinates
     * @return {Entity} The created entity
     */
    addEntity(type, position) {
        const id = `entity_${Date.now()}`;
        const entity = new Entity(id, type, null, position);
        
        this.entities[id] = entity;
        this.graphView.addNode(entity);
        
        // Select the newly added entity
        this.selectEntity(id);
        
        return entity;
    }
    
    /**
     * Add an existing entity to the graph (used during import)
     * @param {Entity} entity - The entity to add
     */
    addExistingEntity(entity) {
        this.entities[entity.id] = entity;
        this.graphView.addNode(entity);
    }
    
    /**
     * Add a new link to the graph
     * @param {string} sourceId - Source entity ID
     * @param {string} targetId - Target entity ID
     * @param {string} type - Link type
     * @return {Link} The created link
     */
    addLink(sourceId, targetId, type) {
        const id = `link_${Date.now()}`;
        const link = new Link(id, sourceId, targetId, type);
        
        this.links[id] = link;
        this.graphView.addEdge(link);
        
        return link;
    }
    
    /**
     * Add an existing link to the graph (used during import)
     * @param {Link} link - The link to add
     */
    addExistingLink(link) {
        this.links[link.id] = link;
        this.graphView.addEdge(link);
    }
    
    /**
     * Update an entity
     * @param {string} id - Entity ID
     * @param {string} field - Field to update
     * @param {*} value - New value
     */
    updateEntity(id, field, value) {
        const entity = this.entities[id];
        if (!entity) return;
        
        if (field.startsWith('properties.')) {
            const propName = field.split('.')[1];
            entity.updateProperty(propName, value);
        } else {
            entity.updateProperty(field, value);
        }
        
        // Update view
        this.graphView.updateNode(id, {
            label: entity.label,
            properties: entity.properties
        });
    }
    
    /**
     * Rename an entity property
     * @param {string} id - Entity ID
     * @param {string} oldName - Old property name
     * @param {string} newName - New property name
     */
    renameEntityProperty(id, oldName, newName) {
        const entity = this.entities[id];
        if (!entity) return;
        
        if (oldName === newName) return;
        
        const value = entity.properties[oldName];
        delete entity.properties[oldName];
        entity.properties[newName] = value;
        
        // Update view
        this.graphView.updateNode(id, {
            properties: entity.properties
        });
    }
    
    /**
     * Remove an entity property
     * @param {string} id - Entity ID
     * @param {string} name - Property name
     */
    removeEntityProperty(id, name) {
        const entity = this.entities[id];
        if (!entity) return;
        
        delete entity.properties[name];
        
        // Update view
        this.graphView.updateNode(id, {
            properties: entity.properties
        });
    }
    
    /**
     * Remove an entity
     * @param {string} id - Entity ID
     */
    removeEntity(id) {
        delete this.entities[id];
        
        // Remove connected links
        Object.values(this.links).forEach(link => {
            if (link.source === id || link.target === id) {
                this.removeLink(link.id);
            }
        });
        
        // Remove from view
        this.graphView.removeElement(id);
    }
    
    /**
     * Remove a link
     * @param {string} id - Link ID
     */
    removeLink(id) {
        delete this.links[id];
        this.graphView.removeElement(id);
    }
    
    /**
     * Clear the entire graph
     */
    clearGraph() {
        this.entities = {};
        this.links = {};
        this.graphView.cy.elements().remove();
        
        // Show placeholder message
        const placeholder = document.querySelector('.placeholder-message');
        if (placeholder) {
            placeholder.style.display = 'block';
        }
    }
    
    /**
     * Select an entity in the graph
     * @param {string} id - Entity ID
     */
    selectEntity(id) {
        this.graphView.cy.elements().unselect();
        const node = this.graphView.cy.getElementById(id);
        if (node.length > 0) {
            node.select();
            
            // Center view on selected node
            this.graphView.cy.animate({
                center: {
                    eles: node
                },
                duration: 500
            });
        }
    }
    
    /**
     * Search entities based on criteria
     * @param {string} term - Search term
     * @param {Object} filters - Type filters
     * @param {Object} fields - Fields to search in
     * @returns {Array} Matching entities
     */
    searchEntities(term, filters, fields) {
        return Object.values(this.entities).filter(entity => {
            // Apply type filters
            if (entity.type === 'person' && !filters.filterPerson) return false;
            if (entity.type === 'organization' && !filters.filterOrg) return false;
            if (entity.type === 'location' && !filters.filterLoc) return false;
            if (!['person', 'organization', 'location'].includes(entity.type) && !filters.filterOther) return false;
            
            // If no search term, return all that match filters
            if (!term) return true;
            
            // Check name/label
            if (fields.searchName && entity.label.toLowerCase().includes(term)) {
                return true;
            }
            
            // Check description
            if (fields.searchDesc && 
                entity.properties.description && 
                entity.properties.description.toLowerCase().includes(term)) {
                return true;
            }
            
            // Check other properties
            if (fields.searchProps) {
                for (const [key, value] of Object.entries(entity.properties)) {
                    if (key !== 'description' && 
                        value && 
                        value.toString().toLowerCase().includes(term)) {
                        return true;
                    }
                }
            }
            
            return false;
        });
    }
    
    /**
     * Select all entities from the current search results
     */
    selectAllSearchResults() {
        this.graphView.cy.elements().unselect();
        
        if (this.searchResults.length > 0) {
            const nodesToSelect = this.searchResults.map(entity => 
                this.graphView.cy.getElementById(entity.id)
            );
            
            this.graphView.cy.collection(nodesToSelect).select();
            
            // Fit view to include all selected nodes
            this.graphView.cy.fit(this.graphView.cy.collection(nodesToSelect), 50);
        }
    }
    
    /**
     * Apply filters to the graph
     * @param {Object} filters - Filter settings
     */
    applyFilters(filters) {
        this.activeFilters = filters;
        
        // Reset all elements first
        this.graphView.cy.elements().removeClass('filtered');
        
        // Filter by entity type
        for (const [type, visible] of Object.entries(filters.entityTypes)) {
            if (!visible) {
                this.graphView.cy.nodes(`[type="${type}"]`).addClass('filtered');
            }
        }
        
        // Filter by link type
        for (const [type, visible] of Object.entries(filters.linkTypes)) {
            if (!visible) {
                this.graphView.cy.edges(`[type="${type}"]`).addClass('filtered');
            }
        }
        
        // Apply connection degree filter
        if (filters.degree > 1) {
            const nodesByDegree = this.getNodesByDegree(filters.degree);
            this.graphView.cy.nodes().difference(nodesByDegree).addClass('filtered');
        }
        
        // Apply date range filter if applicable
        if (filters.dateRange.from || filters.dateRange.to) {
            this.filterByDateRange(filters.dateRange.from, filters.dateRange.to);
        }
        
        // Handle disconnected entities
        if (!filters.showDisconnected) {
            const disconnectedNodes = this.graphView.cy.nodes().filter(node => {
                return node.connectedEdges().length === 0;
            });
            disconnectedNodes.addClass('filtered');
        }
        
        // Add CSS for filtered elements
        const style = document.createElement('style');
        style.textContent = `
            .filtered {
                opacity: 0.1;
                transition: opacity 0.3s;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Get nodes with connection degree >= minDegree
     * @param {number} minDegree - Minimum connection degree
     * @returns {cytoscape.Collection} Collection of nodes
     */
    getNodesWithMinDegree(minDegree) {
        return this.graphView.cy.nodes().filter(node => {
            return node.connectedEdges().length >= minDegree;
        });
    }
    
    /**
     * Filter nodes by date range
     * @param {string} fromDate - Start date (YYYY-MM-DD)
     * @param {string} toDate - End date (YYYY-MM-DD)
     */
    filterByDateRange(fromDate, toDate) {
        // Convert to timestamps for comparison
        const fromTimestamp = fromDate ? new Date(fromDate).getTime() : 0;
        const toTimestamp = toDate ? new Date(toDate).getTime() : Infinity;
        
        this.graphView.cy.nodes().forEach(node => {
            // Focus on event types and entities with date properties
            if (node.data('type') === 'event' || 
                (node.data('properties') && 
                 (node.data('properties').date || 
                  node.data('properties').timestamp))) {
                
                let nodeDate = node.data('properties').date || node.data('properties').timestamp;
                if (!nodeDate) return;
                
                // Convert to timestamp
                let nodeTimestamp;
                if (typeof nodeDate === 'string') {
                    nodeTimestamp = new Date(nodeDate).getTime();
                } else {
                    nodeTimestamp = nodeDate;
                }
                
                // Filter if outside range
                if (nodeTimestamp < fromTimestamp || nodeTimestamp > toTimestamp) {
                    node.addClass('filtered');
                }
            }
        });
    }
    
    /**
     * Reset all filters
     */
    resetFilters() {
        this.activeFilters = null;
        this.graphView.cy.elements().removeClass('filtered');
    }
    
    /**
     * Get all location entities that have valid coordinates
     * @returns {Array} Array of location entities
     */
    getLocationEntities() {
        return Object.values(this.entities).filter(entity => {
            // Include all location type entities
            if (entity.type === 'location') {
                const props = entity.properties;
                // Check if it has valid coordinates
                const hasLat = props.latitude !== undefined || props.lat !== undefined;
                const hasLng = props.longitude !== undefined || props.lng !== undefined;
                return hasLat && hasLng;
            }
            // Also include other entities that might have geo coordinates
            const props = entity.properties;
            if ((props.latitude !== undefined || props.lat !== undefined) &&
                (props.longitude !== undefined || props.lng !== undefined)) {
                return true;
            }
            return false;
        });
    }
    
    /**
     * Highlight a path in the graph
     * @param {Array} path - Array of entity IDs forming the path
     */
    highlightPath(path) {
        // Clear any previous highlight
        if (this.highlightedPath) {
            this.graphView.cy.elements().removeClass('highlighted dimmed');
        }
        
        if (!path || path.length < 2) return;
        
        // Dim all elements
        this.graphView.cy.elements().addClass('dimmed');
        
        // Create collection of highlighted nodes
        const nodes = path.map(id => this.graphView.cy.getElementById(id));
        
        // Highlight nodes
        this.graphView.cy.collection(nodes).removeClass('dimmed').addClass('highlighted');
        
        // Highlight edges between consecutive nodes in path
        for (let i = 0; i < path.length - 1; i++) {
            const sourceId = path[i];
            const targetId = path[i + 1];
            
            // Find edge between these nodes (in either direction)
            const edge = this.graphView.cy.edges().filter(edge => {
                const source = edge.source().id();
                const target = edge.target().id();
                return (source === sourceId && target === targetId) ||
                       (source === targetId && target === sourceId);
            });
            
            edge.removeClass('dimmed').addClass('highlighted');
        }
        
        // Fit view to show highlighted path
        const highlightedElements = this.graphView.cy.elements('.highlighted');
        this.graphView.cy.fit(highlightedElements, 50);
        
        // Store current highlighted path
        this.highlightedPath = path;
        
        // Add CSS for highlighted elements
        const style = document.createElement('style');
        style.textContent = `
            .highlighted {
                opacity: 1;
                z-index: 999;
            }
            .highlighted.edge {
                width: 4;
                line-color: #ff0000;
                target-arrow-color: #ff0000;
            }
            .highlighted.node {
                border-width: 3px;
                border-color: #ff0000;
                border-style: double;
            }
            .dimmed {
                opacity: 0.2;
                transition: opacity 0.3s;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Get community clusters in the graph
     * @returns {Array} Array of node clusters
     */
    getCommunities() {
        // This implementation uses a simple approach based on the Girvan-Newman algorithm
        // A more sophisticated implementation would use dedicated libraries like Cytoscape.js-cose-bilkent
        
        // First, calculate node betweenness centrality
        const bc = this.graphView.cy.elements().bc();
        
        // Create hierarchy of clusters
        const clusters = [];
        let currentClusters = this.graphView.cy.elements().components();
        
        // Continue removing edges until we have a reasonable number of clusters
        const targetClusterCount = Math.min(8, Math.ceil(Math.sqrt(this.graphView.cy.nodes().length / 2)));
        
        while (currentClusters.length < targetClusterCount && bc.betweennessNormalized.length > 0) {
            // Find edge with highest betweenness
            let highestBetweennessEdge = null;
            let highestBetweenness = -1;
            
            bc.betweennessNormalized.forEach((betweenness, i) => {
                const ele = bc.betweennessNormalized[i];
                if (ele.isEdge() && betweenness > highestBetweenness) {
                    highestBetweennessEdge = ele;
                    highestBetweenness = betweenness;
                }
            });
            
            // Remove edge temporarily
            if (highestBetweennessEdge) {
                highestBetweennessEdge.remove();
                
                // Recalculate clusters
                currentClusters = this.graphView.cy.elements().components();
            } else {
                break;
            }
        }
        
        // Convert to array of node IDs
        return currentClusters.map(cluster => {
            return cluster.nodes().map(node => node.id());
        });
    }
    
    /**
     * Generate a report of the investigation
     */
    generateReport() {
        // Get graph statistics
        const stats = dataService.getGraphStatistics();
        
        // Get community clusters for advanced analysis
        const communities = this.getCommunities();
        
        // Generate HTML report
        const reportHtml = `
            <html>
            <head>
                <title>Investigation Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1, h2, h3 { color: #333; }
                    .report-section { margin-bottom: 30px; }
                    .stats-container { display: flex; flex-wrap: wrap; gap: 20px; }
                    .stat-box { 
                        border: 1px solid #ddd; 
                        border-radius: 5px; 
                        padding: 15px; 
                        min-width: 200px;
                        background-color: #f9f9f9;
                    }
                    .entity-list { list-style-type: none; padding: 0; }
                    .entity-item { 
                        display: flex; 
                        align-items: center;
                        margin-bottom: 5px;
                        padding: 5px;
                        border-bottom: 1px solid #eee;
                    }
                    .entity-icon { 
                        display: inline-block;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        color: white;
                        text-align: center;
                        line-height: 20px;
                        margin-right: 10px;
                    }
                    .community { 
                        border: 1px solid #ddd; 
                        margin-bottom: 15px; 
                        padding: 10px;
                        border-radius: 5px;
                    }
                    .badge {
                        display: inline-block;
                        padding: 3px 7px;
                        border-radius: 10px;
                        background-color: #007bff;
                        color: white;
                        font-size: 12px;
                        margin-left: 5px;
                    }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>Investigation Report</h1>
                <p>Generated on ${new Date().toLocaleString()}</p>
                
                <div class="report-section">
                    <h2>Summary</h2>
                    <div class="stats-container">
                        <div class="stat-box">
                            <h3>Entities</h3>
                            <p>${stats.entityCount}</p>
                        </div>
                        <div class="stat-box">
                            <h3>Links</h3>
                            <p>${stats.linkCount}</p>
                        </div>
                        <div class="stat-box">
                            <h3>Graph Density</h3>
                            <p>${stats.density.toFixed(3)}</p>
                        </div>
                        <div class="stat-box">
                            <h3>Communities</h3>
                            <p>${communities.length}</p>
                        </div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h2>Key Entities</h2>
                    <ul class="entity-list">
                        ${stats.mostConnected.map(entity => `
                            <li class="entity-item">
                                <span class="entity-icon" style="background-color: ${ENTITY_TYPES[entity.type].color}">
                                    <i class="fas ${ENTITY_TYPES[entity.type].icon}"></i>
                                </span>
                                <span>${entity.label}</span>
                                <span class="badge">${entity.count} connections</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="report-section">
                    <h2>Entity Breakdown</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Count</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(stats.entityCounts).map(([type, count]) => `
                                <tr>
                                    <td>${type.charAt(0).toUpperCase() + type.slice(1)}</td>
                                    <td>${count}</td>
                                    <td>${((count / stats.entityCount) * 100).toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="report-section">
                    <h2>Link Breakdown</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Count</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(stats.linkCounts).map(([type, count]) => `
                                <tr>
                                    <td>${LINK_TYPES[type].label}</td>
                                    <td>${count}</td>
                                    <td>${((count / stats.linkCount) * 100).toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="report-section">
                    <h2>Community Analysis</h2>
                    ${communities.map((community, index) => `
                        <div class="community">
                            <h3>Community ${index + 1} <span class="badge">${community.length} entities</span></h3>
                            <ul class="entity-list">
                                ${community.slice(0, 5).map(id => {
                                    const entity = this.entities[id];
                                    if (!entity) return '';
                                    return `
                                        <li class="entity-item">
                                            <span class="entity-icon" style="background-color: ${ENTITY_TYPES[entity.type].color}">
                                                <i class="fas ${ENTITY_TYPES[entity.type].icon}"></i>
                                            </span>
                                            <span>${entity.label}</span>
                                        </li>
                                    `;
                                }).join('')}
                                ${community.length > 5 ? `<li>...and ${community.length - 5} more</li>` : ''}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `;
        
        // Create blob and download
        const blob = new Blob([reportHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `investigation_report_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
