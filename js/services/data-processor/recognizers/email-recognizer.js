import BaseRecognizer from './base-recognizer.js';

/**
 * Recognizer for email addresses
 */
class EmailRecognizer extends BaseRecognizer {
    /**
     * Normalize email values
     * @param {*} value - Value to normalize
     * @returns {string} Normalized email
     */
    normalize(value) {
        if (typeof value !== 'string') return value;
        
        // Lowercase and trim whitespace
        return value.trim().toLowerCase();
    }
    
    /**
     * Additional validation specific to emails
     * @param {string} value - Value to validate
     * @returns {boolean} True if valid
     */
    isValid(value) {
        if (!super.matchesPattern(value)) return false;
        
        // Additional checks beyond regex
        if (value.indexOf('@') === -1) return false;
        
        // Check for common invalid domains
        const domain = value.split('@')[1];
        if (domain === 'example.com' || domain === 'test.com') {
            return false;
        }
        
        return true;
    }
}

export default EmailRecognizer;
