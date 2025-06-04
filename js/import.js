/**
 * CSV Import module for LinkChart JS
 */

class CsvImporter {
    constructor(chart, uiManager) {
        this.chart = chart;
        this.uiManager = uiManager;
        this.csvData = null;
        this.headers = [];
        this.currentStep = 1;
        this.selectedEntityType = 'person';
        this.selectedIcon = 'bi-circle';
        this.csvModal = null;
        
        this.columnMappings = {
            idColumn: '',
            nameColumn: '',
            typeColumn: '',
            detectEntityTypes: false,
            includedColumns: []
        };
        
        this.relationshipMapping = {
            createRelationships: false,
            sourceColumn: '',
            targetColumn: '',
            relationType: '',
            detectHierarchy: false,
            hierarchyTypeColumn: '',
            parentReferenceColumn: '',
            parentType: 'Epic',
            childType: 'Story'
        };
        
        this.customEntityType = null;
    }
    
    init() {
        // Initialize CSV import modal
        this.csvModal = new bootstrap.Modal(document.getElementById('csvImportModal'));
        
        // Set up button listeners
        document.getElementById('import-csv').addEventListener('click', () => {
            this.resetImport();
            this.csvModal.show();
        });
        
        // Step navigation buttons
        document.getElementById('next-step-1').addEventListener('click', () => this.handleStep1Next());
        document.getElementById('prev-step-2').addEventListener('click', () => this.goToStep(1));
        document.getElementById('next-step-2').addEventListener('click', () => this.goToStep(3));
        document.getElementById('prev-step-3').addEventListener('click', () => this.goToStep(2));
        document.getElementById('import-csv-data').addEventListener('click', () => this.importData());
        
        // File input change
        document.getElementById('csv-file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('next-step-1').disabled = false;
            } else {
                document.getElementById('next-step-1').disabled = true;
            }
        });
        
        // New entity type handling
        document.getElementById('entity-import-type').addEventListener('change', (e) => {
            if (e.target.value === 'new-type') {
                document.getElementById('new-type-input').style.display = 'block';
                document.getElementById('create-type-btn').disabled = false;
            } else {
                document.getElementById('new-type-input').style.display = 'none';
                document.getElementById('create-type-btn').disabled = true;
            }
        });
        
        // Icon selection in dropdown
        document.querySelectorAll('#entity-icon-dropdown .dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const icon = e.target.closest('.dropdown-item').getAttribute('data-icon');
                this.selectedIcon = icon;
                document.getElementById('entity-type-icon-preview').className = `bi ${icon}`;
            });
        });
        
        // Create relationship checkbox
        document.getElementById('create-relationships').addEventListener('change', (e) => {
            document.getElementById('relationship-options').style.display = 
                e.target.checked ? 'block' : 'none';
            this.relationshipMapping.createRelationships = e.target.checked;
        });
        
        // Add hierarchical relationship detection
        const hierarchyDetection = `
            <div class="mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="detect-hierarchy">
                    <label class="form-check-label" for="detect-hierarchy">
                        Detect hierarchical relationships
                    </label>
                </div>
            </div>
            <div id="hierarchy-options" style="display: none;">
                <div class="mb-3">
                    <label for="hierarchy-type-column" class="form-label">Type Column</label>
                    <select class="form-select" id="hierarchy-type-column"></select>
                    <div class="form-text">Column that identifies the entity type (e.g., Epic, Story)</div>
                </div>
                <div class="mb-3">
                    <label for="parent-reference-column" class="form-label">Parent Reference Column</label>
                    <select class="form-select" id="parent-reference-column"></select>
                    <div class="form-text">Column that references a parent entity (e.g., Epic Name)</div>
                </div>
                <div class="mb-3">
                    <label for="hierarchy-mapping" class="form-label">Hierarchy Mapping</label>
                    <div class="input-group mb-2">
                        <span class="input-group-text">Parent</span>
                        <input type="text" class="form-control" id="parent-type" value="Epic" placeholder="e.g., Epic">
                        <span class="input-group-text">Child</span>
                        <input type="text" class="form-control" id="child-type" value="Story" placeholder="e.g., Story">
                    </div>
                    <div class="form-text">Define the parent-child relationship in your data</div>
                </div>
            </div>
        `;
        
        // Insert the hierarchy detection HTML after the relationship options
        const relationshipOptions = document.getElementById('relationship-options');
        if (relationshipOptions) {
            relationshipOptions.insertAdjacentHTML('afterend', hierarchyDetection);
            
            // Set up event listener for hierarchy detection checkbox
            document.getElementById('detect-hierarchy').addEventListener('change', (e) => {
                document.getElementById('hierarchy-options').style.display = 
                    e.target.checked ? 'block' : 'none';
                this.relationshipMapping.detectHierarchy = e.target.checked;
            });
        }
    }
    
    resetImport() {
        // Reset all import state
        this.csvData = null;
        this.headers = [];
        this.currentStep = 1;
        this.columnMappings = {
            idColumn: '',
            nameColumn: '',
            typeColumn: '',
            detectEntityTypes: false,
            includedColumns: []
        };
        this.relationshipMapping = {
            createRelationships: false,
            sourceColumn: '',
            targetColumn: '',
            relationType: '',
            detectHierarchy: false,
            hierarchyTypeColumn: '',
            parentReferenceColumn: '',
            parentType: 'Epic',
            childType: 'Story'
        };
        this.customEntityType = null;
        
        // Reset UI
        document.getElementById('csv-file-input').value = '';
        document.getElementById('csv-preview-header').innerHTML = '';
        document.getElementById('csv-preview-body').innerHTML = '';
        document.getElementById('column-selection').innerHTML = '';
        document.getElementById('entity-id-column').innerHTML = '';
        document.getElementById('entity-name-column').innerHTML = '';
        
        const relationshipSource = document.getElementById('relationship-source');
        const relationshipTarget = document.getElementById('relationship-target');
        if (relationshipSource) relationshipSource.innerHTML = '';
        if (relationshipTarget) relationshipTarget.innerHTML = '';
        
        const relationshipType = document.getElementById('relationship-type');
        if (relationshipType) relationshipType.value = '';
        
        const createRelationships = document.getElementById('create-relationships');
        if (createRelationships) createRelationships.checked = false;
        
        const relationshipOptions = document.getElementById('relationship-options');
        if (relationshipOptions) relationshipOptions.style.display = 'none';
        
        document.getElementById('new-type-input').style.display = 'none';
        document.getElementById('entity-import-type').value = 'person';
        
        // Reset step visibility
        this.goToStep(1);
    }
    
    goToStep(step) {
        // Hide all steps
        document.querySelectorAll('.import-step').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('.import-step-buttons').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show the selected step
        document.getElementById(`import-step-${step}`).style.display = 'block';
        document.getElementById(`step-${step}-buttons`).style.display = 'block';
        
        this.currentStep = step;
    }
    
    async handleStep1Next() {
        const fileInput = document.getElementById('csv-file-input');
        
        if (fileInput.files.length === 0) {
            alert('Please select a CSV file');
            return;
        }
        
        const file = fileInput.files[0];
        const delimiter = document.getElementById('csv-delimiter').value;
        const hasHeader = document.getElementById('csv-header').checked;
        
        try {
            // Parse CSV file
            await this.parseCSV(file, delimiter, hasHeader);
            
            // Go to step 2
            this.goToStep(2);
        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Error parsing CSV file. Please check the file format and try again.');
        }
    }
    
    async parseCSV(file, delimiter, hasHeader) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                delimiter: delimiter,
                header: hasHeader,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        console.error('CSV parsing errors:', results.errors);
                        if (results.errors[0].code === 'UndetectableDelimiter') {
                            // Try again with auto-detection
                            Papa.parse(file, {
                                header: hasHeader,
                                dynamicTyping: true,
                                skipEmptyLines: true,
                                complete: (retryResults) => {
                                    this.processParseResults(retryResults, hasHeader);
                                    resolve();
                                },
                                error: reject
                            });
                        } else {
                            reject(results.errors[0]);
                        }
                    } else {
                        this.processParseResults(results, hasHeader);
                        resolve();
                    }
                },
                error: reject
            });
        });
    }
    
    processParseResults(results, hasHeader) {
        this.csvData = results.data;
        
        if (hasHeader) {
            // Get headers from the parsed result
            this.headers = Object.keys(this.csvData[0] || {});
        } else {
            // Create numeric headers if no header row
            this.headers = Object.keys(this.csvData[0] || {}).map((_, index) => `Column ${index + 1}`);
            
            // Convert the data to have header keys
            this.csvData = this.csvData.map(row => {
                const newRow = {};
                Object.values(row).forEach((value, index) => {
                    newRow[this.headers[index]] = value;
                });
                return newRow;
            });
        }
        
        this.createPreviewTable();
        this.createColumnMappings();
    }
    
    createPreviewTable() {
        const headerRow = document.getElementById('csv-preview-header');
        const tableBody = document.getElementById('csv-preview-body');
        
        // Clear existing content
        headerRow.innerHTML = '';
        tableBody.innerHTML = '';
        
        // Add headers
        this.headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        // Add preview rows (up to 5)
        const previewRows = this.csvData.slice(0, 5);
        previewRows.forEach(row => {
            const tr = document.createElement('tr');
            
            this.headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] !== undefined ? row[header] : '';
                tr.appendChild(td);
            });
            
            tableBody.appendChild(tr);
        });
        
        // Show row count
        const rowCountDiv = document.createElement('div');
        rowCountDiv.className = 'text-muted small mt-2';
        rowCountDiv.textContent = `Showing ${previewRows.length} of ${this.csvData.length} rows`;
        tableBody.parentNode.parentNode.appendChild(rowCountDiv);
    }
    
    createColumnMappings() {
        // Populate column selection checkboxes
        const columnSelection = document.getElementById('column-selection');
        columnSelection.innerHTML = '';
        
        this.headers.forEach((header, index) => {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-md-3 col-sm-4 mb-2';
            
            const checkDiv = document.createElement('div');
            checkDiv.className = 'form-check';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input column-checkbox';
            checkbox.id = `col-${index}`;
            checkbox.value = header;
            checkbox.checked = true;  // Default all columns to be included
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (!this.columnMappings.includedColumns.includes(header)) {
                        this.columnMappings.includedColumns.push(header);
                    }
                } else {
                    this.columnMappings.includedColumns = this.columnMappings.includedColumns.filter(h => h !== header);
                    
                    // Uncheck this column if it was selected as ID or name
                    if (this.columnMappings.idColumn === header) {
                        document.getElementById('entity-id-column').value = '';
                        this.columnMappings.idColumn = '';
                    }
                    
                    if (this.columnMappings.nameColumn === header) {
                        document.getElementById('entity-name-column').value = '';
                        this.columnMappings.nameColumn = '';
                    }
                }
            });
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `col-${index}`;
            label.textContent = header;
            
            checkDiv.appendChild(checkbox);
            checkDiv.appendChild(label);
            colDiv.appendChild(checkDiv);
            columnSelection.appendChild(colDiv);
            
            // Add all columns to included by default
            this.columnMappings.includedColumns.push(header);
        });
        
        // Populate dropdowns for ID and name columns
        const idSelect = document.getElementById('entity-id-column');
        const nameSelect = document.getElementById('entity-name-column');
        
        idSelect.innerHTML = '<option value="">None (auto-generate)</option>';
        nameSelect.innerHTML = '<option value="">Select a column</option>';
        
        this.headers.forEach(header => {
            const idOption = document.createElement('option');
            idOption.value = header;
            idOption.textContent = header;
            idSelect.appendChild(idOption);
            
            const nameOption = document.createElement('option');
            nameOption.value = header;
            nameOption.textContent = header;
            nameSelect.appendChild(nameOption);
        });
        
        // Set event listeners for dropdowns
        idSelect.addEventListener('change', (e) => {
            this.columnMappings.idColumn = e.target.value;
        });
        
        nameSelect.addEventListener('change', (e) => {
            this.columnMappings.nameColumn = e.target.value;
        });
        
        // Try to auto-select reasonable defaults
        const possibleIdColumns = this.headers.filter(h => 
            h.toLowerCase().includes('id') || 
            h.toLowerCase() === 'key' || 
            h.toLowerCase() === 'identifier'
        );
        
        const possibleNameColumns = this.headers.filter(h => 
            h.toLowerCase().includes('name') || 
            h.toLowerCase() === 'title' ||
            h.toLowerCase() === 'summary' ||
            h.toLowerCase() === 'label'
        );
        
        if (possibleIdColumns.length > 0) {
            idSelect.value = possibleIdColumns[0];
            this.columnMappings.idColumn = possibleIdColumns[0];
        }
        
        if (possibleNameColumns.length > 0) {
            nameSelect.value = possibleNameColumns[0];
            this.columnMappings.nameColumn = possibleNameColumns[0];
        } else if (this.headers.length > 0 && !this.columnMappings.nameColumn) {
            // If no name column found, use the first column
            nameSelect.value = this.headers[0];
            this.columnMappings.nameColumn = this.headers[0];
        }
        
        // Add type detection option
        const entityImportTypeArea = document.querySelector('[for="entity-import-type"]')?.closest('.mb-3');
        
        if (entityImportTypeArea) {
            const typeDetectionHTML = `
                <div class="mb-3">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="detect-entity-types">
                        <label class="form-check-label" for="detect-entity-types">
                            Automatically create entity types from column
                        </label>
                    </div>
                </div>
                <div id="type-detection-options" style="display: none;">
                    <div class="mb-3">
                        <label for="type-detection-column" class="form-label">Type Column</label>
                        <select class="form-select" id="type-detection-column"></select>
                        <div class="form-text">Column that contains entity type values</div>
                    </div>
                </div>
            `;
            
            // Insert the type detection HTML before the entity type selection
            entityImportTypeArea.insertAdjacentHTML('beforebegin', typeDetectionHTML);
            
            // Set up the type detection column dropdown
            const typeDetectionSelect = document.getElementById('type-detection-column');
            typeDetectionSelect.innerHTML = '<option value="">Select a column</option>';
            
            this.headers.forEach(header => {
                const option = document.createElement('option');
                option.value = header;
                option.textContent = header;
                typeDetectionSelect.appendChild(option);
            });
            
            // Try to auto-select a reasonable default for the type column
            const possibleEntityTypeColumns = this.headers.filter(h => 
                h.toLowerCase().includes('type') || 
                h.toLowerCase().includes('category')
            );
            
            if (possibleEntityTypeColumns.length > 0) {
                typeDetectionSelect.value = possibleEntityTypeColumns[0];
                this.columnMappings.typeColumn = possibleEntityTypeColumns[0];
            }
            
            // Set up event listeners
            document.getElementById('detect-entity-types').addEventListener('change', (e) => {
                document.getElementById('type-detection-options').style.display = 
                    e.target.checked ? 'block' : 'none';
                    
                // Disable/enable the regular entity type selector
                document.getElementById('entity-import-type').disabled = e.target.checked;
                document.getElementById('create-type-btn').disabled = e.target.checked;
                    
                this.columnMappings.detectEntityTypes = e.target.checked;
            });
            
            typeDetectionSelect.addEventListener('change', (e) => {
                this.columnMappings.typeColumn = e.target.value;
            });
        }
        
        // Set up relationship columns
        const relationshipSource = document.getElementById('relationship-source');
        const relationshipTarget = document.getElementById('relationship-target');
        
        if (relationshipSource && relationshipTarget) {
            relationshipSource.innerHTML = '<option value="">Select a column</option>';
            relationshipTarget.innerHTML = '<option value="">Select a column</option>';
            
            this.headers.forEach(header => {
                const sourceOption = document.createElement('option');
                sourceOption.value = header;
                sourceOption.textContent = header;
                relationshipSource.appendChild(sourceOption);
                
                const targetOption = document.createElement('option');
                targetOption.value = header;
                targetOption.textContent = header;
                relationshipTarget.appendChild(targetOption);
            });
            
            relationshipSource.addEventListener('change', (e) => {
                this.relationshipMapping.sourceColumn = e.target.value;
            });
            
            relationshipTarget.addEventListener('change', (e) => {
                this.relationshipMapping.targetColumn = e.target.value;
            });
            
            document.getElementById('relationship-type')?.addEventListener('input', (e) => {
                this.relationshipMapping.relationType = e.target.value;
            });
        }
        
        // Set up hierarchy columns
        const hierarchyTypeSelect = document.getElementById('hierarchy-type-column');
        const parentReferenceSelect = document.getElementById('parent-reference-column');
        
        if (hierarchyTypeSelect && parentReferenceSelect) {
            hierarchyTypeSelect.innerHTML = '<option value="">Select a column</option>';
            parentReferenceSelect.innerHTML = '<option value="">Select a column</option>';
            
            this.headers.forEach(header => {
                const hierarchyTypeOption = document.createElement('option');
                hierarchyTypeOption.value = header;
                hierarchyTypeOption.textContent = header;
                hierarchyTypeSelect.appendChild(hierarchyTypeOption);
                
                const parentRefOption = document.createElement('option');
                parentRefOption.value = header;
                parentRefOption.textContent = header;
                parentReferenceSelect.appendChild(parentRefOption);
            });
            
            // Try to auto-select reasonable defaults for hierarchy columns
            const possibleHierarchyTypeColumns = this.headers.filter(h => 
                h.toLowerCase().includes('type') || 
                h.toLowerCase().includes('category')
            );
            
            const possibleParentColumns = this.headers.filter(h => 
                h.toLowerCase().includes('parent') || 
                h.toLowerCase().includes('epic')
            );
            
            if (possibleHierarchyTypeColumns.length > 0) {
                hierarchyTypeSelect.value = possibleHierarchyTypeColumns[0];
                this.relationshipMapping.hierarchyTypeColumn = possibleHierarchyTypeColumns[0];
            }
            
            if (possibleParentColumns.length > 0) {
                parentReferenceSelect.value = possibleParentColumns[0];
                this.relationshipMapping.parentReferenceColumn = possibleParentColumns[0];
            }
            
            // Set up event listeners for hierarchy dropdowns
            hierarchyTypeSelect.addEventListener('change', (e) => {
                this.relationshipMapping.hierarchyTypeColumn = e.target.value;
            });
            
            parentReferenceSelect.addEventListener('change', (e) => {
                this.relationshipMapping.parentReferenceColumn = e.target.value;
            });
            
            document.getElementById('parent-type')?.addEventListener('input', (e) => {
                this.relationshipMapping.parentType = e.target.value;
            });
            
            document.getElementById('child-type')?.addEventListener('input', (e) => {
                this.relationshipMapping.childType = e.target.value;
            });
        }
    }
    
    async importData() {
        if (!this.csvData || this.csvData.length === 0) {
            alert('No CSV data to import');
            return;
        }
        
        if (!this.columnMappings.nameColumn) {
            alert('Please select a column to use for entity names');
            return;
        }
        
        let importedEntities = [];
        
        // Use automatic type detection if enabled
        if (this.columnMappings.detectEntityTypes && this.columnMappings.typeColumn) {
            importedEntities = this.chart.data.importEntitiesWithTypes(
                this.csvData,
                {
                    idColumn: this.columnMappings.idColumn,
                    nameColumn: this.columnMappings.nameColumn,
                    typeColumn: this.columnMappings.typeColumn,
                    includedColumns: this.columnMappings.includedColumns
                }
            );
            
            // Update the entity palette to show new types
            this.uiManager.updateEntityPalette();
        }
        else {
            // Original entity creation code
            const entityTypeSelect = document.getElementById('entity-import-type');
            const selectedType = entityTypeSelect.value;
            
            if (selectedType === 'new-type') {
                const typeName = document.getElementById('new-entity-type-name').value.trim();
                if (!typeName) {
                    alert('Please enter a name for the new entity type');
                    return;
                }
                
                // Generate ID from type name
                const typeId = typeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                
                // Create new entity type
                this.customEntityType = new EntityType(
                    typeId,
                    typeName,
                    this.selectedIcon,
                    '#a29bfe' // default color
                );
                
                // Add the new type to chart data
                this.chart.data.addEntityType(this.customEntityType);
                
                // Update the chart to show new entity type
                this.uiManager.updateEntityPalette();
                
                // Import using the new type ID
                importedEntities = this.chart.data.importEntitiesFromCsv(
                    this.csvData,
                    {
                        idColumn: this.columnMappings.idColumn,
                        nameColumn: this.columnMappings.nameColumn,
                        entityType: typeId,
                        includedColumns: this.columnMappings.includedColumns
                    }
                );
            } else {
                // Import using the selected existing type
                importedEntities = this.chart.data.importEntitiesFromCsv(
                    this.csvData,
                    {
                        idColumn: this.columnMappings.idColumn,
                        nameColumn: this.columnMappings.nameColumn,
                        entityType: selectedType,
                        includedColumns: this.columnMappings.includedColumns
                    }
                );
            }
        }
        
        // Process hierarchical relationships if enabled
        if (this.relationshipMapping.detectHierarchy &&
            this.relationshipMapping.hierarchyTypeColumn && 
            this.relationshipMapping.parentReferenceColumn) {
            
            this.chart.data.createHierarchicalRelationships(
                importedEntities,
                {
                    typeColumn: this.relationshipMapping.hierarchyTypeColumn,
                    parentReferenceColumn: this.relationshipMapping.parentReferenceColumn,
                    parentType: this.relationshipMapping.parentType,
                    childType: this.relationshipMapping.childType
                }
            );
        }
        
        // Process regular relationships if enabled
        if (this.relationshipMapping.createRelationships && 
            this.relationshipMapping.sourceColumn && 
            this.relationshipMapping.targetColumn) {
            
            this.chart.data.createRelationshipsFromCsv(
                importedEntities,
                {
                    sourceColumn: this.relationshipMapping.sourceColumn,
                    targetColumn: this.relationshipMapping.targetColumn,
                    relationType: this.relationshipMapping.relationType
                }
            );
        }
        
        // Update visualization
        this.chart.render();
        this.chart.fitView();
        
        // Close the modal
        this.csvModal.hide();
        
        // Update status
        this.uiManager.updateStatusBar(`Imported ${importedEntities.length} entities`);
    }
}
