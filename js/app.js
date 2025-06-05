/**
 * Main application entry point
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize views
    const graphView = new GraphView('graph-container');
    const entityDetails = new EntityDetailsComponent();
    const sidebarView = new SidebarView();
    const timelineView = new TimelineView();
    
    // Initialize controllers
    const graphController = new GraphController(graphView);
    const entityController = new EntityController(graphController);
    const uiController = new UIController(graphController);
    
    // The UniversalViewerController is auto-initialized
    
    // Initialize drag and drop
    const dragAndDrop = new DragAndDropHandler(graphController);
    
    // Initialize toolbar
    const toolbar = new ToolbarComponent();
    
    // Add button to toggle Universal Viewer
    addUniversalViewerToggle();
    
    // Set up drag and drop link mode
    eventBus.on('dragdrop:enableLinkMode', (linkType) => {
        dragAndDrop.enableLinkMode(linkType);
    });
    
    eventBus.on('dragdrop:cancelLinkMode', () => {
        dragAndDrop.disableLinkMode();
    });
    
    // Add CSS for import preview
    const style = document.createElement('style');
    style.textContent = `
        .preview-container {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #dee2e6;
            border-radius: 0.25rem;
            padding: 0.5rem;
        }
        .form-label {
            font-weight: 500;
            margin-bottom: 0.25rem;
        }
    `;
    document.head.appendChild(style);
    
    console.log('LinkChart JS application initialized');
    
    /**
     * Add Universal Viewer toggle button to toolbar
     */
    function addUniversalViewerToggle() {
        const toolbar = document.querySelector('.toolbar');
        const divider = document.createElement('div');
        divider.className = 'divider';
        toolbar.appendChild(divider);
        
        const uvButton = document.createElement('button');
        uvButton.className = 'btn btn-outline-light';
        uvButton.innerHTML = '<i class="fas fa-table"></i> Universal Viewer';
        uvButton.addEventListener('click', toggleUniversalViewer);
        toolbar.appendChild(uvButton);
    }
    
    /**
     * Toggle Universal Viewer visibility
     */
    function toggleUniversalViewer() {
        const uvContainer = document.getElementById('universal-viewer-container');
        const mainContent = document.querySelector('.main-content');
        
        if (uvContainer.style.display === 'none') {
            uvContainer.style.display = 'block';
            mainContent.style.display = 'none';
        } else {
            uvContainer.style.display = 'none';
            mainContent.style.display = 'flex';
        }
    }
});

/**
 * Load saved settings from localStorage
 */
function loadSavedSettings() {
    const savedSettings = localStorage.getItem('linkchartSettings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            eventBus.emit('settings:change', settings);
        } catch (error) {
            console.error('Error loading saved settings:', error);
        }
    }
}
