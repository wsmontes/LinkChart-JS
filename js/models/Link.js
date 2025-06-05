/**
 * Link class representing an edge in the investigation graph
 */
class Link {
    /**
     * Create a new link between entities
     * @param {string} id - Unique identifier
     * @param {string} source - Source entity ID
     * @param {string} target - Target entity ID
     * @param {string} type - Link type (associates, owns, etc.)
     * @param {Object} properties - Key-value pairs of link properties
     */
    constructor(id, source, target, type, properties = {}) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.type = type;
        this.properties = properties;
        
        // Visual properties
        this.label = LINK_TYPES[type].label;
        this.color = LINK_TYPES[type].color;
        this.icon = LINK_TYPES[type].icon;
    }
    
    /**
     * Convert to Cytoscape edge format
     * @return {Object} Cytoscape edge object
     */
    toCytoscapeEdge() {
        return {
            group: 'edges',
            data: {
                id: this.id,
                source: this.source,
                target: this.target,
                label: this.label,
                type: this.type,
                color: this.color,
                icon: this.icon,
                properties: this.properties
            }
        };
    }
    
    /**
     * Update link properties
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
