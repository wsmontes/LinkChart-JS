// modules/ux.js: User Experience Enhancement Module
// Provides notifications, loading states, progress tracking, and interactive feedback

class UXManager {
    constructor() {
        this.notifications = [];
        this.loadingStates = new Set();
        this.progressOperations = new Map();
        this.init();
    }

    init() {
        this.setupKeyboardShortcuts();
        this.setupTooltips();
        this.setupAnimations();
        this.setupAccessibility();
        console.log('UX Manager initialized');
    }

    // Notification System
    showNotification(message, type = 'info', duration = 5000, options = {}) {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const notification = {
            id,
            message,
            type,
            duration,
            timestamp: new Date(),
            ...options
        };

        this.notifications.push(notification);
        this.renderNotification(notification);

        if (duration > 0) {
            setTimeout(() => this.hideNotification(id), duration);
        }

        return id;
    }

    renderNotification(notification) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notificationEl = document.createElement('div');
        notificationEl.id = notification.id;
        notificationEl.className = `notification ${notification.type} show`;
        notificationEl.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center mb-1">
                        <i class="fas ${this.getNotificationIcon(notification.type)} me-2"></i>
                        <strong>${this.getNotificationTitle(notification.type)}</strong>
                        ${notification.timestamp ? `<small class="ms-auto text-muted">${this.formatTime(notification.timestamp)}</small>` : ''}
                    </div>
                    <div class="notification-content">${notification.message}</div>
                    ${notification.actions ? this.renderNotificationActions(notification.actions) : ''}
                </div>
                <button class="btn-close btn-sm ms-2" onclick="uxManager.hideNotification('${notification.id}')"></button>
            </div>
        `;

        container.appendChild(notificationEl);

        // Add animation
        setTimeout(() => notificationEl.classList.add('show'), 10);
    }

    hideNotification(id) {
        const notificationEl = document.getElementById(id);
        if (notificationEl) {
            notificationEl.classList.remove('show');
            setTimeout(() => {
                notificationEl.remove();
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, 300);
        }
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    getNotificationTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || titles.info;
    }

    renderNotificationActions(actions) {
        return `
            <div class="notification-actions mt-2">
                ${actions.map(action => `
                    <button class="btn btn-sm ${action.class || 'btn-outline-primary'}" 
                            onclick="${action.onclick}">${action.label}</button>
                `).join('')}
            </div>
        `;
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Loading States
    showLoading(message = 'Processing...', id = 'default') {
        this.loadingStates.add(id);
        const overlay = document.getElementById('loading-overlay');
        const messageEl = document.getElementById('loading-message');
        
        if (overlay && messageEl) {
            messageEl.textContent = message;
            overlay.classList.remove('d-none');
        }
    }

    hideLoading(id = 'default') {
        this.loadingStates.delete(id);
        
        if (this.loadingStates.size === 0) {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.classList.add('d-none');
            }
        }
    }

    // Progress Tracking
    showProgress(operationId, message = 'Processing...') {
        const container = document.getElementById('progress-container');
        const progressBar = container?.querySelector('.progress-bar');
        
        if (container && progressBar) {
            container.classList.remove('d-none');
            progressBar.style.width = '0%';
            this.progressOperations.set(operationId, { message, progress: 0 });
        }
    }

    updateProgress(operationId, progress, message) {
        const container = document.getElementById('progress-container');
        const progressBar = container?.querySelector('.progress-bar');
        
        if (container && progressBar && this.progressOperations.has(operationId)) {
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
            
            if (message) {
                this.progressOperations.set(operationId, { 
                    ...this.progressOperations.get(operationId), 
                    message, 
                    progress 
                });
            }
        }
    }

    hideProgress(operationId) {
        this.progressOperations.delete(operationId);
        
        if (this.progressOperations.size === 0) {
            const container = document.getElementById('progress-container');
            if (container) {
                setTimeout(() => container.classList.add('d-none'), 500);
            }
        }
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S - Save case
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.triggerSaveCase();
            }
            
            // Ctrl/Cmd + O - Open case
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                this.triggerLoadCase();
            }
            
            // Ctrl/Cmd + F - Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.focusSearch();
            }
            
            // Escape - Clear selection
            if (e.key === 'Escape') {
                this.clearSelection();
            }
            
            // ? - Show help
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                this.showHelp();
            }
        });
    }

    triggerSaveCase() {
        const saveButton = document.getElementById('saveCase');
        if (saveButton && !saveButton.disabled) {
            saveButton.click();
            this.showNotification('Case saved successfully', 'success', 3000);
        }
    }

    triggerLoadCase() {
        const loadButton = document.getElementById('loadCase');
        if (loadButton && !loadButton.disabled) {
            loadButton.click();
        }
    }

    focusSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    clearSelection() {
        if (window.cy) {
            window.cy.elements().unselect();
            this.showNotification('Selection cleared', 'info', 2000);
        }
    }

    showHelp() {
        const helpModal = new bootstrap.Modal(document.getElementById('helpModal'));
        helpModal.show();
    }

    // Tooltips
    setupTooltips() {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    // Animations
    setupAnimations() {
        // Add intersection observer for fade-in animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                }
            });
        }, { threshold: 0.1 });

        // Observe all cards for animation
        document.querySelectorAll('.card').forEach(card => {
            observer.observe(card);
        });
    }

    // Accessibility
    setupAccessibility() {
        // Add ARIA labels and roles
        this.enhanceAccessibility();
        
        // Focus management for modals
        document.addEventListener('shown.bs.modal', (e) => {
            const modal = e.target;
            const firstInput = modal.querySelector('input, button, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        });
    }

    enhanceAccessibility() {
        // Add ARIA labels to interactive elements
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.setAttribute('aria-label', 'Search entities and relationships');
        }

        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.setAttribute('aria-label', 'Upload data file (CSV or JSON)');
        }

        // Add keyboard navigation to list items
        document.querySelectorAll('#caseList li').forEach((item, index) => {
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'button');
            item.setAttribute('aria-label', `Case ${index + 1}`);
            
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }

    // UI State Management
    setButtonState(buttonId, state) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        switch (state) {
            case 'loading':
                button.disabled = true;
                button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${button.dataset.loadingText || 'Loading...'}`;
                break;
            case 'success':
                button.classList.add('btn-success');
                button.innerHTML = `<i class="fas fa-check me-2"></i>${button.dataset.successText || 'Success'}`;
                setTimeout(() => this.resetButtonState(buttonId), 2000);
                break;
            case 'error':
                button.classList.add('btn-danger');
                button.innerHTML = `<i class="fas fa-times me-2"></i>${button.dataset.errorText || 'Error'}`;
                setTimeout(() => this.resetButtonState(buttonId), 3000);
                break;
            default:
                this.resetButtonState(buttonId);
        }
    }

    resetButtonState(buttonId) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        button.disabled = false;
        button.className = button.dataset.originalClass || button.className.replace(/btn-\w+/, 'btn-primary');
        button.innerHTML = button.dataset.originalText || button.textContent;
    }

    // Utility Methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Analytics and User Tracking
    trackUserAction(action, details = {}) {
        const event = {
            action,
            details,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            userAgent: navigator.userAgent
        };
        
        // Log to audit system if available
        if (window.auditLogger) {
            window.auditLogger.logEvent(
                'user_interaction',
                {
                    message: `User performed action: ${action}`,
                    details,
                    event
                },
                'info'
            );
        }
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    // Performance Monitoring
    measurePerformance(operationName, fn) {
        const startTime = performance.now();
        const result = fn();
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.trackUserAction('performance_measurement', {
            operation: operationName,
            duration: duration,
            timestamp: new Date().toISOString()
        });

        if (duration > 1000) {
            this.showNotification(
                `Operation "${operationName}" took ${Math.round(duration)}ms`,
                'warning',
                3000
            );
        }

        return result;
    }
}

// Initialize UX Manager
const uxManager = new UXManager();

// Make it globally available
window.uxManager = uxManager;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UXManager;
}
