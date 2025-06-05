/**
 * View handling sidebar interactions
 */
class SidebarView {
    /**
     * Initialize the sidebar view
     */
    constructor() {
        this.entityList = document.querySelector('.entity-list');
        this.linkList = document.querySelector('.link-list');
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Handle entity selection from the entity list
        this.entityList.querySelectorAll('.entity-item[draggable="true"]').forEach(item => {
            item.addEventListener('click', (e) => {
                // Prevent click from interfering with drag
                if (!e.target.dragging) {
                    const entityType = item.dataset.type;
                    eventBus.emit('sidebar:entityTypeSelected', entityType);
                }
            });
        });
        
        // Handle link type selection
        this.linkList.querySelectorAll('.entity-item').forEach(item => {
            item.addEventListener('click', () => {
                const linkType = item.dataset.link;
                
                // Remove active class from all items
                this.linkList.querySelectorAll('.entity-item').forEach(i => 
                    i.classList.remove('active')
                );
                
                // Add active class to selected item
                item.classList.add('active');
                
                // Emit event for link mode
                eventBus.emit('sidebar:linkTypeSelected', linkType);
            });
        });
        
        // Listen for entity addition events to update counts if needed
        eventBus.on('entity:added', (entity) => {
            this.updateEntityCounts(entity.type);
        });
    }
    
    /**
     * Update entity type counts in the sidebar (optional)
     * @param {string} entityType - Type of entity that was added
     */
    updateEntityCounts(entityType) {
        // This could be implemented to show counts next to entity types
        // For example: "Person (5)", "Organization (3)", etc.
        
        // For now, this is a placeholder for future implementation
    }
    
    /**
     * Add an entity type to the sidebar
     * @param {string} type - Entity type
     * @param {string} label - Display label
     * @param {string} icon - FontAwesome icon class
     */
    addEntityType(type, label, icon) {
        const item = document.createElement('div');
        item.className = 'entity-item';
        item.draggable = true;
        item.dataset.type = type;
        
        item.innerHTML = `<i class="fas ${icon}"></i> ${label}`;
        
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', type);
            item.dragging = true;
        });
        
        item.addEventListener('dragend', () => {
            item.dragging = false;
        });
        
        item.addEventListener('click', (e) => {
            if (!e.target.dragging) {
                eventBus.emit('sidebar:entityTypeSelected', type);
            }
        });
        
        this.entityList.appendChild(item);
    }
}
