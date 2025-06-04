/**
 * Chart visualization module for LinkChart JS using D3.js
 */

class ChartVisualization {
    constructor(containerId, chartData) {
        this.containerId = containerId;
        this.data = chartData || new ChartData();
        this.svg = null;
        this.simulation = null;
        this.width = 0;
        this.height = 0;
        this.nodes = [];
        this.links = [];
        this.zoom = null;
        this.selectedEntity = null;
        this.onEntitySelected = null;
    }

    init() {
        const container = document.getElementById(this.containerId);
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        // Clear any existing SVG
        d3.select('#' + this.containerId).selectAll("svg").remove();

        // Create the SVG container
        this.svg = d3.select('#' + this.containerId)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('class', 'chart-svg');

        // Create a group for the chart that will be transformed with zoom
        this.chartGroup = this.svg.append('g')
            .attr('class', 'chart-group');

        // Add links group first so they appear below nodes
        this.linksGroup = this.chartGroup.append('g').attr('class', 'links-group');
        this.nodesGroup = this.chartGroup.append('g').attr('class', 'nodes-group');

        // Set up zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.chartGroup.attr('transform', event.transform);
            });
        
        this.svg.call(this.zoom);

        // Add arrow markers for different relationship types
        const defs = this.svg.append('defs');
        
        // Default marker
        defs.append('marker')
            .attr('id', 'arrow-default')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 27)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#999');

        // Hierarchical relationship marker
        defs.append('marker')
            .attr('id', 'arrow-hierarchical')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 27)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#ff9900');
            
        // Related relationship marker
        defs.append('marker')
            .attr('id', 'arrow-related')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 27)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#00aaff');

        // Initialize the simulation with forces specifically tuned for hierarchical data
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id)
                .distance(d => {
                    // Make hierarchical relationships have shorter distances
                    return d.type === 'hierarchical' ? 100 : 150;
                })
                .strength(d => {
                    // Make hierarchical relationships stronger
                    return d.type === 'hierarchical' ? 0.7 : 0.3;
                })
            )
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(50));

        // Set up event listeners for window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleResize() {
        const container = document.getElementById(this.containerId);
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        this.svg
            .attr('width', this.width)
            .attr('height', this.height);

        // Update simulation center force
        this.simulation
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .alpha(0.3)
            .restart();
    }

    updateData(chartData) {
        this.data = chartData;
        this.render();
    }

    render() {
        // Convert data to D3 format
        this.nodes = this.data.entities.map(entity => ({...entity}));
        this.links = this.data.relationships.map(rel => ({
            id: rel.id,
            source: rel.sourceId,
            target: rel.targetId,
            type: rel.type,
            label: rel.label,
            strength: rel.strength
        }));

        // Update the simulation with the new data
        this.simulation
            .nodes(this.nodes)
            .force('link').links(this.links);

        // Create links
        const link = this.linksGroup.selectAll('.link')
            .data(this.links, d => d.id);

        link.exit().remove();

        const linkEnter = link.enter()
            .append('line')
            .attr('class', d => `link ${d.type}`)
            .attr('stroke-width', d => d.strength ? Math.sqrt(d.strength) * 1.5 : 1.5)
            .attr('stroke', d => {
                // Use different colors for different relationship types
                if (d.type === 'hierarchical') return '#ff9900';
                if (d.type === 'related') return '#00aaff';
                return '#999';
            })
            .attr('marker-end', d => `url(#arrow-${d.type || 'default'})`);

        // Create nodes
        const node = this.nodesGroup.selectAll('.node')
            .data(this.nodes, d => d.id);

        node.exit().remove();

        const nodeEnter = node.enter()
            .append('g')
            .attr('class', d => `node ${d.type}`)
            .call(this.drag())
            .on('click', (event, d) => this.onNodeClick(event, d))
            .on('mouseover', (event, d) => this.onNodeMouseOver(event, d))
            .on('mouseout', (event, d) => this.onNodeMouseOut(event, d));

        nodeEnter.append('circle')
            .attr('r', 20)
            .attr('fill', d => {
                const entityType = this.data.getEntityTypeById(d.type);
                return entityType ? entityType.color : '#a29bfe'; // Default color if type not found
            });

        nodeEnter.append('text')
            .attr('dy', 30)
            .attr('text-anchor', 'middle')
            .text(d => d.name);

        // Add hover tooltip with additional info
        nodeEnter.append('title')
            .text(d => {
                let tooltip = `${d.name}\nType: ${d.type}`;
                
                // Add important properties to tooltip
                const keyProps = ['Key', 'Summary', 'Status'];
                keyProps.forEach(prop => {
                    const value = d.getProperty ? d.getProperty(prop) : d.properties?.[prop];
                    if (value) {
                        tooltip += `\n${prop}: ${value}`;
                    }
                });
                
                return tooltip;
            });

        // Update the simulation
        this.simulation
            .on('tick', () => this.onTick());

        // Restart the simulation
        this.simulation.alpha(1).restart();
    }

    onTick() {
        // Update link positions
        this.linksGroup.selectAll('.link')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        // Update node positions
        this.nodesGroup.selectAll('.node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`);
    }

    drag() {
        const simulation = this.simulation;

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            // Store the position in the entity data
            d.x = event.x;
            d.y = event.y;
            // Allow nodes to move again after dragging
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    onNodeClick(event, d) {
        // Unselect previously selected node
        if (this.selectedEntity && this.selectedEntity.id !== d.id) {
            this.nodesGroup.selectAll('.node.selected')
                .classed('selected', false);
        }

        // Toggle selection of clicked node
        const isSelected = !d3.select(event.currentTarget).classed('selected');
        d3.select(event.currentTarget).classed('selected', isSelected);
        
        // Update selected entity and trigger callback
        this.selectedEntity = isSelected ? d : null;
        
        if (this.onEntitySelected) {
            this.onEntitySelected(this.selectedEntity);
        }
   }

    /**
     * Handle mouse over event for nodes
     */
    onNodeMouseOver(event, d) {
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
        }
        
        // Highlight connected nodes and links
        this.highlightConnections(d.id);
    }
    
    /**
     * Handle mouse out event for nodes
     */
    onNodeMouseOut(event, d) {
        this.tooltipTimeout = setTimeout(() => {
            // Remove highlight if node not selected
            if (!this.selectedEntity || this.selectedEntity.id !== d.id) {
                this.clearHighlights();
            }
        }, 300);
    }
    
    /**
     * Highlight connected nodes and links for an entity
     */
    highlightConnections(entityId) {
        // Find all directly connected relationships
        const connectedLinks = this.links.filter(link => 
            link.source.id === entityId || link.target.id === entityId
        );
        
        // Get IDs of connected nodes
        const connectedIds = new Set();
        connectedIds.add(entityId);
        
        connectedLinks.forEach(link => {
            if (link.source.id === entityId) {
                connectedIds.add(link.target.id);
            } else {
                connectedIds.add(link.source.id);
            }
        });
        
        // Dim all nodes and links
        this.nodesGroup.selectAll('.node')
            .classed('dimmed', d => !connectedIds.has(d.id));
            
        this.linksGroup.selectAll('.link')
            .classed('dimmed', d => 
                d.source.id !== entityId && d.target.id !== entityId
            );
    }
    
    /**
     * Clear all highlights from the graph
     */
    clearHighlights() {
        this.nodesGroup.selectAll('.node')
            .classed('dimmed', false)
            .classed('highlighted', false)
            .classed('hub-node', false);
            
        this.linksGroup.selectAll('.link')
            .classed('dimmed', false)
            .classed('highlighted', false);
    }
    
    zoomIn() {
        this.svg.transition().duration(500).call(
            this.zoom.scaleBy, 1.2
        );
    }

    zoomOut() {
        this.svg.transition().duration(500).call(
            this.zoom.scaleBy, 0.8
        );
    }

    fitView() {
        const container = document.getElementById(this.containerId);
        
        if (this.nodes.length === 0) {
            // If no nodes, just reset to center
            this.svg.transition().duration(750).call(
                this.zoom.transform,
                d3.zoomIdentity.translate(this.width / 2, this.height / 2).scale(1)
            );
            return;
        }
        
        // Calculate bounds of all nodes
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x);
            maxY = Math.max(maxY, node.y);
        });
        
        // Add padding
        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Calculate scale to fit
        const scale = Math.min(
            container.clientWidth / width,
            container.clientHeight / height,
            3 // Maximum scale
        );
        
        // Calculate the center of the bounds
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // Transform to center the content
        const translateX = container.clientWidth / 2 - centerX * scale;
        const translateY = container.clientHeight / 2 - centerY * scale;
        
        this.svg.transition().duration(750).call(
            this.zoom.transform,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
        );
        
        // After fitting the view, optimize the layout if hierarchical relationships exist
        const hasHierarchical = this.links.some(link => link.type === 'hierarchical');
        if (hasHierarchical) {
            setTimeout(() => this.optimizeHierarchicalLayout(), 100);
        }
    }

    addNewEntityAtCenter(entity) {
        // Calculate the center of the visible area
        const container = document.getElementById(this.containerId);
        const centerX = container.clientWidth / 2;
        const centerY = container.clientHeight / 2;
        
        // Transform the center point based on the current zoom transform
        const transform = d3.zoomTransform(this.svg.node());
        const point = transform.invert([centerX, centerY]);
        
        // Set the entity position
        entity.x = point[0];
        entity.y = point[1];
        
        // Add to data and re-render
        this.data.addEntity(entity);
        this.render();
        
        return entity;
    }

    createRelationship(sourceId, targetId, type = 'default', label = '') {
        // Create a new relationship
        const relationship = new Relationship(
            null,
            sourceId,
            targetId,
            type,
            label
        );
        
        // Add to data and re-render
        this.data.addRelationship(relationship);
        this.render();
        
        return relationship;
    }
    
    // Add method to optimize layout for hierarchical data
    optimizeHierarchicalLayout() {
        // Find all hierarchical relationships
        const hierarchicalLinks = this.links.filter(link => link.type === 'hierarchical');
        
        // Create a map of parent to children
        const parentChildMap = new Map();
        
        hierarchicalLinks.forEach(link => {
            const parentId = link.target.id; // In our data model, target is the parent
            const childId = link.source.id;
            
            if (!parentChildMap.has(parentId)) {
                parentChildMap.set(parentId, []);
            }
            
            parentChildMap.get(parentId).push(childId);
        });
        
        // For each parent, position children in a semi-circle below
        parentChildMap.forEach((children, parentId) => {
            const parent = this.nodes.find(node => node.id === parentId);
            if (!parent) return;
            
            // Calculate radius based on number of children
            const radius = Math.max(200, children.length * 30);
            const angleStep = Math.PI / Math.max(children.length, 1);
            
            // Position children in a semi-circle below the parent
            children.forEach((childId, i) => {
                const child = this.nodes.find(node => node.id === childId);
                if (!child) return;
                
                const angle = Math.PI / 2 + angleStep * i - (children.length - 1) * angleStep / 2;
                child.x = parent.x + radius * Math.cos(angle);
                child.y = parent.y + radius * Math.sin(angle);
                
                // Pin the node position temporarily
                child.fx = child.x;
                child.fy = child.y;
                
                // Schedule unpinning after layout stabilizes
                setTimeout(() => {
                    child.fx = null;
                    child.fy = null;
                }, 1500);
            });
        });
        
        // Restart the simulation
        this.simulation.alpha(1).restart();
    }
}
