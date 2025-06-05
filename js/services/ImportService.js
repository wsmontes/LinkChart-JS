/**
 * Service handling all import operations for different file formats
 */
class ImportService {
    constructor() {
        // Supported file formats
        this.supportedFormats = {
            json: { name: "JSON", extensions: [".json"] },
            csv: { name: "CSV", extensions: [".csv"] },
            excel: { name: "Excel", extensions: [".xlsx", ".xls"] },
            graphml: { name: "GraphML", extensions: [".graphml", ".xml"] },
            gexf: { name: "GEXF", extensions: [".gexf", ".xml"] },
            cypher: { name: "Neo4j Cypher", extensions: [".cypher", ".cql"] }
        };
    }

    /**
     * Detect file format based on extension
     * @param {File} file - The file object
     * @returns {string|null} - The detected format or null if not supported
     */
    detectFormat(file) {
        const fileName = file.name.toLowerCase();
        
        for (const [format, info] of Object.entries(this.supportedFormats)) {
            if (info.extensions.some(ext => fileName.endsWith(ext))) {
                return format;
            }
        }
        
        return null;
    }

    /**
     * Import data from JSON file
     * @param {File} file - JSON file
     * @returns {Promise<Object>} - Parsed data
     */
    async importFromJSON(file) {
        try {
            return await storageService.importFromJSON(file);
        } catch (error) {
            throw new Error(`JSON import error: ${error.message}`);
        }
    }

    /**
     * Import data from CSV files
     * @param {File} entitiesFile - CSV file with entities
     * @param {File} linksFile - CSV file with links
     * @param {Object} mapping - Field mapping configuration
     * @returns {Promise<Object>} - Parsed data
     */
    async importFromCSV(entitiesFile, linksFile, mapping = {}) {
        try {
            // Parse CSV files
            const entitiesData = await this.parseCSV(entitiesFile);
            const linksData = linksFile ? await this.parseCSV(linksFile) : [];
            
            // Process with mapping info
            return this.processCSVData(entitiesData, linksData, mapping);
        } catch (error) {
            throw new Error(`CSV import error: ${error.message}`);
        }
    }

    /**
     * Import data from Excel file
     * @param {File} file - Excel file
     * @param {Object} options - Import options (sheet names, etc)
     * @returns {Promise<Object>} - Parsed data
     */
    async importFromExcel(file, options = {}) {
        try {
            // We need to load the SheetJS library if not already loaded
            if (!window.XLSX) {
                await this.loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
            }

            // Read the file
            const data = await this.readFileAsArrayBuffer(file);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Determine which sheets to use
            const entitiesSheet = options.entitiesSheet || workbook.SheetNames[0];
            const linksSheet = options.linksSheet || 
                (workbook.SheetNames.length > 1 ? workbook.SheetNames[1] : null);
            
            // Parse sheets to JSON
            const entitiesData = XLSX.utils.sheet_to_json(workbook.Sheets[entitiesSheet]);
            let linksData = [];
            if (linksSheet && workbook.Sheets[linksSheet]) {
                linksData = XLSX.utils.sheet_to_json(workbook.Sheets[linksSheet]);
            }
            
            // Process with mapping info
            return this.processExcelData(entitiesData, linksData, options.mapping || {});
        } catch (error) {
            throw new Error(`Excel import error: ${error.message}`);
        }
    }

    /**
     * Import data from GraphML file
     * @param {File} file - GraphML file
     * @returns {Promise<Object>} - Parsed data
     */
    async importFromGraphML(file) {
        try {
            const text = await this.readFileAsText(file);
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            
            const entities = {};
            const links = {};
            
            // Parse node elements
            const nodeElements = xmlDoc.getElementsByTagName('node');
            Array.from(nodeElements).forEach((node, index) => {
                const id = node.getAttribute('id') || `entity_${Date.now()}_${index}`;
                
                // Extract data elements
                const dataElements = node.getElementsByTagName('data');
                const properties = {};
                let type = 'person'; // default type
                let label = id;
                
                Array.from(dataElements).forEach(data => {
                    const key = data.getAttribute('key');
                    const value = data.textContent;
                    
                    if (key === 'type') {
                        type = value;
                    } else if (key === 'label') {
                        label = value;
                    } else {
                        properties[key] = value;
                    }
                });
                
                // Create entity
                entities[id] = {
                    id,
                    type,
                    label,
                    position: { x: Math.random() * 500, y: Math.random() * 500 },
                    properties
                };
            });
            
            // Parse edge elements
            const edgeElements = xmlDoc.getElementsByTagName('edge');
            Array.from(edgeElements).forEach((edge, index) => {
                const id = edge.getAttribute('id') || `link_${Date.now()}_${index}`;
                const source = edge.getAttribute('source');
                const target = edge.getAttribute('target');
                
                // Extract data elements
                const dataElements = edge.getElementsByTagName('data');
                const properties = {};
                let type = 'associates'; // default type
                
                Array.from(dataElements).forEach(data => {
                    const key = data.getAttribute('key');
                    const value = data.textContent;
                    
                    if (key === 'type') {
                        type = value;
                    } else {
                        properties[key] = value;
                    }
                });
                
                // Create link
                links[id] = {
                    id,
                    source,
                    target,
                    type,
                    properties
                };
            });
            
            return { entities, links };
        } catch (error) {
            throw new Error(`GraphML import error: ${error.message}`);
        }
    }

    /**
     * Import data from GEXF file
     * @param {File} file - GEXF file
     * @returns {Promise<Object>} - Parsed data
     */
    async importFromGEXF(file) {
        try {
            const text = await this.readFileAsText(file);
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            
            const entities = {};
            const links = {};
            
            // Parse node elements
            const nodeElements = xmlDoc.getElementsByTagName('node');
            Array.from(nodeElements).forEach((node, index) => {
                const id = node.getAttribute('id') || `entity_${Date.now()}_${index}`;
                const label = node.getAttribute('label') || id;
                
                // Extract attributes
                const attValues = node.getElementsByTagName('attvalue');
                const properties = {};
                let type = 'person'; // default type
                
                Array.from(attValues).forEach(att => {
                    const key = att.getAttribute('for');
                    const value = att.getAttribute('value');
                    
                    if (key === 'type') {
                        type = value;
                    } else {
                        properties[key] = value;
                    }
                });
                
                // Create entity
                entities[id] = {
                    id,
                    type,
                    label,
                    position: { x: Math.random() * 500, y: Math.random() * 500 },
                    properties
                };
            });
            
            // Parse edge elements
            const edgeElements = xmlDoc.getElementsByTagName('edge');
            Array.from(edgeElements).forEach((edge, index) => {
                const id = edge.getAttribute('id') || `link_${Date.now()}_${index}`;
                const source = edge.getAttribute('source');
                const target = edge.getAttribute('target');
                
                // Extract attributes
                const attValues = edge.getElementsByTagName('attvalue');
                const properties = {};
                let type = 'associates'; // default type
                
                Array.from(attValues).forEach(att => {
                    const key = att.getAttribute('for');
                    const value = att.getAttribute('value');
                    
                    if (key === 'type') {
                        type = value;
                    } else {
                        properties[key] = value;
                    }
                });
                
                // Create link
                links[id] = {
                    id,
                    source,
                    target,
                    type,
                    properties
                };
            });
            
            return { entities, links };
        } catch (error) {
            throw new Error(`GEXF import error: ${error.message}`);
        }
    }

    /**
     * Import data from Neo4j Cypher file
     * @param {File} file - Cypher file
     * @returns {Promise<Object>} - Parsed data
     */
    async importFromCypher(file) {
        try {
            const text = await this.readFileAsText(file);
            const entities = {};
            const links = {};
            
            // Parse CREATE statements for nodes
            const nodeRegex = /CREATE\s*\(([^)]+)\)/g;
            let nodeMatch;
            
            while ((nodeMatch = nodeRegex.exec(text)) !== null) {
                const nodeText = nodeMatch[1];
                const idMatch = nodeText.match(/([a-zA-Z0-9_]+):/);
                if (idMatch) {
                    const id = idMatch[1];
                    
                    // Extract labels (node types)
                    const labelMatches = nodeText.match(/:([a-zA-Z0-9_]+)/g);
                    let type = 'person'; // default type
                    if (labelMatches && labelMatches.length > 0) {
                        type = labelMatches[0].substring(1).toLowerCase();
                        // Map Neo4j labels to our entity types
                        if (type === 'person' || type === 'organization' || 
                            type === 'location' || type === 'event') {
                            // These are already matching our types
                        } else {
                            // Default to person for unknown types
                            type = 'person';
                        }
                    }
                    
                    // Extract properties
                    const propMatches = nodeText.match(/{([^}]+)}/);
                    const properties = {};
                    let label = id;
                    
                    if (propMatches) {
                        const propText = propMatches[1];
                        const propPairs = propText.split(',');
                        
                        propPairs.forEach(pair => {
                            const [key, value] = pair.split(':').map(s => s.trim());
                            // Remove quotes if present
                            const cleanKey = key.replace(/['"]/g, '');
                            let cleanValue = value.replace(/['"]/g, '');
                            
                            // Try to parse numbers
                            if (!isNaN(cleanValue)) {
                                cleanValue = parseFloat(cleanValue);
                            }
                            
                            properties[cleanKey] = cleanValue;
                            
                            // Use name or title as label
                            if (cleanKey === 'name' || cleanKey === 'title') {
                                label = cleanValue;
                            }
                        });
                    }
                    
                    // Create entity
                    entities[id] = {
                        id,
                        type,
                        label,
                        position: { x: Math.random() * 500, y: Math.random() * 500 },
                        properties
                    };
                }
            }
            
            // Parse CREATE statements for relationships
            const relRegex = /CREATE\s*\(([^)]+)\)-\[:([^\]]+)\]->\(([^)]+)\)/g;
            let relMatch;
            
            while ((relMatch = relRegex.exec(text)) !== null) {
                const sourceId = relMatch[1].split(':')[0];
                const targetId = relMatch[3].split(':')[0];
                const relType = relMatch[2];
                
                // Map Neo4j relationship types to our link types
                let type = 'associates'; // default type
                if (relType.toLowerCase().includes('owns')) {
                    type = 'owns';
                } else if (relType.toLowerCase().includes('communicates')) {
                    type = 'communicates';
                } else if (relType.toLowerCase().includes('family')) {
                    type = 'family';
                } else if (relType.toLowerCase().includes('travels')) {
                    type = 'travels';
                }
                
                const id = `link_${Date.now()}_${Object.keys(links).length}`;
                
                // Create link
                links[id] = {
                    id,
                    source: sourceId,
                    target: targetId,
                    type,
                    properties: {}
                };
            }
            
            return { entities, links };
        } catch (error) {
            throw new Error(`Cypher import error: ${error.message}`);
        }
    }

    /**
     * Parse CSV file
     * @param {File} file - CSV file
     * @returns {Promise<Array>} - Parsed data
     */
    async parseCSV(file) {
        try {
            const text = await this.readFileAsText(file);
            const rows = text.split(/\r?\n/);
            const headers = this.parseCSVRow(rows[0]);
            
            const data = [];
            for (let i = 1; i < rows.length; i++) {
                if (!rows[i].trim()) continue;
                
                const values = this.parseCSVRow(rows[i]);
                const row = {};
                
                headers.forEach((header, index) => {
                    if (index < values.length) {
                        row[header] = values[index];
                    } else {
                        row[header] = '';
                    }
                });
                
                data.push(row);
            }
            
            return data;
        } catch (error) {
            throw new Error(`CSV parsing error: ${error.message}`);
        }
    }

    /**
     * Parse a CSV row, handling quoted values with commas
     * @param {string} row - CSV row text
     * @returns {Array} - Array of values
     */
    parseCSVRow(row) {
        const result = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            const nextChar = row[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Double quotes inside quotes
                    currentValue += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quotes mode
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of value
                result.push(currentValue.trim());
                currentValue = '';
            } else {
                // Normal character
                currentValue += char;
            }
        }
        
        // Add the last value
        result.push(currentValue.trim());
        return result;
    }

    /**
     * Process parsed CSV data into entities and links
     * @param {Array} entitiesData - Array of entity objects
     * @param {Array} linksData - Array of link objects
     * @param {Object} mapping - Field mapping configuration
     * @returns {Object} - Entities and links objects
     */
    processCSVData(entitiesData, linksData, mapping) {
        const entities = {};
        const links = {};
        
        // Process entities
        entitiesData.forEach((row, index) => {
            // Use mapping or guess fields
            const idField = mapping.idField || this.guessField(row, ['id', 'ID', 'Id']);
            const typeField = mapping.typeField || this.guessField(row, ['type', 'Type', 'TYPE', 'entity_type']);
            const labelField = mapping.labelField || this.guessField(row, ['label', 'Label', 'name', 'Name', 'title', 'Title']);
            
            const id = row[idField] || `entity_${Date.now()}_${index}`;
            let type = (row[typeField] || '').toLowerCase();
            const label = row[labelField] || id;
            
            // Validate type against our supported entity types
            if (!ENTITY_TYPES[type]) {
                type = 'person'; // Default to person
            }
            
            // Extract properties
            const properties = {};
            Object.entries(row).forEach(([key, value]) => {
                if (key !== idField && key !== typeField && key !== labelField) {
                    properties[key] = value;
                }
            });
            
            // Create entity
            entities[id] = {
                id,
                type,
                label,
                position: { x: Math.random() * 500, y: Math.random() * 500 },
                properties
            };
        });
        
        // Process links
        linksData.forEach((row, index) => {
            // Use mapping or guess fields
            const idField = mapping.linkIdField || this.guessField(row, ['id', 'ID', 'Id']);
            const sourceField = mapping.sourceField || this.guessField(row, ['source', 'Source', 'from', 'From']);
            const targetField = mapping.targetField || this.guessField(row, ['target', 'Target', 'to', 'To']);
            const typeField = mapping.linkTypeField || this.guessField(row, ['type', 'Type', 'TYPE', 'relationship']);
            
            const id = row[idField] || `link_${Date.now()}_${index}`;
            const source = row[sourceField];
            const target = row[targetField];
            let type = (row[typeField] || '').toLowerCase();
            
            // Validate source and target
            if (!source || !target) return;
            
            // Validate type against our supported link types
            if (!LINK_TYPES[type]) {
                type = 'associates'; // Default to associates
            }
            
            // Extract properties
            const properties = {};
            Object.entries(row).forEach(([key, value]) => {
                if (key !== idField && key !== sourceField && key !== targetField && key !== typeField) {
                    properties[key] = value;
                }
            });
            
            // Create link
            links[id] = {
                id,
                source,
                target,
                type,
                properties
            };
        });
        
        return { entities, links };
    }

    /**
     * Process parsed Excel data into entities and links
     * @param {Array} entitiesData - Array of entity objects
     * @param {Array} linksData - Array of link objects
     * @param {Object} mapping - Field mapping configuration
     * @returns {Object} - Entities and links objects
     */
    processExcelData(entitiesData, linksData, mapping) {
        // Excel parsing results in similar structure to CSV
        return this.processCSVData(entitiesData, linksData, mapping);
    }

    /**
     * Try to guess which field in a row matches a set of potential names
     * @param {Object} row - Data row
     * @param {Array} potentialNames - Potential field names
     * @returns {string|null} - Matching field name or null
     */
    guessField(row, potentialNames) {
        for (const name of potentialNames) {
            if (row.hasOwnProperty(name)) {
                return name;
            }
        }
        return Object.keys(row)[0]; // Default to first field
    }

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
     * Dynamically load external script
     * @param {string} src - Script URL
     * @returns {Promise} - Promise that resolves when script is loaded
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Get a sample of data from a CSV file for preview
     * @param {File} file - CSV file
     * @param {number} sampleSize - Number of rows to sample
     * @returns {Promise<Object>} - Headers and sample data
     */
    async getCSVSample(file, sampleSize = 5) {
        try {
            const text = await this.readFileAsText(file);
            const rows = text.split(/\r?\n/);
            const headers = this.parseCSVRow(rows[0]);
            
            const samples = [];
            for (let i = 1; i < rows.length && samples.length < sampleSize; i++) {
                if (!rows[i].trim()) continue;
                
                const values = this.parseCSVRow(rows[i]);
                const row = {};
                
                headers.forEach((header, index) => {
                    if (index < values.length) {
                        row[header] = values[index];
                    } else {
                        row[header] = '';
                    }
                });
                
                samples.push(row);
            }
            
            return { headers, samples };
        } catch (error) {
            throw new Error(`CSV sample error: ${error.message}`);
        }
    }

    /**
     * Get a sample of data from an Excel file for preview
     * @param {File} file - Excel file
     * @param {number} sampleSize - Number of rows to sample
     * @returns {Promise<Object>} - Sheet names and sample data
     */
    async getExcelSample(file, sampleSize = 5) {
        try {
            // Load SheetJS if needed
            if (!window.XLSX) {
                await this.loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
            }
            
            // Read the file
            const data = await this.readFileAsArrayBuffer(file);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const sheetSamples = {};
            
            // Process each sheet
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (jsonData.length > 0) {
                    const headers = jsonData[0];
                    const samples = [];
                    
                    for (let i = 1; i < jsonData.length && i <= sampleSize; i++) {
                        const row = {};
                        headers.forEach((header, index) => {
                            row[header] = jsonData[i][index] || '';
                        });
                        samples.push(row);
                    }
                    
                    sheetSamples[sheetName] = { headers, samples };
                }
            });
            
            return {
                sheetNames: workbook.SheetNames,
                samples: sheetSamples
            };
        } catch (error) {
            throw new Error(`Excel sample error: ${error.message}`);
        }
    }
}

// Create singleton instance
const importService = new ImportService();
