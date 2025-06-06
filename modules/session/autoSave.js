/**
 * Session Auto-Save Module
 * Handles automatic session state persistence
 * Part of the comprehensive investigative analytics platform
 */

class AutoSaveManager {
    constructor() {
        this.isEnabled = true;
        this.interval = 30000; // 30 seconds default
        this.intervalId = null;
        this.lastSaveTime = null;
        this.isDirty = false;
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.callbacks = {
            onSave: [],
            onError: [],
            onStateChange: []
        };
        
        // Track what needs saving
        this.dirtyModules = new Set();
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.startAutoSave();
        console.log('✓ Auto-save manager initialized');
    }

    bindEvents() {
        // Listen for data changes
        document.addEventListener('dataChanged', (event) => {
            this.markDirty(event.detail?.module || 'unknown');
        });

        // Listen for user activity
        ['click', 'keypress', 'change'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                this.updateLastActivity();
            });
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.forceSave();
            }
        });

        // Handle before unload
        window.addEventListener('beforeunload', () => {
            this.forceSave();
        });
    }

    markDirty(module = 'unknown') {
        this.isDirty = true;
        this.dirtyModules.add(module);
        this.notifyStateChange();
    }

    markClean() {
        this.isDirty = false;
        this.dirtyModules.clear();
        this.lastSaveTime = new Date();
        this.notifyStateChange();
    }

    updateLastActivity() {
        if (window.sessionManager) {
            window.sessionManager.updateActivity();
        }
    }

    startAutoSave() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        if (this.isEnabled) {
            this.intervalId = setInterval(() => {
                this.performAutoSave();
            }, this.interval);
        }
    }

    stopAutoSave() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async performAutoSave() {
        if (!this.isDirty || !window.sessionManager) {
            return;
        }

        try {
            await this.saveWithRetry();
            this.notifyCallbacks('onSave', {
                timestamp: new Date(),
                modules: Array.from(this.dirtyModules)
            });
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.notifyCallbacks('onError', error);
        }
    }

    async saveWithRetry(attempt = 1) {
        try {
            await window.sessionManager.saveSession();
            this.markClean();
            return true;
        } catch (error) {
            if (attempt < this.maxRetries) {
                await this.delay(this.retryDelay * attempt);
                return this.saveWithRetry(attempt + 1);
            }
            throw error;
        }
    }

    async forceSave() {
        if (!this.isDirty || !window.sessionManager) {
            return;
        }

        try {
            await window.sessionManager.saveSession();
            this.markClean();
            return true;
        } catch (error) {
            console.error('Force save failed:', error);
            return false;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Configuration methods
    setInterval(milliseconds) {
        this.interval = Math.max(5000, milliseconds); // Minimum 5 seconds
        if (this.isEnabled) {
            this.startAutoSave();
        }
    }

    enable() {
        this.isEnabled = true;
        this.startAutoSave();
        this.notifyStateChange();
    }

    disable() {
        this.isEnabled = false;
        this.stopAutoSave();
        this.notifyStateChange();
    }

    // Callback management
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }

    notifyCallbacks(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Auto-save callback error (${event}):`, error);
                }
            });
        }
    }

    notifyStateChange() {
        this.notifyCallbacks('onStateChange', {
            isDirty: this.isDirty,
            isEnabled: this.isEnabled,
            lastSaveTime: this.lastSaveTime,
            dirtyModules: Array.from(this.dirtyModules)
        });
    }

    // Status methods
    getStatus() {
        return {
            enabled: this.isEnabled,
            interval: this.interval,
            isDirty: this.isDirty,
            lastSaveTime: this.lastSaveTime,
            dirtyModules: Array.from(this.dirtyModules),
            timeSinceLastSave: this.lastSaveTime ? Date.now() - this.lastSaveTime.getTime() : null
        };
    }

    getDirtyModules() {
        return Array.from(this.dirtyModules);
    }

    getTimeSinceLastSave() {
        if (!this.lastSaveTime) return null;
        return Date.now() - this.lastSaveTime.getTime();
    }

    // Utility methods for UI indicators
    formatLastSaveTime() {
        if (!this.lastSaveTime) return 'Never';
        
        const now = new Date();
        const diff = now - this.lastSaveTime;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        return this.lastSaveTime.toLocaleDateString();
    }

    createStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        indicator.innerHTML = `
            <div class="auto-save-status">
                <span class="status-icon ${this.isDirty ? 'dirty' : 'clean'}"></span>
                <span class="status-text">${this.isDirty ? 'Unsaved changes' : 'All changes saved'}</span>
                <span class="last-save">${this.formatLastSaveTime()}</span>
            </div>
        `;
        
        // Update indicator when state changes
        this.on('onStateChange', () => {
            const icon = indicator.querySelector('.status-icon');
            const text = indicator.querySelector('.status-text');
            const lastSave = indicator.querySelector('.last-save');
            
            icon.className = `status-icon ${this.isDirty ? 'dirty' : 'clean'}`;
            text.textContent = this.isDirty ? 'Unsaved changes' : 'All changes saved';
            lastSave.textContent = this.formatLastSaveTime();
        });
        
        return indicator;
    }

    // Cleanup
    destroy() {
        this.stopAutoSave();
        
        // Remove event listeners (simplified - in practice you'd track them)
        document.removeEventListener('dataChanged', this.boundDataChangeHandler);
        
        // Clear callbacks
        Object.keys(this.callbacks).forEach(event => {
            this.callbacks[event] = [];
        });
        
        console.log('✓ Auto-save manager destroyed');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoSaveManager;
} else if (typeof window !== 'undefined') {
    window.AutoSaveManager = AutoSaveManager;
}
