/**
 * Entity class representing a node in the investigation graph
 */
class Entity {
    /**
     * Create a new entity
     * @param {string} id - Unique identifier
     * @param {string} type - Entity type (person, organization, etc.)
     * @param {string} label - Display label
     * @param {Object} position - X,Y coordinates
     * @param {Object} properties - Key-value pairs of entity properties
     */
    constructor(id, type, label, position, properties = {}) {
        this.id = id;
        this.type = type;
        this.label = label || type.charAt(0).toUpperCase() + type.slice(1);
        this.position = position;
        
        // Get default properties for this entity type and merge with provided properties
        const defaultProps = ENTITY_TYPES[type].defaultProperties || {};
        this.properties = { ...defaultProps, ...properties };
        
        // Visual properties
        this.color = ENTITY_TYPES[type].color;
        this.icon = ENTITY_TYPES[type].icon;
    }
    
    /**
     * Convert to Cytoscape node format
     * @return {Object} Cytoscape node object
     */
    toCytoscapeNode() {
        return {
            group: 'nodes',
            data: {
                id: this.id,
                label: this.label,
                type: this.type,
                color: this.color,
                icon: this.icon,
                properties: this.properties
            },
            position: this.position
        };
    }
    
    /**
     * Update entity properties
     * @param {string} key - Property key
     * @param {*} value - Property value
     */
    updateProperty(key, value) {
        if (key === 'label') {
            this.label = value;
        } else {
            this.properties[key] = value;
        }
    }
}
