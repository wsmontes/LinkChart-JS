/**
 * Simple event bus for application-wide communication
 */
class EventBus {
    constructor() {
        this.listeners = {};
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {function} callback - Callback function to remove
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    
    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {any} data - Data to pass to event listeners
     */
    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => {
            callback(data);
        });
    }
}

// Create a singleton instance
const eventBus = new EventBus();
