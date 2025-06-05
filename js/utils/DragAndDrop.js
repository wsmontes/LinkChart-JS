/**
 * Handles drag and drop functionality for entities
 */
class DragAndDropHandler {
    /**
     * Initialize drag and drop functionality
     * @param {GraphController} graphController - The graph controller instance
     */
    constructor(graphController) {
        this.graphController = graphController;
        this.setupEntityDragAndDrop();
        this.linkMode = false;
        this.linkSource = null;
    }
    
    /**
     * Set up drag and drop for entity palette items
     */
    setupEntityDragAndDrop() {
        const entityItems = document.querySelectorAll('.entity-item[draggable="true"]');
        const graphContainer = document.getElementById('graph-container');
        
        entityItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.type);
            });
        });
        
        graphContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        graphContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const entityType = e.dataTransfer.getData('text/plain');
            
            // Calculate position based on drop point relative to container
            const containerRect = graphContainer.getBoundingClientRect();
            const position = {
                x: e.clientX - containerRect.left,
                y: e.clientY - containerRect.top
            };
            
            // Add entity through the controller
            this.graphController.addEntity(entityType, position);
        });
    }
    
    /**
     * Enable link creation mode
     * @param {string} linkType - Type of link to create
     */
    enableLinkMode(linkType) {
        this.linkMode = true;
        this.linkType = linkType;
        document.getElementById('graph-container').classList.add('link-mode');
    }
    
    /**
     * Disable link creation mode
     */
    disableLinkMode() {
        this.linkMode = false;
        this.linkSource = null;
        this.linkType = null;
        document.getElementById('graph-container').classList.remove('link-mode');
    }
    
    /**
     * Handle node selection during link creation
     * @param {string} nodeId - ID of the selected node
     */
    handleNodeSelection(nodeId) {
        if (!this.linkMode) return;
        
        if (!this.linkSource) {
            // First node selection - set as source
            this.linkSource = nodeId;
        } else {
            // Second node selection - create link
            if (this.linkSource !== nodeId) {
                this.graphController.addLink(this.linkSource, nodeId, this.linkType);
                this.disableLinkMode();
            }
        }
    }
}
