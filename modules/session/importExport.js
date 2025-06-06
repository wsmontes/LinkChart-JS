/**
 * Session Import/Export Module
 * Handles session data import/export functionality
 * Part of the comprehensive investigative analytics platform
 */

class ImportExportManager {
    constructor() {
        this.supportedFormats = ['json', 'csv', 'xml'];
        this.exportOptions = {
            includeData: true,
            includeSettings: true,
            includeWorkspace: true,
            includeSearchHistory: true,
            includeUserPreferences: true,
            compressData: false
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        console.log('✓ Import/Export manager initialized');
    }

    bindEvents() {
        // Listen for export requests
        document.addEventListener('sessionExportRequested', (event) => {
            this.handleExportRequest(event.detail);
        });

        // Listen for import requests
        document.addEventListener('sessionImportRequested', (event) => {
            this.handleImportRequest(event.detail);
        });
    }

    // Export functionality
    async exportSession(options = {}) {
        const exportOptions = { ...this.exportOptions, ...options };
        
        try {
            const sessionData = await this.collectSessionData(exportOptions);
            const exportData = this.formatExportData(sessionData, exportOptions);
            
            return {
                success: true,
                data: exportData,
                metadata: this.generateExportMetadata(exportOptions)
            };
        } catch (error) {
            console.error('Export failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async collectSessionData(options) {
        const data = {};
        
        if (options.includeData && window.sessionManager) {
            data.sessionState = await window.sessionManager.getSessionState();
        }
        
        if (options.includeSettings && window.sessionManager) {
            data.userPreferences = window.sessionManager.getUserPreferences();
        }
        
        if (options.includeWorkspace && window.caseWorkspaceModule) {
            data.workspace = {
                entities: window.caseWorkspaceModule.entities.getAllEntities(),
                notes: window.caseWorkspaceModule.notes.getAllNotes(),
                tags: window.caseWorkspaceModule.notes.getAllTags(),
                workspace: window.caseWorkspaceModule.getWorkspaceData()
            };
        }
        
        if (options.includeSearchHistory && window.searchModule) {
            data.searchHistory = {
                recent: window.searchModule.getRecentSearches(),
                saved: window.searchModule.getSavedSearches(),
                filters: window.searchModule.filters.getActiveFilters()
            };
        }
        
        // Include graph data if available
        if (window.graphModule) {
            data.graph = {
                nodes: window.graphModule.getNodes(),
                edges: window.graphModule.getEdges(),
                layout: window.graphModule.getCurrentLayout(),
                filters: window.graphModule.getActiveFilters()
            };
        }
        
        // Include dashboard configuration
        if (window.dashboardModule) {
            data.dashboard = {
                charts: window.dashboardModule.charts.getChartConfigurations(),
                layout: window.dashboardModule.getLayoutConfig(),
                savedQueries: window.dashboardModule.charts.getSavedQueries()
            };
        }
        
        return data;
    }

    formatExportData(sessionData, options) {
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            platform: 'LinkChart Analytics Platform',
            ...sessionData
        };
        
        if (options.compressData) {
            // Simple compression simulation (in practice use a real compression library)
            return this.compressData(exportData);
        }
        
        return exportData;
    }

    generateExportMetadata(options) {
        return {
            exportTime: new Date().toISOString(),
            options: options,
            size: 0, // Will be calculated after export
            checksum: null // Will be calculated after export
        };
    }

    // Import functionality
    async importSession(importData, options = {}) {
        try {
            const validatedData = this.validateImportData(importData);
            const importResult = await this.processImportData(validatedData, options);
            
            return {
                success: true,
                imported: importResult,
                warnings: this.getImportWarnings(validatedData)
            };
        } catch (error) {
            console.error('Import failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    validateImportData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid import data format');
        }
        
        if (!data.version) {
            throw new Error('Missing version information');
        }
        
        if (!data.platform || !data.platform.includes('LinkChart')) {
            console.warn('Import data may not be compatible with this platform');
        }
        
        return data;
    }

    async processImportData(data, options) {
        const imported = {};
        
        // Import session state
        if (data.sessionState && window.sessionManager) {
            await window.sessionManager.restoreSessionState(data.sessionState);
            imported.sessionState = true;
        }
        
        // Import user preferences
        if (data.userPreferences && window.sessionManager) {
            Object.keys(data.userPreferences).forEach(key => {
                window.sessionManager.setUserPreference(key, data.userPreferences[key]);
            });
            imported.userPreferences = true;
        }
        
        // Import workspace data
        if (data.workspace && window.caseWorkspaceModule) {
            if (data.workspace.entities) {
                await this.importEntities(data.workspace.entities);
                imported.entities = true;
            }
            
            if (data.workspace.notes) {
                await this.importNotes(data.workspace.notes);
                imported.notes = true;
            }
            
            if (data.workspace.workspace) {
                await window.caseWorkspaceModule.restoreWorkspaceData(data.workspace.workspace);
                imported.workspace = true;
            }
        }
        
        // Import search history
        if (data.searchHistory && window.searchModule) {
            if (data.searchHistory.saved) {
                data.searchHistory.saved.forEach(search => {
                    window.searchModule.saveSearch(search);
                });
                imported.searchHistory = true;
            }
        }
        
        // Import graph data
        if (data.graph && window.graphModule) {
            await this.importGraphData(data.graph);
            imported.graph = true;
        }
        
        // Import dashboard configuration
        if (data.dashboard && window.dashboardModule) {
            await this.importDashboardConfig(data.dashboard);
            imported.dashboard = true;
        }
        
        return imported;
    }

    async importEntities(entities) {
        if (!window.caseWorkspaceModule || !entities) return;
        
        for (const entity of entities) {
            try {
                await window.caseWorkspaceModule.entities.addEntity(entity);
            } catch (error) {
                console.warn('Failed to import entity:', entity.id, error);
            }
        }
    }

    async importNotes(notes) {
        if (!window.caseWorkspaceModule || !notes) return;
        
        for (const note of notes) {
            try {
                await window.caseWorkspaceModule.notes.addNote(note);
            } catch (error) {
                console.warn('Failed to import note:', note.id, error);
            }
        }
    }

    async importGraphData(graphData) {
        if (!window.graphModule) return;
        
        try {
            if (graphData.nodes) {
                await window.graphModule.loadNodes(graphData.nodes);
            }
            
            if (graphData.edges) {
                await window.graphModule.loadEdges(graphData.edges);
            }
            
            if (graphData.layout) {
                await window.graphModule.setLayout(graphData.layout);
            }
        } catch (error) {
            console.warn('Failed to import graph data:', error);
        }
    }

    async importDashboardConfig(dashboardData) {
        if (!window.dashboardModule) return;
        
        try {
            if (dashboardData.charts) {
                await window.dashboardModule.charts.loadChartConfigurations(dashboardData.charts);
            }
            
            if (dashboardData.savedQueries) {
                dashboardData.savedQueries.forEach(query => {
                    window.dashboardModule.charts.saveQuery(query.name, query.config);
                });
            }
        } catch (error) {
            console.warn('Failed to import dashboard config:', error);
        }
    }

    getImportWarnings(data) {
        const warnings = [];
        
        if (data.version !== '1.0') {
            warnings.push(`Version mismatch: expected 1.0, got ${data.version}`);
        }
        
        if (!data.platform || !data.platform.includes('LinkChart')) {
            warnings.push('Data may not be fully compatible with this platform');
        }
        
        return warnings;
    }

    // File handling
    async exportToFile(options = {}) {
        const result = await this.exportSession(options);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        const filename = this.generateFilename(options.format || 'json');
        const blob = this.createBlob(result.data, options.format || 'json');
        
        this.downloadFile(blob, filename);
        
        return {
            success: true,
            filename,
            size: blob.size
        };
    }

    async importFromFile(file) {
        try {
            const data = await this.readFile(file);
            const parsedData = this.parseFileData(data, this.getFileExtension(file.name));
            
            return await this.importSession(parsedData);
        } catch (error) {
            console.error('File import failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            
            reader.readAsText(file);
        });
    }

    parseFileData(data, format) {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.parse(data);
            case 'csv':
                return this.parseCSV(data);
            case 'xml':
                return this.parseXML(data);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    createBlob(data, format) {
        let content;
        let mimeType;
        
        switch (format.toLowerCase()) {
            case 'json':
                content = JSON.stringify(data, null, 2);
                mimeType = 'application/json';
                break;
            case 'csv':
                content = this.convertToCSV(data);
                mimeType = 'text/csv';
                break;
            case 'xml':
                content = this.convertToXML(data);
                mimeType = 'application/xml';
                break;
            default:
                content = JSON.stringify(data, null, 2);
                mimeType = 'application/json';
        }
        
        return new Blob([content], { type: mimeType });
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateFilename(format) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `session-export-${timestamp}.${format}`;
    }

    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    // Format converters (simplified implementations)
    parseCSV(csvData) {
        // Simplified CSV parser - in practice use a robust CSV library
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',');
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index]?.trim();
                });
                data.push(row);
            }
        }
        
        return { csvData: data };
    }

    convertToCSV(data) {
        // Simplified CSV converter
        if (!data.graph || !data.graph.nodes) {
            return 'No graph data available';
        }
        
        const nodes = data.graph.nodes;
        const headers = ['id', 'label', 'type', 'properties'];
        const csvLines = [headers.join(',')];
        
        nodes.forEach(node => {
            const row = [
                node.id,
                node.label || '',
                node.type || '',
                JSON.stringify(node.properties || {})
            ];
            csvLines.push(row.join(','));
        });
        
        return csvLines.join('\n');
    }

    parseXML(xmlData) {
        // Simplified XML parser - in practice use DOMParser
        return { xmlData: 'XML parsing not fully implemented' };
    }

    convertToXML(data) {
        // Simplified XML converter
        return `<?xml version="1.0" encoding="UTF-8"?>
<session>
    <version>${data.version}</version>
    <timestamp>${data.timestamp}</timestamp>
    <platform>${data.platform}</platform>
    <!-- Full XML conversion not implemented -->
</session>`;
    }

    compressData(data) {
        // Simplified compression simulation
        const jsonString = JSON.stringify(data);
        return {
            compressed: true,
            originalSize: jsonString.length,
            data: btoa(jsonString) // Base64 encoding as simple "compression"
        };
    }

    // UI helpers
    createExportDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'export-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Export Session</h3>
                <div class="export-options">
                    <label><input type="checkbox" id="includeData" checked> Include Data</label>
                    <label><input type="checkbox" id="includeSettings" checked> Include Settings</label>
                    <label><input type="checkbox" id="includeWorkspace" checked> Include Workspace</label>
                    <label><input type="checkbox" id="includeSearchHistory" checked> Include Search History</label>
                </div>
                <div class="format-selection">
                    <label for="exportFormat">Format:</label>
                    <select id="exportFormat">
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                        <option value="xml">XML</option>
                    </select>
                </div>
                <div class="dialog-buttons">
                    <button id="exportBtn">Export</button>
                    <button id="cancelBtn">Cancel</button>
                </div>
            </div>
        `;
        
        return dialog;
    }

    createImportDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'import-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Import Session</h3>
                <div class="file-input">
                    <input type="file" id="importFile" accept=".json,.csv,.xml">
                    <label for="importFile">Choose file to import</label>
                </div>
                <div class="import-warnings" id="importWarnings" style="display: none;"></div>
                <div class="dialog-buttons">
                    <button id="importBtn" disabled>Import</button>
                    <button id="cancelBtn">Cancel</button>
                </div>
            </div>
        `;
        
        return dialog;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImportExportManager;
} else if (typeof window !== 'undefined') {
    window.ImportExportManager = ImportExportManager;
}
