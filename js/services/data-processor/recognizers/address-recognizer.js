import BaseRecognizer from './base-recognizer.js';

/**
 * Recognizer for addresses
 */
class AddressRecognizer extends BaseRecognizer {
    /**
     * Additional address-specific indicators beyond the base implementation
     * @param {string} fieldName - Field name
     * @param {*} value - Field value
     * @returns {boolean} True if likely an address
     */
    isLikelyType(fieldName, value) {
        if (super.isLikelyType(fieldName, value)) return true;
        
        if (typeof value !== 'string') return false;
        
        // Check for street suffixes with word boundaries
        const streetSuffixes = [
            /\bst\b/i, /\bstreet\b/i, /\bave\b/i, /\bavenue\b/i, 
            /\bblvd\b/i, /\bboulevard\b/i, /\brd\b/i, /\broad\b/i,
            /\bln\b/i, /\blane\b/i, /\bway\b/i, /\bpl\b/i, /\bplace\b/i,
            /\bdr\b/i, /\bdrive\b/i, /\bcir\b/i, /\bcircle\b/i
        ];
        
        if (streetSuffixes.some(suffix => suffix.test(value))) {
            return true;
        }
        
        // Check for address number patterns (e.g., "123 Main St")
        if (/^\d+\s+[A-Za-z]/.test(value)) {
            return true;
        }
        
        // Look for postal code pattern within the string
        if (/\b\d{5}(?:-\d{4})?\b/.test(value)) { // US ZIP
            return true;
        }
        
        // Look for state abbreviations with word boundaries
        const stateAbbr = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/;
        if (stateAbbr.test(value)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Normalize address values
     * @param {*} value - Value to normalize
     * @returns {string} Normalized address
     */
    normalize(value) {
        if (typeof value !== 'string') return value;
        
        // Basic address normalization - expand common abbreviations
        const addressAbbreviations = {
            'st': 'Street',
            'rd': 'Road',
            'ave': 'Avenue',
            'blvd': 'Boulevard',
            'dr': 'Drive',
            'ln': 'Lane',
            'ct': 'Court',
            'pl': 'Place',
            'pkwy': 'Parkway',
            'sq': 'Square',
            'hwy': 'Highway',
            'apt': 'Apartment',
            'ste': 'Suite',
            'n': 'North',
            's': 'South',
            'e': 'East',
            'w': 'West',
            'ne': 'Northeast',
            'nw': 'Northwest',
            'se': 'Southeast',
            'sw': 'Southwest'
        };
        
        let normalized = value;
        
        // Replace abbreviations with full words only at word boundaries
        for (const [abbr, full] of Object.entries(addressAbbreviations)) {
            const regex = new RegExp(`\\b${abbr}\\b`, 'i');
            normalized = normalized.replace(regex, full);
        }
        
        // Ensure proper capitalization for each word
        normalized = normalized.split(' ')
            .map(word => {
                if (/^[a-z]/.test(word)) {
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }
                return word;
            })
            .join(' ');
        
        return normalized;
    }
}

export default AddressRecognizer;
