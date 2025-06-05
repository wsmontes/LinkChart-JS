/**
 * Detects entity types based on properties
 */
class TypeDetector {
    /**
     * Initialize with type patterns
     * @param {Object} entityTypePatterns - Entity type patterns from JSON
     */
    constructor(entityTypePatterns) {
        this.entityTypePatterns = entityTypePatterns;
    }
    
    /**
     * Detect entity type based on its properties
     * @param {Object} entity - Entity to analyze
     * @return {string} Detected entity type
     */
    detectEntityType(entity) {
        if (!entity || !this.entityTypePatterns) return 'person';
        
        const props = entity.properties || {};
        const label = entity.label || '';
        const fieldNames = Object.keys(props);
        
        // Calculate scores for each entity type
        const scores = {};
        for (const [type, patterns] of Object.entries(this.entityTypePatterns)) {
            scores[type] = this.calculateTypeScore(type, label, props, fieldNames, patterns);
        }
        
        // Find type with highest score
        let highestScore = -1;
        let detectedType = 'person';  // Default
        
        for (const [type, score] of Object.entries(scores)) {
            if (score > highestScore) {
                highestScore = score;
                detectedType = type;
            }
        }
        
        // Ensure the type is valid in our entity types
        if (!ENTITY_TYPES[detectedType]) {
            return 'person';
        }
        
        return detectedType;
    }
    
    /**
     * Calculate score for a specific entity type
     * @param {string} type - Entity type
     * @param {string} label - Entity label
     * @param {Object} props - Entity properties
     * @param {Array} fieldNames - Property field names
     * @param {Object} patterns - Type patterns
     * @returns {number} Score for type match
     */
    calculateTypeScore(type, label, props, fieldNames, patterns) {
        let score = 0;
        
        // Check label for keywords
        if (patterns.keywords && label) {
            const labelLower = label.toLowerCase();
            for (const keyword of patterns.keywords) {
                if (labelLower.includes(keyword.toLowerCase())) {
                    score += 2;  // Strong indicator in label
                    break;
                }
            }
        }
        
        // Check property field names
        if (patterns.properties) {
            for (const propName of patterns.properties) {
                if (fieldNames.includes(propName) || fieldNames.some(f => f.includes(propName))) {
                    score += 1;  // Medium indicator - property name match
                }
            }
        }
        
        // Check field patterns
        if (patterns.fieldPatterns) {
            for (const [patternKey, patternConfig] of Object.entries(patterns.fieldPatterns)) {
                // Check fields with matching names
                for (const fieldName of fieldNames) {
                    if (patternConfig.fields && this.matchesFieldPattern(fieldName, props[fieldName], patternConfig)) {
                        score += 1.5;  // Strong indicator - field pattern match
                    }
                }
            }
        }
        
        // Special type-specific checks
        if (type === 'location' && this.hasCoordinates(props)) {
            score += 3;  // Strongest indicator for locations
        } else if (type === 'person' && this.hasPersonalInfo(props)) {
            score += 2;  // Strong person indicator
        } else if (type === 'organization' && this.hasOrgInfo(props)) {
            score += 2;  // Strong organization indicator
        }
        
        return score;
    }
    
    /**
     * Check if field matches a pattern configuration
     * @param {string} fieldName - Field name
     * @param {*} value - Field value
     * @param {Object} patternConfig - Pattern configuration
     * @returns {boolean} True if matches
     */
    matchesFieldPattern(fieldName, value, patternConfig) {
        // Check if field name matches any of the fields in the pattern
        const fieldMatches = patternConfig.fields && patternConfig.fields.some(f => 
            fieldName === f || fieldName.includes(f) || f.includes(fieldName)
        );
        
        if (!fieldMatches) return false;
        
        // If field matches and value isn't available, it's still a match
        if (value === undefined || value === null) return true;
        
        // If regex pattern exists, check against it
        if (patternConfig.regex && typeof value === 'string') {
            const regex = new RegExp(patternConfig.regex, 'i');
            if (regex.test(value)) return true;
        }
        
        // If values list exists, check if value is in it
        if (patternConfig.values && typeof value === 'string') {
            const valueLower = value.toLowerCase();
            if (patternConfig.values.some(v => v.toLowerCase() === valueLower)) {
                return true;
            }
        }
        
        // Default to true if field name matches but we have no value constraints
        return !(patternConfig.regex || patternConfig.values);
    }
    
    /**
     * Check if entity has coordinates
     * @param {Object} props - Entity properties
     * @returns {boolean} True if has coordinates
     */
    hasCoordinates(props) {
        // Check for latitude/longitude pairs
        const hasLat = props.latitude !== undefined || props.lat !== undefined;
        const hasLng = props.longitude !== undefined || props.lng !== undefined;
        
        // Check for coordinates field
        const hasCoords = props.coordinates !== undefined && 
            typeof props.coordinates === 'string' &&
            /^-?\d+\.?\d*[,\s]+-?\d+\.?\d*$/.test(props.coordinates);
        
        return (hasLat && hasLng) || hasCoords;
    }
    
    /**
     * Check if entity has person-specific info
     * @param {Object} props - Entity properties
     * @returns {boolean} True if has person info
     */
    hasPersonalInfo(props) {
        // Check for common person identifiers
        return !!(props.first_name || props.last_name || 
                props.gender || props.dob || props.birthdate || 
                props.age || props.ssn || props.email);
    }
    
    /**
     * Check if entity has organization-specific info
     * @param {Object} props - Entity properties
     * @returns {boolean} True if has organization info
     */
    hasOrgInfo(props) {
        // Check for company identifiers
        return !!(props.industry || props.employees || props.founded || props.revenue || 
                props.website || props.company_type || props.registration_number);
    }
}

export default TypeDetector;
