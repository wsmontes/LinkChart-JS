/**
 * Component for visualizing and exploring relationships between entities
 */
class RelationshipsViewer {
    /**
     * Initialize the relationships viewer
     * @param {UniversalViewer} parent - Parent universal viewer
     */
    constructor(parent) {
        this.parent = parent;
        this.container = parent.container.querySelector('.uv-relationships-view');
        this.matrixContainer = this.container.querySelector('.uv-relationship-matrix');
        this.detailContainer = this.container.querySelector('.uv-relationship-detail');
        this.relationshipMatrix = {};
        this.selectedRelationships = [];
    }
    
    /**
     * Initialize the component
     */
    init() {
        // No initialization needed yet
    }
    
    /**
     * Called when the relationships view is activated
     */
    onActivate() {
        // Analyze relationships if we have entities but no matrix yet
        if (this.parent.state.allEntities.length > 0 && 
            Object.keys(this.relationshipMatrix).length === 0) {
            this.analyzeRelationships(this.parent.state.allEntities);
            this.renderRelationshipMatrix();
        }
    }
    
    /**
     * Analyze relationships between entities
     * @param {Array} entities - Array of entities to analyze
     */
    analyzeRelationships(entities) {
        // This is a simplified implementation that looks for potential relationships
        // In a real application, you would load actual relationship data
        
        // Reset relationship matrix
        this.relationshipMatrix = {};
        
        // Group entities by type for easier access
        const entitiesByType = {};
        entities.forEach(entity => {
            if (!entitiesByType[entity.type]) {
                entitiesByType[entity.type] = [];
            }
            entitiesByType[entity.type].push(entity);
        });
        
        // Sample relationship patterns (simplified rules)
        const relationshipPatterns = [
            // People working at organizations
            {
                sourceType: 'person',
                targetType: 'organization',
                sourceProperties: ['company', 'employer', 'organization'],
                targetProperties: ['name'],
                linkType: 'works_at'
            },
            // People living at locations
            {
                sourceType: 'person',
                targetType: 'location',
                sourceProperties: ['address', 'city', 'location'],
                targetProperties: ['address'],
                linkType: 'lives_at'
            },
            // Organizations at locations
            {
                sourceType: 'organization',
                targetType: 'location',
                sourceProperties: ['address', 'headquarters', 'location'],
                targetProperties: ['address'],
                linkType: 'located_at'
            },
            // People knowing each other (based on similar properties)
            {
                sourceType: 'person',
                targetType: 'person',
                matchingProperties: ['company', 'employer', 'school', 'university'],
                linkType: 'knows'
            }
        ];
        
        // Create relationships
        entities.forEach(sourceEntity => {
            // For each entity, look for potential relationships
            relationshipPatterns.forEach(pattern => {
                // Skip if source entity type doesn't match
                if (sourceEntity.type !== pattern.sourceType) return;
                
                // Get potential target entities
                const targetEntities = entitiesByType[pattern.targetType] || [];
                
                targetEntities.forEach(targetEntity => {
                    // Skip self-relationships
                    if (sourceEntity.id === targetEntity.id) return;
                    
                    let matchFound = false;
                    
                    // Check for property value matches
                    if (pattern.sourceProperties && pattern.targetProperties) {
                        // For each source property
                        for (const sourceProp of pattern.sourceProperties) {
                            const sourceValue = sourceEntity.properties[sourceProp];
                            if (!sourceValue) continue;
                            
                            // Check against each target property
                            for (const targetProp of pattern.targetProperties) {
                                const targetValue = targetEntity.properties[targetProp];
                                if (!targetValue) continue;
                                
                                // If values match approximately (case-insensitive containment)
                                if (String(sourceValue).toLowerCase().includes(String(targetValue).toLowerCase()) ||
                                    String(targetValue).toLowerCase().includes(String(sourceValue).toLowerCase())) {
                                    matchFound = true;
                                    break;
                                }
                            }
                            
                            if (matchFound) break;
                        }
                    }
                    
                    // Check for matching property pairs (e.g., same employer)
                    if (!matchFound && pattern.matchingProperties) {
                        for (const prop of pattern.matchingProperties) {
                            const sourceValue = sourceEntity.properties[prop];
                            const targetValue = targetEntity.properties[prop];
                            
                            if (sourceValue && targetValue && 
                                String(sourceValue).toLowerCase() === String(targetValue).toLowerCase()) {
                                matchFound = true;
                                break;
                            }
                        }
                    }
                    
                    // If a match was found, create a relationship
                    if (matchFound) {
                        // Create matrix key
                        const sourceKey = `${sourceEntity.type}_${sourceEntity.id}`;
                        const targetKey = `${targetEntity.type}_${targetEntity.id}`;
                        
                        // Store in matrix
                        if (!this.relationshipMatrix[sourceKey]) {
                            this.relationshipMatrix[sourceKey] = {};
                        }
                        
                        this.relationshipMatrix[sourceKey][targetKey] = {
                            type: pattern.linkType,
                            source: sourceEntity,
                            target: targetEntity,
                            confidence: 0.7, // Example confidence score
                            properties: {},
                            evidence: [`Matching ${pattern.matchingProperties ? pattern.matchingProperties[0] : 'property'}`]
                        };
                    }
                });
            });
        });
        
        // Also check for existing links in the data and add them to the matrix
        const existingLinks = this.getExistingLinks(entities);
        this.incorporateExistingLinks(existingLinks);
        
        // Count relationships to enable relationships breadcrumb
        const relationshipCount = Object.values(this.relationshipMatrix)
            .reduce((count, relations) => count + Object.keys(relations).length, 0);
        
        if (relationshipCount > 0) {
            this.parent.enableBreadcrumb('relationships');
        }
    }
    
    /**
     * Get existing links that are associated with the provided entities
     * @param {Array} entities - Entities to check for links
     * @returns {Array} Array of links associated with entities
     */
    getExistingLinks(entities) {
        // This would normally come from the graph controller or data service
        // For now, return an empty array as placeholder
        return [];
    }
    
    /**
     * Incorporate existing links into the relationship matrix
     * @param {Array} links - Links to incorporate
     */
    incorporateExistingLinks(links) {
        links.forEach(link => {
            const sourceEntity = this.parent.state.allEntities.find(e => e.id === link.source);
            const targetEntity = this.parent.state.allEntities.find(e => e.id === link.target);
            
            if (!sourceEntity || !targetEntity) return;
            
            const sourceKey = `${sourceEntity.type}_${sourceEntity.id}`;
            const targetKey = `${targetEntity.type}_${targetEntity.id}`;
            
            if (!this.relationshipMatrix[sourceKey]) {
                this.relationshipMatrix[sourceKey] = {};
            }
            
            this.relationshipMatrix[sourceKey][targetKey] = {
                type: link.type,
                source: sourceEntity,
                target: targetEntity,
                confidence: 1.0, // Existing links have 100% confidence
                properties: link.properties || {},
                existing: true
            };
        });
    }
    
    /**
     * Render relationship matrix
     * @param {Object} focusEntity - Entity to focus on (optional)
     */
    renderRelationshipMatrix(focusEntity = null) {
        // Clear containers
        this.matrixContainer.innerHTML = '';
        this.detailContainer.innerHTML = '';
        
        // Get entities to display in the matrix
        let matrixEntities = this.parent.state.allEntities;
        
        // If focus entity is provided, show only its relationships
        if (focusEntity) {
            const focusEntityKey = `${focusEntity.type}_${focusEntity.id}`;
            
            // Find all entities related to the focus entity
            const relatedEntityIds = new Set();
            
            // Check relationships where focus entity is the source
            if (this.relationshipMatrix[focusEntityKey]) {
                Object.keys(this.relationshipMatrix[focusEntityKey]).forEach(targetKey => {
                    const [targetType, targetId] = targetKey.split('_');
                    relatedEntityIds.add(targetId);
                });
            }
            
            // Check relationships where focus entity is the target
            Object.entries(this.relationshipMatrix).forEach(([sourceKey, targets]) => {
                if (sourceKey !== focusEntityKey && targets[focusEntityKey]) {
                    const [sourceType, sourceId] = sourceKey.split('_');
                    relatedEntityIds.add(sourceId);
                }
            });
            
            // Create filtered list of entities including focus entity and related entities
            matrixEntities = this.parent.state.allEntities.filter(entity => 
                entity.id === focusEntity.id || relatedEntityIds.has(entity.id)
            );
        }
        
        // Group entities by type
        const entityTypes = [...new Set(matrixEntities.map(entity => entity.type))];
        
        // Create matrix header
        const matrixHeader = document.createElement('div');
        matrixHeader.className = 'matrix-header';
        matrixHeader.innerHTML = `
            <h5 class="mb-3">Relationship Matrix</h5>
            <p class="text-muted mb-4">
                ${focusEntity ? 
                    `Showing relationships for <strong>${focusEntity.label}</strong>` : 
                    'Showing all potential relationships between entities'}
            </p>
        `;
        
        this.matrixContainer.appendChild(matrixHeader);
        
        // Create matrix UI
        const matrixTable = document.createElement('div');
        matrixTable.className = 'matrix-table';
        
        // Create map of entity by ID for faster lookup
        const entitiesById = {};
        matrixEntities.forEach(entity => {
            entitiesById[entity.id] = entity;
        });
        
        // Create column headers (target entities)
        const headerRow = document.createElement('div');
        headerRow.className = 'matrix-header-row';
        
        // Empty corner cell
        const cornerCell = document.createElement('div');
        cornerCell.className = 'matrix-corner-cell';
        headerRow.appendChild(cornerCell);
        
        // Target entity headers
        matrixEntities.forEach(entity => {
            const headerCell = document.createElement('div');
            headerCell.className = 'matrix-header-cell';
            headerCell.setAttribute('title', entity.label);
            headerCell.innerHTML = `
                <div class="matrix-entity-icon" style="background-color: ${ENTITY_TYPES[entity.type]?.color || '#999'}">
                    <i class="fas ${ENTITY_TYPES[entity.type]?.icon || 'fa-question'}"></i>
                </div>
            `;
            headerRow.appendChild(headerCell);
        });
        
        matrixTable.appendChild(headerRow);
        
        // Create matrix rows (source entities)
        matrixEntities.forEach(sourceEntity => {
            const row = document.createElement('div');
            row.className = 'matrix-row';
            
            // Row header (source entity)
            const rowHeader = document.createElement('div');
            rowHeader.className = 'matrix-row-header';
            rowHeader.setAttribute('title', sourceEntity.label);
            rowHeader.innerHTML = `
                <div class="matrix-entity-icon" style="background-color: ${ENTITY_TYPES[sourceEntity.type]?.color || '#999'}">
                    <i class="fas ${ENTITY_TYPES[sourceEntity.type]?.icon || 'fa-question'}"></i>
                </div>
                <span class="matrix-entity-label">${sourceEntity.label.substring(0, 15)}${sourceEntity.label.length > 15 ? '...' : ''}</span>
            `;
            row.appendChild(rowHeader);
            
            // Matrix cells
            matrixEntities.forEach(targetEntity => {
                // Skip self-relationships
                if (sourceEntity.id === targetEntity.id) {
                    // Add empty cell
                    const emptyCell = document.createElement('div');
                    emptyCell.className = 'matrix-cell self-cell';
                    emptyCell.innerHTML = `<span class="self-marker">×</span>`;
                    row.appendChild(emptyCell);
                    return;
                }
                
                // Check if relationship exists
                const sourceKey = `${sourceEntity.type}_${sourceEntity.id}`;
                const targetKey = `${targetEntity.type}_${targetEntity.id}`;
                
                const forwardRel = this.relationshipMatrix[sourceKey]?.[targetKey];
                const reverseRel = this.relationshipMatrix[targetKey]?.[sourceKey];
                const hasRelationship = forwardRel || reverseRel;
                
                // Create cell
                const cell = document.createElement('div');
                cell.className = `matrix-cell ${hasRelationship ? 'has-links' : ''}`;
                cell.dataset.sourceId = sourceEntity.id;
                cell.dataset.targetId = targetEntity.id;
                
                if (hasRelationship) {
                    // Determine the cell appearance based on relationship
                    const relationship = forwardRel || reverseRel;
                    const isBidirectional = forwardRel && reverseRel;
                    const isExisting = relationship.existing;
                    
                    let cellIcon = 'fa-check';
                    let cellClass = '';
                    
                    if (isBidirectional) {
                        cellIcon = 'fa-exchange-alt';
                        cellClass = 'bidirectional';
                    } else if (isExisting) {
                        cellClass = 'existing';
                    }
                    
                    // Check if this relationship is selected
                    const isSelected = this.selectedRelationships.some(rel => 
                        (rel.source === sourceEntity.id && rel.target === targetEntity.id) ||
                        (rel.source === targetEntity.id && rel.target === sourceEntity.id)
                    );
                    
                    if (isSelected) {
                        cellClass += ' selected';
                    }
                    
                    cell.classList.add(cellClass);
                    cell.innerHTML = `<i class="fas ${cellIcon}"></i>`;
                    
                    // Add click event to show relationship details
                    cell.addEventListener('click', () => {
                        this.showRelationshipDetails(sourceEntity, targetEntity);
                    });
                }
                
                row.appendChild(cell);
            });
            
            matrixTable.appendChild(row);
        });
        
        this.matrixContainer.appendChild(matrixTable);
        
        // Add control buttons
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'matrix-controls mt-4';
        
        if (focusEntity) {
            controlsContainer.innerHTML = `
                <button class="btn btn-sm btn-outline-secondary" id="clear-focus-btn">
                    <i class="fas fa-times"></i> Clear Focus
                </button>
                <button class="btn btn-sm btn-outline-primary" id="add-all-relationships-btn">
                    <i class="fas fa-plus"></i> Add All Relationships
                </button>
            `;
            
            // Add event listeners for control buttons
            controlsContainer.querySelector('#clear-focus-btn').addEventListener('click', () => {
                this.renderRelationshipMatrix();
            });
            
            controlsContainer.querySelector('#add-all-relationships-btn').addEventListener('click', () => {
                this.addAllRelationshipsToSelection(focusEntity);
            });
        } else {
            controlsContainer.innerHTML = `
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control" placeholder="Search entities..." id="matrix-search-input">
                    <button class="btn btn-outline-secondary" type="button" id="matrix-search-btn">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            `;
            
            // Add event listener for search
            const searchInput = controlsContainer.querySelector('#matrix-search-input');
            const searchBtn = controlsContainer.querySelector('#matrix-search-btn');
            
            const performSearch = () => {
                const term = searchInput.value.trim().toLowerCase();
                if (!term) return;
                
                const entity = this.parent.state.allEntities.find(e => 
                    e.label.toLowerCase().includes(term)
                );
                
                if (entity) {
                    this.renderRelationshipMatrix(entity);
                } else {
                    alert(`No entity found matching "${searchInput.value}"`);
                }
            };
            
            searchBtn.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
        
        this.matrixContainer.appendChild(controlsContainer);
        
        // Add relationship detail placeholder
        this.detailContainer.innerHTML = `
            <div class="relationship-detail-placeholder">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Select a relationship from the matrix above to view details
                </div>
                <div class="selected-relationships-container mt-3" style="${this.selectedRelationships.length === 0 ? 'display:none;' : ''}">
                    <h6><i class="fas fa-check-circle me-2"></i>Selected Relationships</h6>
                    <div class="selected-relationships-list" id="selected-relationships-list">
                        <!-- Selected relationships will be added here -->
                    </div>
                    <button class="btn btn-primary mt-3" id="generate-chart-btn">
                        <i class="fas fa-project-diagram me-2"></i>
                        Generate Link Chart (${this.selectedRelationships.length})
                    </button>
                </div>
            </div>
        `;
        
        // Update selected relationships list
        this.updateSelectedRelationshipsList();
        
        // Add event listener for generate chart button
        const generateChartBtn = this.detailContainer.querySelector('#generate-chart-btn');
        if (generateChartBtn) {
            generateChartBtn.addEventListener('click', () => {
                this.generateLinkChart();
            });
        }
        
        // Add CSS styles for matrix
        this.addMatrixStyles();
    }
    
    /**
     * Show relationship details
     * @param {Object} sourceEntity - Source entity
     * @param {Object} targetEntity - Target entity
     */
    showRelationshipDetails(sourceEntity, targetEntity) {
        // Check for relationship in both directions
        const sourceKey = `${sourceEntity.type}_${sourceEntity.id}`;
        const targetKey = `${targetEntity.type}_${targetEntity.id}`;
        
        const forwardRelationship = this.relationshipMatrix[sourceKey]?.[targetKey];
        const reverseRelationship = this.relationshipMatrix[targetKey]?.[sourceKey];
        
        // Combine relationships
        const relationships = [];
        if (forwardRelationship) {
            relationships.push({
                direction: 'forward',
                type: forwardRelationship.type,
                source: sourceEntity,
                target: targetEntity,
                confidence: forwardRelationship.confidence || 0.5,
                properties: forwardRelationship.properties || {},
                evidence: forwardRelationship.evidence || [],
                existing: forwardRelationship.existing || false
            });
        }
        if (reverseRelationship) {
            relationships.push({
                direction: 'reverse',
                type: reverseRelationship.type,
                source: targetEntity,
                target: sourceEntity,
                confidence: reverseRelationship.confidence || 0.5,
                properties: reverseRelationship.properties || {},
                evidence: reverseRelationship.evidence || [],
                existing: reverseRelationship.existing || false
            });
        }
        
        // Clear previous details
        this.detailContainer.innerHTML = '';
        
        // Create relationship detail card
        const detailCard = document.createElement('div');
        detailCard.className = 'card relationship-detail-card';
        
        detailCard.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Relationship Details</h5>
                <button class="btn btn-sm btn-outline-secondary" id="close-detail-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="card-body">
                <div class="relationship-entities mb-4">
                    <div class="d-flex align-items-center">
                        <div class="relationship-entity p-2 border rounded me-3">
                            <div class="entity-icon-wrapper mb-2" style="background-color: ${ENTITY_TYPES[sourceEntity.type]?.color || '#999'}">
                                <i class="fas ${ENTITY_TYPES[sourceEntity.type]?.icon || 'fa-question'}"></i>
                            </div>
                            <div class="entity-label">${sourceEntity.label}</div>
                            <div class="entity-type">${sourceEntity.type}</div>
                        </div>
                        
                        <div class="relationship-direction px-3">
                            <i class="fas ${relationships.length > 1 ? 'fa-exchange-alt' : 'fa-long-arrow-alt-right'} fa-2x"></i>
                        </div>
                        
                        <div class="relationship-entity p-2 border rounded">
                            <div class="entity-icon-wrapper mb-2" style="background-color: ${ENTITY_TYPES[targetEntity.type]?.color || '#999'}">
                                <i class="fas ${ENTITY_TYPES[targetEntity.type]?.icon || 'fa-question'}"></i>
                            </div>
                            <div class="entity-label">${targetEntity.label}</div>
                            <div class="entity-type">${targetEntity.type}</div>
                        </div>
                    </div>
                </div>
                
                <h6 class="mb-3">Relationship Types</h6>
                <ul class="list-group mb-4 relationship-types-list">
                    ${relationships.map(rel => `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge ${rel.direction === 'forward' ? 'bg-primary' : 'bg-secondary'} me-2">
                                    ${rel.direction === 'forward' ? 'Forward' : 'Reverse'}
                                </span>
                                ${rel.type}
                                ${rel.existing ? '<span class="badge bg-success ms-2">Existing</span>' : 
                                    `<div class="progress mt-1" style="height: 5px; width: 100px;">
                                        <div class="progress-bar" role="progressbar" style="width: ${rel.confidence * 100}%;" 
                                            aria-valuenow="${rel.confidence * 100}" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>`
                                }
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input relationship-select" 
                                    type="checkbox" 
                                    data-source-id="${rel.source.id}" 
                                    data-target-id="${rel.target.id}"
                                    data-rel-type="${rel.type}"
                                    ${this.isRelationshipSelected(rel.source.id, rel.target.id, rel.type) ? 'checked' : ''}>
                            </div>
                        </li>
                    `).join('')}
                </ul>
                
                ${relationships.some(rel => rel.evidence && rel.evidence.length > 0) ? `
                    <h6 class="mb-2">Evidence</h6>
                    <ul class="list-group mb-4">
                        ${relationships.flatMap(rel => rel.evidence || []).map(evidence => `
                            <li class="list-group-item">${evidence}</li>
                        `).join('')}
                    </ul>
                ` : ''}
                
                ${relationships.some(rel => Object.keys(rel.properties || {}).length > 0) ? `
                    <h6 class="mb-2">Properties</h6>
                    <table class="table table-sm mb-4">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${relationships.flatMap(rel => 
                                Object.entries(rel.properties || {}).map(([key, value]) => `
                                    <tr>
                                        <td>${key}</td>
                                        <td>${value}</td>
                                    </tr>
                                `)
                            ).join('')}
                        </tbody>
                    </table>
                ` : ''}
                
                <div class="d-grid">
                    <button class="btn btn-primary add-selected-relationships-btn" id="add-these-relationships-btn">
                        <i class="fas fa-plus"></i> Add Selected Relationships to Chart
                    </button>
                </div>
            </div>
        `;
        
        // Add to detail container
        this.detailContainer.appendChild(detailCard);
        
        // Event listeners for relationship selection
        const relationshipSelects = detailCard.querySelectorAll('.relationship-select');
        relationshipSelects.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const sourceId = checkbox.dataset.sourceId;
                const targetId = checkbox.dataset.targetId;
                const relType = checkbox.dataset.relType;
                
                if (e.target.checked) {
                    this.addRelationshipToSelection(sourceId, targetId, relType);
                } else {
                    this.removeRelationshipFromSelection(sourceId, targetId, relType);
                }
                
                // Update cell styling
                this.updateRelationshipCellStyle(sourceId, targetId);
            });
        });
        
        // Event listener for "Add Selected Relationships" button
        detailCard.querySelector('#add-these-relationships-btn').addEventListener('click', () => {
            let anySelected = false;
            
            relationshipSelects.forEach(checkbox => {
                if (checkbox.checked) {
                    anySelected = true;
                    const sourceId = checkbox.dataset.sourceId;
                    const targetId = checkbox.dataset.targetId;
                    const relType = checkbox.dataset.relType;
                    
                    this.addRelationshipToSelection(sourceId, targetId, relType);
                }
            });
            
            if (anySelected) {
                // Update selected relationships list
                this.updateSelectedRelationshipsList();
                
                // Show confirmation
                alert('Relationships added to selection.');
            } else {
                alert('No relationships selected.');
            }
        });
        
        // Close button handler
        detailCard.querySelector('#close-detail-btn').addEventListener('click', () => {
            this.detailContainer.innerHTML = `
                <div class="relationship-detail-placeholder">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Select a relationship from the matrix above to view details
                    </div>
                    <div class="selected-relationships-container mt-3" style="${this.selectedRelationships.length === 0 ? 'display:none;' : ''}">
                        <h6><i class="fas fa-check-circle me-2"></i>Selected Relationships</h6>
                        <div class="selected-relationships-list" id="selected-relationships-list">
                            <!-- Selected relationships will be added here -->
                        </div>
                        <button class="btn btn-primary mt-3" id="generate-chart-btn">
                            <i class="fas fa-project-diagram me-2"></i>
                            Generate Link Chart (${this.selectedRelationships.length})
                        </button>
                    </div>
                </div>
            `;
            
            // Update selected relationships list
            this.updateSelectedRelationshipsList();
            
            // Add event listener for generate chart button
            const generateChartBtn = this.detailContainer.querySelector('#generate-chart-btn');
            if (generateChartBtn) {
                generateChartBtn.addEventListener('click', () => {
                    this.generateLinkChart();
                });
            }
        });
    }
    
    /**
     * Check if a relationship is selected
     * @param {string} sourceId - Source entity ID
     * @param {string} targetId - Target entity ID
     * @param {string} type - Relationship type
     * @returns {boolean} True if relationship is selected
     */
    isRelationshipSelected(sourceId, targetId, type) {
        return this.selectedRelationships.some(rel => 
            (rel.source === sourceId && rel.target === targetId && rel.type === type) ||
            (rel.source === targetId && rel.target === sourceId && rel.type === type)
        );
    }
    
    /**
     * Add a relationship to the selection
     * @param {string} sourceId - Source entity ID
     * @param {string} targetId - Target entity ID
     * @param {string} type - Relationship type
     */
    addRelationshipToSelection(sourceId, targetId, type) {
        // Check if already selected
        if (this.isRelationshipSelected(sourceId, targetId, type)) return;
        
        // Add to selection
        this.selectedRelationships.push({
            source: sourceId,
            target: targetId,
            type: type
        });
        
        // Show the selected relationships container if this is the first selection
        if (this.selectedRelationships.length === 1) {
            const container = this.detailContainer.querySelector('.selected-relationships-container');
            if (container) container.style.display = 'block';
        }
        
        // Update the button counter
        const generateBtn = this.detailContainer.querySelector('#generate-chart-btn');
        if (generateBtn) {
            generateBtn.innerHTML = `
                <i class="fas fa-project-diagram me-2"></i>
                Generate Link Chart (${this.selectedRelationships.length})
            `;
        }
    }
    
    /**
     * Remove a relationship from the selection
     * @param {string} sourceId - Source entity ID
     * @param {string} targetId - Target entity ID
     * @param {string} type - Relationship type
     */
    removeRelationshipFromSelection(sourceId, targetId, type) {
        // Find and remove the relationship
        this.selectedRelationships = this.selectedRelationships.filter(rel => 
            !(
                ((rel.source === sourceId && rel.target === targetId) || 
                (rel.source === targetId && rel.target === sourceId)) && 
                rel.type === type
            )
        );
        
        // Hide the selected relationships container if no selections remain
        if (this.selectedRelationships.length === 0) {
            const container = this.detailContainer.querySelector('.selected-relationships-container');
            if (container) container.style.display = 'none';
        }
        
        // Update the button counter
        const generateBtn = this.detailContainer.querySelector('#generate-chart-btn');
        if (generateBtn) {
            generateBtn.innerHTML = `
                <i class="fas fa-project-diagram me-2"></i>
                Generate Link Chart (${this.selectedRelationships.length})
            `;
        }
    }
    
    /**
     * Update the visual style of a relationship cell based on selection state
     * @param {string} sourceId - Source entity ID
     * @param {string} targetId - Target entity ID
     */
    updateRelationshipCellStyle(sourceId, targetId) {
        // Find the cell in the matrix
        const cell = this.matrixContainer.querySelector(`.matrix-cell[data-source-id="${sourceId}"][data-target-id="${targetId}"]`);
        if (!cell) return;
        
        // Check if relationship is selected
        const isSelected = this.selectedRelationships.some(rel => 
            (rel.source === sourceId && rel.target === targetId) ||
            (rel.source === targetId && rel.target === sourceId)
        );
        
        // Update cell appearance
        if (isSelected) {
            cell.classList.add('selected');
        } else {
            cell.classList.remove('selected');
        }
    }
    
    /**
     * Update the list of selected relationships
     */
    updateSelectedRelationshipsList() {
        const listContainer = this.detailContainer.querySelector('#selected-relationships-list');
        if (!listContainer) return;
        
        if (this.selectedRelationships.length === 0) {
            listContainer.innerHTML = '<div class="text-muted">No relationships selected yet</div>';
            return;
        }
        
        // Populate the list
        listContainer.innerHTML = '';
        
        this.selectedRelationships.forEach(rel => {
            const sourceEntity = this.parent.state.allEntities.find(e => e.id === rel.source);
            const targetEntity = this.parent.state.allEntities.find(e => e.id === rel.target);
            
            if (!sourceEntity || !targetEntity) return;
            
            const item = document.createElement('div');
            item.className = 'selected-relationship-item p-2 border-bottom d-flex justify-content-between';
            
            item.innerHTML = `
                <div class="d-flex align-items-center">
                    <span class="badge rounded-pill" style="background-color: ${ENTITY_TYPES[sourceEntity.type]?.color || '#999'}">
                        ${sourceEntity.label.substring(0, 10)}${sourceEntity.label.length > 10 ? '...' : ''}
                    </span>
                    <i class="fas fa-arrow-right mx-2"></i>
                    <span class="badge rounded-pill" style="background-color: ${ENTITY_TYPES[targetEntity.type]?.color || '#999'}">
                        ${targetEntity.label.substring(0, 10)}${targetEntity.label.length > 10 ? '...' : ''}
                    </span>
                    <span class="ms-2 text-muted small">${rel.type}</span>
                </div>
                <button class="btn btn-sm btn-link remove-rel-btn p-0" data-source="${rel.source}" data-target="${rel.target}" data-type="${rel.type}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Add event listener to remove button
            item.querySelector('.remove-rel-btn').addEventListener('click', (e) => {
                const btn = e.currentTarget;
                this.removeRelationshipFromSelection(
                    btn.dataset.source, 
                    btn.dataset.target,
                    btn.dataset.type
                );
                
                // Update cell appearance
                this.updateRelationshipCellStyle(btn.dataset.source, btn.dataset.target);
                
                // Update the list
                this.updateSelectedRelationshipsList();
            });
            
            listContainer.appendChild(item);
        });
    }
    
    /**
     * Add all relationships for an entity to the selection
     * @param {Object} entity - Entity to add relationships for
     */
    addAllRelationshipsToSelection(entity) {
        // Safety check
        if (!entity) return;
        
        const entityKey = `${entity.type}_${entity.id}`;
        let relationshipsAdded = 0;
        
        // Add relationships where entity is source
        if (this.relationshipMatrix[entityKey]) {
            Object.entries(this.relationshipMatrix[entityKey]).forEach(([targetKey, rel]) => {
                const [targetType, targetId] = targetKey.split('_');
                
                this.addRelationshipToSelection(entity.id, targetId, rel.type);
                relationshipsAdded++;
            });
        }
        
        // Add relationships where entity is target
        Object.entries(this.relationshipMatrix).forEach(([sourceKey, targets]) => {
            if (targets[entityKey]) {
                const [sourceType, sourceId] = sourceKey.split('_');
                const rel = targets[entityKey];
                
                this.addRelationshipToSelection(sourceId, entity.id, rel.type);
                relationshipsAdded++;
            }
        });
        
        // Update UI
        this.updateSelectedRelationshipsList();
        
        // Show message
        alert(`Added ${relationshipsAdded} relationships to selection.`);
        
        // Update all cells' appearance
        this.updateAllCellStyles();
    }
    
    /**
     * Update the appearance of all cells based on selection state
     */
    updateAllCellStyles() {
        const cells = this.matrixContainer.querySelectorAll('.matrix-cell.has-links');
        
        cells.forEach(cell => {
            const sourceId = cell.dataset.sourceId;
            const targetId = cell.dataset.targetId;
            
            const isSelected = this.selectedRelationships.some(rel => 
                (rel.source === sourceId && rel.target === targetId) ||
                (rel.source === targetId && rel.target === sourceId)
            );
            
            if (isSelected) {
                cell.classList.add('selected');
            } else {
                cell.classList.remove('selected');
            }
        });
    }
    
    /**
     * Generate a link chart from selected relationships
     */
    generateLinkChart() {
        if (this.selectedRelationships.length === 0) {
            alert('No relationships selected.');
            return;
        }
        
        // Create entities and links for the link chart
        const entities = {};
        const links = {};
        
        // Add entities involved in the selected relationships
        this.selectedRelationships.forEach(rel => {
            const sourceEntity = this.parent.state.allEntities.find(e => e.id === rel.source);
            const targetEntity = this.parent.state.allEntities.find(e => e.id === rel.target);
            
            if (sourceEntity) entities[sourceEntity.id] = sourceEntity;
            if (targetEntity) entities[targetEntity.id] = targetEntity;
            
            // Create a link ID
            const linkId = `link_${Date.now()}_${Object.keys(links).length}`;
            
            // Add link
            links[linkId] = {
                id: linkId,
                source: rel.source,
                target: rel.target,
                type: rel.type,
                properties: {}
            };
        });
        
        // Generate the chart
        this.parent.state.selectedData = { entities, links };
        this.parent.generateLinkChart();
        
        console.log('Generated link chart with:', {
            entities: Object.keys(entities).length,
            links: Object.keys(links).length
        });
    }
    
    /**
     * Add CSS styles for the matrix visualization
     */
    addMatrixStyles() {
        // Check if styles already exist
        if (document.getElementById('relationship-matrix-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'relationship-matrix-styles';
        style.textContent = `
            .matrix-table {
                display: flex;
                flex-direction: column;
                overflow-x: auto;
                margin-bottom: 20px;
                max-width: 100%;
            }
            
            .matrix-header-row {
                display: flex;
                position: sticky;
                top: 0;
                background-color: white;
                z-index: 2;
            }
            
            .matrix-corner-cell {
                min-width: 150px;
                width: 150px;
                height: 40px;
                border-bottom: 2px solid #dee2e6;
                background-color: #f8f9fa;
            }
            
            .matrix-header-cell {
                min-width: 40px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-bottom: 2px solid #dee2e6;
                background-color: #f8f9fa;
                position: relative;
            }
            
            .matrix-row {
                display: flex;
                height: 40px;
                border-bottom: 1px solid #dee2e6;
            }
            
            .matrix-row-header {
                min-width: 150px;
                width: 150px;
                padding: 0 10px;
                display: flex;
                align-items: center;
                background-color: #f8f9fa;
                font-size: 0.9rem;
                border-right: 2px solid #dee2e6;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .matrix-entity-icon {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                margin-right: 8px;
                flex-shrink: 0;
            }
            
            .matrix-cell {
                min-width: 40px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-right: 1px solid #dee2e6;
                border-bottom: 1px solid #dee2e6;
                cursor: pointer;
            }
            
            .matrix-cell.self-cell {
                background-color: #f8f9fa;
                cursor: not-allowed;
            }
            
            .matrix-cell.has-links {
                background-color: rgba(52, 152, 219, 0.1);
                color: #3498db;
            }
            
            .matrix-cell.has-links:hover {
                background-color: rgba(52, 152, 219, 0.3);
            }
            
            .matrix-cell.has-links.bidirectional {
                background-color: rgba(155, 89, 182, 0.1);
                color: #9b59b6;
            }
            
            .matrix-cell.has-links.existing {
                background-color: rgba(46, 204, 113, 0.1);
                color: #2ecc71;
            }
            
            .matrix-cell.has-links.selected {
                background-color: rgba(231, 76, 60, 0.15);
                color: #e74c3c;
                border: 2px solid #e74c3c;
            }
            
            .selected-relationship-item:hover {
                background-color: #f8f9fa;
            }
            
            .relationship-entity {
                text-align: center;
                max-width: 150px;
            }
            
            .entity-icon-wrapper {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                margin: 0 auto;
            }
            
            .relationship-types-list .progress {
                width: 100px;
                height: 5px;
            }
            
            .relationship-detail-placeholder {
                padding: 10px;
            }
            
            @media (max-width: 768px) {
                .matrix-row-header {
                    min-width: 100px;
                    width: 100px;
                }
                
                .matrix-corner-cell {
                    min-width: 100px;
                    width: 100px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Apply search filtering to relationships
     * @param {string} term - Search term
     */
    applySearch(term) {
        if (!term) {
            return;
        }
        
        // Find an entity matching the search term
        const matchedEntity = this.parent.state.allEntities.find(entity => 
            entity.label.toLowerCase().includes(term.toLowerCase())
        );
        
        if (matchedEntity) {
            // If found, focus on this entity's relationships
            this.renderRelationshipMatrix(matchedEntity);
        } else {
            alert(`No entity found matching '${term}'`);
        }
    }
    
    /**
     * Reset filters
     */
    resetFilters() {
        // No filters implemented yet for relationships view
    }
}
