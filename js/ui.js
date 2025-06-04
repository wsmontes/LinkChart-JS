/**
 * UI Interaction module for LinkChart JS
 */

class UiManager {
    constructor(chart) {
        this.chart = chart;
        this.draggedEntityType = null;
        this.isCreatingRelationship = false;
        this.relationshipSource = null;
        this.entityModal = null;
        this.editingEntityId = null;
    }

    init() {
        this.initDragAndDrop();
        this.initChartControls();
        this.initEntityModal();
        this.setupEntitySelectionHandler();
        
        // Check if we have entity types, if not, create default ones
        if (this.chart.data.entityTypes.length === 0) {
            this.createDefaultEntityTypes();
        }
        
        this.updateEntityPalette();
    }
    
    /**
     * Create default entity types if none exist
     */
    createDefaultEntityTypes() {
        // Add common entity types
        this.chart.data.addEntityType(new EntityType('person', 'Person', 'bi-person', '#ff7675'));
        this.chart.data.addEntityType(new EntityType('organization', 'Organization', 'bi-building', '#74b9ff'));
        this.chart.data.addEntityType(new EntityType('location', 'Location', 'bi-geo-alt', '#55efc4'));
        this.chart.data.addEntityType(new EntityType('event', 'Event', 'bi-calendar-event', '#fdcb6e'));
        this.chart.data.addEntityType(new EntityType('custom', 'Custom', 'bi-box', '#a29bfe'));
    }

    initDragAndDrop() {
        // Set up entity palette drag and drop
        const entityTypes = document.querySelectorAll('.entity-type');
        entityTypes.forEach(type => {
            type.addEventListener('dragstart', (e) => {
                this.draggedEntityType = e.target.getAttribute('data-type');
                e.dataTransfer.setData('entityType', this.draggedEntityType);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        // Set up drop target (visualization area)
        const chartContainer = document.getElementById('chart-container');
        chartContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        chartContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const entityType = e.dataTransfer.getData('entityType') || this.draggedEntityType;
            
            if (entityType) {
                // Show modal for entering entity details
                this.showEntityModal(entityType);
            }
            
            this.draggedEntityType = null;
        });
    }

    initChartControls() {
        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.chart.zoomIn();
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
            this.chart.zoomOut();
        });

        document.getElementById('fit-view').addEventListener('click', () => {
            this.chart.fitView();
        });

        // File operations
        document.getElementById('new-chart').addEventListener('click', () => {
            if (confirm('Create a new chart? All unsaved changes will be lost.')) {
                this.chart.updateData(new ChartData());
                this.updateStatusBar('New chart created');
            }
        });

        document.getElementById('save-chart').addEventListener('click', () => {
            dataManager.saveChart(this.chart.data);
            this.updateStatusBar('Chart saved');
        });

        document.getElementById('load-chart').addEventListener('click', async () => {
            const data = await dataManager.loadChart();
            if (data) {
                this.chart.updateData(data);
                this.updateStatusBar('Chart loaded');
                this.chart.fitView();
            }
        });

        document.getElementById('export-chart').addEventListener('click', () => {
            dataManager.exportChart(this.chart.data);
            this.updateStatusBar('Chart exported');
        });
        
        // Add layout control handlers
        document.getElementById('hierarchical-layout')?.addEventListener('click', () => {
            this.chart.optimizeHierarchicalLayout();
            this.updateStatusBar('Applied hierarchical layout');
        });
        
        document.getElementById('force-layout')?.addEventListener('click', () => {
            // Reset all fixed positions and restart simulation
            this.chart.nodes.forEach(node => {
                node.fx = null;
                node.fy = null;
            });
            this.chart.simulation.alpha(0.5).restart();
            this.updateStatusBar('Applied force-directed layout');
        });
        
        document.getElementById('circular-layout')?.addEventListener('click', () => {
            // Position nodes in a circle
            const center = {
                x: this.chart.width / 2,
                y: this.chart.height / 2
            };
            const radius = Math.min(this.chart.width, this.chart.height) * 0.4;
            const nodeCount = this.chart.nodes.length;
            
            this.chart.nodes.forEach((node, i) => {
                const angle = (i / nodeCount) * 2 * Math.PI;
                node.x = center.x + radius * Math.cos(angle);
                node.y = center.y + radius * Math.sin(angle);
                
                // Pin the node position temporarily
                node.fx = node.x;
                node.fy = node.y;
                
                // Schedule unpinning after layout stabilizes
                setTimeout(() => {
                    node.fx = null;
                    node.fy = null;
                }, 1500);
            });
            
            this.chart.simulation.alpha(0.3).restart();
            this.updateStatusBar('Applied circular layout');
        });
        
        // Add Analysis button handler
        document.getElementById('analyze-chart').addEventListener('click', () => {
            this.performAnalysis();
        });
        
        // Add Optimal Layout button handler
        document.getElementById('analysis-layout').addEventListener('click', () => {
            this.applyOptimalLayout();
        });
        
        // Analysis modal - optimal layout button
        document.getElementById('apply-optimal-layout').addEventListener('click', () => {
            this.applyOptimalLayout();
            const analysisModal = bootstrap.Modal.getInstance(document.getElementById('analysisModal'));
            if (analysisModal) {
                analysisModal.hide();
            }
        });
    }

    initEntityModal() {
        this.entityModal = new bootstrap.Modal(document.getElementById('entityModal'));
        
        document.getElementById('save-entity').addEventListener('click', () => {
            this.saveEntityFromModal();
        });
        
        // Reset form when modal is hidden
        document.getElementById('entityModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('entity-form').reset();
            this.editingEntityId = null;
        });
    }

    showEntityModal(entityType = null, entity = null) {
        const form = document.getElementById('entity-form');
        form.reset();
        
        if (entity) {
            // Edit mode
            this.editingEntityId = entity.id;
            document.getElementById('entity-name').value = entity.name;
            document.getElementById('entity-type').value = entity.type;
            document.getElementById('entity-description').value = entity.description;
        } else {
            // Create mode
            this.editingEntityId = null;
            if (entityType) {
                document.getElementById('entity-type').value = entityType;
            }
        }
        
        this.entityModal.show();
    }

    saveEntityFromModal() {
        const form = document.getElementById('entity-form');
        
        const name = document.getElementById('entity-name').value;
        const type = document.getElementById('entity-type').value;
        const description = document.getElementById('entity-description').value;
        
        if (!name) {
            alert('Entity name is required.');
            return;
        }
        
        if (this.editingEntityId) {
            // Update existing entity
            const entity = this.chart.data.getEntityById(this.editingEntityId);
            if (entity) {
                entity.name = name;
                entity.type = type;
                entity.description = description;
                this.chart.render();
                this.updateStatusBar(`Updated entity: ${name}`);
            }
        } else {
            // Create new entity
            const newEntity = new Entity(null, type, name, description);
            this.chart.addNewEntityAtCenter(newEntity);
            this.updateStatusBar(`Created new ${type}: ${name}`);
        }
        
        this.entityModal.hide();
    }

    setupEntitySelectionHandler() {
        this.chart.onEntitySelected = (entity) => {
            this.updatePropertiesPanel(entity);
            
            // If we're in the process of creating a relationship
            if (this.isCreatingRelationship && this.relationshipSource) {
                if (entity && entity.id !== this.relationshipSource.id) {
                    // Create relationship between source and target
                    const relationship = this.chart.createRelationship(
                        this.relationshipSource.id,
                        entity.id
                    );
                    
                    this.updateStatusBar(`Created relationship between ${this.relationshipSource.name} and ${entity.name}`);
                    
                    // Reset relationship creation mode
                    this.isCreatingRelationship = false;
                    this.relationshipSource = null;
                    
                    // Update UI to show we're no longer in creation mode
                    document.body.classList.remove('creating-relationship');
                }
            }
        };
    }

    updateEntityPalette() {
        const entityTypes = this.chart.data.entityTypes;
        const entityPalette = document.querySelector('.entity-types');
        
        // Clear all existing entity types
        entityPalette.innerHTML = '';
        
        // Add all entity types dynamically
        entityTypes.forEach(type => {
            const typeElement = document.createElement('div');
            typeElement.className = 'entity-type';
            typeElement.setAttribute('draggable', 'true');
            typeElement.setAttribute('data-type', type.id);
            
            typeElement.innerHTML = `
                <i class="bi ${type.icon}" style="color:${type.color}"></i> ${type.name}
            `;
            
            // Set up drag behavior
            typeElement.addEventListener('dragstart', (e) => {
                this.draggedEntityType = e.target.getAttribute('data-type');
                e.dataTransfer.setData('entityType', this.draggedEntityType);
                e.dataTransfer.effectAllowed = 'copy';
            });
            
            entityPalette.appendChild(typeElement);
        });
        
        // Add the "Create New Type" option at the end
        const createTypeElement = document.createElement('div');
        createTypeElement.className = 'entity-type-create';
        createTypeElement.innerHTML = '<i class="bi bi-plus-circle"></i> Create New Type';
        createTypeElement.addEventListener('click', () => {
            // Show entity type creation modal
            const entityTypeModal = new bootstrap.Modal(document.getElementById('entityTypeModal'));
            entityTypeModal.show();
            
            // Set up save handler
            document.getElementById('save-entity-type').onclick = () => {
                const typeName = document.getElementById('type-name').value.trim();
                const typeIcon = document.getElementById('type-icon').value;
                const typeColor = document.getElementById('type-color').value;
                
                if (!typeName) {
                    alert('Type name is required');
                    return;
                }
                
                // Generate ID from name
                const typeId = typeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                
                // Create and add the new type
                const entityType = new EntityType(typeId, typeName, typeIcon, typeColor);
                this.chart.data.addEntityType(entityType);
                
                // Update the UI
                this.updateEntityPalette();
                
                // Close the modal
                entityTypeModal.hide();
            };
        });
        
        entityPalette.appendChild(createTypeElement);
    }
    
    // Add icon preview functionality for the entity type modal
    initEntityTypeModal() {
        const typeIconInput = document.getElementById('type-icon');
        const typeIconPreview = document.getElementById('type-icon-preview');
        
        typeIconInput.addEventListener('input', () => {
            typeIconPreview.className = `bi ${typeIconInput.value}`;
        });
    }

    // Enhanced properties panel to better display complex issue data
    updatePropertiesPanel(entity) {
        const propertiesPanel = document.getElementById('entity-properties');
        
        if (!entity) {
            propertiesPanel.innerHTML = '<p class="text-muted">Select an entity to view properties</p>';
            return;
        }
        
        // Get entity type
        const entityType = this.chart.data.getEntityTypeById(entity.type) || {
            name: entity.type.charAt(0).toUpperCase() + entity.type.slice(1),
            icon: 'bi-box'
        };
        
        let html = `
            <h6>
                <i class="bi ${entityType.icon}"></i>
                ${entity.name}
            </h6>
            <div class="property-item">
                <div class="property-label">Type</div>
                <div class="property-value">${entityType.name}</div>
            </div>
        `;
        
        if (entity.description) {
            html += `
                <div class="property-item">
                    <div class="property-label">Description</div>
                    <div class="property-value">${entity.description}</div>
                </div>
            `;
        }
        
        // Add all custom properties from CSV import
        if (entity.properties && Object.keys(entity.properties).length > 0) {
            // Organize properties into categories
            const basicProps = ['Key', 'Summary', 'Status', 'Issue Type'];
            const personProps = ['Reporter', 'Assignee'];
            const detailProps = ['Description', 'Last comment'];
            const metaProps = ['Count', 'Epic Name'];
            
            html += '<hr>';
            
            // Basic properties
            html += '<div class="property-category">Basic Information</div>';
            basicProps.forEach(prop => {
                const value = this.getPropertyValue(entity, prop);
                if (value) {
                    html += this.createPropertyHTML(prop, value);
                }
            });
            
            // People properties
            const hasPersonProps = personProps.some(prop => this.getPropertyValue(entity, prop));
            if (hasPersonProps) {
                html += '<div class="property-category">People</div>';
                personProps.forEach(prop => {
                    const value = this.getPropertyValue(entity, prop);
                    if (value) {
                        html += this.createPropertyHTML(prop, value);
                    }
                });
            }
            
            // Detail properties
            const hasDetailProps = detailProps.some(prop => this.getPropertyValue(entity, prop));
            if (hasDetailProps) {
                html += '<div class="property-category">Details</div>';
                detailProps.forEach(prop => {
                    const value = this.getPropertyValue(entity, prop);
                    if (value) {
                        const isLongText = value.length > 100;
                        
                        if (isLongText) {
                            html += `
                                <div class="property-item">
                                    <div class="property-label">${prop}</div>
                                    <div class="property-value text-truncate" style="max-width: 100%;" 
                                         title="${this.escapeHTML(value)}" data-bs-toggle="tooltip">
                                        ${this.escapeHTML(value.substring(0, 100))}...
                                    </div>
                                    <button class="btn btn-sm btn-link p-0 mt-1 show-full-text">Show full text</button>
                                </div>
                            `;
                        } else {
                            html += this.createPropertyHTML(prop, value);
                        }
                    }
                });
            }
            
            // Meta properties
            const hasMetaProps = metaProps.some(prop => this.getPropertyValue(entity, prop));
            if (hasMetaProps) {
                html += '<div class="property-category">Metadata</div>';
                metaProps.forEach(prop => {
                    const value = this.getPropertyValue(entity, prop);
                    if (value) {
                        html += this.createPropertyHTML(prop, value);
                    }
                });
            }
            
            // Other properties not already shown
            const shownProps = [...basicProps, ...personProps, ...detailProps, ...metaProps];
            const otherProps = Object.keys(entity.properties).filter(
                prop => !shownProps.some(p => p.toLowerCase() === prop.toLowerCase())
            );
            
            if (otherProps.length > 0) {
                html += '<div class="property-category">Other Properties</div>';
                otherProps.forEach(prop => {
                    const value = entity.properties[prop];
                    if (value !== undefined && value !== null && value !== '') {
                        html += this.createPropertyHTML(prop, value);
                    }
                });
            }
        }
        
        html += `
            <div class="mt-3">
                <button class="btn btn-sm btn-outline-primary me-2" id="edit-entity">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger me-2" id="delete-entity">
                    <i class="bi bi-trash"></i> Delete
                </button>
                <button class="btn btn-sm btn-outline-success" id="create-relationship">
                    <i class="bi bi-link"></i> Link
                </button>
            </div>
        `;
        
        propertiesPanel.innerHTML = html;
        
        // Initialize tooltips
        setTimeout(() => {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
            
            // Add event listeners for "Show full text" buttons
            document.querySelectorAll('.show-full-text').forEach(button => {
                button.addEventListener('click', (e) => {
                    const valueElement = e.target.previousElementSibling;
                    const fullText = valueElement.getAttribute('title');
                    
                    if (e.target.textContent === 'Show full text') {
                        valueElement.textContent = fullText;
                        valueElement.classList.remove('text-truncate');
                        e.target.textContent = 'Show less';
                    } else {
                        valueElement.textContent = fullText.substring(0, 100) + '...';
                        valueElement.classList.add('text-truncate');
                        e.target.textContent = 'Show full text';
                    }
                });
            });
        }, 100);
        
        // Set up event handlers for the buttons
        document.getElementById('edit-entity').addEventListener('click', () => {
            this.showEntityModal(null, entity);
        });
        
        document.getElementById('delete-entity').addEventListener('click', () => {
            if (confirm(`Delete entity "${entity.name}"?`)) {
                this.chart.data.removeEntityById(entity.id);
                this.chart.render();
                this.updatePropertiesPanel(null);
                this.updateStatusBar(`Deleted entity: ${entity.name}`);
            }
        });
        
        document.getElementById('create-relationship').addEventListener('click', () => {
            this.startRelationshipCreation(entity);
        });
    }
    
    /**
     * Perform graph analysis and show results
     */
    performAnalysis() {
        if (this.chart.data.entities.length === 0) {
            alert('No data to analyze. Please add some entities first.');
            return;
        }

        // Create analyzer instance
        const analyzer = new GraphAnalysis(this.chart.data);
        
        // Run analysis
        const analysisResults = analyzer.analyzeGraph();
        
        // Store analysis results
        this.lastAnalysisResults = analysisResults;
        this.analyzer = analyzer;
        
        // Show results in modal
        this.displayAnalysisResults(analysisResults);
        
        // Open the modal
        const analysisModal = new bootstrap.Modal(document.getElementById('analysisModal'));
        analysisModal.show();
    }
    
    /**
     * Display analysis results in the modal
     */
    displayAnalysisResults(results) {
        // Populate summary tab
        const summaryDiv = document.getElementById('analysis-summary');
        summaryDiv.innerHTML = this.generateAnalysisSummary(results);
        
        // Populate metrics tab
        const metricsDiv = document.getElementById('analysis-metrics');
        metricsDiv.innerHTML = this.generateMetricsHTML(results.metrics);
        
        // Populate patterns tab
        const patternsDiv = document.getElementById('analysis-patterns');
        patternsDiv.innerHTML = this.generatePatternsHTML(results.patterns);
        
        // Populate central nodes tab
        const centralNodesDiv = document.getElementById('analysis-central-nodes');
        centralNodesDiv.innerHTML = this.generateCentralNodesHTML(results.centralNodes);
    }
    
    /**
     * Generate summary HTML
     */
    generateAnalysisSummary(results) {
        const { metrics, patterns, centralNodes, clusters } = results;
        
        let html = `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">Graph Overview</h5>
                    <p>Your graph contains <strong>${metrics.entityCount} entities</strong> and <strong>${metrics.relationshipCount} relationships</strong>.</p>
        `;
        
        // Add information about clusters if we found any
        if (clusters && clusters.length > 0) {
            html += `<p>Found <strong>${clusters.length} clusters</strong> of connected entities.</p>`;
        }
        
        // Add information about detected patterns
        if (patterns && patterns.length > 0) {
            html += `<p>Detected <strong>${patterns.length} patterns</strong> in your data.</p>`;
            
            // Count pattern types
            const patternTypes = patterns.reduce((acc, pattern) => {
                acc[pattern.type] = (acc[pattern.type] || 0) + 1;
                return acc;
            }, {});
            
            const patternSummary = [];
            if (patternTypes.hierarchy) patternSummary.push(`${patternTypes.hierarchy} hierarchies`);
            if (patternTypes.hub) patternSummary.push(`${patternTypes.hub} hubs`);
            if (patternTypes.cycle) patternSummary.push(`${patternTypes.cycle} cycles`);
            
            if (patternSummary.length > 0) {
                html += `<p>Including ${patternSummary.join(', ')}.</p>`;
            }
        }
        
        // Add information about central nodes
        if (centralNodes && centralNodes.length > 0) {
            html += `<p>Most central entity: <strong>${centralNodes[0].entity.name}</strong> with ${centralNodes[0].score} connections.</p>`;
        }
        
        html += `
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Insights</h5>
                    <ul class="list-group list-group-flush">
        `;
        
        // Add insights based on metrics and patterns
        let insights = [];
        
        // Graph density insights
        if (metrics.density < 0.05) {
            insights.push('Your graph is very sparse. Consider exploring more connections between entities.');
        } else if (metrics.density > 0.5) {
            insights.push('Your graph is highly connected. Consider filtering to focus on key relationships.');
        }
        
        // Pattern-based insights
        if (patterns.some(p => p.type === 'hierarchy')) {
            insights.push('Hierarchical patterns detected. Try the hierarchical layout for better visualization.');
        }
        
        if (patterns.some(p => p.type === 'hub')) {
            insights.push('Hub patterns detected. Some entities are disproportionately connected to others.');
        }
        
        if (patterns.some(p => p.type === 'cycle')) {
            insights.push('Circular references detected. This may indicate feedback loops or recursive relationships.');
        }
        
        // Distribution insights
        const typeKeys = Object.keys(metrics.entityTypes || {});
        if (typeKeys.length > 0) {
            const counts = typeKeys.map(key => metrics.entityTypes[key]);
            const max = Math.max(...counts);
            const min = Math.min(...counts);
            
            if (max > min * 5) {
                insights.push('Entity types are unevenly distributed. Consider exploring under-represented types.');
            }
        }
        
        // Add insights to HTML
        if (insights.length === 0) {
            insights.push('No specific insights identified for this graph.');
        }
        
        insights.forEach(insight => {
            html += `<li class="list-group-item"><i class="bi bi-lightbulb text-warning me-2"></i>${insight}</li>`;
        });
        
        html += `
                    </ul>
                </div>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Generate metrics HTML
     */
    generateMetricsHTML(metrics) {
        let html = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Basic Metrics</h5>
                            <table class="table table-sm">
                                <tbody>
                                    <tr>
                                        <th>Entities</th>
                                        <td>${metrics.entityCount}</td>
                                    </tr>
                                    <tr>
                                        <th>Relationships</th>
                                        <td>${metrics.relationshipCount}</td>
                                    </tr>
                                    <tr>
                                        <th>Graph Density</th>
                                        <td>${(metrics.density * 100).toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                        <th>Average Connections</th>
                                        <td>${metrics.averageDegree ? metrics.averageDegree.toFixed(2) : 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <th>Max Connections</th>
                                        <td>${metrics.maxDegree || 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Entity Distribution</h5>
        `;
        
        // Add entity type distribution chart or table
        if (metrics.entityTypes && Object.keys(metrics.entityTypes).length > 0) {
            html += '<table class="table table-sm"><tbody>';
            
            Object.entries(metrics.entityTypes)
                .sort((a, b) => b[1] - a[1]) // Sort by count (descending)
                .forEach(([type, count]) => {
                    const percentage = ((count / metrics.entityCount) * 100).toFixed(1);
                    const entityType = this.chart.data.getEntityTypeById(type);
                    const typeName = entityType ? entityType.name : type;
                    
                    html += `
                        <tr>
                            <td>${typeName}</td>
                            <td>${count}</td>
                            <td>
                                <div class="progress">
                                    <div class="progress-bar" role="progressbar" 
                                         style="width: ${percentage}%;"
                                         aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
                                        ${percentage}%
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            
            html += '</tbody></table>';
        } else {
            html += '<p class="text-muted">No entity type data available</p>';
        }
        
        html += `
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Relationship Types</h5>
        `;
        
        // Add relationship type distribution
        if (metrics.relationshipTypes && Object.keys(metrics.relationshipTypes).length > 0) {
            html += '<table class="table table-sm"><tbody>';
            
            Object.entries(metrics.relationshipTypes)
                .sort((a, b) => b[1] - a[1]) // Sort by count (descending)
                .forEach(([type, count]) => {
                    const percentage = ((count / metrics.relationshipCount) * 100).toFixed(1);
                    
                    html += `
                        <tr>
                            <td>${type}</td>
                            <td>${count}</td>
                            <td>
                                <div class="progress">
                                    <div class="progress-bar" role="progressbar" 
                                         style="width: ${percentage}%;"
                                         aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
                                        ${percentage}%
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            
            html += '</tbody></table>';
        } else {
            html += '<p class="text-muted">No relationship type data available</p>';
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Generate patterns HTML
     */
    generatePatternsHTML(patterns) {
        if (!patterns || patterns.length === 0) {
            return '<div class="alert alert-info">No significant patterns detected in the graph.</div>';
        }
        
        // Group patterns by type
        const patternsByType = patterns.reduce((acc, pattern) => {
            if (!acc[pattern.type]) {
                acc[pattern.type] = [];
            }
            acc[pattern.type].push(pattern);
            return acc;
        }, {});
        
        let html = '';
        
        // Hierarchical patterns
        if (patternsByType.hierarchy) {
            html += `
                <div class="card mb-3">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-diagram-3 me-2"></i>
                            Hierarchical Patterns
                        </h5>
                    </div>
                    <ul class="list-group list-group-flush">
            `;
            
            patternsByType.hierarchy.forEach(pattern => {
                html += `
                    <li class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${pattern.root.name}</strong> 
                                <span class="badge bg-secondary">${pattern.root.type}</span>
                                <div class="text-muted small">${pattern.description}</div>
                            </div>
                            <button class="btn btn-outline-primary btn-sm highlight-pattern" 
                                    data-pattern-type="hierarchy" 
                                    data-root-id="${pattern.root.id}">
                                Highlight
                            </button>
                        </div>
                    </li>
                `;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        // Hub patterns
        if (patternsByType.hub) {
            html += `
                <div class="card mb-3">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-asterisk me-2"></i>
                            Hub Patterns
                        </h5>
                    </div>
                    <ul class="list-group list-group-flush">
            `;
            
            patternsByType.hub.forEach(pattern => {
                html += `
                    <li class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${pattern.entity.name}</strong> 
                                <span class="badge bg-secondary">${pattern.entity.type}</span>
                                <div class="text-muted small">${pattern.description}</div>
                            </div>
                            <button class="btn btn-outline-primary btn-sm highlight-pattern" 
                                    data-pattern-type="hub" 
                                    data-entity-id="${pattern.entity.id}">
                                Highlight
                            </button>
                        </div>
                    </li>
                `;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        // Cycle patterns
        if (patternsByType.cycle) {
            html += `
                <div class="card mb-3">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-arrow-repeat me-2"></i>
                            Cycle Patterns
                        </h5>
                    </div>
                    <ul class="list-group list-group-flush">
            `;
            
            patternsByType.cycle.forEach(pattern => {
                html += `
                    <li class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${pattern.entities[0].name} → ... → ${pattern.entities[0].name}</strong>
                                <div class="text-muted small">${pattern.description}</div>
                            </div>
                            <button class="btn btn-outline-primary btn-sm highlight-pattern" 
                                    data-pattern-type="cycle" 
                                    data-cycle-ids="${pattern.entities.map(e => e.id).join(',')}">
                                Highlight
                            </button>
                        </div>
                    </li>
                `;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        // Add event listeners for highlight buttons after rendering
        setTimeout(() => {
            document.querySelectorAll('.highlight-pattern').forEach(button => {
                button.addEventListener('click', (e) => {
                    const patternType = e.target.getAttribute('data-pattern-type');
                    
                    switch(patternType) {
                        case 'hierarchy':
                            const rootId = e.target.getAttribute('data-root-id');
                            this.highlightHierarchy(rootId);
                            break;
                            
                        case 'hub':
                            const entityId = e.target.getAttribute('data-entity-id');
                            this.highlightHub(entityId);
                            break;
                            
                        case 'cycle':
                            const cycleIds = e.target.getAttribute('data-cycle-ids').split(',');
                            this.highlightCycle(cycleIds);
                            break;
                    }
                    
                    // Close the modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('analysisModal'));
                    if (modal) {
                        modal.hide();
                    }
                });
            });
        }, 100);
        
        return html;
    }
    
    /**
     * Generate central nodes HTML
     */
    generateCentralNodesHTML(centralNodes) {
        if (!centralNodes || centralNodes.length === 0) {
            return '<div class="alert alert-info">No central nodes identified.</div>';
        }
        
        let html = `
            <p class="text-muted mb-3">
                These nodes are the most connected entities in your graph and represent key points of analysis.
            </p>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Entity</th>
                            <th>Type</th>
                            <th>Connections</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        centralNodes.forEach(node => {
            if (!node.entity) return;
            
            // Get entity type name
            const entityType = this.chart.data.getEntityTypeById(node.entity.type);
            const typeName = entityType ? entityType.name : node.entity.type;
            
            html += `
                <tr>
                    <td>${node.entity.name}</td>
                    <td>${typeName}</td>
                    <td>${node.score}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary focus-node" data-entity-id="${node.entity.id}">
                            Focus
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        // Add event listeners for focus buttons after rendering
        setTimeout(() => {
            document.querySelectorAll('.focus-node').forEach(button => {
                button.addEventListener('click', (e) => {
                    const entityId = e.target.getAttribute('data-entity-id');
                    this.focusOnEntity(entityId);
                    
                    // Close the modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('analysisModal'));
                    if (modal) {
                        modal.hide();
                    }
                });
            });
        }, 100);
        
        return html;
    }
    
    /**
     * Highlight a hierarchy in the graph
     */
    highlightHierarchy(rootId) {
        // Find the node and its relationships
        const rootNode = this.chart.nodes.find(n => n.id === rootId);
        if (!rootNode) return;
        
        // Remove any existing highlights
        this.chart.nodesGroup.selectAll('.node').classed('highlighted', false);
        this.chart.linksGroup.selectAll('.link').classed('highlighted', false);
        
        // Highlight this node
        this.chart.nodesGroup.selectAll('.node')
            .classed('highlighted', false);
            
        // Find all hierarchical relationships to this node
        const hierarchicalLinks = this.chart.links.filter(link => 
            link.type === 'hierarchical' && link.target.id === rootId
        );
        
        // Highlight those links and source nodes
        const childIds = new Set(hierarchicalLinks.map(link => link.source.id));
        childIds.add(rootId);
        
        this.chart.nodesGroup.selectAll('.node')
            .classed('highlighted', d => childIds.has(d.id));
            
        this.chart.linksGroup.selectAll('.link')
            .classed('highlighted', d => 
                d.type === 'hierarchical' && d.target.id === rootId
            );
            
        // Center view on the hierarchy
        this.zoomToFitNodes(Array.from(childIds));
    }
    
    /**
     * Highlight a hub in the graph
     */
    highlightHub(hubId) {
        // Find the hub node and its relationships
        const hubNode = this.chart.nodes.find(n => n.id === hubId);
        if (!hubNode) return;
        
        // Remove any existing highlights
        this.chart.nodesGroup.selectAll('.node').classed('highlighted', false);
        this.chart.linksGroup.selectAll('.link').classed('highlighted', false);
        
        // Find all relationships connected to this hub
        const connectedLinks = this.chart.links.filter(link => 
            link.source.id === hubId || link.target.id === hubId
        );
        
        // Get IDs of connected nodes
        const connectedIds = new Set();
        connectedIds.add(hubId);
        
        connectedLinks.forEach(link => {
            connectedIds.add(link.source.id);
            connectedIds.add(link.target.id);
        });
        
        // Highlight hub and connected nodes
        this.chart.nodesGroup.selectAll('.node')
            .classed('highlighted', d => connectedIds.has(d.id))
            .classed('hub-node', d => d.id === hubId);
            
        this.chart.linksGroup.selectAll('.link')
            .classed('highlighted', d => 
                d.source.id === hubId || d.target.id === hubId
            );
            
        // Center view on the hub
        this.zoomToFitNodes(Array.from(connectedIds));
    }
    
    /**
     * Highlight a cycle in the graph
     */
    highlightCycle(nodeIds) {
        if (!nodeIds || nodeIds.length < 3) return;
        
        // Remove any existing highlights
        this.chart.nodesGroup.selectAll('.node').classed('highlighted', false);
        this.chart.linksGroup.selectAll('.link').classed('highlighted', false);
        
        // Highlight cycle nodes
        const cycleNodesSet = new Set(nodeIds);
        
        this.chart.nodesGroup.selectAll('.node')
            .classed('highlighted', d => cycleNodesSet.has(d.id));
            
        // Highlight links in the cycle
        this.chart.linksGroup.selectAll('.link')
            .classed('highlighted', d => {
                // Check if both source and target are in the cycle
                return cycleNodesSet.has(d.source.id) && cycleNodesSet.has(d.target.id);
            });
            
        // Center view on the cycle
        this.zoomToFitNodes(nodeIds);
    }
    
    /**
     * Focus on a specific entity
     */
    focusOnEntity(entityId) {
        const node = this.chart.nodes.find(n => n.id === entityId);
        if (!node) return;
        
        // Simulate clicking on the node to select it
        const element = this.chart.nodesGroup.selectAll('.node')
            .filter(d => d.id === entityId)
            .node();
            
        if (element) {
            // Zoom to the node
            const padding = 200;
            const transform = d3.zoomIdentity
                .translate(
                    this.chart.width / 2 - node.x * 1.5,
                    this.chart.height / 2 - node.y * 1.5
                )
                .scale(1.5);
                
            this.chart.svg.transition().duration(750).call(
                this.chart.zoom.transform,
                transform
            );
            
            // Highlight and select the node
            this.chart.nodesGroup.selectAll('.node')
                .classed('highlighted', false)
                .classed('selected', d => d.id === entityId);
                
            // Find and highlight direct connections
            const connectedLinks = this.chart.links.filter(link => 
                link.source.id === entityId || link.target.id === entityId
            );
            
            // Highlight those links
            this.chart.linksGroup.selectAll('.link')
                .classed('highlighted', d => 
                    d.source.id === entityId || d.target.id === entityId
                );
                
            // Update the property panel if there's a selection handler
            if (this.chart.onEntitySelected) {
                this.chart.onEntitySelected(node);
            }
        }
    }
    
    /**
     * Zoom to fit the specified nodes
     */
    zoomToFitNodes(nodeIds) {
        if (!nodeIds || nodeIds.length === 0) return;
        
        // Find the nodes
        const nodes = this.chart.nodes.filter(node => nodeIds.includes(node.id));
        
        if (nodes.length === 0) return;
        
        // Calculate bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x);
            maxY = Math.max(maxY, node.y);
        });
        
        // Add padding
        const padding = 100;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Calculate scale to fit
        const scale = Math.min(
            this.chart.width / width,
            this.chart.height / height,
            2 // Maximum scale
        );
        
        // Calculate the center of the bounds
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // Transform to center the content
        const translateX = this.chart.width / 2 - centerX * scale;
        const translateY = this.chart.height / 2 - centerY * scale;
        
        this.chart.svg.transition().duration(750).call(
            this.chart.zoom.transform,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
        );
    }
    
    /**
     * Apply optimal layout based on analysis
     */
    applyOptimalLayout() {
        if (!this.analyzer) {
            // If no analysis has been run, create analyzer
            this.analyzer = new GraphAnalysis(this.chart.data);
            
            // Run analysis to detect patterns
            this.analyzer.analyzeGraph();
        }
        
        // Apply the optimal layout
        this.analyzer.applyOptimalLayout(this.chart);
        
        this.updateStatusBar('Applied optimal layout based on analysis');
    }
    
    // Helper methods for property display
    getPropertyValue(entity, propName) {
        // Case-insensitive property lookup
        for (const [key, value] of Object.entries(entity.properties)) {
            if (key.toLowerCase() === propName.toLowerCase()) {
                return value;
            }
        }
        return null;
    }
    
    createPropertyHTML(label, value) {
        return `
            <div class="property-item">
                <div class="property-label">${label}</div>
                <div class="property-value">${this.escapeHTML(value)}</div>
            </div>
        `;
    }
    
    escapeHTML(str) {
        if (typeof str !== 'string') {
            return str;
        }
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    startRelationshipCreation(sourceEntity) {
        this.isCreatingRelationship = true;
        this.relationshipSource = sourceEntity;
        document.body.classList.add('creating-relationship');
        
        this.updateStatusBar('Select a target entity to create a relationship');
    }

    updateStatusBar(message) {
        const statusBar = document.querySelector('.status-bar');
        if (statusBar) {
            statusBar.textContent = message;
        }
    }
}
