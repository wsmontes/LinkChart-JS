/**
 * Component for displaying and interacting with entities
 */
class EntitiesViewer {
    /**
     * Initialize the entities viewer
     * @param {UniversalViewer} parent - Parent universal viewer
     */
    constructor(parent) {
        this.parent = parent;
        this.container = parent.container.querySelector('.uv-entities-view');
        this.tableBody = this.container.querySelector('#entity-table-body');
        this.filterContent = parent.container.querySelector('.uv-filter-content');
        this.entityTypeFilters = [];
        this.dataSourceFilters = [];
        this.propertyFilters = [];
    }
    
    /**
     * Initialize the component
     */
    init() {
        // No initialization needed yet
    }
    
    /**
     * Populate the entity table
     * @param {Array} entities - Entities to display
     */
    populateEntityTable(entities) {
        this.tableBody.innerHTML = '';
        
        entities.forEach(entity => {
            const row = document.createElement('tr');
            row.dataset.entityId = entity.id;
            
            // Prepare property pills HTML
            const propertyPills = Object.entries(entity.properties || {})
                .slice(0, 3) // Limit to first 3 properties for display
                .map(([key, value]) => {
                    return `<span class="entity-property-pill">${key}: ${String(value).substring(0, 15)}</span>`;
                })
                .join('');
            
            // Additional properties indicator
            const propCount = Object.keys(entity.properties || {}).length;
            const additionalProps = propCount > 3 ? 
                `<span class="badge bg-secondary">+${propCount - 3} more</span>` : '';
            
            row.innerHTML = `
                <td><input type="checkbox" class="entity-select" data-id="${entity.id}"></td>
                <td>
                    <span class="uv-entity-type-icon" style="background-color: ${ENTITY_TYPES[entity.type]?.color || '#999'}">
                        <i class="fas ${ENTITY_TYPES[entity.type]?.icon || 'fa-question'}"></i>
                    </span>
                    ${entity.type}
                </td>
                <td>${entity.label}</td>
                <td>
                    ${propertyPills}
                    ${additionalProps}
                </td>
                <td>
                    <span class="badge-source" style="background-color: ${entity.sourceColor}">
                        ${entity.sourceName}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-entity-btn" data-id="${entity.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary view-related-btn" data-id="${entity.id}">
                        <i class="fas fa-project-diagram"></i>
                    </button>
                </td>
            `;
            
            // Add event listeners
            row.querySelector('.entity-select').addEventListener('change', (e) => {
                this.toggleEntitySelection(entity.id, e.target.checked);
            });
            
            row.querySelector('.view-entity-btn').addEventListener('click', () => {
                this.viewEntityDetails(entity);
            });
            
            row.querySelector('.view-related-btn').addEventListener('click', () => {
                this.viewRelatedEntities(entity);
            });
            
            this.tableBody.appendChild(row);
        });
        
        // Update item count
        this.parent.updateItemCount(entities.length);
    }
    
    /**
     * Toggle selection of an entity
     * @param {string} entityId - Entity ID
     * @param {boolean} selected - Whether entity is selected
     */
    toggleEntitySelection(entityId, selected) {
        const entity = this.parent.state.allEntities.find(e => e.id === entityId);
        if (!entity) return;
        
        if (selected) {
            this.parent.state.selectedData.entities[entityId] = entity;
        } else {
            delete this.parent.state.selectedData.entities[entityId];
        }
        
        // Update selection count in parent
        this.parent.updateSelectionCount();
    }
    
    /**
     * Select all currently visible entities
     * @param {boolean} selected - Whether to select or deselect all
     */
    selectAllEntities(selected) {
        // Get all checkboxes
        const checkboxes = this.container.querySelectorAll('.entity-select');
        
        // Set all to selected/deselected state
        checkboxes.forEach(checkbox => {
            checkbox.checked = selected;
            this.toggleEntitySelection(checkbox.dataset.id, selected);
        });
    }
    
    /**
     * View entity details
     * @param {Object} entity - Entity to view
     */
    viewEntityDetails(entity) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'entityDetailsModal';
        modal.setAttribute('tabindex', '-1');
        
        // Format properties for display
        let propertiesHtml = '';
        for (const [key, value] of Object.entries(entity.properties || {})) {
            propertiesHtml += `
                <tr>
                    <th>${key}</th>
                    <td>${String(value)}</td>
                </tr>
            `;
        }
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Entity Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex align-items-center mb-4">
                            <div class="me-3">
                                <div class="uv-entity-type-icon" style="background-color: ${ENTITY_TYPES[entity.type]?.color || '#999'}; width: 40px; height: 40px; font-size: 18px;">
                                    <i class="fas ${ENTITY_TYPES[entity.type]?.icon || 'fa-question'}"></i>
                                </div>
                            </div>
                            <div>
                                <h4 class="mb-1">${entity.label}</h4>
                                <span class="badge-source" style="background-color: ${entity.sourceColor}">
                                    ${entity.sourceName}
                                </span>
                                <span class="badge bg-secondary">${entity.type}</span>
                            </div>
                        </div>
                        
                        <h6 class="mb-3">Properties</h6>
                        <table class="table table-striped">
                            <tbody>
                                ${propertiesHtml}
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary entity-select-btn" data-id="${entity.id}">
                            Select for Link Chart
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize the modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        // Handle select button
        modal.querySelector('.entity-select-btn').addEventListener('click', () => {
            // Select the entity
            this.toggleEntitySelection(entity.id, true);
            
            // Update checkbox in table
            const checkbox = this.container.querySelector(`.entity-select[data-id="${entity.id}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
            
            // Close modal
            modalInstance.hide();
        });
        
        // Remove modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }
    
    /**
     * View related entities
     * @param {Object} entity - Entity to view related entities for
     */
    viewRelatedEntities(entity) {
        // Switch to relationships view and focus on this entity
        this.parent.switchView('relationships');
        this.parent.relationshipsViewer.renderRelationshipMatrix(entity);
    }
    
    /**
     * Setup entity filters based on loaded entities
     */
    setupFilters() {
        // Get unique entity types and source IDs
        const entityTypes = [...new Set(this.parent.state.allEntities.map(entity => entity.type))];
        const sourceIds = [...new Set(this.parent.state.allEntities.map(entity => entity.sourceId))];
        
        const filterContent = this.filterContent;
        filterContent.innerHTML = '';
        
        // Entity type filters
        if (entityTypes.length > 0) {
            const typeFiltersContainer = document.createElement('div');
            typeFiltersContainer.className = 'filter-section';
            typeFiltersContainer.innerHTML = `<h6>Entity Types</h6>`;
            
            const typeCheckboxes = document.createElement('div');
            typeCheckboxes.className = 'filter-checkboxes';
            
            entityTypes.forEach(type => {
                const checkbox = document.createElement('div');
                checkbox.className = 'form-check';
                checkbox.innerHTML = `
                    <input class="form-check-input entity-type-filter" type="checkbox" id="filter-${type}" value="${type}" checked>
                    <label class="form-check-label" for="filter-${type}">
                        <span class="uv-entity-type-icon" style="background-color: ${ENTITY_TYPES[type]?.color || '#999'}">
                            <i class="fas ${ENTITY_TYPES[type]?.icon || 'fa-question'}"></i>
                        </span>
                        ${type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                `;
                typeCheckboxes.appendChild(checkbox);
                
                // Save reference to filter checkbox
                this.entityTypeFilters.push({
                    type,
                    element: checkbox.querySelector('input')
                });
            });
            
            typeFiltersContainer.appendChild(typeCheckboxes);
            filterContent.appendChild(typeFiltersContainer);
        }
        
        // Data source filters
        if (sourceIds.length > 0) {
            const sourceFiltersContainer = document.createElement('div');
            sourceFiltersContainer.className = 'filter-section';
            sourceFiltersContainer.innerHTML = `<h6>Data Sources</h6>`;
            
            const sourceCheckboxes = document.createElement('div');
            sourceCheckboxes.className = 'filter-checkboxes';
            
            sourceIds.forEach(sourceId => {
                const source = this.parent.state.dataSources[sourceId];
                if (!source) return;
                
                const checkbox = document.createElement('div');
                checkbox.className = 'form-check';
                checkbox.innerHTML = `
                    <input class="form-check-input source-filter" type="checkbox" id="filter-source-${sourceId}" value="${sourceId}" checked>
                    <label class="form-check-label" for="filter-source-${sourceId}">
                        <span class="uv-source-icon-small" style="color: ${source.color}">
                            <i class="fas ${source.icon}"></i>
                        </span>
                        ${source.name}
                    </label>
                `;
                sourceCheckboxes.appendChild(checkbox);
                
                // Save reference to filter checkbox
                this.dataSourceFilters.push({
                    sourceId,
                    element: checkbox.querySelector('input')
                });
            });
            
            sourceFiltersContainer.appendChild(sourceCheckboxes);
            filterContent.appendChild(sourceFiltersContainer);
        }
    }
    
    /**
     * Setup source filter for a specific source ID
     * @param {string} sourceId - Source ID to filter by
     */
    setupSourceFilter(sourceId) {
        // Reset all source filters
        this.dataSourceFilters.forEach(filter => {
            filter.element.checked = (filter.sourceId === sourceId);
        });
        
        // Apply filters
        this.applyFilters();
    }
    
    /**
     * Add a property filter
     * @param {string} key - Property key
     * @param {string} value - Property value
     */
    addPropertyFilter(key, value) {
        const activeFilters = this.filterContent.querySelector('#active-property-filters');
        const filterId = `filter-${key}-${value.replace(/\s+/g, '-')}`;
        
        // Check if filter already exists
        if (document.getElementById(filterId)) return;
        
        const filterBadge = document.createElement('div');
        filterBadge.className = 'badge bg-light text-dark me-2 mb-2 p-2';
        filterBadge.id = filterId;
        filterBadge.innerHTML = `
            ${key}: "${value}"
            <button type="button" class="btn-close btn-close-sm ms-2" aria-label="Remove filter"></button>
        `;
        
        filterBadge.querySelector('.btn-close').addEventListener('click', () => {
            activeFilters.removeChild(filterBadge);
            
            // Remove from property filters array
            const index = this.propertyFilters.findIndex(p => p.key === key && p.value === value);
            if (index !== -1) {
                this.propertyFilters.splice(index, 1);
            }
        });
        
        activeFilters.appendChild(filterBadge);
        
        // Add to property filters array
        this.propertyFilters.push({ key, value });
    }
    
    /**
     * Apply filters to entities
     */
    applyFilters() {
        // Get selected entity types
        const selectedTypes = this.entityTypeFilters
            .filter(filter => filter.element.checked)
            .map(filter => filter.type);
        
        // Get selected sources
        const selectedSources = this.dataSourceFilters
            .filter(filter => filter.element.checked)
            .map(filter => filter.sourceId);
        
        // Filter entities
        const filteredEntities = this.parent.state.allEntities.filter(entity => 
            selectedTypes.includes(entity.type) &&
            selectedSources.includes(entity.sourceId)
        );
        
        // Update table
        this.populateEntityTable(filteredEntities);
    }
    
    /**
     * Filter entities based on current filter settings
     * @returns {Array} Filtered entities
     */
    filterEntities() {
        const filters = this.parent.state.filters;
        
        return this.parent.state.allEntities.filter(entity => {
            // Type filter
            if (filters.types && !filters.types.includes(entity.type)) return false;
            
            // Source filter
            if (filters.sources && !filters.sources.includes(entity.sourceId)) return false;
            
            // Property filters
            if (filters.properties && filters.properties.length > 0) {
                // Entity must match ALL property filters
                for (const propFilter of filters.properties) {
                    const entityValue = entity.properties[propFilter.key];
                    // If property doesn't exist or value doesn't match
                    if (entityValue === undefined || 
                        !String(entityValue).toLowerCase().includes(String(propFilter.value).toLowerCase())) {
                        return false;
                    }
                }
            }
            
            // Search filter
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                // Search in label
                if (entity.label.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                // Search in type
                if (entity.type.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                // Search in properties
                let foundInProps = false;
                for (const [key, value] of Object.entries(entity.properties || {})) {
                    if (key.toLowerCase().includes(searchTerm) || 
                        String(value).toLowerCase().includes(searchTerm)) {
                        foundInProps = true;
                        break;
                    }
                }
                
                if (!foundInProps) return false;
            }
            
            return true;
        });
    }
    
    /**
     * Reset all filters
     */
    resetFilters() {
        // Reset type filters
        this.entityTypeFilters.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        // Reset source filters
        this.dataSourceFilters.forEach(checkbox => {
            checkbox.checked = true;
        });
        
        // Clear property filters
        this.propertyFilters = [];
        const activeFilters = this.filterContent.querySelector('#active-property-filters');
        if (activeFilters) {
            activeFilters.innerHTML = '';
        }
        
        // Reset property selectors
        const propertyKeySelect = this.filterContent.querySelector('#filter-property-key');
        const propertyValueInput = this.filterContent.querySelector('#filter-property-value');
        
        if (propertyKeySelect) propertyKeySelect.value = '';
        if (propertyValueInput) propertyValueInput.value = '';
        
        // Reset search input
        this.parent.container.querySelector('#uv-search-input').value = '';
        this.parent.state.searchTerm = '';
        
        // Apply reset (show all entities)
        this.parent.state.filters = {};
        this.populateEntityTable(this.parent.state.allEntities);
    }
    
    /**
     * Apply search filter
     * @param {string} term - Search term
     */
    applySearch() {
        // Apply filters will handle the search term from the parent state
        this.applyFilters();
    }
    
    /**
     * Handle view mode change
     */
    onViewModeChange() {
        if (this.container.classList.contains('grid-view')) {
            this.container.classList.remove('grid-view');
            this.container.classList.add('table-view');
        } else {
            this.container.classList.remove('table-view');
            this.container.classList.add('grid-view');
            
            // Convert table to cards if needed
            this.convertTableToCards();
        }
    }
    
    /**
     * Convert table view to card view
     */
    convertTableToCards() {
        // Only do this if we're in grid-view mode
        if (!this.container.classList.contains('grid-view')) return;
        
        // Get current table data
        const rows = Array.from(this.tableBody.querySelectorAll('tr'));
        
        // Create card container
        const cardContainer = document.createElement('div');
        cardContainer.className = 'uv-entity-card-container';
        
        // Create cards from rows
        rows.forEach(row => {
            const entityId = row.dataset.entityId;
            const entity = this.parent.state.allEntities.find(e => e.id === entityId);
            if (!entity) return;
            
            const card = document.createElement('div');
            card.className = 'uv-entity-card';
            card.dataset.entityId = entityId;
            
            card.innerHTML = `
                <div class="uv-entity-card-header">
                    <div class="uv-entity-type-badge" style="background-color: ${ENTITY_TYPES[entity.type]?.color || '#999'}">
                        <i class="fas ${ENTITY_TYPES[entity.type]?.icon || 'fa-question'}"></i>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input entity-select" type="checkbox" data-id="${entity.id}">
                    </div>
                </div>
                <div class="uv-entity-card-body">
                    <h5 class="uv-entity-card-title">${entity.label}</h5>
                    <p class="uv-entity-card-source">
                        <span class="badge-source" style="background-color: ${entity.sourceColor}">
                            ${entity.sourceName}
                        </span>
                    </p>
                    <div class="uv-entity-card-properties">
                        ${Object.entries(entity.properties || {}).slice(0, 3).map(([key, value]) => 
                            `<div class="uv-entity-card-property">${key}: ${String(value).substring(0, 20)}</div>`
                        ).join('')}
                    </div>
                </div>
                <div class="uv-entity-card-footer">
                    <button class="btn btn-sm btn-outline-primary view-entity-btn" data-id="${entity.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline-secondary view-related-btn" data-id="${entity.id}">
                        <i class="fas fa-project-diagram"></i> Relations
                    </button>
                </div>
            `;
            
            // Add event listeners
            card.querySelector('.entity-select').addEventListener('change', (e) => {
                this.toggleEntitySelection(entity.id, e.target.checked);
                
                // Sync with table view checkbox
                const tableCheckbox = this.tableBody.querySelector(`.entity-select[data-id="${entity.id}"]`);
                if (tableCheckbox) {
                    tableCheckbox.checked = e.target.checked;
                }
            });
            
            card.querySelector('.view-entity-btn').addEventListener('click', () => {
                this.viewEntityDetails(entity);
            });
            
            card.querySelector('.view-related-btn').addEventListener('click', () => {
                this.viewRelatedEntities(entity);
            });
            
            cardContainer.appendChild(card);
        });
        
        // Replace table with cards temporarily
        this.tableBody.style.display = 'none';
        this.container.querySelector('.uv-entity-table-container').appendChild(cardContainer);
    }
    
    /**
     * Called when the entities view is activated
     */
    onActivate() {
        // Setup filters if needed
        if (this.entityTypeFilters.length === 0 && this.parent.state.allEntities.length > 0) {
            this.setupFilters();
        }
    }
}
