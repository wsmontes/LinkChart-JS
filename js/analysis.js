/**
 * Analysis module for LinkChart JS
 * Provides automated analysis capabilities for graph data
 */

class GraphAnalysis {
    constructor(chartData) {
        this.data = chartData;
        this.metrics = {};
        this.patterns = [];
        this.clusters = [];
    }

    /**
     * Run a complete analysis of the current graph
     */
    analyzeGraph() {
        this.calculateBasicMetrics();
        this.findCentralNodes();
        this.detectClusters();
        this.identifyPatterns();
        return {
            metrics: this.metrics,
            centralNodes: this.centralNodes,
            clusters: this.clusters,
            patterns: this.patterns
        };
    }

    /**
     * Calculate basic graph metrics
     */
    calculateBasicMetrics() {
        const entities = this.data.entities;
        const relationships = this.data.relationships;
        
        // Basic counts
        this.metrics.entityCount = entities.length;
        this.metrics.relationshipCount = relationships.length;
        
        // Entity type distribution
        this.metrics.entityTypes = {};
        entities.forEach(entity => {
            if (!this.metrics.entityTypes[entity.type]) {
                this.metrics.entityTypes[entity.type] = 0;
            }
            this.metrics.entityTypes[entity.type]++;
        });
        
        // Relationship type distribution
        this.metrics.relationshipTypes = {};
        relationships.forEach(rel => {
            if (!this.metrics.relationshipTypes[rel.type]) {
                this.metrics.relationshipTypes[rel.type] = 0;
            }
            this.metrics.relationshipTypes[rel.type]++;
        });
        
        // Calculate density (ratio of actual connections to possible connections)
        if (entities.length > 1) {
            const possibleConnections = entities.length * (entities.length - 1);
            this.metrics.density = relationships.length / possibleConnections;
        } else {
            this.metrics.density = 0;
        }
        
        // Calculate average degree (number of connections per entity)
        if (entities.length > 0) {
            // Count connections for each entity
            const connectionCounts = {};
            relationships.forEach(rel => {
                if (!connectionCounts[rel.sourceId]) connectionCounts[rel.sourceId] = 0;
                if (!connectionCounts[rel.targetId]) connectionCounts[rel.targetId] = 0;
                connectionCounts[rel.sourceId]++;
                connectionCounts[rel.targetId]++;
            });
            
            // Calculate average
            let totalConnections = 0;
            Object.values(connectionCounts).forEach(count => {
                totalConnections += count;
            });
            
            this.metrics.averageDegree = totalConnections / entities.length;
            
            // Find highest degree (most connected)
            let maxDegree = 0;
            let maxDegreeEntityId = null;
            
            for (const [entityId, count] of Object.entries(connectionCounts)) {
                if (count > maxDegree) {
                    maxDegree = count;
                    maxDegreeEntityId = entityId;
                }
            }
            
            this.metrics.maxDegree = maxDegree;
            this.metrics.maxDegreeEntityId = maxDegreeEntityId;
        }
    }

    /**
     * Find the most central or important nodes in the graph
     */
    findCentralNodes() {
        // Map to store degree centrality (number of connections)
        const degreeCentrality = {};
        
        // Calculate degree centrality
        this.data.relationships.forEach(rel => {
            if (!degreeCentrality[rel.sourceId]) degreeCentrality[rel.sourceId] = 0;
            if (!degreeCentrality[rel.targetId]) degreeCentrality[rel.targetId] = 0;
            degreeCentrality[rel.sourceId]++;
            degreeCentrality[rel.targetId]++;
        });
        
        // Sort entities by their centrality
        const centralityList = Object.entries(degreeCentrality)
            .map(([id, score]) => ({ id, score }))
            .sort((a, b) => b.score - a.score);
        
        // Get top 5 central nodes
        this.centralNodes = centralityList.slice(0, 5).map(item => {
            const entity = this.data.getEntityById(item.id);
            return {
                entity: entity,
                score: item.score
            };
        });
    }

    /**
     * Detect clusters or communities in the graph
     */
    detectClusters() {
        // Simple clustering based on common connections
        const entityMap = new Map();
        
        // Initialize map with empty clusters
        this.data.entities.forEach(entity => {
            entityMap.set(entity.id, {
                entity,
                neighbors: new Set()
            });
        });
        
        // Add neighbor relationships
        this.data.relationships.forEach(rel => {
            if (entityMap.has(rel.sourceId) && entityMap.has(rel.targetId)) {
                entityMap.get(rel.sourceId).neighbors.add(rel.targetId);
                entityMap.get(rel.targetId).neighbors.add(rel.sourceId);
            }
        });
        
        // Simple clustering algorithm
        const visited = new Set();
        this.clusters = [];
        
        this.data.entities.forEach(entity => {
            if (!visited.has(entity.id)) {
                const cluster = this._exploreDFS(entity.id, entityMap, visited);
                if (cluster.entities.length > 1) {
                    this.clusters.push(cluster);
                }
            }
        });
        
        // Sort clusters by size
        this.clusters.sort((a, b) => b.entities.length - a.entities.length);
    }
    
    /**
     * Helper DFS function for clustering
     */
    _exploreDFS(startId, entityMap, visited) {
        const cluster = {
            id: 'cluster_' + this.clusters.length,
            entities: [],
            relationships: []
        };
        
        const stack = [startId];
        
        while (stack.length > 0) {
            const currentId = stack.pop();
            
            if (!visited.has(currentId)) {
                visited.add(currentId);
                
                // Add entity to cluster
                const entityInfo = entityMap.get(currentId);
                if (entityInfo && entityInfo.entity) {
                    cluster.entities.push(entityInfo.entity);
                }
                
                // Add relationships within cluster
                this.data.relationships.forEach(rel => {
                    if ((rel.sourceId === currentId && visited.has(rel.targetId)) ||
                        (rel.targetId === currentId && visited.has(rel.sourceId))) {
                        if (!cluster.relationships.some(r => r.id === rel.id)) {
                            cluster.relationships.push(rel);
                        }
                    }
                });
                
                // Add neighbors to stack
                if (entityInfo && entityInfo.neighbors) {
                    entityInfo.neighbors.forEach(neighbor => {
                        if (!visited.has(neighbor)) {
                            stack.push(neighbor);
                        }
                    });
                }
            }
        }
        
        return cluster;
    }

    /**
     * Identify common patterns in the graph
     */
    identifyPatterns() {
        this.patterns = [];
        
        // Find hierarchical structures (e.g., tree-like structures)
        this._findHierarchicalPatterns();
        
        // Find hub patterns (central entity with many connections)
        this._findHubPatterns();
        
        // Find circular references
        this._findCircularPatterns();
    }
    
    /**
     * Find hierarchical patterns in the data
     */
    _findHierarchicalPatterns() {
        // Find all hierarchical relationships
        const hierarchicalRels = this.data.relationships.filter(rel => 
            rel.type === 'hierarchical'
        );
        
        if (hierarchicalRels.length === 0) return;
        
        // Group by target (parent) to find tree roots
        const parentMap = new Map();
        hierarchicalRels.forEach(rel => {
            if (!parentMap.has(rel.targetId)) {
                parentMap.set(rel.targetId, []);
            }
            parentMap.get(rel.targetId).push(rel.sourceId);
        });
        
        // Find root nodes (parents without parents)
        const rootCandidates = Array.from(parentMap.keys());
        const roots = rootCandidates.filter(id => {
            // Check if this node is not a child in another relationship
            return !hierarchicalRels.some(rel => rel.sourceId === id);
        });
        
        if (roots.length > 0) {
            const hierarchies = roots.map(rootId => {
                const rootEntity = this.data.getEntityById(rootId);
                const childrenCount = parentMap.get(rootId)?.length || 0;
                
                return {
                    rootEntity,
                    childrenCount,
                    depth: this._calculateHierarchyDepth(rootId, parentMap)
                };
            });
            
            // Add hierarchy patterns that have sufficient depth and children
            hierarchies.forEach(hierarchy => {
                if (hierarchy.childrenCount >= 2 || hierarchy.depth >= 2) {
                    this.patterns.push({
                        type: 'hierarchy',
                        root: hierarchy.rootEntity,
                        childrenCount: hierarchy.childrenCount,
                        depth: hierarchy.depth,
                        description: `${hierarchy.rootEntity.name} is the root of a hierarchy with ${hierarchy.childrenCount} direct children and depth of ${hierarchy.depth}.`
                    });
                }
            });
        }
    }
    
    /**
     * Calculate the depth of a hierarchy starting from a root
     */
    _calculateHierarchyDepth(rootId, parentMap, visited = new Set()) {
        if (visited.has(rootId) || !parentMap.has(rootId)) {
            return 0;
        }
        
        visited.add(rootId);
        const children = parentMap.get(rootId) || [];
        
        if (children.length === 0) {
            return 1;
        }
        
        let maxChildDepth = 0;
        children.forEach(childId => {
            const childDepth = this._calculateHierarchyDepth(childId, parentMap, new Set(visited));
            maxChildDepth = Math.max(maxChildDepth, childDepth);
        });
        
        return 1 + maxChildDepth;
    }
    
    /**
     * Find hub patterns (entities with many connections)
     */
    _findHubPatterns() {
        // Count connections per entity
        const connectionCounts = {};
        
        this.data.relationships.forEach(rel => {
            if (!connectionCounts[rel.sourceId]) connectionCounts[rel.sourceId] = 0;
            if (!connectionCounts[rel.targetId]) connectionCounts[rel.targetId] = 0;
            connectionCounts[rel.sourceId]++;
            connectionCounts[rel.targetId]++;
        });
        
        // Find entities with significantly more connections than average
        if (Object.keys(connectionCounts).length > 0) {
            const counts = Object.values(connectionCounts);
            const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
            const threshold = Math.max(5, avg * 1.5); // At least 5 connections or 1.5x average
            
            // Find hubs
            const hubs = Object.entries(connectionCounts)
                .filter(([id, count]) => count >= threshold)
                .map(([id, count]) => ({ entity: this.data.getEntityById(id), count }))
                .sort((a, b) => b.count - a.count);
            
            // Add top hubs to patterns
            hubs.slice(0, 3).forEach(hub => {
                this.patterns.push({
                    type: 'hub',
                    entity: hub.entity,
                    connectionCount: hub.count,
                    description: `${hub.entity.name} is a hub with ${hub.count} connections.`
                });
            });
        }
    }
    
    /**
     * Find circular reference patterns
     */
    _findCircularPatterns() {
        // Simple cycle detection
        const visited = new Set();
        const cycles = [];
        
        const findCycles = (entityId, path = [], parentId = null) => {
            if (path.includes(entityId)) {
                // Found a cycle
                const cycleStart = path.indexOf(entityId);
                return path.slice(cycleStart);
            }
            
            if (visited.has(entityId)) {
                return null;
            }
            
            visited.add(entityId);
            path.push(entityId);
            
            // Get all connected entities
            const connections = this.data.relationships
                .filter(rel => rel.sourceId === entityId || rel.targetId === entityId)
                .map(rel => rel.sourceId === entityId ? rel.targetId : rel.sourceId)
                .filter(id => id !== parentId); // Don't go back to parent
                
            for (const nextId of connections) {
                const cycle = findCycles(nextId, [...path], entityId);
                if (cycle && cycle.length > 2) { // Min 3 nodes for interesting cycle
                    cycles.push(cycle);
                }
            }
            
            return null;
        };
        
        // Start from each entity
        for (const entity of this.data.entities) {
            if (!visited.has(entity.id)) {
                findCycles(entity.id);
            }
        }
        
        // Convert cycles to pattern objects
        cycles.slice(0, 3).forEach(cycle => {
            const cycleEntities = cycle.map(id => this.data.getEntityById(id));
            this.patterns.push({
                type: 'cycle',
                entities: cycleEntities,
                length: cycle.length,
                description: `Found a circular reference of ${cycle.length} entities.`
            });
        });
    }

    /**
     * Perform automatic layout based on analysis results
     * @param {ChartVisualization} chart - The chart visualization object
     */
    applyOptimalLayout(chart) {
        // If we have clusters, organize by clusters
        if (this.clusters.length > 0) {
            this._applyClusterLayout(chart);
        }
        // If we have hierarchies, use a hierarchical layout
        else if (this.patterns.some(p => p.type === 'hierarchy')) {
            chart.optimizeHierarchicalLayout();
        }
        // Otherwise apply a force-directed layout optimized for hubs
        else {
            this._applyForceLayout(chart);
        }
    }
    
    /**
     * Apply a layout that emphasizes clusters
     */
    _applyClusterLayout(chart) {
        const clusterCount = this.clusters.length;
        if (clusterCount === 0) return;
        
        const padding = 300; // Space between clusters
        
        // Position each cluster in a grid layout
        const cols = Math.ceil(Math.sqrt(clusterCount));
        const rows = Math.ceil(clusterCount / cols);
        
        this.clusters.forEach((cluster, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            const centerX = (col + 0.5) * chart.width / cols;
            const centerY = (row + 0.5) * chart.height / rows;
            
            // Place entities in a circle around the center
            const entityCount = cluster.entities.length;
            const radius = Math.min(150, 30 * Math.sqrt(entityCount));
            
            cluster.entities.forEach((entity, i) => {
                const angle = (i / entityCount) * 2 * Math.PI;
                const nodeId = entity.id;
                
                const node = chart.nodes.find(n => n.id === nodeId);
                if (node) {
                    node.x = centerX + radius * Math.cos(angle);
                    node.y = centerY + radius * Math.sin(angle);
                    
                    // Pin position temporarily
                    node.fx = node.x;
                    node.fy = node.y;
                    
                    // Release after some time
                    setTimeout(() => {
                        node.fx = null;
                        node.fy = null;
                    }, 2000);
                }
            });
        });
        
        // Restart the simulation with weaker forces
        chart.simulation.alpha(0.5).restart();
    }
    
    /**
     * Apply a force-directed layout optimized for the current graph patterns
     */
    _applyForceLayout(chart) {
        // Get hub entities
        const hubs = this.patterns
            .filter(p => p.type === 'hub')
            .map(p => p.entity.id);
        
        // Adjust forces based on detected patterns
        chart.simulation
            .force('charge', d3.forceManyBody()
                .strength(d => {
                    // Stronger repulsion for hubs
                    return hubs.includes(d.id) ? -700 : -300;
                })
            )
            .force('link', d3.forceLink().id(d => d.id)
                .distance(d => {
                    // Different distances for different relationship types
                    if (d.type === 'hierarchical') return 120;
                    if (hubs.includes(d.source.id) || hubs.includes(d.target.id)) return 180;
                    return 150;
                })
                .strength(d => d.strength || 0.3)
            );
        
        // Restart the simulation
        chart.simulation.alpha(1).restart();
    }
}

// Export the GraphAnalysis class
window.GraphAnalysis = GraphAnalysis;
