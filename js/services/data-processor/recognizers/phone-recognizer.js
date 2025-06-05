import BaseRecognizer from './base-recognizer.js';

/**
 * Recognizer for phone numbers
 */
class PhoneRecognizer extends BaseRecognizer {
    /**
     * Normalize phone number values
     * @param {*} value - Value to normalize
     * @returns {string} Normalized phone number
     */
    normalize(value) {
        if (typeof value !== 'string') return value;
        
        // Remove all non-numeric characters
        const digits = value.replace(/\D/g, '');
        
        // Format according to length
        if (digits.length === 10) {
            // US format: (XXX) XXX-XXXX
            return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
        } else if (digits.length === 11 && digits[0] === '1') {
            // US with country code: +1 (XXX) XXX-XXXX
            return `+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
        } else if (digits.length > 10) {
            // International format
            return `+${digits}`;
        }
        
        // Return as-is if can't normalize
        return value;
    }
    
    /**
     * Enhanced matching for phone numbers beyond regex
     * @param {string} value - Value to check
     * @returns {boolean} True if matches phone pattern
     */
    matchesPattern(value) {
        if (!super.matchesPattern(value)) {
            // Try additional phone formats not covered by regex
            const digitCount = (value.match(/\d/g) || []).length;
            return digitCount >= 7 && digitCount <= 15;
        }
        return true;
    }
}

export default PhoneRecognizer;
