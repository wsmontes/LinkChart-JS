/**
 * Service for data operations, import/export, and analytics
 */
class DataService {
    constructor() {
        this.graphController = null;
    }
    
    /**
     * Set the graph controller instance
     * @param {GraphController} controller - Graph controller instance
     */
    setGraphController(controller) {
        this.graphController = controller;
    }
    
    /**
     * Get complete investigation data
     * @returns {Object} Complete investigation data
     */
    getInvestigationData() {
        if (!this.graphController) return { entities: {}, links: {} };
        
        return {
            entities: this.graphController.entities,
            links: this.graphController.links,
            metadata: {
                created: new Date().toISOString(),
                version: APP_CONFIG.version
            }
        };
    }
    
    /**
     * Load investigation data
     * @param {Object} data - Investigation data
     */
    loadInvestigationData(data) {
        if (!this.graphController) return;
        
        // Clear existing data
        this.graphController.clearGraph();
        
        // Load entities first
        Object.values(data.entities).forEach(entityData => {
            const entity = new Entity(
                entityData.id, 
                entityData.type, 
                entityData.label, 
                entityData.position, 
                entityData.properties
            );
            this.graphController.addExistingEntity(entity);
        });
        
        // Then load links
        Object.values(data.links).forEach(linkData => {
            const link = new Link(
                linkData.id,
                linkData.source,
                linkData.target,
                linkData.type,
                linkData.properties
            );
            this.graphController.addExistingLink(link);
        });
        
        // Apply layout
        this.graphController.graphView.applyLayout();
    }
    
    /**
     * Import data from CSV
     * @param {File} entitiesFile - CSV file with entities data
     * @param {File} linksFile - CSV file with links data
     * @returns {Promise<Object>} Imported data
     */
    async importFromCSV(entitiesFile, linksFile) {
        try {
            const entitiesData = await this.parseCSV(entitiesFile);
            const linksData = await this.parseCSV(linksFile);
            
            const entities = {};
            const links = {};
            
            // Parse entities
            entitiesData.forEach((row, index) => {
                if (index === 0) return; // Skip header
                
                const id = row[0] || `entity_${Date.now()}_${index}`;
                const type = row[1];
                const label = row[2];
                const properties = row[3] ? JSON.parse(row[3]) : {};
                const position = { x: Math.random() * 500, y: Math.random() * 500 };
                
                entities[id] = new Entity(id, type, label, position, properties);
            });
            
            // Parse links
            linksData.forEach((row, index) => {
                if (index === 0) return; // Skip header
                
                const id = row[0] || `link_${Date.now()}_${index}`;
                const source = row[1];
                const target = row[2];
                const type = row[3];
                const properties = row[4] ? JSON.parse(row[4]) : {};
                
                links[id] = new Link(id, source, target, type, properties);
            });
            
            return { entities, links };
        } catch (error) {
            console.error('Error importing from CSV:', error);
            throw error;
        }
    }
    
    /**
     * Helper method to parse CSV file
     * @param {File} file - CSV file
     * @returns {Promise<Array>} Parsed CSV data
     */
    parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target.result;
                    const rows = text.split('\n');
                    const data = rows.map(row => {
                        // Handle quoted values with commas inside
                        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                        if (!matches) return [];
                        
                        // Remove quotes from quoted values
                        return matches.map(value => {
                            if (value.startsWith('"') && value.endsWith('"')) {
                                return value.substring(1, value.length - 1);
                            }
                            return value;
                        });
                    });
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid CSV file'));
                }
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    }
    
    /**
     * Find path between two entities
     * @param {string} sourceId - Source entity ID
     * @param {string} targetId - Target entity ID
     * @param {number} maxDepth - Maximum path depth
     * @returns {Array} Path of entity IDs
     */
    findPath(sourceId, targetId, maxDepth = 3) {
        if (!this.graphController) return [];
        
        const { entities, links } = this.graphController;
        
        // Build adjacency list
        const graph = {};
        Object.values(entities).forEach(entity => {
            graph[entity.id] = [];
        });
        
        Object.values(links).forEach(link => {
            if (!graph[link.source]) graph[link.source] = [];
            if (!graph[link.target]) graph[link.target] = [];
            
            graph[link.source].push(link.target);
            graph[link.target].push(link.source); // Bidirectional
        });
        
        // BFS to find shortest path
        const queue = [[sourceId]];
        const visited = new Set([sourceId]);
        
        while (queue.length > 0) {
            const path = queue.shift();
            const current = path[path.length - 1];
            
            if (current === targetId) {
                return path;
            }
            
            if (path.length > maxDepth) continue;
            
            for (const neighbor of graph[current] || []) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);
                }
            }
        }
        
        return []; // No path found
    }
    
    /**
     * Get statistics about the graph
     * @returns {Object} Graph statistics
     */
    getGraphStatistics() {
        if (!this.graphController) return {};
        
        const { entities, links } = this.graphController;
        
        // Count entities by type
        const entityCounts = {};
        Object.values(entities).forEach(entity => {
            entityCounts[entity.type] = (entityCounts[entity.type] || 0) + 1;
        });
        
        // Count links by type
        const linkCounts = {};
        Object.values(links).forEach(link => {
            linkCounts[link.type] = (linkCounts[link.type] || 0) + 1;
        });
        
        // Find most connected entities
        const connectivity = {};
        Object.values(links).forEach(link => {
            connectivity[link.source] = (connectivity[link.source] || 0) + 1;
            connectivity[link.target] = (connectivity[link.target] || 0) + 1;
        });
        
        const mostConnected = Object.entries(connectivity)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, count]) => ({ 
                id, 
                count, 
                label: entities[id]?.label || id,
                type: entities[id]?.type || 'unknown'
            }));
        
        return {
            entityCount: Object.keys(entities).length,
            linkCount: Object.keys(links).length,
            entityCounts,
            linkCounts,
            mostConnected,
            density: this.calculateGraphDensity(entities, links)
        };
    }
    
    /**
     * Calculate graph density
     * @param {Object} entities - Map of entities
     * @param {Object} links - Map of links
     * @returns {number} Graph density
     */
    calculateGraphDensity(entities, links) {
        const n = Object.keys(entities).length;
        if (n <= 1) return 0;
        
        const m = Object.keys(links).length;
        return (2 * m) / (n * (n - 1));
    }
    
    /**
     * Import data from API
     * @param {string} url - API URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} Imported data
     */
    async importFromAPI(url, options = {}) {
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            // Process API data into entities and links
            // This is a placeholder implementation - would need to be customized
            // based on the actual API response structure
            return {
                entities: {},
                links: {}
            };
        } catch (error) {
            console.error('Error importing from API:', error);
            throw error;
        }
    }
}

// Create singleton instance
const dataService = new DataService();
