/**
 * Controller handling entity-specific operations
 */
class EntityController {
    /**
     * Initialize the entity controller
     * @param {GraphController} graphController - The graph controller instance
     */
    constructor(graphController) {
        this.graphController = graphController;
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Entity selection event
        eventBus.on('entity:selected', (data) => {
            this.handleEntitySelected(data);
        });
        
        // Entity creation events
        eventBus.on('sidebar:entityTypeSelected', (entityType) => {
            // This is just for selection, not creation
            console.log(`Entity type selected: ${entityType}`);
        });
        
        // Entity update events
        eventBus.on('entity:updateLabel', (data) => {
            this.updateEntityLabel(data.id, data.label);
        });
        
        eventBus.on('entity:updateProperty', (data) => {
            this.updateEntityProperty(data.id, data.key, data.value);
        });
        
        // Entity property events
        eventBus.on('entity:addProperty', (data) => {
            this.addEntityProperty(data.id, data.key, data.value);
        });
        
        eventBus.on('entity:removeProperty', (data) => {
            this.removeEntityProperty(data.id, data.key);
        });
    }
    
    /**
     * Handle entity selection
     * @param {Object} entityData - Selected entity data
     */
    handleEntitySelected(entityData) {
        // This will be handled by the EntityDetailsComponent
        console.log('Entity selected:', entityData.id);
    }
    
    /**
     * Update entity label
     * @param {string} id - Entity ID
     * @param {string} label - New label
     */
    updateEntityLabel(id, label) {
        this.graphController.updateEntity(id, 'label', label);
    }
    
    /**
     * Update entity property
     * @param {string} id - Entity ID
     * @param {string} key - Property key
     * @param {*} value - Property value
     */
    updateEntityProperty(id, key, value) {
        this.graphController.updateEntity(id, `properties.${key}`, value);
    }
    
    /**
     * Add a property to an entity
     * @param {string} id - Entity ID
     * @param {string} key - Property key
     * @param {*} value - Property value
     */
    addEntityProperty(id, key, value) {
        this.graphController.updateEntity(id, `properties.${key}`, value);
    }
    
    /**
     * Remove a property from an entity
     * @param {string} id - Entity ID
     * @param {string} key - Property key
     */
    removeEntityProperty(id, key) {
        this.graphController.removeEntityProperty(id, key);
    }
}
