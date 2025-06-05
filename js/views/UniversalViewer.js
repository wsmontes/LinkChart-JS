/**
 * Universal Viewer component for browsing, filtering and selecting data
 * before generating link charts - inspired by DataWalk
 */
class UniversalViewer {
    /**
     * Initialize the Universal Viewer
     * @param {string} containerId - ID of container element
     */
    constructor(containerId = 'universal-viewer-container') {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.currentView = 'sources'; // sources, entities, relationships
        
        // Initialize shared state
        this.state = {
            dataSources: {},
            selectedData: { entities: {}, links: {} },
            allEntities: [],
            filters: {},
            searchTerm: ''
        };
        
        // First initialize the UI structure
        this.init();
        
        // Only after UI is created, initialize sub-components
        this.sourcesViewer = new SourcesViewer(this);
        this.entitiesViewer = new EntitiesViewer(this);
        this.relationshipsViewer = new RelationshipsViewer(this);
        
        // Initialize the components after they've been created
        this.sourcesViewer.init();
        this.entitiesViewer.init();
        this.relationshipsViewer.init();
    }
    
    /**
     * Initialize the viewer
     */
    init() {
        if (!this.container) {
            console.error(`Container element with ID '${this.containerId}' not found.`);
            return;
        }
        
        // Create the basic structure
        this.container.innerHTML = `
            <div class="universal-viewer">
                <div class="uv-header">
                    <div class="uv-breadcrumb">
                        <span class="uv-breadcrumb-item active" data-view="sources">Data Sources</span>
                        <span class="uv-breadcrumb-separator">›</span>
                        <span class="uv-breadcrumb-item disabled" data-view="entities">Entities</span>
                        <span class="uv-breadcrumb-separator">›</span>
                        <span class="uv-breadcrumb-item disabled" data-view="relationships">Relationships</span>
                    </div>
                    <div class="uv-actions">
                        <button class="btn btn-sm btn-primary disabled" id="generateLinkChartBtn">
                            <i class="fas fa-project-diagram"></i> Generate Link Chart
                        </button>
                    </div>
                </div>
                
                <div class="uv-toolbar">
                    <div class="input-group">
                        <span class="input-group-text"><i class="fas fa-search"></i></span>
                        <input type="text" class="form-control" id="uv-search-input" placeholder="Search...">
                        <button class="btn btn-outline-secondary" id="uv-filter-btn">
                            <i class="fas fa-filter"></i> Filters
                        </button>
                        <button class="btn btn-outline-secondary" id="uv-view-btn">
                            <i class="fas fa-th"></i>
                        </button>
                    </div>
                </div>
                
                <div class="uv-filter-panel" style="display: none;">
                    <div class="uv-filter-header">
                        <h5>Filters</h5>
                        <button class="btn btn-sm btn-link" id="uv-filter-close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="uv-filter-content">
                        <!-- Filter controls will be dynamically added here -->
                    </div>
                    <div class="uv-filter-footer">
                        <button class="btn btn-sm btn-secondary" id="uv-filter-reset-btn">Reset</button>
                        <button class="btn btn-sm btn-primary" id="uv-filter-apply-btn">Apply</button>
                    </div>
                </div>
                
                <div class="uv-content">
                    <div class="uv-sources-view active">
                        <div class="uv-source-grid">
                            <!-- Data sources will be dynamically added here -->
                        </div>
                    </div>
                    
                    <div class="uv-entities-view">
                        <div class="uv-entity-table-container">
                            <table class="table table-hover table-striped">
                                <thead>
                                    <tr>
                                        <th><input type="checkbox" id="select-all-entities"></th>
                                        <th>Type</th>
                                        <th>Label</th>
                                        <th>Properties</th>
                                        <th>Source</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="entity-table-body">
                                    <!-- Entity rows will be dynamically added here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="uv-relationships-view">
                        <div class="uv-relationship-matrix">
                            <!-- Relationship matrix will be rendered here -->
                        </div>
                        <div class="uv-relationship-detail">
                            <!-- Relationship details will be shown here -->
                        </div>
                    </div>
                </div>
                
                <div class="uv-status-bar">
                    <div class="uv-status-info">
                        <span id="uv-status-count">0</span> items
                    </div>
                    <div class="uv-selection-info">
                        <span id="uv-selected-count">0</span> selected
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Breadcrumb navigation
        this.container.querySelectorAll('.uv-breadcrumb-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                if (!item.classList.contains('active') && !item.classList.contains('disabled')) {
                    this.switchView(view);
                }
            });
        });
        
        // Filter panel toggle
        this.container.querySelector('#uv-filter-btn').addEventListener('click', () => {
            const filterPanel = this.container.querySelector('.uv-filter-panel');
            filterPanel.style.display = filterPanel.style.display === 'none' ? 'block' : 'none';
        });
        
        // Filter panel close
        this.container.querySelector('#uv-filter-close-btn').addEventListener('click', () => {
            this.container.querySelector('.uv-filter-panel').style.display = 'none';
        });
        
        // Filter reset and apply buttons
        this.container.querySelector('#uv-filter-reset-btn').addEventListener('click', () => {
            this.resetFilters();
        });
        
        this.container.querySelector('#uv-filter-apply-btn').addEventListener('click', () => {
            this.applyFilters();
            this.container.querySelector('.uv-filter-panel').style.display = 'none';
        });
        
        // Search input
        this.container.querySelector('#uv-search-input').addEventListener('input', (e) => {
            this.state.searchTerm = e.target.value;
            this.applySearch();
        });
        
        // View toggle button
        this.container.querySelector('#uv-view-btn').addEventListener('click', () => {
            this.toggleViewMode();
        });
        
        // Generate link chart button
        this.container.querySelector('#generateLinkChartBtn').addEventListener('click', () => {
            this.generateLinkChart();
        });
        
        // Select all entities checkbox
        this.container.querySelector('#select-all-entities').addEventListener('change', (e) => {
            this.selectAllEntities(e.target.checked);
        });
    }
    
    /**
     * Switch view between sources, entities, relationships
     * @param {string} view - View to switch to
     */
    switchView(view) {
        if (!['sources', 'entities', 'relationships'].includes(view)) return;
        
        // Update breadcrumb
        this.container.querySelectorAll('.uv-breadcrumb-item').forEach(item => {
            item.classList.remove('active');
        });
        this.container.querySelector(`.uv-breadcrumb-item[data-view="${view}"]`).classList.add('active');
        
        // Hide all views
        this.container.querySelectorAll('.uv-content > div').forEach(div => {
            div.classList.remove('active');
        });
        
        // Show selected view
        this.container.querySelector(`.uv-${view}-view`).classList.add('active');
        
        this.currentView = view;
        
        // Update component if needed
        if (view === 'entities') {
            this.entitiesViewer.onActivate();
        } else if (view === 'relationships') {
            this.relationshipsViewer.onActivate();
        }
    }
    
    /**
     * Enable a breadcrumb item
     * @param {string} view - View to enable
     */
    enableBreadcrumb(view) {
        const item = this.container.querySelector(`.uv-breadcrumb-item[data-view="${view}"]`);
        if (item) {
            item.classList.remove('disabled');
        }
    }
    
    /**
     * Toggle view mode (grid/list)
     */
    toggleViewMode() {
        const viewBtn = this.container.querySelector('#uv-view-btn i');
        
        if (viewBtn.classList.contains('fa-th')) {
            viewBtn.classList.remove('fa-th');
            viewBtn.classList.add('fa-list');
        } else {
            viewBtn.classList.remove('fa-list');
            viewBtn.classList.add('fa-th');
        }
        
        // Toggle view class on the content container
        this.container.querySelector('.uv-content').classList.toggle('grid-view');
        
        // Notify current view of the change
        if (this.currentView === 'sources') {
            this.sourcesViewer.onViewModeChange();
        } else if (this.currentView === 'entities') {
            this.entitiesViewer.onViewModeChange();
        }
    }
    
    /**
     * Reset all filters
     */
    resetFilters() {
        this.state.filters = {};
        
        if (this.currentView === 'entities') {
            this.entitiesViewer.resetFilters();
        } else if (this.currentView === 'relationships') {
            this.relationshipsViewer.resetFilters();
        }
    }
    
    /**
     * Apply current filters
     */
    applyFilters() {
        if (this.currentView === 'entities') {
            this.entitiesViewer.applyFilters();
        } else if (this.currentView === 'relationships') {
            this.relationshipsViewer.applyFilters();
        }
    }
    
    /**
     * Apply search term
     */
    applySearch() {
        if (this.currentView === 'sources') {
            this.sourcesViewer.applySearch(this.state.searchTerm);
        } else if (this.currentView === 'entities') {
            this.entitiesViewer.applySearch(this.state.searchTerm);
        } else if (this.currentView === 'relationships') {
            this.relationshipsViewer.applySearch(this.state.searchTerm);
        }
    }
    
    /**
     * Select all entities
     * @param {boolean} selected - Whether to select or deselect all entities
     */
    selectAllEntities(selected) {
        if (this.currentView === 'entities') {
            this.entitiesViewer.selectAllEntities(selected);
        }
    }
    
    /**
     * Generate a link chart from selected data
     */
    generateLinkChart() {
        universalViewerController.generateLinkChart(this.state.selectedData);
    }
    
    /**
     * Update selection count in status bar
     */
    updateSelectionCount() {
        const count = Object.keys(this.state.selectedData.entities).length;
        this.container.querySelector('#uv-selected-count').textContent = count;
        
        // Enable/disable generate link chart button
        this.container.querySelector('#generateLinkChartBtn').classList.toggle(
            'disabled', count === 0
        );
    }
    
    /**
     * Update item count in status bar
     * @param {number} count - Number of items
     */
    updateItemCount(count) {
        this.container.querySelector('#uv-status-count').textContent = count;
    }
}
