/**
 * Controller coordinating UI interactions across components
 */
class UIController {
    /**
     * Initialize the UI controller
     * @param {GraphController} graphController - The graph controller instance
     */
    constructor(graphController) {
        this.graphController = graphController;
        this.currentTheme = 'light';
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Handle UI setting changes
        eventBus.on('settings:open', () => {
            this.openSettingsModal();
        });
        
        eventBus.on('settings:change', (data) => {
            this.applySettings(data);
        });
        
        // Listen for theme toggle
        eventBus.on('settings:toggleTheme', () => {
            this.toggleTheme();
        });
        
        // Handle UI mode changes
        eventBus.on('sidebar:linkTypeSelected', (linkType) => {
            this.setLinkMode(linkType);
        });
        
        // Listen for keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcut(e);
        });
    }
    
    /**
     * Open settings modal dialog
     */
    openSettingsModal() {
        // Create modal for settings
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'settingsModal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Settings</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Theme</label>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="themeToggle">
                                <label class="form-check-label" for="themeToggle">Dark Mode</label>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Graph Settings</label>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="edgeLabelToggle" checked>
                                <label class="form-check-label" for="edgeLabelToggle">Show Edge Labels</label>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Node Size</label>
                            <input type="range" class="form-range" id="nodeSizeRange" min="20" max="80" step="5" value="40">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="applySettingsBtn">Apply</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize the modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        // Set initial values
        document.getElementById('themeToggle').checked = this.currentTheme === 'dark';
        
        // Add event listeners
        document.getElementById('applySettingsBtn').addEventListener('click', () => {
            const settings = {
                theme: document.getElementById('themeToggle').checked ? 'dark' : 'light',
                showEdgeLabels: document.getElementById('edgeLabelToggle').checked,
                nodeSize: document.getElementById('nodeSizeRange').value
            };
            
            this.applySettings(settings);
            modalInstance.hide();
        });
        
        // Remove modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }
    
    /**
     * Apply settings
     * @param {Object} settings - Settings object
     */
    applySettings(settings) {
        // Apply theme
        if (settings.theme) {
            this.currentTheme = settings.theme;
            this.applyTheme(settings.theme);
        }
        
        // Apply graph settings
        if (settings.showEdgeLabels !== undefined) {
            this.graphController.graphView.toggleEdgeLabels(settings.showEdgeLabels);
        }
        
        if (settings.nodeSize) {
            this.graphController.graphView.setNodeSize(parseInt(settings.nodeSize));
        }
        
        // Save settings to localStorage
        localStorage.setItem('linkchartSettings', JSON.stringify(settings));
    }
    
    /**
     * Apply theme
     * @param {string} theme - 'light' or 'dark'
     */
    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
    
    /**
     * Toggle theme between light and dark
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
    }
    
    /**
     * Set link mode for drag and drop
     * @param {string} linkType - Link type to create
     */
    setLinkMode(linkType) {
        eventBus.emit('dragdrop:enableLinkMode', linkType);
    }
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcut(e) {
        // Delete selected elements
        if ((e.key === 'Delete' || e.key === 'Backspace') && 
            !e.target.matches('input, textarea')) {
            const selected = this.graphController.graphView.getSelected();
            if (selected) {
                if (selected.isNode()) {
                    this.graphController.removeEntity(selected.id());
                } else if (selected.isEdge()) {
                    this.graphController.removeLink(selected.id());
                }
            }
        }
        
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            eventBus.emit('investigation:save');
        }
        
        // Ctrl+O to open
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            eventBus.emit('investigation:open');
        }
        
        // Ctrl+N for new investigation
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            eventBus.emit('investigation:new');
        }
        
        // Escape to cancel link mode
        if (e.key === 'Escape') {
            eventBus.emit('dragdrop:cancelLinkMode');
        }
    }
}
