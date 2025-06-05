/**
 * View handling the timeline panel
 */
class TimelineView {
    /**
     * Initialize the timeline view
     */
    constructor() {
        this.timeline = document.querySelector('.timeline-content');
        this.placeholder = document.querySelector('.timeline-placeholder');
        
        // Set up timeline toggle
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
        
        // Listen for events to add to timeline
        eventBus.on('entity:added', (entity) => {
            if (entity.type === 'event') {
                this.addTimelineEvent(entity);
            }
        });
    }
    
    /**
     * Add an event to the timeline
     * @param {Entity} entity - Event entity to add
     */
    addTimelineEvent(entity) {
        // Hide placeholder
        this.placeholder.style.display = 'none';
        
        // Create timeline item
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.innerHTML = `
            <div class="timeline-item-date">${entity.properties.date || 'No date'}</div>
            <div class="timeline-item-content">
                <h6>${entity.label}</h6>
                <p>${entity.properties.description || 'No description'}</p>
            </div>
        `;
        
        // Add click event to select entity
        timelineItem.addEventListener('click', () => {
            eventBus.emit('entity:select', entity.id);
        });
        
        this.timeline.appendChild(timelineItem);
    }
    
    /**
     * Clear all events from the timeline
     */
    clearTimeline() {
        this.timeline.innerHTML = '';
        this.placeholder.style.display = 'block';
    }
    
    /**
     * Sort timeline events by date
     */
    sortEventsByDate() {
        const events = Array.from(this.timeline.querySelectorAll('.timeline-item'));
        events.sort((a, b) => {
            const dateA = new Date(a.querySelector('.timeline-item-date').textContent);
            const dateB = new Date(b.querySelector('.timeline-item-date').textContent);
            return dateA - dateB;
        });
        
        events.forEach(event => {
            this.timeline.appendChild(event);
        });
    }
}
