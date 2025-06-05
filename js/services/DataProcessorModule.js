/**
 * Data Processor Module
 * 
 * Automatically processes imported data before loading into views:
 * - Extracts relevant fields
 * - Filters data based on rules
 * - Cleans and normalizes data values
 * - Transforms data structures if needed
 */
class DataProcessorModule {
    constructor() {
        this.processingRules = {
            // Default field mapping configurations
            fieldMapping: {
                person: {
                    include: ['id', 'name', 'gender', 'age', 'email', 'phone', 'address', 'description'],
                    rename: { // Maps source field names to target field names
                        'full_name': 'name',
                        'person_id': 'id', 
                        'notes': 'description',
                        'telephone': 'phone',
                        'phoneNumber': 'phone'
                    }
                },
                organization: {
                    include: ['id', 'name', 'type', 'industry', 'description', 'location'],
                    rename: {
                        'org_name': 'name',
                        'organization_id': 'id',
                        'sector': 'industry',
                        'category': 'type',
                        'notes': 'description'
                    }
                },
                location: {
                    include: ['id', 'name', 'address', 'city', 'country', 'latitude', 'longitude', 'description'],
                    rename: {
                        'lat': 'latitude',
                        'lng': 'longitude',
                        'location_id': 'id',
                        'place_name': 'name',
                        'notes': 'description'
                    }
                }
            },
            
            // Value normalization rules
            normalization: {
                // Standardize date formats
                dateFields: ['date', 'birthdate', 'dob', 'start_date', 'end_date', 'created_at', 'updated_at'],
                
                // Text case normalization
                textCases: {
                    uppercase: ['country', 'country_code'],
                    lowercase: ['email', 'username'],
                    titleCase: ['name', 'city', 'state']
                },
                
                // Replace values
                valueReplacements: {
                    gender: {
                        'm': 'Male',
                        'f': 'Female',
                        'male': 'Male',
                        'female': 'Female'
                    }
                }
            },
            
            // Entity type detection rules 
            typeDetection: {
                organization: ['company', 'organization', 'org', 'business', 'corporation', 'enterprise'],
                person: ['person', 'individual', 'human', 'contact'],
                location: ['location', 'place', 'address', 'venue', 'site']
            }
        };
        
        // Initialize and listen for import events
        this.init();
    }
    
    /**
     * Initialize the data processor
     */
    init() {
        // Listen for data import events before they reach the universal viewer
        eventBus.on('import:data', this.handleImportData.bind(this), true);
        
        console.log('Data Processor Module initialized');
    }
    
    /**
     * Handle imported data
     * @param {Object} data - Import data event object
     */
    handleImportData(data) {
        console.log('Data processor intercepting imported data');
        
        // Process the data
        const processedData = this.processData(data.data);
        
        // Update the event data with processed data
        data.data = processedData;
        data.processed = true;
        
        // Allow event to continue to the next handler
        return true;
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
        
        return processedData;
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
        
        // Initialize or copy properties
        if (!processedEntity.properties) {
            processedEntity.properties = {};
        } else {
            processedEntity.properties = { ...processedEntity.properties };
        }
        
        // Step 1: Detect entity type if not specified
        if (!processedEntity.type || processedEntity.type === 'unknown') {
            processedEntity.type = this.detectEntityType(processedEntity);
            console.log(`Type detection: "${originalType || 'none'}" → "${processedEntity.type}"`);
        }
        
        // Step 2: Apply field extraction and mapping
        this.extractAndMapFields(processedEntity);
        
        // Step 3: Clean and normalize data
        this.cleanEntityData(processedEntity);
        
        // Step 4: Transform entity data if needed
        this.transformEntityData(processedEntity);
        
        // Ensure entity has a label
        if (!processedEntity.label) {
            processedEntity.label = this.generateLabel(processedEntity);
            console.log(`Generated label: "${originalLabel || 'none'}" → "${processedEntity.label}"`);
        }
        
        // Step 5: Filter entity if it doesn't meet criteria
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
        
        // Step 3: Transform link data if needed
        this.transformLinkData(processedLink);
        
        // Step 4: Filter link if it doesn't meet criteria
        if (this.shouldFilterLink(processedLink)) {
            return null;
        }
        
        return processedLink;
    }
    
    /**
     * Detect entity type based on its properties
     * @param {Object} entity - Entity to analyze
     * @return {string} Detected entity type
     */
    detectEntityType(entity) {
        // Start with some sensible defaults based on properties
        const props = entity.properties || {};
        const label = entity.label || '';
        
        // Check for common location indicators
        if (
            props.latitude || props.lat || props.longitude || props.lng ||
            props.address || props.city || props.country || props.postal_code ||
            props.zip
        ) {
            return 'location';
        }
        
        // Check for common person indicators
        if (
            props.first_name || props.last_name || props.gender || 
            props.age || props.dob || props.birthdate || props.ssn
        ) {
            return 'person';
        }
        
        // Check for common organization indicators
        if (
            props.industry || props.employees || props.founded ||
            props.revenue || props.company_type || props.registration_number
        ) {
            return 'organization';
        }
        
        // Check the entity label against type keywords
        const labelLower = label.toLowerCase();
        
        for (const [type, keywords] of Object.entries(this.processingRules.typeDetection)) {
            for (const keyword of keywords) {
                if (labelLower.includes(keyword)) {
                    return type;
                }
            }
        }
        
        // Default to person if we can't determine
        return 'person';
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
     * Extract and map fields based on entity type rules
     * @param {Object} entity - Entity to process
     */
    extractAndMapFields(entity) {
        // Don't apply mapping if no properties exist
        if (!entity.properties || Object.keys(entity.properties).length === 0) {
            // Try to extract properties from top-level entity fields
            const potentialProps = { ...entity };
            // Don't include these fields as properties
            delete potentialProps.id; 
            delete potentialProps.type;
            delete potentialProps.label;
            delete potentialProps.properties;
            delete potentialProps.position;
            
            // If we found some properties in the top level, use them
            if (Object.keys(potentialProps).length > 0) {
                entity.properties = potentialProps;
                console.log(`Extracted ${Object.keys(potentialProps).length} properties from top-level fields`);
            }
            return;
        }
        
        const type = entity.type;
        const rules = this.processingRules.fieldMapping[type];
        
        // Skip if no rules for this type
        if (!rules) return;
        
        const props = entity.properties;
        const newProps = {};
        const includedFields = rules.include || [];
        const renamedFields = rules.rename || {};
        
        // If include list is empty, include all fields
        const shouldIncludeAll = includedFields.length === 0;
        
        // Process fields in properties
        Object.entries(props).forEach(([key, value]) => {
            // Skip null/undefined/empty values
            if (value === null || value === undefined || value === '') return;
            
            // Check if this field should be renamed
            let newKey = renamedFields[key] || key;
            
            // Include if in include list or no include list specified
            if (shouldIncludeAll || includedFields.includes(newKey)) {
                newProps[newKey] = value;
            }
        });
        
        // Replace properties with filtered and renamed set only if we have some properties
        if (Object.keys(newProps).length > 0) {
            entity.properties = newProps;
        }
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
                // Use empty string for text fields
                if (typeof value === 'string') {
                    props[key] = '';
                }
                return;
            }
            
            // Convert empty strings to null for consistency
            if (value === '') {
                props[key] = null;
                return;
            }
            
            // Normalize date values
            if (this.processingRules.normalization.dateFields.includes(key)) {
                props[key] = this.normalizeDate(value);
                return;
            }
            
            // Apply case normalization for text
            if (typeof value === 'string') {
                // Uppercase fields
                if (this.processingRules.normalization.textCases.uppercase.includes(key)) {
                    props[key] = value.toUpperCase();
                } 
                // Lowercase fields
                else if (this.processingRules.normalization.textCases.lowercase.includes(key)) {
                    props[key] = value.toLowerCase();
                }
                // Title case fields
                else if (this.processingRules.normalization.textCases.titleCase.includes(key)) {
                    props[key] = this.toTitleCase(value);
                }
                
                // Apply value replacements
                const replacements = this.processingRules.normalization.valueReplacements[key];
                if (replacements && replacements[value.toLowerCase()]) {
                    props[key] = replacements[value.toLowerCase()];
                }
                
                // Trim whitespace from strings
                if (typeof props[key] === 'string') {
                    props[key] = props[key].trim();
                }
            }
            
            // Convert numeric strings to numbers
            if (typeof value === 'string' && !isNaN(value) && !isNaN(parseFloat(value))) {
                // This handles integers and floats
                props[key] = parseFloat(value);
            }
        });
    }
    
    /**
     * Transform entity data with more complex operations
     * @param {Object} entity - Entity to transform
     */
    transformEntityData(entity) {
        // Implement complex transformations here based on entity type
        const type = entity.type;
        const props = entity.properties;
        
        switch (type) {
            case 'person':
                // Combine first and last name into full name if needed
                if (props.first_name && props.last_name && !props.name) {
                    props.name = `${props.first_name} ${props.last_name}`;
                }
                
                // Calculate age from birthdate if available
                if (props.birthdate && !props.age) {
                    props.age = this.calculateAge(props.birthdate);
                }
                break;
                
            case 'location':
                // Format full address if components exist
                if (!props.address && (props.street || props.city || props.state || props.country)) {
                    props.address = this.formatAddress(props);
                }
                
                // Parse coordinates from string formats if needed
                this.parseCoordinates(props);
                break;
                
            case 'organization':
                // No special transformations yet
                break;
        }
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
     * Transform link data
     * @param {Object} link - Link to transform
     */
    transformLinkData(link) {
        // For now, we don't have any complex link transformations
        // This is where we'd implement link-specific transformations in the future
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
        // For now, we keep all links
        // This is where we'd implement filtering rules
        return false;
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
     * Parse coordinates from various string formats
     * @param {Object} props - Location properties
     */
    parseCoordinates(props) {
        // Handle coordinates in a single string field
        if (props.coordinates && typeof props.coordinates === 'string') {
            const matches = props.coordinates.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
            if (matches && matches.length === 3) {
                props.latitude = parseFloat(matches[1]);
                props.longitude = parseFloat(matches[2]);
            }
        }
        
        // Convert string coordinates to numbers
        if (props.latitude && typeof props.latitude === 'string') {
            props.latitude = parseFloat(props.latitude);
        }
        
        if (props.longitude && typeof props.longitude === 'string') {
            props.longitude = parseFloat(props.longitude);
        }
        
        // Handle lat/lng aliases
        if (!props.latitude && props.lat) {
            props.latitude = typeof props.lat === 'string' ? parseFloat(props.lat) : props.lat;
        }
        
        if (!props.longitude && props.lng) {
            props.longitude = typeof props.lng === 'string' ? parseFloat(props.lng) : props.lng;
        }
    }
    
    /**
     * Format full address from components
     * @param {Object} addressProps - Address components
     * @return {string} Formatted address
     */
    formatAddress(addressProps) {
        const parts = [];
        
        if (addressProps.street) parts.push(addressProps.street);
        if (addressProps.city) parts.push(addressProps.city);
        if (addressProps.state) parts.push(addressProps.state);
        if (addressProps.postal_code || addressProps.zip) parts.push(addressProps.postal_code || addressProps.zip);
        if (addressProps.country) parts.push(addressProps.country);
        
        return parts.join(', ');
    }
    
    /**
     * Calculate age from birthdate
     * @param {string|Date} birthdate - Birthdate
     * @return {number} Age in years
     */
    calculateAge(birthdate) {
        if (!birthdate) return null;
        
        try {
            const birth = new Date(birthdate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            
            // Adjust age if birthday hasn't occurred yet this year
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            
            return age;
        } catch (e) {
            console.error('Error calculating age:', e);
            return null;
        }
    }
    
    /**
     * Convert text to title case
     * @param {string} text - Input text
     * @return {string} Title cased text
     */
    toTitleCase(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    /**
     * Normalize different date formats to ISO format
     * @param {string|Date} date - Date to normalize
     * @return {string} Normalized ISO date string
     */
    normalizeDate(date) {
        if (!date) return null;
        
        try {
            // If already a Date object
            if (date instanceof Date) {
                return date.toISOString().split('T')[0];
            }
            
            // If it's a timestamp number
            if (typeof date === 'number') {
                return new Date(date).toISOString().split('T')[0];
            }
            
            // Handle string date formats
            if (typeof date === 'string') {
                // MM/DD/YYYY
                if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
                    const [month, day, year] = date.split('/');
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
                
                // DD/MM/YYYY
                if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(date)) {
                    const [day, month, year] = date.split('-');
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
                
                // Try standard parsing
                const parsed = new Date(date);
                if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString().split('T')[0];
                }
            }
            
            return date; // Return original if we can't normalize
        } catch (e) {
            console.error('Error normalizing date:', e, date);
            return date; // Return original on error
        }
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
    
    /**
     * Configure processing rules
     * @param {Object} rules - New rules to apply
     */
    configure(rules) {
        this.processingRules = {
            ...this.processingRules,
            ...rules
        };
    }
}

// Create singleton instance
const dataProcessor = new DataProcessorModule();
