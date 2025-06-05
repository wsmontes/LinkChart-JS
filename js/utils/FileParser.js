/**
 * Utility for file parsing and data transformation
 */
class FileParserUtil {
    /**
     * Read file as text
     * @param {File} file - File object
     * @returns {Promise<string>} - File contents as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject(new Error("File reading failed"));
            reader.readAsText(file);
        });
    }

    /**
     * Read file as array buffer
     * @param {File} file - File object
     * @returns {Promise<ArrayBuffer>} - File contents as array buffer
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject(new Error("File reading failed"));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Read file as data URL
     * @param {File} file - File object
     * @returns {Promise<string>} - File contents as data URL
     */
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject(new Error("File reading failed"));
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Normalize CSV data to entity-link structure
     * @param {Array} rows - CSV data rows
     * @param {Object} mapping - Field mapping
     * @param {boolean} isLinks - Whether this is link data
     * @returns {Object} Normalized entity or link data
     */
    normalizeCSVData(rows, mapping, isLinks = false) {
        const result = {};
        
        // Determine key fields based on mapping
        const idField = isLinks ? (mapping.linkIdField || 'id') : (mapping.idField || 'id');
        const typeField = isLinks ? (mapping.linkTypeField || 'type') : (mapping.typeField || 'type');
        const labelField = mapping.labelField || 'label';
        
        // Link-specific fields
        const sourceField = mapping.sourceField || 'source';
        const targetField = mapping.targetField || 'target';
        
        rows.forEach((row, index) => {
            // Skip empty rows
            if (Object.keys(row).length === 0) return;
            
            // Generate ID if not present
            const id = row[idField] || (isLinks ? 
                `link_${Date.now()}_${index}` : 
                `entity_${Date.now()}_${index}`);
            
            // Skip if ID already exists
            if (result[id]) return;
            
            // Extract properties (excluding special fields)
            const properties = {};
            Object.entries(row).forEach(([key, value]) => {
                if (!isLinks) {
                    // For entities, exclude ID, type, and label fields
                    if (key !== idField && key !== typeField && key !== labelField) {
                        properties[key] = value;
                    }
                } else {
                    // For links, exclude ID, type, source, and target fields
                    if (key !== idField && key !== typeField && 
                        key !== sourceField && key !== targetField) {
                        properties[key] = value;
                    }
                }
            });
            
            if (isLinks) {
                // Create link object
                result[id] = {
                    id,
                    source: row[sourceField],
                    target: row[targetField],
                    type: row[typeField] || 'associates',
                    properties
                };
            } else {
                // Create entity object
                result[id] = {
                    id,
                    type: row[typeField] || 'person',
                    label: row[labelField] || id,
                    position: { x: Math.random() * 500, y: Math.random() * 500 },
                    properties
                };
            }
        });
        
        return result;
    }
    
    /**
     * Convert XML to JSON object
     * @param {Document} xmlDoc - XML Document
     * @returns {Object} Converted JSON object
     */
    xmlToJson(xmlDoc) {
        // Create the return object
        var obj = {};

        if (xmlDoc.nodeType === 1) { // Element
            // Process attributes
            if (xmlDoc.attributes.length > 0) {
                obj["@attributes"] = {};
                for (let i = 0; i < xmlDoc.attributes.length; i++) {
                    const attribute = xmlDoc.attributes[i];
                    obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                }
            }
        } else if (xmlDoc.nodeType === 3) { // Text
            obj = xmlDoc.nodeValue.trim();
        }

        // Process children
        if (xmlDoc.hasChildNodes()) {
            for (let i = 0; i < xmlDoc.childNodes.length; i++) {
                const item = xmlDoc.childNodes[i];
                const nodeName = item.nodeName;
                
                if (nodeName === "#text" && item.nodeValue.trim() === "") continue;
                
                if (typeof(obj[nodeName]) === "undefined") {
                    obj[nodeName] = this.xmlToJson(item);
                } else {
                    if (typeof(obj[nodeName].push) === "undefined") {
                        var old = obj[nodeName];
                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                    }
                    obj[nodeName].push(this.xmlToJson(item));
                }
            }
        }
        
        return obj;
    }
}

// Create singleton instance
const fileParserUtil = new FileParserUtil();
