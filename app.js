// LinkChart JS - Investigation Tool
// Main application JavaScript

// Initialize the application when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the graph
    initializeGraph();
    
    // Set up event handlers
    setupEventHandlers();
    
    // Set up drag and drop functionality
    setupDragAndDrop();
    
    // Initialize the timeline panel toggle
    initTimelineToggle();
});

// Global variables
let cy; // Cytoscape instance
let selectedNode = null;

// Initialize the graph visualization
function initializeGraph() {
    cy = cytoscape({
        container: document.getElementById('graph-container'),
        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'text-valign': 'center',
                    'color': '#fff',
                    'background-color': 'data(color)',
                    'text-outline-width': 2,
                    'text-outline-color': 'data(color)',
                    'width': 40,
                    'height': 40
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#999',
                    'curve-style': 'bezier',
                    'label': 'data(label)',
                    'text-rotation': 'autorotate',
                    'text-margin-y': -10,
                    'text-background-color': 'white',
                    'text-background-opacity': 1,
                    'text-background-padding': '3px'
                }
            },
            {
                selector: ':selected',
                style: {
                    'border-width': 3,
                    'border-color': '#3498db'
                }
            }
        ],
        layout: {
            name: 'grid',
        },
        // For now start with empty graph
        elements: {
            nodes: [],
            edges: []
        }
    });
    
    // Hide placeholder message when graph has elements
    cy.on('add', 'node', function() {
        const placeholder = document.querySelector('.placeholder-message');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    });
    
    // Handle element selection
    cy.on('select', 'node', function(event) {
        selectedNode = event.target;
        showEntityDetails(selectedNode.data());
    });
    
    cy.on('unselect', function() {
        selectedNode = null;
        hideEntityDetails();
    });
}

// Set up event handlers for the UI
function setupEventHandlers() {
    // Add event listener for toolbar buttons
    document.querySelectorAll('.toolbar .btn').forEach(button => {
        button.addEventListener('click', function() {
            const action = this.textContent.trim();
            console.log(`Toolbar action: ${action}`);
            // Implement toolbar actions here
        });
    });
}

// Set up drag and drop functionality for entities
function setupDragAndDrop() {
    const entityItems = document.querySelectorAll('.entity-item[draggable="true"]');
    const graphContainer = document.getElementById('graph-container');
    
    entityItems.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.dataset.type);
        });
    });
    
    graphContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    graphContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        const entityType = e.dataTransfer.getData('text/plain');
        
        // Calculate position based on drop point relative to container
        const containerRect = graphContainer.getBoundingClientRect();
        const position = {
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top
        };
        
        // Add a node to the graph at this position
        addEntityToGraph(entityType, position);
    });
}

// Add an entity to the graph
function addEntityToGraph(type, position) {
    // Define colors and icons for each entity type
    const entityStyles = {
        person: { color: '#e74c3c', icon: 'fa-user' },
        organization: { color: '#2ecc71', icon: 'fa-building' },
        location: { color: '#3498db', icon: 'fa-map-marker-alt' },
        event: { color: '#9b59b6', icon: 'fa-calendar-alt' },
        document: { color: '#f1c40f', icon: 'fa-file-alt' },
        vehicle: { color: '#e67e22', icon: 'fa-car' },
        phone: { color: '#1abc9c', icon: 'fa-phone' },
        email: { color: '#34495e', icon: 'fa-envelope' }
    };
    
    // Generate unique ID
    const id = 'n' + Date.now();
    
    // Add the node
    cy.add({
        group: 'nodes',
        data: {
            id: id,
            label: type.charAt(0).toUpperCase() + type.slice(1),
            type: type,
            color: entityStyles[type].color,
            icon: entityStyles[type].icon,
            properties: {}
        },
        position: position
    });
    
    // Select the newly added node
    cy.getElementById(id).select();
}

// Show entity details in the right sidebar
function showEntityDetails(data) {
    document.querySelector('.no-selection-message').style.display = 'none';
    const detailsForm = document.querySelector('.details-form');
    detailsForm.style.display = 'block';
    
    document.getElementById('entity-type').value = data.type;
    document.getElementById('entity-name').value = data.label;
    
    // Add event listeners to update the node data when inputs change
    document.getElementById('entity-name').onchange = function() {
        updateSelectedNodeData('label', this.value);
    };
}

// Hide entity details
function hideEntityDetails() {
    document.querySelector('.no-selection-message').style.display = 'block';
    document.querySelector('.details-form').style.display = 'none';
}

// Update selected node data
function updateSelectedNodeData(field, value) {
    if (selectedNode) {
        selectedNode.data(field, value);
    }
}

// Initialize timeline panel toggle
function initTimelineToggle() {
    const toggleBtn = document.querySelector('.toggle-panel');
    const timelinePanel = document.querySelector('.timeline-panel');
    const timelineContent = document.querySelector('.timeline-content');
    const icon = toggleBtn.querySelector('i');
    
    toggleBtn.addEventListener('click', function() {
        if (timelineContent.style.display === 'none') {
            timelineContent.style.display = 'block';
            timelinePanel.style.height = '180px';
            icon.className = 'fas fa-chevron-up';
        } else {
            timelineContent.style.display = 'none';
            timelinePanel.style.height = '40px';
            icon.className = 'fas fa-chevron-down';
        }
    });
}
