import BaseRecognizer from './base-recognizer.js';

/**
 * Recognizer for geographic coordinates
 */
class CoordinatesRecognizer extends BaseRecognizer {
    /**
     * Enhanced check for coordinate fields and values
     * @param {string} fieldName - Field name
     * @param {*} value - Field value
     * @returns {boolean} True if likely coordinates
     */
    isLikelyType(fieldName, value) {
        if (super.isLikelyType(fieldName, value)) return true;
        
        // Check for paired lat/lng fields
        if ((fieldName === 'lat' || fieldName === 'latitude') && 
            typeof value === 'number' && 
            value >= -90 && value <= 90) {
            return true;
        }
        
        if ((fieldName === 'lng' || fieldName === 'lon' || fieldName === 'longitude') && 
            typeof value === 'number' && 
            value >= -180 && value <= 180) {
            return true;
        }
        
        // Check for coordinate objects
        if (typeof value === 'object' && value !== null) {
            if ((value.lat !== undefined || value.latitude !== undefined) && 
                (value.lng !== undefined || value.lon !== undefined || value.longitude !== undefined)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Normalize coordinate values
     * @param {*} value - Value to normalize
     * @returns {Object|string} Normalized coordinates
     */
    normalize(value) {
        if (typeof value === 'object' && value !== null) {
            // If already an object with lat/lng, standardize property names
            const lat = value.lat !== undefined ? value.lat : value.latitude;
            const lng = value.lng !== undefined ? value.lng : 
                       (value.lon !== undefined ? value.lon : value.longitude);
            
            if (lat !== undefined && lng !== undefined) {
                return {
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng)
                };
            }
        } else if (typeof value === 'string') {
            // Parse from string format (e.g., "40.7128, -74.0060")
            const matches = value.match(this.regex);
            if (matches && matches.length === 3) {
                return {
                    latitude: parseFloat(matches[1]),
                    longitude: parseFloat(matches[2])
                };
            }
            
            // Check for other formats like "40°7'28\"N 74°0'60\"W"
            const dmsMatches = value.match(/(\d+)°\s*(\d+)['′]\s*(\d+)[\"″]?\s*([NS])\s*(\d+)°\s*(\d+)['′]\s*(\d+)[\"″]?\s*([EW])/i);
            if (dmsMatches) {
                const latDeg = parseInt(dmsMatches[1]);
                const latMin = parseInt(dmsMatches[2]);
                const latSec = parseInt(dmsMatches[3]);
                const latDir = dmsMatches[4].toUpperCase();
                
                const lngDeg = parseInt(dmsMatches[5]);
                const lngMin = parseInt(dmsMatches[6]);
                const lngSec = parseInt(dmsMatches[7]);
                const lngDir = dmsMatches[8].toUpperCase();
                
                let lat = latDeg + (latMin / 60) + (latSec / 3600);
                if (latDir === 'S') lat *= -1;
                
                let lng = lngDeg + (lngMin / 60) + (lngSec / 3600);
                if (lngDir === 'W') lng *= -1;
                
                return {
                    latitude: lat,
                    longitude: lng
                };
            }
        }
        
        return value;
    }
    
    /**
     * Check if the coordinates are valid
     * @param {Object} coords - Coordinate object
     * @returns {boolean} True if valid coordinates
     */
    isValid(coords) {
        if (typeof coords !== 'object' || coords === null) return false;
        
        const lat = coords.latitude !== undefined ? coords.latitude : coords.lat;
        const lng = coords.longitude !== undefined ? coords.longitude : 
                   (coords.lon !== undefined ? coords.lon : coords.lng);
        
        if (typeof lat !== 'number' || typeof lng !== 'number') return false;
        if (lat < -90 || lat > 90) return false;
        if (lng < -180 || lng > 180) return false;
        
        return true;
    }
}

export default CoordinatesRecognizer;
