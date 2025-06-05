/**
 * Component for the application toolbar
 */
class ToolbarComponent {
    constructor() {
        this.actionHandlers = {
            'fa-plus': this.handleNewInvestigation.bind(this),
            'fa-save': this.handleSave.bind(this),
            'fa-folder-open': this.handleOpen.bind(this),
            'fa-search': this.handleSearch.bind(this),
            'fa-filter': this.handleFilter.bind(this),
            'fa-cog': this.handleSettings.bind(this)
        };
        
        this.initializeToolbar();
    }
    
    /**
     * Initialize toolbar buttons
     */
    initializeToolbar() {
        document.querySelectorAll('.toolbar .btn').forEach(button => {
            const iconClass = button.querySelector('i').className.split(' ')[1];
            
            button.addEventListener('click', () => {
                if (this.actionHandlers[iconClass]) {
                    this.actionHandlers[iconClass]();
                }
            });
        });
        
        // Add more toolbar buttons
        this.addExtraButtons();
    }
    
    /**
     * Add additional toolbar buttons for advanced features
     */
    addExtraButtons() {
        const toolbar = document.querySelector('.toolbar');
        
        // Add divider
        const divider = document.createElement('div');
        divider.className = 'divider';
        toolbar.appendChild(divider);
        
        // Add export dropdown
        this.addDropdownButton(toolbar, 'Export', 'fa-file-export', [
            { label: 'Export as JSON', icon: 'fa-file-code', action: this.handleExportJSON.bind(this) },
            { label: 'Export as CSV', icon: 'fa-file-csv', action: this.handleExportCSV.bind(this) },
            { label: 'Export as Image', icon: 'fa-file-image', action: this.handleExportImage.bind(this) },
            { label: 'Generate Report', icon: 'fa-file-pdf', action: this.handleGenerateReport.bind(this) }
        ]);
        
        // Add import dropdown
        this.addDropdownButton(toolbar, 'Import', 'fa-file-import', [
            { label: 'Auto-detect File Type', icon: 'fa-file', action: () => eventBus.emit('import:file') },
            { label: 'Import JSON', icon: 'fa-file-code', action: () => eventBus.emit('import:json') },
            { label: 'Import CSV', icon: 'fa-file-csv', action: () => eventBus.emit('import:csv') },
            { label: 'Import Excel', icon: 'fa-file-excel', action: () => eventBus.emit('import:excel') },
            { label: 'Import GraphML', icon: 'fa-project-diagram', action: () => eventBus.emit('import:graphml') },
            { label: 'Import GEXF', icon: 'fa-project-diagram', action: () => eventBus.emit('import:gexf') },
            { label: 'Import Neo4j Cypher', icon: 'fa-database', action: () => eventBus.emit('import:cypher') },
            { label: 'Import from API', icon: 'fa-cloud-download-alt', action: () => eventBus.emit('import:api') }
        ]);
        
        // Add analytics button
        this.addButton(toolbar, 'Analytics', 'fa-chart-line', this.handleAnalytics.bind(this));
        
        // Add layout button
        this.addDropdownButton(toolbar, 'Layout', 'fa-vector-square', [
            { label: 'Grid Layout', icon: 'fa-th', action: () => this.handleLayout('grid') },
            { label: 'Circle Layout', icon: 'fa-circle', action: () => this.handleLayout('circle') },
            { label: 'Concentric Layout', icon: 'fa-bullseye', action: () => this.handleLayout('concentric') },
            { label: 'Force-Directed', icon: 'fa-project-diagram', action: () => this.handleLayout('cose') }
        ]);
        
        // Add map view button
        this.addButton(toolbar, 'Map View', 'fa-map', this.handleMapView.bind(this));
    }
    
    /**
     * Add a button to the toolbar
     * @param {HTMLElement} parent - Parent element
     * @param {string} label - Button label
     * @param {string} icon - FontAwesome icon class
     * @param {Function} action - Click handler
     */
    addButton(parent, label, icon, action) {
        const button = document.createElement('button');
        button.className = 'btn btn-outline-light';
        button.innerHTML = `<i class="fas ${icon}"></i> ${label}`;
        button.addEventListener('click', action);
        parent.appendChild(button);
        return button;
    }
    
    /**
     * Add a dropdown button to the toolbar
     * @param {HTMLElement} parent - Parent element
     * @param {string} label - Button label
     * @param {string} icon - FontAwesome icon class
     * @param {Array} items - Dropdown items
     */
    addDropdownButton(parent, label, icon, items) {
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'dropdown';
        
        const button = document.createElement('button');
        button.className = 'btn btn-outline-light dropdown-toggle';
        button.setAttribute('data-bs-toggle', 'dropdown');
        button.innerHTML = `<i class="fas ${icon}"></i> ${label}`;
        
        const dropdown = document.createElement('ul');
        dropdown.className = 'dropdown-menu';
        
        items.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'dropdown-item';
            a.href = '#';
            a.innerHTML = `<i class="fas ${item.icon}"></i> ${item.label}`;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                item.action();
            });
            li.appendChild(a);
            dropdown.appendChild(li);
        });
        
        dropdownContainer.appendChild(button);
        dropdownContainer.appendChild(dropdown);
        parent.appendChild(dropdownContainer);
        
        return dropdownContainer;
    }
    
    /**
     * Handle new investigation action
     */
    handleNewInvestigation() {
        if (confirm('Create a new investigation? All unsaved changes will be lost.')) {
            eventBus.emit('investigation:new');
        }
    }
    
    /**
     * Handle save action
     */
    handleSave() {
        eventBus.emit('investigation:save');
    }
    
    /**
     * Handle open action
     */
    handleOpen() {
        eventBus.emit('investigation:open');
    }
    
    /**
     * Handle search action
     */
    handleSearch() {
        eventBus.emit('search:open');
        
        // Create modal if it doesn't exist
        let modal = document.getElementById('searchModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'searchModal';
            modal.setAttribute('tabindex', '-1');
            
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Advanced Search</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="input-group mb-3">
                                <input type="text" class="form-control" id="searchInput" placeholder="Search entities...">
                                <button class="btn btn-primary" id="searchButton" type="button">Search</button>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Filter by entity type:</label>
                                <div class="btn-group" role="group">
                                    <input type="checkbox" class="btn-check" id="filter-person" checked>
                                    <label class="btn btn-outline-primary" for="filter-person">Person</label>
                                    
                                    <input type="checkbox" class="btn-check" id="filter-org" checked>
                                    <label class="btn btn-outline-primary" for="filter-org">Organization</label>
                                    
                                    <input type="checkbox" class="btn-check" id="filter-loc" checked>
                                    <label class="btn btn-outline-primary" for="filter-loc">Location</label>
                                    
                                    <input type="checkbox" class="btn-check" id="filter-other" checked>
                                    <label class="btn btn-outline-primary" for="filter-other">Other</label>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Search in properties:</label>
                                <div class="form-check form-check-inline">
                                    <input class="form-check-input" type="checkbox" id="search-name" checked>
                                    <label class="form-check-label" for="search-name">Name</label>
                                </div>
                                <div class="form-check form-check-inline">
                                    <input class="form-check-input" type="checkbox" id="search-desc" checked>
                                    <label class="form-check-label" for="search-desc">Description</label>
                                </div>
                                <div class="form-check form-check-inline">
                                    <input class="form-check-input" type="checkbox" id="search-props" checked>
                                    <label class="form-check-label" for="search-props">Other Properties</label>
                                </div>
                            </div>
                            
                            <hr>
                            
                            <h6>Search Results</h6>
                            <div id="searchResults" class="list-group">
                                <!-- Results will be populated here -->
                                <div class="text-center text-muted">Enter search terms above</div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="selectAllResults">Select All Results</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Initialize the modal
            const modalInstance = new bootstrap.Modal(modal);
            
            // Add search functionality
            document.getElementById('searchButton').addEventListener('click', () => {
                this.performSearch();
            });
            
            document.getElementById('searchInput').addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
            
            document.getElementById('selectAllResults').addEventListener('click', () => {
                this.selectAllSearchResults();
                modalInstance.hide();
            });
        }
        
        // Show the modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }
    
    /**
     * Perform search based on input criteria
     */
    performSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filterPerson = document.getElementById('filter-person').checked;
        const filterOrg = document.getElementById('filter-org').checked;
        const filterLoc = document.getElementById('filter-loc').checked;
        const filterOther = document.getElementById('filter-other').checked;
        
        const searchName = document.getElementById('search-name').checked;
        const searchDesc = document.getElementById('search-desc').checked;
        const searchProps = document.getElementById('search-props').checked;
        
        // Get entities from eventBus
        eventBus.emit('search:query', {
            term: searchTerm,
            filters: { filterPerson, filterOrg, filterLoc, filterOther },
            fields: { searchName, searchDesc, searchProps },
            callback: this.displaySearchResults.bind(this)
        });
    }
    
    /**
     * Display search results
     * @param {Array} results - Search results
     */
    displaySearchResults(results) {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = '';
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="text-center text-muted">No results found</div>';
            return;
        }
        
        results.forEach(entity => {
            const item = document.createElement('button');
            item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <div>
                    <i class="fas ${ENTITY_TYPES[entity.type].icon}" style="color: ${ENTITY_TYPES[entity.type].color}"></i>
                    <span class="ms-2">${entity.label}</span>
                </div>
                <span class="badge bg-primary rounded-pill">${entity.type}</span>
            `;
            
            item.addEventListener('click', () => {
                eventBus.emit('entity:select', entity.id);
            });
            
            resultsContainer.appendChild(item);
        });
    }
    
    /**
     * Select all search results
     */
    selectAllSearchResults() {
        eventBus.emit('search:selectAll');
    }
    
    /**
     * Handle filter action
     */
    handleFilter() {
        eventBus.emit('filter:open');
        
        // Create modal if it doesn't exist
        let modal = document.getElementById('filterModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'filterModal';
            modal.setAttribute('tabindex', '-1');
            
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Advanced Filters</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card mb-3">
                                        <div class="card-header">
                                            <h6 class="mb-0">Entity Types</h6>
                                        </div>
                                        <div class="card-body" id="entity-type-filters">
                                            <!-- Entity type filters will be populated here -->
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card mb-3">
                                        <div class="card-header">
                                            <h6 class="mb-0">Link Types</h6>
                                        </div>
                                        <div class="card-body" id="link-type-filters">
                                            <!-- Link type filters will be populated here -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="mb-0">Advanced Filters</h6>
                                </div>
                                <div class="card-body">
                                    <div class="mb-3">
                                        <label class="form-label">Connection Degree</label>
                                        <div class="d-flex">
                                            <input type="range" class="form-range" id="degreeRange" min="1" max="10" value="1">
                                            <span class="ms-2" id="degreeValue">1</span>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Date Range (for events)</label>
                                        <div class="row">
                                            <div class="col">
                                                <input type="date" class="form-control" id="dateFrom">
                                            </div>
                                            <div class="col">
                                                <input type="date" class="form-control" id="dateTo">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="showDisconnected">
                                        <label class="form-check-label" for="showDisconnected">
                                            Show disconnected entities
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-danger" id="resetFilters">Reset Filters</button>
                            <button type="button" class="btn btn-primary" id="applyFilters">Apply Filters</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Initialize the modal
            const modalInstance = new bootstrap.Modal(modal);
            
            // Populate entity type filters
            const entityTypeFilters = document.getElementById('entity-type-filters');
            Object.entries(ENTITY_TYPES).forEach(([type, config]) => {
                const filterItem = document.createElement('div');
                filterItem.className = 'form-check';
                filterItem.innerHTML = `
                    <input class="form-check-input entity-type-filter" type="checkbox" id="filter-${type}" value="${type}" checked>
                    <label class="form-check-label" for="filter-${type}">
                        <i class="fas ${config.icon}" style="color: ${config.color}"></i>
                        <span class="ms-1">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </label>
                `;
                entityTypeFilters.appendChild(filterItem);
            });
            
            // Populate link type filters
            const linkTypeFilters = document.getElementById('link-type-filters');
            Object.entries(LINK_TYPES).forEach(([type, config]) => {
                const filterItem = document.createElement('div');
                filterItem.className = 'form-check';
                filterItem.innerHTML = `
                    <input class="form-check-input link-type-filter" type="checkbox" id="filter-link-${type}" value="${type}" checked>
                    <label class="form-check-label" for="filter-link-${type}">
                        <i class="fas ${config.icon}" style="color: ${config.color}"></i>
                        <span class="ms-1">${config.label}</span>
                    </label>
                `;
                linkTypeFilters.appendChild(filterItem);
            });
            
            // Range slider functionality
            const degreeRange = document.getElementById('degreeRange');
            const degreeValue = document.getElementById('degreeValue');
            degreeRange.addEventListener('input', () => {
                degreeValue.textContent = degreeRange.value;
            });
            
            // Add filter functionality
            document.getElementById('applyFilters').addEventListener('click', () => {
                this.applyFilters(modalInstance);
            });
            
            document.getElementById('resetFilters').addEventListener('click', () => {
                this.resetFilters();
            });
        }
        
        // Show the modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }
    
    /**
     * Apply filter settings
     * @param {bootstrap.Modal} modalInstance - The Bootstrap modal instance
     */
    applyFilters(modalInstance) {
        // Get entity type filters
        const entityTypeFilters = {};
        document.querySelectorAll('.entity-type-filter').forEach(checkbox => {
            entityTypeFilters[checkbox.value] = checkbox.checked;
        });
        
        // Get link type filters
        const linkTypeFilters = {};
        document.querySelectorAll('.link-type-filter').forEach(checkbox => {
            linkTypeFilters[checkbox.value] = checkbox.checked;
        });
        
        // Get other filters
        const degree = parseInt(document.getElementById('degreeRange').value);
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        const showDisconnected = document.getElementById('showDisconnected').checked;
        
        const filters = {
            entityTypes: entityTypeFilters,
            linkTypes: linkTypeFilters,
            degree,
            dateRange: { from: dateFrom, to: dateTo },
            showDisconnected
        };
        
        // Apply filters
        eventBus.emit('filter:apply', filters);
        
        // Close modal
        modalInstance.hide();
    }
    
    /**
     * Reset all filters
     */
    resetFilters() {
        // Reset entity type filters
        document.querySelectorAll('.entity-type-filter').forEach(checkbox => {
            checkbox.checked = true;
        });
        
        // Reset link type filters
        document.querySelectorAll('.link-type-filter').forEach(checkbox => {
            checkbox.checked = true;
        });
        
        // Reset other filters
        document.getElementById('degreeRange').value = 1;
        document.getElementById('degreeValue').textContent = '1';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('showDisconnected').checked = false;
        
        // Apply reset
        eventBus.emit('filter:reset');
    }
    
    /**
     * Handle settings action
     */
    handleSettings() {
        eventBus.emit('settings:open');
    }
    
    /**
     * Handle export as JSON
     */
    handleExportJSON() {
        eventBus.emit('export:json');
    }
    
    /**
     * Handle export as CSV
     */
    handleExportCSV() {
        eventBus.emit('export:csv');
    }
    
    /**
     * Handle export as image
     */
    handleExportImage() {
        eventBus.emit('export:image');
    }
    
    /**
     * Handle generate report
     */
    handleGenerateReport() {
        eventBus.emit('report:generate');
    }
    
    /**
     * Handle import JSON
     */
    handleImportJSON() {
        eventBus.emit('import:json');
    }
    
    /**
     * Handle import CSV
     */
    handleImportCSV() {
        eventBus.emit('import:csv');
    }
    
    /**
     * Handle import from API
     */
    handleImportAPI() {
        // Create modal for API import
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'apiImportModal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Import from API</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="apiUrl" class="form-label">API URL</label>
                            <input type="text" class="form-control" id="apiUrl" placeholder="https://api.example.com/data">
                        </div>
                        <div class="mb-3">
                            <label for="apiAuthToken" class="form-label">Authentication Token (optional)</label>
                            <input type="password" class="form-control" id="apiAuthToken">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="importAPIButton">Import</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize the modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        // Add import functionality
        document.getElementById('importAPIButton').addEventListener('click', () => {
            const url = document.getElementById('apiUrl').value.trim();
            const token = document.getElementById('apiAuthToken').value.trim();
            
            if (url) {
                eventBus.emit('import:api', { url, token });
                modalInstance.hide();
            } else {
                alert('Please enter an API URL.');
            }
        });
        
        // Remove modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }
    
    /**
     * Handle analytics action
     */
    handleAnalytics() {
        eventBus.emit('analytics:open');
        
        // Create modal for analytics
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'analyticsModal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Investigation Analytics</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card mb-3">
                                    <div class="card-header">Graph Summary</div>
                                    <div class="card-body">
                                        <div id="graph-summary">Loading...</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card mb-3">
                                    <div class="card-header">Key Entities</div>
                                    <div class="card-body">
                                        <div id="key-entities">Loading...</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card mb-3">
                                    <div class="card-header">Entity Types</div>
                                    <div class="card-body">
                                        <canvas id="entity-types-chart"></canvas>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card mb-3">
                                    <div class="card-header">Link Types</div>
                                    <div class="card-body">
                                        <canvas id="link-types-chart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card mb-3">
                            <div class="card-header">Path Analysis</div>
                            <div class="card-body">
                                <div class="form-text mb-2">Find shortest path between two entities</div>
                                <div class="row mb-3">
                                    <div class="col">
                                        <select class="form-select" id="path-source">
                                            <option value="">Select source entity</option>
                                        </select>
                                    </div>
                                    <div class="col">
                                        <select class="form-select" id="path-target">
                                            <option value="">Select target entity</option>
                                        </select>
                                    </div>
                                    <div class="col-auto">
                                        <button class="btn btn-primary" id="find-path-btn">Find Path</button>
                                    </div>
                                </div>
                                <div id="path-results"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize the modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        // Load analytics data
        eventBus.emit('analytics:getData', {
            callback: (data) => this.populateAnalytics(data)
        });
        
        // Set up path analysis
        eventBus.emit('analytics:getEntities', {
            callback: (entities) => this.setupPathAnalysis(entities)
        });
        
        // Remove modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }
    
    /**
     * Populate analytics data in the modal
     * @param {Object} data - Analytics data
     */
    populateAnalytics(data) {
        // Graph summary
        const summaryEl = document.getElementById('graph-summary');
        summaryEl.innerHTML = `
            <p><strong>Entities:</strong> ${data.entityCount}</p>
            <p><strong>Links:</strong> ${data.linkCount}</p>
            <p><strong>Graph Density:</strong> ${data.density.toFixed(3)}</p>
        `;
        
        // Key entities
        const keyEntitiesEl = document.getElementById('key-entities');
        if (data.mostConnected.length === 0) {
            keyEntitiesEl.innerHTML = '<p>No connected entities found.</p>';
        } else {
            const list = document.createElement('ul');
            list.className = 'list-group';
            
            data.mostConnected.forEach(entity => {
                const item = document.createElement('li');
                item.className = 'list-group-item d-flex justify-content-between align-items-center';
                item.innerHTML = `
                    <div>
                        <i class="fas ${ENTITY_TYPES[entity.type].icon}" style="color: ${ENTITY_TYPES[entity.type].color}"></i>
                        <span class="ms-2">${entity.label}</span>
                    </div>
                    <span class="badge bg-primary rounded-pill">${entity.count} connections</span>
                `;
                
                list.appendChild(item);
            });
            
            keyEntitiesEl.innerHTML = '';
            keyEntitiesEl.appendChild(list);
        }
        
        // Entity types chart
        const entityTypesEl = document.getElementById('entity-types-chart');
        const entityLabels = Object.keys(data.entityCounts).map(
            type => type.charAt(0).toUpperCase() + type.slice(1)
        );
        const entityColors = Object.keys(data.entityCounts).map(
            type => ENTITY_TYPES[type].color
        );
        
        new Chart(entityTypesEl, {
            type: 'doughnut',
            data: {
                labels: entityLabels,
                datasets: [{
                    data: Object.values(data.entityCounts),
                    backgroundColor: entityColors
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
        
        // Link types chart
        const linkTypesEl = document.getElementById('link-types-chart');
        const linkLabels = Object.keys(data.linkCounts).map(
            type => LINK_TYPES[type].label
        );
        const linkColors = Object.keys(data.linkCounts).map(
            type => LINK_TYPES[type].color
        );
        
        new Chart(linkTypesEl, {
            type: 'doughnut',
            data: {
                labels: linkLabels,
                datasets: [{
                    data: Object.values(data.linkCounts),
                    backgroundColor: linkColors
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
    
    /**
     * Set up path analysis in analytics modal
     * @param {Array} entities - List of entities
     */
    setupPathAnalysis(entities) {
        const sourceSelect = document.getElementById('path-source');
        const targetSelect = document.getElementById('path-target');
        
        // Populate entity dropdowns
        entities.forEach(entity => {
            const option = document.createElement('option');
            option.value = entity.id;
            option.textContent = entity.label;
            
            sourceSelect.appendChild(option.cloneNode(true));
            targetSelect.appendChild(option);
        });
        
        // Set up find path button
        document.getElementById('find-path-btn').addEventListener('click', () => {
            const sourceId = sourceSelect.value;
            const targetId = targetSelect.value;
            
            if (!sourceId || !targetId) {
                alert('Please select both source and target entities.');
                return;
            }
            
            if (sourceId === targetId) {
                alert('Source and target must be different entities.');
                return;
            }
            
            eventBus.emit('analytics:findPath', {
                sourceId,
                targetId,
                callback: (path, entities) => this.displayPath(path, entities)
            });
        });
    }
    
    /**
     * Display path between entities
     * @param {Array} path - Array of entity IDs forming the path
     * @param {Object} entities - Map of entity objects
     */
    displayPath(path, entities) {
        const resultsEl = document.getElementById('path-results');
        
        if (path.length === 0) {
            resultsEl.innerHTML = '<div class="alert alert-warning">No path found between the selected entities.</div>';
            return;
        }
        
        let html = '<div class="alert alert-success">Path found with ' + (path.length - 1) + ' steps</div>';
        html += '<div class="path-visualization">';
        
        path.forEach((id, index) => {
            const entity = entities[id];
            
            if (index > 0) {
                html += '<div class="path-arrow"><i class="fas fa-arrow-right"></i></div>';
            }
            
            html += `
                <div class="path-node">
                    <div class="path-node-icon" style="background-color: ${ENTITY_TYPES[entity.type].color}">
                        <i class="fas ${ENTITY_TYPES[entity.type].icon}"></i>
                    </div>
                    <div class="path-node-label">${entity.label}</div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Add button to highlight path in graph
        html += `
            <div class="mt-3 text-center">
                <button class="btn btn-primary" id="highlight-path-btn">
                    <i class="fas fa-map-marked-alt"></i> Highlight Path in Graph
                </button>
            </div>
        `;
        
        resultsEl.innerHTML = html;
        
        // Add CSS for path visualization
        const style = document.createElement('style');
        style.textContent = `
            .path-visualization {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                margin: 20px 0;
            }
            .path-node {
                text-align: center;
                margin: 5px;
            }
            .path-node-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                margin: 0 auto 5px;
            }
            .path-arrow {
                margin: 0 5px;
                color: #999;
            }
            .path-node-label {
                font-size: 12px;
                max-width: 80px;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        `;
        document.head.appendChild(style);
        
        // Add highlight functionality
        document.getElementById('highlight-path-btn').addEventListener('click', () => {
            eventBus.emit('graph:highlightPath', path);
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('analyticsModal'));
            modal.hide();
        });
    }
    
    /**
     * Handle layout application
     * @param {string} layoutName - Name of the layout to apply
     */
    handleLayout(layoutName) {
        eventBus.emit('graph:applyLayout', layoutName);
    }
    
    /**
     * Handle map view action
     */
    handleMapView() {
        eventBus.emit('mapView:toggle');
        
        // Check if map view is already created
        let mapContainer = document.getElementById('map-container');
        
        if (!mapContainer) {
            // Create map container
            mapContainer = document.createElement('div');
            mapContainer.id = 'map-container';
            mapContainer.className = 'map-container';
            mapContainer.style.display = 'none';
            
            // Create map toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn btn-sm btn-primary map-toggle-btn';
            toggleBtn.innerHTML = '<i class="fas fa-project-diagram"></i> Graph View';
            
            // Use bound method for event handler to preserve 'this' context
            toggleBtn.addEventListener('click', this.handleMapView.bind(this));
            
            mapContainer.appendChild(toggleBtn);
            
            // Create map element
            const mapElement = document.createElement('div');
            mapElement.id = 'map';
            mapElement.style.height = '100%';
            mapContainer.appendChild(mapElement);
            
            // Add to DOM
            const graphContainer = document.getElementById('graph-container');
            graphContainer.parentNode.insertBefore(mapContainer, graphContainer.nextSibling);
            
            // Add CSS for map
            const style = document.createElement('style');
            style.textContent = `
                .map-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: white;
                    z-index: 1000;
                }
                .map-toggle-btn {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    z-index: 1001;
                }
            `;
            document.head.appendChild(style);
            
            // Load Leaflet library if not already loaded
            if (!window.L) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
                document.head.appendChild(link);
                
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
                
                // Store this context and properly bind the initialization function
                const boundInitializeMap = this.initializeMap.bind(this);
                
                // Use direct function reference for onload
                script.onload = function() {
                    boundInitializeMap();
                };
                
                document.body.appendChild(script);
            } else {
                this.initializeMap();
            }
        }
        
        // Toggle visibility
        const graphContainer = document.getElementById('graph-container');
        if (mapContainer.style.display === 'none') {
            mapContainer.style.display = 'block';
            graphContainer.style.display = 'none';
        } else {
            mapContainer.style.display = 'none';
            graphContainer.style.display = 'block';
        }
    }
    
    /**
     * Initialize map view
     */
    initializeMap() {
        // Initialize Leaflet map
        const map = L.map('map').setView([0, 0], 2);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Get location entities from the graph
        eventBus.emit('entity:getLocations', {
            callback: this.addLocationsToMap.bind(this, map)
        });
    }
    
    /**
     * Add location entities to the map
     * @param {L.Map} map - Leaflet map instance
     * @param {Array} locations - Array of location entities
     */
    addLocationsToMap(map, locations) {
        if (!locations || locations.length === 0) {
            alert('No location entities found with valid coordinates.');
            return;
        }
        
        // Create markers for each location
        const markers = [];
        locations.forEach(location => {
            // Extract coordinates from properties
            const lat = parseFloat(location.properties.latitude || location.properties.lat);
            const lng = parseFloat(location.properties.longitude || location.properties.lng);
            
            if (isNaN(lat) || isNaN(lng)) return;
            
            // Create marker
            const marker = L.marker([lat, lng])
                .addTo(map)
                .bindPopup(`
                    <strong>${location.label}</strong><br>
                    ${location.properties.address || ''}
                `);
            
            markers.push(marker);
        });
        
        // If we have markers, fit map bounds
        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    }
}
