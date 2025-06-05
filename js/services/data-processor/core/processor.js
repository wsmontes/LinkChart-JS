/**
 * Core data processing logic
 */
class DataProcessor {
    /**
     * Initialize the processor
     * @param {TypeDetector} typeDetector - Entity type detector
     * @param {Object} recognizers - Data type recognizers
     */
    constructor(typeDetector, recognizers) {
        this.typeDetector = typeDetector;
        this.recognizers = recognizers;
    }
    
    /**
     * Process imported data
     * @param {Object} data - Data with entities and links
     * @return {Object} Processed data
     */
    processData(data) {
        if (!data) return data;
        
        console.log(`Processing data with ${Object.keys(data.entities || {}).length} entities and ${Object.keys(data.links || {}).length} links`);
        
        // Create new objects to avoid modifying originals
        const processedData = {
            entities: {},
            links: {}
        };
        
        // Track filtering statistics
        let totalEntities = 0;
        let filteredEntities = 0;
        let processedEntities = 0;
        
        // Start a console group for import process logs
        console.group('📊 Import Data Analysis');
        
        // Analyze incoming data structure before processing
        this.analyzeImportData(data);
        
        // Process entities
        if (data.entities) {
            totalEntities = Object.keys(data.entities).length;
            
            Object.entries(data.entities).forEach(([id, entity]) => {
                // Apply processing steps
                const processedEntity = this.processEntity(entity);
                
                if (processedEntity) {
                    processedData.entities[id] = processedEntity;
                    processedEntities++;
                } else {
                    filteredEntities++;
                }
            });
            
            console.log(`Entity processing stats: Total=${totalEntities}, Processed=${processedEntities}, Filtered=${filteredEntities}`);
            
            // If all entities were filtered out, use original entities as fallback
            if (processedEntities === 0 && totalEntities > 0) {
                console.warn("All entities were filtered out. Using original entities as fallback.");
                processedData.entities = { ...data.entities };
                processedEntities = totalEntities;
                filteredEntities = 0;
            }
            
            // Analyze processed entity data
            this.analyzeProcessedData(processedData);
        }
        
        // Process links
        if (data.links) {
            Object.entries(data.links).forEach(([id, link]) => {
                // Apply processing steps
                const processedLink = this.processLink(link, processedData.entities);
                
                if (processedLink) {
                    processedData.links[id] = processedLink;
                }
            });
        }
        
        // Remove orphaned links (links with no valid source or target)
        this.removeOrphanedLinks(processedData);
        
        console.log(`Processed data now has ${Object.keys(processedData.entities).length} entities and ${Object.keys(processedData.links).length} links`);
        
        // End the console group for import process logs
        console.groupEnd();
        
        return processedData;
    }
    
    /**
     * Analyze imported data before processing
     * @param {Object} data - Data with entities and links
     */
    analyzeImportData(data) {
        if (!data || !data.entities) return;
        
        console.group('📥 Incoming Data Analysis');
        
        // Analyze entity types
        const entityTypes = {};
        const propertyNames = {};
        const propertyTypes = {};
        let totalProperties = 0;
        
        // Sample entities for detailed type analysis
        // (only analyze a subset to avoid performance issues with large datasets)
        const entities = Object.values(data.entities);
        const entitySampleSize = Math.min(100, entities.length);
        const entitySample = entities.slice(0, entitySampleSize);
        
        entitySample.forEach(entity => {
            // Count entity types
            const type = entity.type || 'unknown';
            entityTypes[type] = (entityTypes[type] || 0) + 1;
            
            // Analyze properties
            if (entity.properties) {
                totalProperties += Object.keys(entity.properties).length;
                
                // Count property names
                Object.keys(entity.properties).forEach(propName => {
                    propertyNames[propName] = (propertyNames[propName] || 0) + 1;
                });
                
                // Analyze property types
                Object.entries(entity.properties).forEach(([propName, propValue]) => {
                    const valueType = typeof propValue;
                    propertyTypes[valueType] = (propertyTypes[valueType] || 0) + 1;
                });
            }
        });
        
        // Output entity type distribution
        console.log('Entity Type Distribution:');
        const entityTypeCounts = Object.entries(entityTypes)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .slice(0, 10); // Only top 10 types
        
        if (entityTypeCounts.length > 0) {
            console.table(entityTypeCounts.map(([type, count]) => ({
                Type: type,
                Count: count,
                Percentage: `${((count / entitySample.length) * 100).toFixed(1)}%`
            })));
        } else {
            console.log('No entity types found');
        }
        
        // Output most common property names
        console.log('Common Property Names:');
        const topProperties = Object.entries(propertyNames)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .slice(0, 10); // Only top 10 property names
        
        if (topProperties.length > 0) {
            console.table(topProperties.map(([name, count]) => ({
                Property: name,
                'Found In': count,
                'Frequency': `${((count / entitySample.length) * 100).toFixed(1)}%`
            })));
        }
        
        // Output property type distribution
        console.log('Property Value Types:');
        if (Object.keys(propertyTypes).length > 0) {
            console.table(Object.entries(propertyTypes).map(([type, count]) => ({
                Type: type,
                Count: count,
                Percentage: `${((count / totalProperties) * 100).toFixed(1)}%`
            })));
        }
        
        // Output link type distribution if links exist
        if (data.links && Object.keys(data.links).length > 0) {
            const linkTypes = {};
            Object.values(data.links).forEach(link => {
                const type = link.type || 'unknown';
                linkTypes[type] = (linkTypes[type] || 0) + 1;
            });
            
            console.log('Link Type Distribution:');
            console.table(Object.entries(linkTypes).map(([type, count]) => ({
                Type: type,
                Count: count,
                Percentage: `${((count / Object.keys(data.links).length) * 100).toFixed(1)}%`
            })));
        }
        
        // Output data quality indicators
        const missingTypeCount = entities.filter(e => !e.type).length;
        const missingLabelCount = entities.filter(e => !e.label).length;
        const emptyPropertiesCount = entities.filter(e => !e.properties || Object.keys(e.properties).length === 0).length;
        
        console.log('Data Quality Indicators:');
        console.table([
            { Indicator: 'Entities missing type', Count: missingTypeCount, Percentage: `${((missingTypeCount / entities.length) * 100).toFixed(1)}%` },
            { Indicator: 'Entities missing label', Count: missingLabelCount, Percentage: `${((missingLabelCount / entities.length) * 100).toFixed(1)}%` },
            { Indicator: 'Entities with no properties', Count: emptyPropertiesCount, Percentage: `${((emptyPropertiesCount / entities.length) * 100).toFixed(1)}%` },
            { Indicator: 'Average properties per entity', Count: (totalProperties / entitySample.length).toFixed(1), Percentage: 'N/A' }
        ]);
        
        console.groupEnd();
    }
    
    /**
     * Analyze processed data after processing is complete
     * @param {Object} data - Processed data with entities and links
     */
    analyzeProcessedData(data) {
        if (!data || !data.entities) return;
        
        console.group('📤 Processed Data Analysis');
        
        // Analyze entity types after processing
        const entityTypes = {};
        const propertyNames = {};
        let totalProperties = 0;
        
        // Count entity types after processing
        Object.values(data.entities).forEach(entity => {
            const type = entity.type || 'unknown';
            entityTypes[type] = (entityTypes[type] || 0) + 1;
            
            // Count properties after processing
            if (entity.properties) {
                totalProperties += Object.keys(entity.properties).length;
                Object.keys(entity.properties).forEach(propName => {
                    propertyNames[propName] = (propertyNames[propName] || 0) + 1;
                });
            }
        });
        
        // Output processed entity types
        console.log('Processed Entity Types:');
        console.table(Object.entries(entityTypes).map(([type, count]) => ({
            Type: type,
            Count: count,
            Percentage: `${((count / Object.keys(data.entities).length) * 100).toFixed(1)}%`
        })));
        
        // Output processed link types if links exist
        if (data.links && Object.keys(data.links).length > 0) {
            const linkTypes = {};
            Object.values(data.links).forEach(link => {
                const type = link.type || 'unknown';
                linkTypes[type] = (linkTypes[type] || 0) + 1;
            });
            
            console.log('Processed Link Types:');
            console.table(Object.entries(linkTypes).map(([type, count]) => ({
                Type: type,
                Count: count,
                Percentage: `${((count / Object.keys(data.links).length) * 100).toFixed(1)}%`
            })));
        }
        
        // Output data transformation summary
        console.log('Data Transformation Summary:');
        const entitiesWithGeneratedLabels = Object.values(data.entities).filter(e => e._labelWasGenerated).length;
        const entitiesWithTypeChanged = Object.values(data.entities).filter(e => e._typeWasChanged).length;
        
        console.table([
            { Metric: 'Average properties per entity', Value: (totalProperties / Object.keys(data.entities).length).toFixed(1) },
            { Metric: 'Entities with generated labels', Value: entitiesWithGeneratedLabels },
            { Metric: 'Entities with type changed', Value: entitiesWithTypeChanged }
        ]);
        
        console.groupEnd();
    }
    
    /**
     * Process a single entity
     * @param {Object} entity - Entity to process
     * @return {Object} Processed entity or null if filtered out
     */
    processEntity(entity) {
        // Make a copy of the entity to avoid modifying the original
        const processedEntity = { ...entity };
        
        // Store original values for debugging
        const originalType = processedEntity.type;
        const originalLabel = processedEntity.label;
        const originalPropsCount = Object.keys(processedEntity.properties || {}).length;
        
        // Initialize properties if they don't exist
        if (!processedEntity.properties) {
            processedEntity.properties = {};
        } else {
            processedEntity.properties = { ...processedEntity.properties };
        }
        
        // Step 1: Detect entity type if not specified
        if (!processedEntity.type || processedEntity.type === 'unknown') {
            processedEntity.type = this.typeDetector.detectEntityType(processedEntity);
            processedEntity._typeWasChanged = true;
            console.log(`Type detection: "${originalType || 'none'}" → "${processedEntity.type}"`);
        }
        
        // Step 2: Clean and normalize data
        this.cleanEntityData(processedEntity);
        
        // Step 3: Extract structure from unstructured properties where possible
        this.extractStructuredData(processedEntity);
        
        // Ensure entity has a label
        if (!processedEntity.label) {
            processedEntity.label = this.generateLabel(processedEntity);
            processedEntity._labelWasGenerated = true;
            console.log(`Generated label: "${originalLabel || 'none'}" → "${processedEntity.label}"`);
        }
        
        // Step 4: Filter entity if it doesn't meet criteria
        if (this.shouldFilterEntity(processedEntity)) {
            console.log(`Filtered entity: type=${originalType || 'unknown'}, label=${originalLabel || 'none'}, ` +
                      `original props=${originalPropsCount}, processed props=${Object.keys(processedEntity.properties).length}`);
            return null;
        }
        
        return processedEntity;
    }
    
    /**
     * Process a single link
     * @param {Object} link - Link to process
     * @param {Object} entities - Available entities map
     * @return {Object} Processed link or null if filtered out
     */
    processLink(link, entities) {
        // Make a copy of the link to avoid modifying the original
        const processedLink = { ...link };
        
        // Initialize properties if they don't exist
        if (!processedLink.properties) {
            processedLink.properties = {};
        } else {
            processedLink.properties = { ...processedLink.properties };
        }
        
        // Skip if source or target entity doesn't exist
        if (!entities[processedLink.source] || !entities[processedLink.target]) {
            return null;
        }
        
        // Step 1: Detect link type if not specified
        if (!processedLink.type || processedLink.type === 'unknown') {
            processedLink.type = this.detectLinkType(processedLink, entities);
        }
        
        // Step 2: Clean link data
        this.cleanLinkData(processedLink);
        
        // Step 3: Filter link if it doesn't meet criteria
        if (this.shouldFilterLink(processedLink)) {
            return null;
        }
        
        return processedLink;
    }
    
    /**
     * Clean entity data by normalizing values and handling missing data
     * @param {Object} entity - Entity to clean
     */
    cleanEntityData(entity) {
        const props = entity.properties;
        
        // Loop through all properties
        Object.entries(props).forEach(([key, value]) => {
            // Skip null/undefined values
            if (value === null || value === undefined) {
                return;
            }
            
            // Convert empty strings to null for consistency
            if (value === '') {
                props[key] = null;
                return;
            }
            
            // Apply normalization based on recognized field type
            props[key] = this.normalizeValue(key, value);
        });
    }
    
    /**
     * Extract structured data from unstructured properties
     * @param {Object} entity - Entity to process
     */
    extractStructuredData(entity) {
        const props = entity.properties;
        
        // Extract coordinates from address properties
        if (entity.type === 'location' && !props.latitude && !props.longitude) {
            if (props.coordinates && typeof props.coordinates === 'string') {
                const coordRecognizer = this.recognizers.coordinates;
                if (coordRecognizer) {
                    const normalized = coordRecognizer.normalize(props.coordinates);
                    if (normalized && typeof normalized === 'object') {
                        props.latitude = normalized.latitude;
                        props.longitude = normalized.longitude;
                    }
                }
            }
        }
        
        // Extract first and last names from full name
        if (entity.type === 'person' && !props.first_name && !props.last_name && props.name) {
            const nameParts = props.name.trim().split(/\s+/);
            if (nameParts.length >= 2) {
                props.first_name = nameParts[0];
                props.last_name = nameParts.slice(1).join(' ');
            }
        }
        
        // Combine first and last name into full name
        if (entity.type === 'person' && !props.name && props.first_name && props.last_name) {
            props.name = `${props.first_name} ${props.last_name}`;
        }
    }
    
    /**
     * Detect link type based on connected entities
     * @param {Object} link - Link to analyze
     * @param {Object} entities - Available entities map
     * @return {string} Detected link type
     */
    detectLinkType(link, entities) {
        const source = entities[link.source];
        const target = entities[link.target];
        
        if (!source || !target) return 'associates';
        
        // Person -> Person: family or associates
        if (source.type === 'person' && target.type === 'person') {
            // Check for family keywords
            const props = link.properties || {};
            const relationshipProps = props.relationship || props.relation || '';
            
            if (
                relationshipProps && 
                /family|relative|parent|child|sibling|spouse|husband|wife|mother|father|son|daughter|brother|sister/i.test(relationshipProps)
            ) {
                return 'family';
            }
            
            return 'associates';
        }
        
        // Person -> Organization: often ownership
        if (source.type === 'person' && target.type === 'organization') {
            return 'owns';
        }
        
        // Person -> Location: travel
        if (source.type === 'person' && target.type === 'location') {
            return 'travels';
        }
        
        // Check for communication keywords
        const props = link.properties || {};
        if (
            props.communication || props.contacted || props.call || 
            props.email || props.message || props.conversation
        ) {
            return 'communicates';
        }
        
        // Default relationship
        return 'associates';
    }
    
    /**
     * Clean link data
     * @param {Object} link - Link to clean
     */
    cleanLinkData(link) {
        // Remove blank properties
        const props = link.properties;
        Object.entries(props).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                delete props[key];
            }
            
            // Trim whitespace from strings
            if (typeof value === 'string') {
                props[key] = value.trim();
            }
        });
        
        // Make sure we have a label
        if (!link.label) {
            link.label = LINK_TYPES[link.type]?.label || link.type.charAt(0).toUpperCase() + link.type.slice(1);
        }
    }
    
    /**
     * Normalize field value based on recognized type
     * @param {string} key - Field name
     * @param {*} value - Field value
     * @returns {*} Normalized value
     */
    normalizeValue(key, value) {
        if (value === null || value === undefined) return value;
        
        // Find the highest confidence recognizer for this field
        let bestRecognizer = null;
        let highestConfidence = 0;
        
        for (const recognizer of Object.values(this.recognizers)) {
            const confidence = recognizer.getConfidence(key, value);
            if (confidence > highestConfidence) {
                highestConfidence = confidence;
                bestRecognizer = recognizer;
            }
            
            // If we have high confidence, stop looking
            if (confidence >= 0.9) break;
        }
        
        // Use the best matching recognizer to normalize, if found
        if (bestRecognizer && highestConfidence >= 0.5) {
            return bestRecognizer.normalize(value);
        }
        
        // Handle numeric strings
        if (typeof value === 'string' && !isNaN(value) && !isNaN(parseFloat(value))) {
            // Skip conversion for zip codes, years, IDs, etc.
            if (this.isLikelyStringNumber(key)) {
                return value;
            }
            return parseFloat(value);
        }
        
        return value;
    }
    
    /**
     * Check if a field should stay as string even if numeric
     * @param {string} key - Field name
     * @returns {boolean} True if likely a string number field
     */
    isLikelyStringNumber(key) {
        const keyLower = key.toLowerCase();
        
        // Fields that should remain as strings even if they contain numbers
        const stringNumberFields = [
            'zip', 'postal', 'code', 'phone', 'id', 'year', 'ssn', 'isbn', 
            'account', 'number', 'social', 'security'
        ];
        
        return stringNumberFields.some(field => keyLower.includes(field));
    }
    
    /**
     * Determine if an entity should be filtered out
     * @param {Object} entity - Entity to check
     * @return {boolean} True if entity should be filtered out
     */
    shouldFilterEntity(entity) {
        // If we have a valid label and type, always keep the entity even with no properties
        if (entity.label && entity.type && ENTITY_TYPES[entity.type]) {
            return false;
        }
        
        // Otherwise check if it has properties
        const props = entity.properties;
        
        // Filter out entities with absolutely no data
        if (!entity.label && Object.keys(props).length === 0) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Determine if a link should be filtered out
     * @param {Object} link - Link to check
     * @return {boolean} True if link should be filtered out
     */
    shouldFilterLink(link) {
        return false; // For now, we keep all links
    }
    
    /**
     * Remove links that don't have both source and target entities
     * @param {Object} data - Data with entities and links
     */
    removeOrphanedLinks(data) {
        const { entities, links } = data;
        
        Object.entries(links).forEach(([id, link]) => {
            if (!entities[link.source] || !entities[link.target]) {
                delete links[id];
            }
        });
    }
    
    /**
     * Generate a label for an entity based on its properties
     * @param {Object} entity - Entity to generate label for
     * @return {string} Generated label
     */
    generateLabel(entity) {
        const props = entity.properties || {};
        
        // First try entity properties that might contain names
        if (props.name) return props.name;
        if (props.title) return props.title;
        if (props.label) return props.label;
        if (props.id) return props.id;
        
        switch (entity.type) {
            case 'person':
                if (props.first_name && props.last_name) return `${props.first_name} ${props.last_name}`;
                if (props.first_name) return props.first_name;
                if (props.last_name) return props.last_name;
                if (props.username) return props.username;
                if (props.email) return props.email;
                break;
                
            case 'organization':
                if (props.company_name) return props.company_name;
                if (props.org_name) return props.org_name;
                break;
                
            case 'location':
                if (props.address) return props.address;
                if (props.city) {
                    let label = props.city;
                    if (props.country) label += `, ${props.country}`;
                    return label;
                }
                break;
        }
        
        // If we still don't have a label, use the ID or a generic name
        return entity.id || `New ${entity.type}`;
    }
}

export default DataProcessor;
