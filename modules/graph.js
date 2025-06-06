// Graph Visualization Module
// Handles graph rendering, layouts, interactions, and analysis using Cytoscape.js

let cy = null;
let graphData = { nodes: [], edges: [] };
let layouts = {};
let selectedElements = new Set();

export function initGraph() {
  console.log('Initializing graph module...');
  
  // Check if Cytoscape is loaded globally via script tag
  if (typeof cytoscape === 'undefined') {
    console.error('Cytoscape.js not loaded! Make sure it is included via script tag before initializing.');
    if (window.uxManager) {
      window.uxManager.showNotification(
        'Graph library not found. Please refresh the page or check the console for details.',
        'error',
        8000
      );
    }
    return;
  }

  // Set up graph container
  const container = document.getElementById('cy');
  if (!container) {
    console.warn('Graph container not found. The graph will be initialized when container becomes available.');
    return;
  }

  // Initialize Cytoscape instance with configuration - using global cytoscape object
  try {
    cy = cytoscape({
      container,
      style: getCytoscapeStyle(),
      layout: {
        name: 'grid', // Default simple layout
        fit: true,
        padding: 30
      },
      wheelSensitivity: 0.3,
      minZoom: 0.1,
      maxZoom: 5
    });
    
    // Store the instance globally for debugging and external access
    window.cy = cy;
    
    // Register event handlers
    registerGraphEventHandlers();
    
    // Register available layouts
    registerLayouts();
    
    // Set up context menu (if context menu extension is available)
    setupContextMenu();
    
    // Listen for data changes
    listenForDataChanges();
    
    console.log('Graph module initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Cytoscape:', error);
    if (window.uxManager) {
      window.uxManager.showNotification(
        `Error initializing graph: ${error.message}`,
        'error',
        8000
      );
    }
  }
}

function getCytoscapeStyle() {
  return [
    {
      selector: 'node',
      style: {
        'background-color': '#667eea',
        'label': 'data(name)',
        'color': '#333',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-background-color': 'white',
        'text-background-opacity': 0.7,
        'text-background-padding': '3px',
        'font-size': '10px',
        'width': 30,
        'height': 30,
        'border-width': 2,
        'border-color': '#fff',
        'border-opacity': 0.8,
        'text-wrap': 'ellipsis',
        'text-max-width': '80px'
      }
    },
    {
      selector: 'node[type]',
      style: {
        'background-color': ele => getTypeColor(ele.data('type'))
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 1.5,
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'opacity': 0.8,
        'label': 'data(label)',
        'font-size': '8px',
        'text-background-color': 'white',
        'text-background-opacity': 0.7,
        'text-background-padding': '2px',
        'text-rotation': 'autorotate'
      }
    },
    {
      selector: 'edge[weight]',
      style: {
        'width': ele => 1 + Math.min(5, (ele.data('weight') || 1) * 2),
        'opacity': ele => 0.6 + Math.min(0.4, (ele.data('weight') || 1) * 0.3)
      }
    },
    {
      selector: ':selected',
      style: {
        'background-color': '#f5576c',
        'border-width': 3,
        'border-color': '#f093fb',
        'line-color': '#f5576c',
        'target-arrow-color': '#f5576c',
        'opacity': 1
      }
    },
    {
      selector: '.highlighted',
      style: {
        'background-color': '#f093fb',
        'line-color': '#f093fb',
        'target-arrow-color': '#f093fb',
        'transition-property': 'background-color, line-color, target-arrow-color',
        'transition-duration': '0.5s',
        'z-index': 999
      }
    },
    {
      selector: '.search-highlighted',
      style: {
        'background-color': '#ffa600',
        'border-width': 4,
        'border-color': '#ff8c00',
        'transition-property': 'background-color, border-width, border-color',
        'transition-duration': '0.3s',
        'z-index': 998
      }
    }
  ];
}

function getTypeColor(type) {
  const typeColors = {
    'Person': '#4facfe',
    'Company': '#43e97b',
    'Bank': '#f093fb',
    'Asset': '#f5576c',
    'Agency': '#667eea',
    'Vehicle': '#ffa600',
    'Account': '#00f2fe',
    'Evidence': '#fa709a'
  };
  
  return typeColors[type] || '#667eea'; // Default color
}

function registerGraphEventHandlers() {
  if (!cy) return;
  
  // Node selection events
  cy.on('select', 'node', function(event) {
    const node = event.target;
    selectedElements.add(node.id());
    
    // Highlight connected edges
    node.connectedEdges().addClass('highlighted');
    
    // Show node details
    showNodeDetails(node.data());
    
    // Track user action
    if (window.uxManager) {
      window.uxManager.trackUserAction('node_selected', {
        nodeId: node.id(),
        nodeType: node.data('type') || 'unknown'
      });
    }
  });
  
  // Edge selection events
  cy.on('select', 'edge', function(event) {
    const edge = event.target;
    selectedElements.add(edge.id());
    
    // Show edge details
    showEdgeDetails(edge.data());
    
    // Track user action
    if (window.uxManager) {
      window.uxManager.trackUserAction('edge_selected', {
        edgeId: edge.id(),
        sourceId: edge.source().id(),
        targetId: edge.target().id()
      });
    }
  });
  
  // Unselection events
  cy.on('unselect', function(event) {
    const element = event.target;
    selectedElements.delete(element.id());
    
    if (element.isNode()) {
      // Remove highlighting from connected edges
      element.connectedEdges().removeClass('highlighted');
    }
    
    // If nothing selected, clear details
    if (cy.$(":selected").length === 0) {
      clearDetails();
    }
  });
  
  // Double-click to expand
  cy.on('dblclick', 'node', function(event) {
    const node = event.target;
    expandNode(node);
  });
  
  // Add hover effects if UX manager is available
  if (window.uxManager) {
    // Throttle the hover events to improve performance
    const throttledHover = window.uxManager.throttle((event) => {
      const element = event.target;
      element.style('border-width', '4');
      element.style('border-color', '#f093fb');
      
      if (element.isNode()) {
        // Show tooltip with basic info
        showQuickTooltip(element);
      }
    }, 100);
    
    const throttledHoverOut = window.uxManager.throttle((event) => {
      const element = event.target;
      if (!element.selected()) {
        element.style('border-width', '2');
        element.style('border-color', '#fff');
      }
      
      // Hide tooltip
      hideQuickTooltip();
    }, 100);
    
    cy.on('mouseover', 'node, edge', throttledHover);
    cy.on('mouseout', 'node, edge', throttledHoverOut);
  }
}

function registerLayouts() {
  layouts = {
    'grid': {
      name: 'grid',
      fit: true,
      padding: 30
    },
    'circle': {
      name: 'circle',
      fit: true,
      padding: 30
    },
    'concentric': {
      name: 'concentric',
      fit: true,
      padding: 30,
      minNodeSpacing: 50
    },
    'breadthfirst': {
      name: 'breadthfirst',
      fit: true,
      padding: 30,
      directed: true
    },
    'cose': {
      name: 'cose',
      fit: true,
      padding: 30,
      nodeOverlap: 20,
      idealEdgeLength: 100
    }
  };
  
  // Make layouts accessible to other modules
  window.graphLayouts = layouts;
}

function setupContextMenu() {
  // If using the cytoscape-context-menus extension, set it up here
  if (cy.contextMenus) {
    cy.contextMenus({
      menuItems: [
        {
          id: 'add-to-case',
          content: '<i class="fas fa-plus-circle"></i> Add to Case',
          selector: 'node',
          onClickFunction: function(event) {
            const node = event.target;
            const nodeData = node.data();
            
            // Dispatch event to case workspace
            window.dispatchEvent(new CustomEvent('graph:addToCase', {
              detail: {
                id: nodeData.id,
                name: nodeData.name || nodeData.id,
                type: nodeData.type || 'Unknown',
                source: 'graph_context_menu',
                ...nodeData
              }
            }));
            
            // Show success notification
            if (window.uxManager) {
              window.uxManager.showNotification(
                `Added "${nodeData.name || nodeData.id}" to case`,
                'success',
                3000
              );
            }
          }
        },
        {
          id: 'expand-node',
          content: '<i class="fas fa-expand-arrows-alt"></i> Expand Node',
          selector: 'node',
          onClickFunction: function(event) {
            const node = event.target;
            expandNode(node);
          }
        },
        {
          id: 'highlight-neighbors',
          content: '<i class="fas fa-link"></i> Highlight Connections',
          selector: 'node',
          onClickFunction: function(event) {
            const node = event.target;
            highlightNeighbors(node);
          }
        },
        {
          id: 'focus-node',
          content: '<i class="fas fa-crosshairs"></i> Focus Node',
          selector: 'node',
          onClickFunction: function(event) {
            const node = event.target;
            cy.center(node);
            cy.fit(node, 100);
          }
        },
        {
          id: 'hide-element',
          content: '<i class="fas fa-eye-slash"></i> Hide',
          selector: 'node, edge',
          onClickFunction: function(event) {
            const element = event.target;
            element.hide();
            
            if (window.uxManager) {
              window.uxManager.showNotification(
                'Element hidden. Refresh to restore.',
                'info',
                3000
              );
            }
          }
        },
        {
          id: 'node-info',
          content: '<i class="fas fa-info-circle"></i> Show Details',
          selector: 'node',
          onClickFunction: function(event) {
            const node = event.target;
            const nodeData = node.data();
            showNodeDetailsModal(nodeData);
          }
        }
      ]
    });
  } else {
    // Fallback: Basic right-click handling without context menu extension
    cy.on('cxttap', 'node', function(evt) {
      const node = evt.target;
      const nodeData = node.data();
      
      // Simple right-click action: add to case
      if (confirm(`Add "${nodeData.name || nodeData.id}" to case?`)) {
        window.dispatchEvent(new CustomEvent('graph:addToCase', {
          detail: {
            id: nodeData.id,
            name: nodeData.name || nodeData.id,
            type: nodeData.type || 'Unknown',
            source: 'graph_right_click',
            ...nodeData
          }
        }));
        
        if (window.uxManager) {
          window.uxManager.showNotification(
            `Added "${nodeData.name || nodeData.id}" to case`,
            'success',
            3000
          );
        }
      }
    });
  }
}

function listenForDataChanges() {
  // Listen for normalized data events
  window.addEventListener('data:normalized', (e) => {
    const data = e.detail;
    console.log('Graph: received normalized data', data);
    
    if (data && data.nodes && data.edges) {
      updateGraphData(data);
      renderGraph('cose'); // Use a nice default layout
      
      // Dispatch event for dashboard and other modules
      window.dispatchEvent(new CustomEvent('data:entitiesResolved', { detail: data }));
      
      if (window.uxManager) {
        window.uxManager.showNotification(
          `Graph loaded: ${data.nodes.length} entities, ${data.edges.length} relationships`,
          'success',
          4000
        );
      }
    }
  });
  
  // Listen for search results to highlight matching nodes
  window.addEventListener('search:results', (e) => {
    const results = e.detail;
    highlightSearchResults(results);
  });
  
  // Listen for search selection to focus on specific nodes
  window.addEventListener('search:selected', (e) => {
    const selectedNode = e.detail;
    focusOnNode(selectedNode.id);
  });
}

export function updateGraphData(data) {
  graphData = data;
  
  console.log('Updating graph data:', data);
  
  // Transform nodes to Cytoscape format
  graphData.nodes = graphData.nodes.map(node => ({
    data: {
      id: node.id || generateId(),
      label: node.name || node.label || node.id,
      name: node.name || node.id,
      type: node.type || 'entity',
      ...node
    }
  }));
  
  // Transform edges to Cytoscape format
  graphData.edges = graphData.edges.map(edge => ({
    data: {
      id: edge.id || `${edge.source}-${edge.target}-${generateId()}`,
      source: edge.source,
      target: edge.target,
      label: edge.label || edge.type || 'connected',
      ...edge
    }
  }));
  
  console.log('Transformed graph data:', graphData);
  return graphData;
}

export function renderGraph(layoutName = 'cose') {
  if (!cy) return;
  
  // Clear existing graph
  cy.elements().remove();
  
  // Add new elements
  cy.add([
    ...graphData.nodes,
    ...graphData.edges
  ]);
  
  // Apply layout
  applyLayout(layoutName);
  
  // Center and fit
  cy.center();
  cy.fit();
  
  // Notify that graph is rendered
  const event = new CustomEvent('graph:rendered', {
    detail: {
      nodeCount: graphData.nodes.length,
      edgeCount: graphData.edges.length
    }
  });
  window.dispatchEvent(event);
}

export function applyLayout(layoutName) {
  const layout = layouts[layoutName] || layouts['grid'];
  
  if (window.uxManager) {
    window.uxManager.showLoading(`Applying ${layoutName} layout...`, 'layout');
  }
  
  cy.layout(layout)
    .run();
  
  if (window.uxManager) {
    window.uxManager.hideLoading('layout');
  }
}

// Defensive stubs for details/expand functions if not defined elsewhere
function showNodeDetails(data) {
  if (window.uxManager && window.uxManager.showNodeDetails) {
    window.uxManager.showNodeDetails(data);
  } else {
    // No-op or simple log
    console.info('Node details:', data);
  }
}

function showEdgeDetails(data) {
  if (window.uxManager && window.uxManager.showEdgeDetails) {
    window.uxManager.showEdgeDetails(data);
  } else {
    console.info('Edge details:', data);
  }
}

function clearDetails() {
  if (window.uxManager && window.uxManager.clearDetails) {
    window.uxManager.clearDetails();
  } else {
    // No-op
  }
}

function expandNode(node) {
  if (window.uxManager && window.uxManager.expandNode) {
    window.uxManager.expandNode(node);
  } else {
    // No-op or log
    console.info('Expand node:', node.id());
  }
}

// Helper functions
function generateId() {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function highlightNeighbors(node) {
  // Reset previous highlights
  cy.elements().removeClass('highlighted');
  
  // Highlight the node, its neighbors, and connecting edges
  const neighborhood = node.neighborhood().add(node);
  neighborhood.addClass('highlighted');
  
  // Notify user
  if (window.uxManager) {
    window.uxManager.showNotification(
      `Highlighted ${neighborhood.nodes().length - 1} connected entities`,
      'info',
      3000
    );
  }
}

function showQuickTooltip(element) {
  // Implement quick tooltip (requires a tooltip library or custom implementation)
  // This is a placeholder for now
}

function hideQuickTooltip() {
  // Hide tooltip implementation
}

// Helper functions for search integration
function highlightSearchResults(results) {
  if (!cy) return;
  
  // Reset previous highlights
  cy.elements().removeClass('search-highlighted');
  
  if (!results || results.length === 0) {
    return;
  }
  
  // Highlight matching nodes
  results.forEach(result => {
    const nodeId = result.item ? result.item.id : result.id;
    const node = cy.getElementById(nodeId);
    if (node.length > 0) {
      node.addClass('search-highlighted');
    }
  });
  
  // Optionally, center and zoom to the first result
  const firstResult = results[0];
  if (firstResult && firstResult.item) {
    const nodeId = firstResult.item.id;
    const node = cy.getElementById(nodeId);
    if (node.length > 0) {
      cy.center(node);
      cy.fit(node, 100);
    }
  }
}

// Function to show detailed node information in a modal
function showNodeDetailsModal(nodeData) {
  // Create modal for displaying detailed node information
  const existingModal = document.getElementById('nodeDetailsModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'nodeDetailsModal';
  modal.setAttribute('tabindex', '-1');
  
  // Format the data for display
  const displayData = Object.entries(nodeData)
    .filter(([key, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      return `
        <tr>
          <th scope="row" style="width: 30%;">${formattedKey}</th>
          <td>${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</td>
        </tr>
      `;
    })
    .join('');
  
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fas fa-info-circle me-2"></i>
            Entity Details: ${nodeData.name || nodeData.id}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="row">
            <div class="col-md-8">
              <h6>Properties</h6>
              <div class="table-responsive">
                <table class="table table-sm table-striped">
                  <tbody>
                    ${displayData}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="col-md-4">
              <h6>Actions</h6>
              <div class="d-grid gap-2">
                <button class="btn btn-primary btn-sm" onclick="addNodeToCase('${nodeData.id}')">
                  <i class="fas fa-plus"></i> Add to Case
                </button>
                <button class="btn btn-info btn-sm" onclick="focusOnNode('${nodeData.id}')">
                  <i class="fas fa-crosshairs"></i> Focus in Graph
                </button>
                <button class="btn btn-warning btn-sm" onclick="highlightNodeNeighbors('${nodeData.id}')">
                  <i class="fas fa-link"></i> Highlight Connections
                </button>
              </div>
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
  const bootstrapModal = new bootstrap.Modal(modal);
  bootstrapModal.show();
  
  // Clean up when modal is hidden
  modal.addEventListener('hidden.bs.modal', () => {
    document.body.removeChild(modal);
  });
}

// Helper functions for modal actions
function addNodeToCase(nodeId) {
  const node = cy.getElementById(nodeId);
  if (node.length > 0) {
    const nodeData = node.data();
    window.dispatchEvent(new CustomEvent('graph:addToCase', {
      detail: {
        id: nodeData.id,
        name: nodeData.name || nodeData.id,
        type: nodeData.type || 'Unknown',
        source: 'details_modal',
        ...nodeData
      }
    }));
    
    if (window.uxManager) {
      window.uxManager.showNotification(
        `Added "${nodeData.name || nodeData.id}" to case`,
        'success',
        3000
      );
    }
  }
}

function focusOnNode(nodeId) {
  const node = cy.getElementById(nodeId);
  if (node.length > 0) {
    cy.center(node);
    cy.fit(node, 100);
    
    if (window.uxManager) {
      window.uxManager.showNotification(
        'Focused on entity',
        'info',
        2000
      );
    }
  }
}

function highlightNodeNeighbors(nodeId) {
  const node = cy.getElementById(nodeId);
  if (node.length > 0) {
    highlightNeighbors(node);
  }
}

// Make functions available globally for modal button clicks
if (typeof window !== 'undefined') {
  window.addNodeToCase = addNodeToCase;
  window.focusOnNode = focusOnNode;
  window.highlightNodeNeighbors = highlightNodeNeighbors;
}
