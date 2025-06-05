/**
 * Service for saving and loading investigation data
 */
class StorageService {
    constructor() {
        this.storageKey = 'linkChartInvestigation';
    }
    
    /**
     * Save investigation to localStorage
     * @param {Object} data - Investigation data
     * @returns {Boolean} Success status
     */
    saveToLocalStorage(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }
    
    /**
     * Load investigation from localStorage
     * @returns {Object|null} Investigation data or null if not found
     */
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }
    
    /**
     * Export investigation as JSON file
     * @param {Object} data - Investigation data
     */
    exportAsJSON(data) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `investigation_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Import investigation from JSON file
     * @param {File} file - JSON file
     * @returns {Promise<Object>} Investigation data
     */
    importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid JSON file'));
                }
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    }
    
    /**
     * Export investigation as image
     * @param {Object} cytoscapeInstance - Cytoscape instance
     * @param {string} format - Export format ('png', 'jpg')
     */
    exportAsImage(cytoscapeInstance, format = 'png') {
        const dataUrl = cytoscapeInstance.png({ 
            output: 'blob',
            bg: 'white',
            full: true 
        });
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(dataUrl);
        a.download = `investigation_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }
    
    /**
     * Export investigation to CSV
     * @param {Object} entities - Map of entities
     * @param {Object} links - Map of links
     */
    exportAsCSV(entities, links) {
        // Export entities
        let entitiesCSV = 'ID,Type,Label,Properties\n';
        Object.values(entities).forEach(entity => {
            entitiesCSV += `${entity.id},${entity.type},${entity.label},"${JSON.stringify(entity.properties)}"\n`;
        });
        
        this.downloadCSV(entitiesCSV, 'entities');
        
        // Export links
        let linksCSV = 'ID,Source,Target,Type,Properties\n';
        Object.values(links).forEach(link => {
            linksCSV += `${link.id},${link.source},${link.target},${link.type},"${JSON.stringify(link.properties)}"\n`;
        });
        
        this.downloadCSV(linksCSV, 'links');
    }
    
    /**
     * Helper method to download CSV data
     */
    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Create singleton instance
const storageService = new StorageService();
