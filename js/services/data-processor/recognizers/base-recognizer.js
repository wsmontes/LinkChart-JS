/**
 * Base class for all data type recognizers
 */
class BaseRecognizer {
    /**
     * Initialize the recognizer with pattern data
     * @param {Object} patternData - Pattern configuration
     */
    constructor(patternData) {
        this.patterns = patternData;
        this.fieldNames = patternData?.fieldNames || [];
        this.regex = patternData?.regex ? new RegExp(patternData.regex, 'i') : null;
    }
    
    /**
     * Check if field name matches any of the known field names for this type
     * @param {string} fieldName - Field name to check
     * @returns {boolean} True if field name matches
     */
    matchesFieldName(fieldName) {
        if (!fieldName || !this.fieldNames || this.fieldNames.length === 0) return false;
        
        const normalizedFieldName = fieldName.toLowerCase().replace(/[_-\s]/g, '');
        
        return this.fieldNames.some(knownField => {
            const normalizedKnownField = knownField.toLowerCase().replace(/[_-\s]/g, '');
            return normalizedFieldName === normalizedKnownField || 
                   normalizedFieldName.includes(normalizedKnownField) ||
                   normalizedKnownField.includes(normalizedFieldName);
        });
    }
    
    /**
     * Check if value matches the regex pattern for this type
     * @param {string} value - Value to test
     * @returns {boolean} True if value matches pattern
     */
    matchesPattern(value) {
        if (!value || typeof value !== 'string' || !this.regex) return false;
        return this.regex.test(value);
    }
    
    /**
     * Check if the field is likely of this type based on name and/or value
     * @param {string} fieldName - Field name
     * @param {*} value - Field value
     * @returns {boolean} True if field is likely this type
     */
    isLikelyType(fieldName, value) {
        // Strong match if both field name and value pattern match
        if (this.matchesFieldName(fieldName) && this.matchesPattern(value)) {
            return true;
        }
        
        // Field name matching is a moderately strong signal
        if (this.matchesFieldName(fieldName)) {
            return true;
        }
        
        // Value pattern matching by itself is a weaker signal
        if (typeof value === 'string' && this.matchesPattern(value)) {
            return true; 
        }
        
        return false;
    }
    
    /**
     * Calculate confidence score (0-1) that a field is of this type
     * @param {string} fieldName - Field name
     * @param {*} value - Field value
     * @returns {number} Confidence score between 0-1
     */
    getConfidence(fieldName, value) {
        if (this.matchesFieldName(fieldName) && this.matchesPattern(value)) {
            return 1.0; // Perfect match (name and pattern)
        } else if (this.matchesFieldName(fieldName)) {
            return 0.7; // Good match (name only)
        } else if (typeof value === 'string' && this.matchesPattern(value)) {
            return 0.5; // Possible match (pattern only)
        }
        return 0;
    }
    
    /**
     * Normalize the value according to this type's rules
     * @param {*} value - Value to normalize
     * @returns {*} Normalized value
     */
    normalize(value) {
        // Default implementation does nothing
        // Override in specific recognizers
        return value;
    }
}

export default BaseRecognizer;
