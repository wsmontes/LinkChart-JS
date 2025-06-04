/**
 * Data models for LinkChart JS
 */

class Entity {
    constructor(id, type, name, description = '', properties = {}) {
        this.id = id || this._generateId();
        this.type = type;
        this.name = name;
        this.description = description;
        this.properties = properties;
        this.x = 0;
        this.y = 0;
    }

    _generateId() {
        return 'entity_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    }

    addProperty(key, value) {
        this.properties[key] = value;
    }

    getProperty(key) {
        return this.properties[key];
    }

    removeProperty(key) {
        delete this.properties[key];
    }

    updatePosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setPropertiesFromCsv(rowData, columnMapping) {
        for (const [column, value] of Object.entries(rowData)) {
            if (columnMapping.includes(column)) {
                this.addProperty(column, value);
            }
        }
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            description: this.description,
            properties: this.properties,
            x: this.x,
            y: this.y
        };
    }
}

class Relationship {
    constructor(id, sourceId, targetId, type = 'default', label = '', properties = {}) {
        this.id = id || this._generateId();
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.type = type;
        this.label = label;
        this.properties = properties;
        this.strength = 1; // Default relationship strength
    }

    _generateId() {
        return 'rel_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    }

    addProperty(key, value) {
        this.properties[key] = value;
    }

    removeProperty(key) {
        delete this.properties[key];
    }
    
    // Set the relationship strength (for visualization)
    setStrength(value) {
        this.strength = value;
        return this;
    }

    toJSON() {
        return {
            id: this.id,
            sourceId: this.sourceId,
            targetId: this.targetId,
            type: this.type,
            label: this.label,
            properties: this.properties,
            strength: this.strength
        };
    }
}

class EntityType {
    constructor(id, name, icon, color) {
        this.id = id || this._generateId();
        this.name = name;
        this.icon = icon || 'bi-box';
        this.color = color || '#a29bfe';
    }

    _generateId() {
        return 'type_' + Math.random().toString(36).substring(2, 9);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            icon: this.icon,
            color: this.color
        };
    }
}

class ChartData {
    constructor() {
        this.entities = [];
        this.relationships = [];
        this.entityTypes = [];
    }

    addEntity(entity) {
        this.entities.push(entity);
        return entity;
    }

    addRelationship(relationship) {
        this.relationships.push(relationship);
        return relationship;
    }

    getEntityById(id) {
        return this.entities.find(entity => entity.id === id);
    }

    getRelationshipById(id) {
        return this.relationships.find(rel => rel.id === id);
    }

    removeEntityById(id) {
        this.entities = this.entities.filter(entity => entity.id !== id);
        // Also remove any relationships connected to this entity
        this.relationships = this.relationships.filter(
            rel => rel.sourceId !== id && rel.targetId !== id
        );
    }

    removeRelationshipById(id) {
        this.relationships = this.relationships.filter(rel => rel.id !== id);
    }
    
    addEntityType(entityType) {
        // Check if type with same ID already exists
        const existingTypeIndex = this.entityTypes.findIndex(t => t.id === entityType.id);
        
        if (existingTypeIndex >= 0) {
            // Update existing type
            this.entityTypes[existingTypeIndex] = entityType;
        } else {
            // Add new type
            this.entityTypes.push(entityType);
        }

        return entityType;
    }

    /**
     * Ensures there's at least one entity type, creating default types if needed
     */
    ensureEntityTypes() {
        if (this.entityTypes.length === 0) {
            // Add default entity types
            this.addEntityType(new EntityType('default', 'Default', 'bi-box', '#3498db'));
        }
    }

    getEntityTypeById(id) {
        return this.entityTypes.find(type => type.id === id);
    }

    removeEntityType(id) {
        this.entityTypes = this.entityTypes.filter(type => type.id !== id);
    }

    toJSON() {
        return {
            entities: this.entities.map(e => e.toJSON()),
            relationships: this.relationships.map(r => r.toJSON()),
            entityTypes: this.entityTypes.map(t => t.toJSON())
        };
    }

    fromJSON(data) {
        this.entities = data.entities.map(e => {
            const entity = new Entity(e.id, e.type, e.name, e.description, e.properties);
            entity.x = e.x || 0;
            entity.y = e.y || 0;
            return entity;
        });
        
        this.relationships = data.relationships.map(r => {
            const relationship = new Relationship(r.id, r.sourceId, r.targetId, r.type, r.label, r.properties);
            if (r.strength) relationship.strength = r.strength;
            return relationship;
        });
        
        // Load entity types if present
        if (data.entityTypes) {
            this.entityTypes = data.entityTypes.map(t => 
                new EntityType(t.id, t.name, t.icon, t.color)
            );
        }
    }

    /**
     * Create entities from CSV data
     * @param {Array} csvData - Array of objects representing CSV rows
     * @param {Object} options - Import options
     * @returns {Array} - Created entities
     */
    importEntitiesFromCsv(csvData, options) {
        const {
            idColumn,
            nameColumn,
            entityType,
            includedColumns
        } = options;
        
        const createdEntities = [];
        
        // Process each row of the CSV
        csvData.forEach(row => {
            const id = idColumn ? row[idColumn] : null;
            const name = row[nameColumn] || 'Unnamed Entity';
            
            // Create a new entity
            const entity = new Entity(id, entityType, name);
            
            // Add all included columns as properties
            entity.setPropertiesFromCsv(row, includedColumns);
            
            // Add entity to chart data
            this.addEntity(entity);
            createdEntities.push(entity);
        });
        
        return createdEntities;
    }
    
    /**
     * Create relationships from CSV data using specified columns
     * @param {Array} entities - Array of created entities
     * @param {Object} options - Relationship options
     */
    createRelationshipsFromCsv(entities, options) {
        const {
            sourceColumn,
            targetColumn,
            relationType
        } = options;
        
        if (!sourceColumn || !targetColumn) return;
        
        // Map of values to entity IDs for quick lookup
        const entityMap = new Map();
        
        entities.forEach(entity => {
            // Use sourceColumn value as key for this entity
            const sourceValue = entity.properties[sourceColumn];
            if (sourceValue) {
                entityMap.set(sourceValue, entity.id);
            }
        });
        
        // Create relationships
        entities.forEach(entity => {
            const targetValue = entity.properties[targetColumn];
            
            if (targetValue && entityMap.has(targetValue)) {
                const targetId = entityMap.get(targetValue);
                
                // Don't create self-relationships
                if (targetId !== entity.id) {
                    // Create a relationship
                    const relationship = new Relationship(
                        null,
                        entity.id,
                        targetId,
                        'default',
                        relationType || 'connected to'
                    );
                    
                    this.addRelationship(relationship);
                }
            }
        });
    }
    
    /**
     * Create hierarchical relationships based on type and parent references
     * @param {Array} entities - Array of created entities
     * @param {Object} options - Hierarchy options
     */
    createHierarchicalRelationships(entities, options) {
        const {
            typeColumn, 
            parentReferenceColumn,
            parentType,
            childType
        } = options;
        
        if (!typeColumn || !parentReferenceColumn) return;
        
        // Create maps for quick lookup
        const parentEntities = new Map();
        const childEntities = [];
        
        // First pass: identify all parent entities and store them by a key property
        entities.forEach(entity => {
            const entityType = entity.getProperty(typeColumn);
            
            if (entityType && entityType.toLowerCase() === parentType.toLowerCase()) {
                // For parent entities, store them by key and name for flexible matching
                parentEntities.set(entity.id, entity);
                
                if (entity.name) {
                    parentEntities.set(entity.name, entity);
                }
                
                // Also store by all property values that might be used as references
                for (const [key, value] of Object.entries(entity.properties)) {
                    if (value && typeof value === 'string') {
                        parentEntities.set(value, entity);
                    }
                }
            }
            else if (entityType && entityType.toLowerCase() === childType.toLowerCase()) {
                childEntities.push(entity);
            }
        });
        
        // Second pass: create relationships from children to parents
        childEntities.forEach(child => {
            const parentRef = child.getProperty(parentReferenceColumn);
            
            if (parentRef && parentEntities.has(parentRef)) {
                const parent = parentEntities.get(parentRef);
                
                // Create a relationship
                const relationship = new Relationship(
                    null,
                    child.id,
                    parent.id,
                    'hierarchical',
                    'belongs to'
                ).setStrength(1.5);
                
                this.addRelationship(relationship);
            }
        });
    }
    
    /**
     * Import entities from CSV with automatic type detection
     * @param {Array} csvData - CSV data rows
     * @param {Object} options - Import options including typeColumn
     */
    importEntitiesWithTypes(csvData, options) {
        const {
            idColumn,
            nameColumn,
            typeColumn,
            includedColumns
        } = options;
        
        const createdEntities = [];
        
        // Create entity types if needed
        if (typeColumn) {
            this.createEntityTypesFromColumn(csvData, typeColumn);
        } else {
            // Ensure we have at least one entity type
            this.ensureEntityTypes();
        }
        
        // Process each row of the CSV
        csvData.forEach(row => {
            const id = idColumn ? row[idColumn] : null;
            const name = row[nameColumn] || 'Unnamed Entity';
            
            // Determine entity type from the type column or use default
            let entityType = this.entityTypes.length > 0 ? this.entityTypes[0].id : 'default';
            if (typeColumn && row[typeColumn]) {
                const typeValue = row[typeColumn].toString().trim();
                const typeId = typeValue.toLowerCase().replace(/[^a-z0-9]/g, '-');
                
                // Check if this type exists
                if (this.entityTypes.some(et => et.id === typeId)) {
                    entityType = typeId;
                }
            }
            
            // Create a new entity
            const entity = new Entity(id, entityType, name);
            
            // Add all included columns as properties
            entity.setPropertiesFromCsv(row, includedColumns);
            
            // Add entity to chart data
            this.addEntity(entity);
            createdEntities.push(entity);
        });
        
        return createdEntities;
    }
    
    /**
     * Create automatic entity types based on a type column
     * @param {Array} csvData - Array of objects representing CSV rows
     * @param {string} typeColumn - Column containing entity type information
     */
    createEntityTypesFromColumn(csvData, typeColumn) {
        if (!typeColumn) return [];
        
        // Extract unique types from the data
        const uniqueTypes = new Set();
        csvData.forEach(row => {
            const typeValue = row[typeColumn];
            if (typeValue) {
                uniqueTypes.add(typeValue.toString().trim());
            }
        });
        
        // Create entity types for each unique value
        const colors = ['#ff7675', '#74b9ff', '#55efc4', '#fdcb6e', '#a29bfe', '#fab1a0', '#81ecec', '#dfe6e9'];
        const icons = ['bi-file-text', 'bi-card-heading', 'bi-card-text', 'bi-check2-square', 'bi-calendar-event', 'bi-person', 'bi-building', 'bi-geo-alt'];
        
        let colorIndex = 0;
        let iconIndex = 0;
        
        const createdTypes = [];
        
        uniqueTypes.forEach(type => {
            // Skip if this type already exists
            if (this.entityTypes.some(et => et.name.toLowerCase() === type.toLowerCase())) {
                return;
            }
            
            // Create a type ID from the name
            const typeId = type.toLowerCase().replace(/[^a-z0-9]/g, '-');
            
            // Create the entity type
            const entityType = new EntityType(
                typeId,
                type,
                icons[iconIndex % icons.length],
                colors[colorIndex % colors.length]
            );
            
            this.addEntityType(entityType);
            createdTypes.push(entityType);
            
            // Increment color and icon indexes
            colorIndex++;
            iconIndex++;
        });
        
        return createdTypes;
    }
}
