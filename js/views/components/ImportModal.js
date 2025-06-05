/**
 * Component for managing import modals
 */
class ImportModal {
    constructor() {
        this.currentModal = null;
        this.entityMappings = {};
        this.linkMappings = {};
        this.selectedFiles = {};
        this.importInProgress = false;
    }

    /**
     * Show import modal for a specific file type
     * @param {string} importType - Type of import (json, csv, excel, etc)
     */
    showImportModal(importType) {
        // Remove any existing modal
        if (this.currentModal) {
            document.body.removeChild(this.currentModal);
        }

        // Reset state
        this.entityMappings = {};
        this.linkMappings = {};
        this.selectedFiles = {};
        this.importInProgress = false;

        // Create modal based on import type
        switch (importType) {
            case 'json':
                this.showJSONImportModal();
                break;
            case 'csv':
                this.showCSVImportModal();
                break;
            case 'excel':
                this.showExcelImportModal();
                break;
            case 'graphml':
                this.showGraphMLImportModal();
                break;
            case 'gexf':
                this.showGEXFImportModal();
                break;
            case 'cypher':
                this.showCypherImportModal();
                break;
            case 'file': // Generic file type detection modal
                this.showFileTypeDetectionModal();
                break;
            default:
                console.error(`Unknown import type: ${importType}`);
        }
    }

    /**
     * Show modal for JSON import
     */
    showJSONImportModal() {
        const modal = this.createModalBase('Import JSON Data');

        modal.querySelector('.modal-body').innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                Select a JSON file containing investigation data.
            </div>
            <div class="mb-3">
                <label for="jsonFile" class="form-label">JSON File</label>
                <input class="form-control" type="file" id="jsonFile" accept=".json">
            </div>
            <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="jsonMergeData">
                <label class="form-check-label" for="jsonMergeData">
                    Route directly to graph (bypass Universal Viewer)
                </label>
            </div>
            <div id="jsonPreview" class="preview-container mt-3" style="display:none;">
                <h6>Preview</h6>
                <pre class="border p-2 bg-light" style="max-height: 200px; overflow: auto;"></pre>
            </div>
        `;

        // Add file change event listener for preview
        const fileInput = modal.querySelector('#jsonFile');
        fileInput.addEventListener('change', async (event) => {
            if (event.target.files.length > 0) {
                const file = event.target.files[0];
                try {
                    const text = await fileParserUtil.readFileAsText(file);
                    const jsonPreview = modal.querySelector('#jsonPreview');
                    jsonPreview.style.display = 'block';
                    jsonPreview.querySelector('pre').textContent = text.substring(0, 500) + (text.length > 500 ? '...' : '');
                } catch (error) {
                    console.error('Error reading JSON file:', error);
                }
            }
        });

        const importButton = modal.querySelector('#importButton');
        importButton.addEventListener('click', async () => {
            if (this.importInProgress) return;
            
            const fileInput = document.getElementById('jsonFile');
            const mergeData = document.getElementById('jsonMergeData').checked;
            
            if (fileInput.files.length === 0) {
                alert('Please select a JSON file.');
                return;
            }
            
            try {
                this.importInProgress = true;
                importButton.disabled = true;
                importButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Importing...';
                
                const file = fileInput.files[0];
                const data = await importService.importFromJSON(file);
                
                // Import data via event system, specifying 'json-import' as the source
                eventBus.emit('import:data', { 
                    data,
                    sourceId: 'json-import', 
                    merge: mergeData 
                });
                
                // Close modal
                this.closeModal();
            } catch (error) {
                alert(`Error importing JSON: ${error.message}`);
                importButton.disabled = false;
                importButton.textContent = 'Import';
                this.importInProgress = false;
            }
        });

        this.displayModal(modal);
    }

    /**
     * Show modal for CSV import
     */
    showCSVImportModal() {
        const modal = this.createModalBase('Import CSV Data');
        
        modal.querySelector('.modal-body').innerHTML = `
            <ul class="nav nav-tabs" id="csvTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="files-tab" data-bs-toggle="tab" data-bs-target="#files" 
                        type="button" role="tab" aria-controls="files" aria-selected="true">
                        1. Select Files
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="preview-tab" data-bs-toggle="tab" data-bs-target="#preview" 
                        type="button" role="tab" aria-controls="preview" aria-selected="false">
                        2. Preview &amp; Map
                    </button>
                </li>
            </ul>
            
            <div class="tab-content p-3 border border-top-0 rounded-bottom">
                <div class="tab-pane fade show active" id="files" role="tabpanel" aria-labelledby="files-tab">
                    <div class="mb-3">
                        <label for="entitiesFile" class="form-label">Entities CSV File</label>
                        <input class="form-control" type="file" id="entitiesFile" accept=".csv">
                    </div>
                    <div class="mb-3">
                        <label for="linksFile" class="form-label">Links CSV File (optional)</label>
                        <input class="form-control" type="file" id="linksFile" accept=".csv">
                    </div>
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" id="loadPreviewButton">Load Preview</button>
                    </div>
                </div>
                <div class="tab-pane fade" id="preview" role="tabpanel" aria-labelledby="preview-tab">
                    <div class="mb-3">
                        <h5>Entities Mapping</h5>
                        <div id="entityMappingContainer">
                            Please load preview first
                        </div>
                    </div>
                    
                    <div class="mb-3" id="linkMappingSection" style="display:none;">
                        <h5>Links Mapping</h5>
                        <div id="linkMappingContainer">
                            Please load preview first
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <h5>Data Preview</h5>
                        <div class="preview-container" id="csvPreviewContainer">
                            No data to preview
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const loadPreviewButton = modal.querySelector('#loadPreviewButton');
        loadPreviewButton.addEventListener('click', async () => {
            const entitiesFile = document.getElementById('entitiesFile').files[0];
            if (!entitiesFile) {
                alert('Please select an entities CSV file.');
                return;
            }
            
            // Save selected files for later import
            this.selectedFiles = {
                entitiesFile,
                linksFile: document.getElementById('linksFile').files[0]
            };
            
            try {
                loadPreviewButton.disabled = true;
                loadPreviewButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
                
                // Get sample data for entities
                const entitySample = await importService.getCSVSample(entitiesFile);
                
                // Create entity mapping UI
                this.createMappingInterface(
                    'entityMappingContainer', 
                    entitySample.headers, 
                    this.entityMappings, 
                    ['ID Field', 'Type Field', 'Label Field']
                );
                
                // Load preview table
                document.getElementById('csvPreviewContainer').innerHTML = this.createPreviewTable(
                    entitySample.headers, 
                    entitySample.samples,
                    'entity-preview-table'
                );
                
                // If links file is provided, create mapping for it too
                if (this.selectedFiles.linksFile) {
                    const linkSample = await importService.getCSVSample(this.selectedFiles.linksFile);
                    
                    // Show link mapping section
                    document.getElementById('linkMappingSection').style.display = 'block';
                    
                    // Create link mapping UI
                    this.createMappingInterface(
                        'linkMappingContainer', 
                        linkSample.headers, 
                        this.linkMappings, 
                        ['ID Field', 'Source Field', 'Target Field', 'Type Field']
                    );
                    
                    // Add links preview to the preview container
                    document.getElementById('csvPreviewContainer').innerHTML += `
                        <h6 class="mt-4">Links Preview</h6>
                        ${this.createPreviewTable(
                            linkSample.headers, 
                            linkSample.samples,
                            'links-preview-table'
                        )}
                    `;
                }
                
                // Show the preview tab
                document.getElementById('preview-tab').click();
                
                loadPreviewButton.disabled = false;
                loadPreviewButton.textContent = 'Reload Preview';
            } catch (error) {
                alert(`Error loading preview: ${error.message}`);
                loadPreviewButton.disabled = false;
                loadPreviewButton.textContent = 'Load Preview';
            }
        });
        
        const importButton = modal.querySelector('#importButton');
        importButton.addEventListener('click', async () => {
            if (this.importInProgress) return;
            
            if (!this.selectedFiles.entitiesFile) {
                alert('Please select and preview the CSV files first.');
                document.getElementById('files-tab').click();
                return;
            }
            
            try {
                this.importInProgress = true;
                importButton.disabled = true;
                importButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Importing...';
                
                // Combine mappings
                const mapping = {
                    ...this.getSelectedMappings('entityMappingContainer'),
                    ...this.getSelectedMappings('linkMappingContainer', true)
                };
                
                // Import CSV data
                const importedData = await importService.importFromCSV(
                    this.selectedFiles.entitiesFile,
                    this.selectedFiles.linksFile,
                    mapping
                );
                
                // Import data via Universal Viewer
                eventBus.emit('import:data', { 
                    data: importedData,
                    sourceId: 'csv-import',
                    merge: false
                });
                
                // Close modal
                this.closeModal();
            } catch (error) {
                alert(`Error importing CSV: ${error.message}`);
                importButton.disabled = false;
                importButton.textContent = 'Import';
                this.importInProgress = false;
            }
        });

        this.displayModal(modal);
    }

    /**
     * Show modal for Excel import
     */
    showExcelImportModal() {
        const modal = this.createModalBase('Import Excel Data');
        
        modal.querySelector('.modal-body').innerHTML = `
            <ul class="nav nav-tabs" id="excelTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="excel-files-tab" data-bs-toggle="tab" data-bs-target="#excel-files" 
                        type="button" role="tab" aria-controls="excel-files" aria-selected="true">
                        1. Select File
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="excel-sheets-tab" data-bs-toggle="tab" data-bs-target="#excel-sheets" 
                        type="button" role="tab" aria-controls="excel-sheets" aria-selected="false">
                        2. Select Sheets
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="excel-preview-tab" data-bs-toggle="tab" data-bs-target="#excel-preview" 
                        type="button" role="tab" aria-controls="excel-preview" aria-selected="false">
                        3. Preview &amp; Map
                    </button>
                </li>
            </ul>
            
            <div class="tab-content p-3 border border-top-0 rounded-bottom">
                <div class="tab-pane fade show active" id="excel-files" role="tabpanel" aria-labelledby="excel-files-tab">
                    <div class="mb-3">
                        <label for="excelFile" class="form-label">Excel File</label>
                        <input class="form-control" type="file" id="excelFile" accept=".xlsx,.xls">
                    </div>
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" id="loadSheetsButton">Load Sheets</button>
                    </div>
                </div>
                
                <div class="tab-pane fade" id="excel-sheets" role="tabpanel" aria-labelledby="excel-sheets-tab">
                    <div class="mb-3">
                        <label for="entitiesSheet" class="form-label">Entities Sheet</label>
                        <select class="form-select" id="entitiesSheet">
                            <option value="">Select sheet...</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="linksSheet" class="form-label">Links Sheet (optional)</label>
                        <select class="form-select" id="linksSheet">
                            <option value="">None</option>
                        </select>
                    </div>
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" id="loadExcelPreviewButton">Load Preview</button>
                    </div>
                </div>
                
                <div class="tab-pane fade" id="excel-preview" role="tabpanel" aria-labelledby="excel-preview-tab">
                    <div class="mb-3">
                        <h5>Entities Mapping</h5>
                        <div id="excelEntityMappingContainer">
                            Please load preview first
                        </div>
                    </div>
                    
                    <div class="mb-3" id="excelLinkMappingSection" style="display:none;">
                        <h5>Links Mapping</h5>
                        <div id="excelLinkMappingContainer">
                            Please load preview first
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <h5>Data Preview</h5>
                        <div class="preview-container" id="excelPreviewContainer">
                            No data to preview
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Load sheets from Excel file
        const loadSheetsButton = modal.querySelector('#loadSheetsButton');
        loadSheetsButton.addEventListener('click', async () => {
            const excelFile = document.getElementById('excelFile').files[0];
            if (!excelFile) {
                alert('Please select an Excel file.');
                return;
            }
            
            try {
                loadSheetsButton.disabled = true;
                loadSheetsButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
                
                // Save file for later use
                this.selectedFiles.excelFile = excelFile;
                
                // Get sample to extract sheet names
                const excelData = await importService.getExcelSample(excelFile, 1);
                
                // Populate sheet selectors
                const entitySelect = document.getElementById('entitiesSheet');
                const linkSelect = document.getElementById('linksSheet');
                
                entitySelect.innerHTML = '<option value="">Select sheet...</option>';
                linkSelect.innerHTML = '<option value="">None</option>';
                
                excelData.sheetNames.forEach(sheetName => {
                    const entityOption = document.createElement('option');
                    entityOption.value = sheetName;
                    entityOption.textContent = sheetName;
                    entitySelect.appendChild(entityOption);
                    
                    const linkOption = document.createElement('option');
                    linkOption.value = sheetName;
                    linkOption.textContent = sheetName;
                    linkSelect.appendChild(linkOption);
                });
                
                // If there's only one sheet, select it for entities
                if (excelData.sheetNames.length === 1) {
                    entitySelect.value = excelData.sheetNames[0];
                }
                
                // Go to sheets tab
                document.getElementById('excel-sheets-tab').click();
                
                loadSheetsButton.disabled = false;
                loadSheetsButton.textContent = 'Reload Sheets';
            } catch (error) {
                alert(`Error loading Excel sheets: ${error.message}`);
                loadSheetsButton.disabled = false;
                loadSheetsButton.textContent = 'Load Sheets';
            }
        });
        
        // Load preview from selected sheets
        const loadExcelPreviewButton = modal.querySelector('#loadExcelPreviewButton');
        loadExcelPreviewButton.addEventListener('click', async () => {
            const entitiesSheet = document.getElementById('entitiesSheet').value;
            if (!entitiesSheet) {
                alert('Please select a sheet for entities.');
                return;
            }
            
            try {
                loadExcelPreviewButton.disabled = true;
                loadExcelPreviewButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
                
                // Save selected sheets
                this.selectedSheets = {
                    entitiesSheet,
                    linksSheet: document.getElementById('linksSheet').value
                };
                
                // Get sample data with all sheets
                const excelData = await importService.getExcelSample(this.selectedFiles.excelFile, 5);
                
                // Create entity mapping UI
                const entitySample = excelData.samples[entitiesSheet];
                this.createMappingInterface(
                    'excelEntityMappingContainer', 
                    entitySample.headers,
                    this.entityMappings, 
                    ['ID Field', 'Type Field', 'Label Field']
                );
                
                // Load preview table
                document.getElementById('excelPreviewContainer').innerHTML = this.createPreviewTable(
                    entitySample.headers, 
                    entitySample.samples,
                    'excel-entity-preview-table'
                );
                
                // If links sheet is selected, create mapping for it too
                if (this.selectedSheets.linksSheet) {
                    const linkSample = excelData.samples[this.selectedSheets.linksSheet];
                    
                    // Show link mapping section
                    document.getElementById('excelLinkMappingSection').style.display = 'block';
                    
                    // Create link mapping UI
                    this.createMappingInterface(
                        'excelLinkMappingContainer', 
                        linkSample.headers,
                        this.linkMappings, 
                        ['ID Field', 'Source Field', 'Target Field', 'Type Field']
                    );
                    
                    // Add links preview to the preview container
                    document.getElementById('excelPreviewContainer').innerHTML += `
                        <h6 class="mt-4">Links Preview</h6>
                        ${this.createPreviewTable(
                            linkSample.headers, 
                            linkSample.samples,
                            'excel-links-preview-table'
                        )}
                    `;
                }
                
                // Show the preview tab
                document.getElementById('excel-preview-tab').click();
                
                loadExcelPreviewButton.disabled = false;
                loadExcelPreviewButton.textContent = 'Reload Preview';
            } catch (error) {
                alert(`Error loading Excel preview: ${error.message}`);
                loadExcelPreviewButton.disabled = false;
                loadExcelPreviewButton.textContent = 'Load Preview';
            }
        });
        
        // Handle import
        const importButton = modal.querySelector('#importButton');
        importButton.addEventListener('click', async () => {
            if (this.importInProgress) return;
            
            if (!this.selectedFiles.excelFile || !this.selectedSheets?.entitiesSheet) {
                alert('Please select an Excel file and preview the data first.');
                return;
            }
            
            try {
                this.importInProgress = true;
                importButton.disabled = true;
                importButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Importing...';
                
                // Combine mappings
                const mapping = {
                    ...this.getSelectedMappings('excelEntityMappingContainer'),
                    ...this.getSelectedMappings('excelLinkMappingContainer', true)
                };
                
                // Import Excel data
                const importedData = await importService.importFromExcel(
                    this.selectedFiles.excelFile,
                    {
                        entitiesSheet: this.selectedSheets.entitiesSheet,
                        linksSheet: this.selectedSheets.linksSheet,
                        mapping
                    }
                );
                
                // Import data via Universal Viewer
                eventBus.emit('import:data', { 
                    data: importedData,
                    sourceId: 'excel-import',
                    merge: false
                });
                
                // Close modal
                this.closeModal();
            } catch (error) {
                alert(`Error importing Excel data: ${error.message}`);
                importButton.disabled = false;
                importButton.textContent = 'Import';
                this.importInProgress = false;
            }
        });

        this.displayModal(modal);
    }

    /**
     * Show modal for GraphML import
     */
    showGraphMLImportModal() {
        const modal = this.createModalBase('Import GraphML Data');

        modal.querySelector('.modal-body').innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                GraphML is an XML-based format for graphs used by tools like yEd and NetworkX.
            </div>
            <div class="mb-3">
                <label for="graphmlFile" class="form-label">GraphML File</label>
                <input class="form-control" type="file" id="graphmlFile" accept=".graphml,.xml">
            </div>
            <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="graphmlMergeData">
                <label class="form-check-label" for="graphmlMergeData">
                    Merge with existing data
                </label>
            </div>
        `;

        const importButton = modal.querySelector('#importButton');
        importButton.addEventListener('click', async () => {
            if (this.importInProgress) return;
            
            const fileInput = document.getElementById('graphmlFile');
            const mergeData = document.getElementById('graphmlMergeData').checked;
            
            if (fileInput.files.length === 0) {
                alert('Please select a GraphML file.');
                return;
            }
            
            try {
                this.importInProgress = true;
                importButton.disabled = true;
                importButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Importing...';
                
                const file = fileInput.files[0];
                const importedData = await importService.importFromGraphML(file);
                
                // Import data via Universal Viewer
                eventBus.emit('import:data', { 
                    data: importedData,
                    sourceId: 'graphml-import',
                    merge: mergeData
                });
                
                // Close modal
                this.closeModal();
            } catch (error) {
                alert(`Error importing GraphML: ${error.message}`);
                importButton.disabled = false;
                importButton.textContent = 'Import';
                this.importInProgress = false;
            }
        });

        this.displayModal(modal);
    }

    /**
     * Show modal for GEXF import
     */
    showGEXFImportModal() {
        const modal = this.createModalBase('Import GEXF Data');

        modal.querySelector('.modal-body').innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                GEXF (Graph Exchange XML Format) is used by tools like Gephi.
            </div>
            <div class="mb-3">
                <label for="gexfFile" class="form-label">GEXF File</label>
                <input class="form-control" type="file" id="gexfFile" accept=".gexf,.xml">
            </div>
            <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="gexfMergeData">
                <label class="form-check-label" for="gexfMergeData">
                    Merge with existing data
                </label>
            </div>
        `;

        const importButton = modal.querySelector('#importButton');
        importButton.addEventListener('click', async () => {
            if (this.importInProgress) return;
            
            const fileInput = document.getElementById('gexfFile');
            const mergeData = document.getElementById('gexfMergeData').checked;
            
            if (fileInput.files.length === 0) {
                alert('Please select a GEXF file.');
                return;
            }
            
            try {
                this.importInProgress = true;
                importButton.disabled = true;
                importButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Importing...';
                
                const file = fileInput.files[0];
                const importedData = await importService.importFromGEXF(file);
                
                // Import data via Universal Viewer
                eventBus.emit('import:data', { 
                    data: importedData,
                    sourceId: 'gexf-import',
                    merge: mergeData
                });
                
                // Close modal
                this.closeModal();
            } catch (error) {
                alert(`Error importing GEXF: ${error.message}`);
                importButton.disabled = false;
                importButton.textContent = 'Import';
                this.importInProgress = false;
            }
        });

        this.displayModal(modal);
    }

    /**
     * Show modal for Neo4j Cypher import
     */
    showCypherImportModal() {
        const modal = this.createModalBase('Import Neo4j Cypher Data');

        modal.querySelector('.modal-body').innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                Import Neo4j database exports in Cypher query format.
            </div>
            <div class="mb-3">
                <label for="cypherFile" class="form-label">Cypher File</label>
                <input class="form-control" type="file" id="cypherFile" accept=".cypher,.cql,.txt">
            </div>
            <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="cypherMergeData">
                <label class="form-check-label" for="cypherMergeData">
                    Merge with existing data
                </label>
            </div>
            <div id="cypherPreview" class="preview-container mt-3" style="display:none;">
                <h6>Query Preview</h6>
                <pre class="border p-2 bg-light" style="max-height: 200px; overflow: auto;"></pre>
            </div>
        `;

        // Add file change event listener for preview
        const fileInput = modal.querySelector('#cypherFile');
        fileInput.addEventListener('change', async (event) => {
            if (event.target.files.length > 0) {
                const file = event.target.files[0];
                try {
                    const text = await fileParserUtil.readFileAsText(file);
                    const cypherPreview = modal.querySelector('#cypherPreview');
                    cypherPreview.style.display = 'block';
                    cypherPreview.querySelector('pre').textContent = text.substring(0, 500) + (text.length > 500 ? '...' : '');
                } catch (error) {
                    console.error('Error reading Cypher file:', error);
                }
            }
        });

        const importButton = modal.querySelector('#importButton');
        importButton.addEventListener('click', async () => {
            if (this.importInProgress) return;
            
            const fileInput = document.getElementById('cypherFile');
            const mergeData = document.getElementById('cypherMergeData').checked;
            
            if (fileInput.files.length === 0) {
                alert('Please select a Cypher file.');
                return;
            }
            
            try {
                this.importInProgress = true;
                importButton.disabled = true;
                importButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Importing...';
                
                const file = fileInput.files[0];
                const importedData = await importService.importFromCypher(file);
                
                // Import data via Universal Viewer
                eventBus.emit('import:data', { 
                    data: importedData,
                    sourceId: 'cypher-import',
                    merge: mergeData
                });
                
                // Close modal
                this.closeModal();
            } catch (error) {
                alert(`Error importing Cypher: ${error.message}`);
                importButton.disabled = false;
                importButton.textContent = 'Import';
                this.importInProgress = false;
            }
        });

        this.displayModal(modal);
    }

    /**
     * Show modal for automatic file type detection
     */
    showFileTypeDetectionModal() {
        const modal = this.createModalBase('Import Investigation Data');

        modal.querySelector('.modal-body').innerHTML = `
            <div class="alert alert-info mb-4">
                <i class="fas fa-info-circle"></i>
                Select a file to import. The file type will be detected automatically.
            </div>
            
            <div class="mb-3">
                <label for="dataFile" class="form-label">Data File</label>
                <input class="form-control" type="file" id="dataFile">
            </div>
            
            <div class="mt-3 supported-formats">
                <h6>Supported Formats:</h6>
                <div class="format-grid">
                    <div class="format-item">
                        <i class="fas fa-file-code"></i> JSON
                    </div>
                    <div class="format-item">
                        <i class="fas fa-file-csv"></i> CSV
                    </div>
                    <div class="format-item">
                        <i class="fas fa-file-excel"></i> Excel
                    </div>
                    <div class="format-item">
                        <i class="fas fa-project-diagram"></i> GraphML
                    </div>
                    <div class="format-item">
                        <i class="fas fa-project-diagram"></i> GEXF
                    </div>
                    <div class="format-item">
                        <i class="fas fa-database"></i> Neo4j Cypher
                    </div>
                </div>
            </div>
        `;

        // Add CSS for format grid
        const style = document.createElement('style');
        style.textContent = `
            .format-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 10px;
                margin-top: 10px;
            }
            .format-item {
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 10px;
                text-align: center;
            }
            .format-item i {
                font-size: 24px;
                margin-bottom: 5px;
                display: block;
            }
        `;
        document.head.appendChild(style);

        const dataFileInput = modal.querySelector('#dataFile');
        dataFileInput.addEventListener('change', () => {
            if (dataFileInput.files.length > 0) {
                const file = dataFileInput.files[0];
                const detectedFormat = importService.detectFormat(file);
                
                if (detectedFormat) {
                    // Close current modal
                    this.closeModal();
                    
                    // Open appropriate import modal
                    this.showImportModal(detectedFormat);
                } else {
                    alert('Unsupported file format. Please use one of the supported formats.');
                }
            }
        });

        this.displayModal(modal);
    }

    /**
     * Create base modal structure
     * @param {string} title - Modal title
     * @returns {HTMLElement} - Modal element
     */
    createModalBase(title) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Content will be added dynamically -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="importButton">Import</button>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    /**
     * Display modal in DOM and initialize Bootstrap modal
     * @param {HTMLElement} modal - Modal element
     */
    displayModal(modal) {
        document.body.appendChild(modal);
        this.currentModal = modal;
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Remove modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
            this.currentModal = null;
        });
    }

    /**
     * Close current modal
     */
    closeModal() {
        if (this.currentModal) {
            const bsModal = bootstrap.Modal.getInstance(this.currentModal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }

    /**
     * Create a field mapping interface
     * @param {string} containerId - ID of container element
     * @param {Array} fields - Available fields
     * @param {Object} mappings - Current mapping values
     * @param {Array} mapTypes - Types of mappings to create
     */
    createMappingInterface(containerId, fields, mappings, mapTypes) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        mapTypes.forEach(mapType => {
            const mapKey = mapType.toLowerCase().replace(/\s+/g, '');
            
            const row = document.createElement('div');
            row.className = 'row mb-2 align-items-center';
            
            row.innerHTML = `
                <div class="col-4">
                    <label class="form-label" for="${containerId}-${mapKey}">${mapType}:</label>
                </div>
                <div class="col-8">
                    <select class="form-select form-select-sm" id="${containerId}-${mapKey}" 
                        data-mapping-type="${mapKey}">
                        <option value="">Auto-detect</option>
                        ${fields.map(field => `
                            <option value="${field}">${field}</option>
                        `).join('')}
                    </select>
                </div>
            `;
            
            container.appendChild(row);
            
            // Set previously selected value if available
            if (mappings[mapKey]) {
                document.getElementById(`${containerId}-${mapKey}`).value = mappings[mapKey];
            }
        });
    }

    /**
     * Get selected mappings from a mapping container
     * @param {string} containerId - ID of the container element
     * @param {boolean} isLinkMapping - Whether this is for link mappings
     * @returns {Object} - Selected mappings
     */
    getSelectedMappings(containerId, isLinkMapping = false) {
        const mappings = {};
        const container = document.getElementById(containerId);
        
        if (!container) return mappings;
        
        // Get all select elements in the container
        const selects = container.querySelectorAll('select');
        
        selects.forEach(select => {
            const mappingType = select.getAttribute('data-mapping-type');
            const value = select.value;
            
            if (value) {
                // Use appropriate key prefix for links
                if (isLinkMapping) {
                    if (mappingType === 'idfield') mappings.linkIdField = value;
                    else if (mappingType === 'sourcefield') mappings.sourceField = value;
                    else if (mappingType === 'targetfield') mappings.targetField = value;
                    else if (mappingType === 'typefield') mappings.linkTypeField = value;
                    else mappings[mappingType] = value;
                } else {
                    mappings[mappingType] = value;
                }
            }
        });
        
        return mappings;
    }

    /**
     * Create a preview table for CSV/Excel data
     * @param {Array} headers - Column headers
     * @param {Array} rows - Data rows
     * @param {string} tableId - ID for the table
     * @returns {string} - HTML for the preview table
     */
    createPreviewTable(headers, rows, tableId) {
        if (!headers || !rows || headers.length === 0) {
            return '<div class="alert alert-warning">No preview data available</div>';
        }
        
        let html = `
            <div class="table-responsive">
                <table class="table table-sm table-striped table-hover" id="${tableId}">
                    <thead class="table-light">
                        <tr>
                            ${headers.map(header => `<th>${header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Add data rows
        rows.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                html += `<td>${row[header] !== undefined ? row[header] : ''}</td>`;
            });
            html += '</tr>';
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        return html;
    }
}

// Create singleton instance
const importModal = new ImportModal();