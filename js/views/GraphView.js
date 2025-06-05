/**
 * View handling the graph visualization
 */
class GraphView {
    /**
     * Initialize the graph visualization
     * @param {string} containerId - ID of the container element
     */
    constructor(containerId = 'graph-container') {
        this.containerId = containerId;
        this.cy = null;
        this.selectedNode = null;
        this.selectedEdge = null;
        this.initializeCytoscape();
    }
    
    /**
     * Initialize Cytoscape instance
     */
    initializeCytoscape() {
        this.cy = cytoscape({
            container: document.getElementById(this.containerId),
            style: CYTOSCAPE_STYLES,
            layout: {
                name: 'grid',
            },
            // Start with empty graph
            elements: {
                nodes: [],
                edges: []
            }
        });
        
        // Hide placeholder message when graph has elements
        this.cy.on('add', 'node', () => {
            const placeholder = document.querySelector('.placeholder-message');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        });
        
        // Handle element selection
        this.cy.on('select', 'node', (event) => {
            this.selectedNode = event.target;
            this.selectedEdge = null;
            eventBus.emit('entity:selected', this.selectedNode.data());
        });
        
        this.cy.on('select', 'edge', (event) => {
            this.selectedEdge = event.target;
            this.selectedNode = null;
            eventBus.emit('link:selected', this.selectedEdge.data());
        });
        
        this.cy.on('unselect', () => {
            if (this.cy.$(":selected").length === 0) {
                this.selectedNode = null;
                this.selectedEdge = null;
                eventBus.emit('selection:cleared');
            }
        });
        
        // Enable panning and zooming
        this.cy.userPanningEnabled(true);
        this.cy.userZoomingEnabled(true);
        
        // Double-click to center the graph
        document.getElementById(this.containerId).addEventListener('dblclick', (event) => {
            if (event.target.id === this.containerId) {
                this.cy.fit();
                this.cy.center();
            }
        });
    }
    
    /**
     * Add a node to the graph
     * @param {Entity} entity - Entity to add
     */
    addNode(entity) {
        const node = entity.toCytoscapeNode();
        this.cy.add(node);
        return this.cy.getElementById(entity.id);
    }
    
    /**
     * Add an edge to the graph
     * @param {Link} link - Link to add
     */
    addEdge(link) {
        const edge = link.toCytoscapeEdge();
        this.cy.add(edge);
        return this.cy.getElementById(link.id);
    }
    
    /**
     * Update a node in the graph
     * @param {string} nodeId - ID of the node to update
     * @param {Object} data - New data for the node
     */
    updateNode(nodeId, data) {
        const node = this.cy.getElementById(nodeId);
        if (node.length === 0) return;
        
        Object.keys(data).forEach(key => {
            node.data(key, data[key]);
        });
    }
    
    /**
     * Update an edge in the graph
     * @param {string} edgeId - ID of the edge to update
     * @param {Object} data - New data for the edge
     */
    updateEdge(edgeId, data) {
        const edge = this.cy.getElementById(edgeId);
        if (edge.length === 0) return;
        
        Object.keys(data).forEach(key => {
            edge.data(key, data[key]);
        });
    }
    
    /**
     * Remove an element from the graph
     * @param {string} id - ID of the element to remove
     */
    removeElement(id) {
        const element = this.cy.getElementById(id);
        if (element.length === 0) return;
        
        this.cy.remove(element);
    }
    
    /**
     * Get the currently selected node or edge
     * @return {Object|null} Selected node/edge or null if nothing selected
     */
    getSelected() {
        return this.selectedNode || this.selectedEdge;
    }
    
    /**
     * Apply a layout to the graph
     * @param {string} layoutName - Name of the layout to apply
     */
    applyLayout(layoutName = 'cose') {
        const layout = this.cy.layout({ name: layoutName });
        layout.run();
    }
}
