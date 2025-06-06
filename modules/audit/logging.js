/**
 * Comprehensive Audit Logging Module
 * Handles detailed audit logging with compliance features
 * Part of the comprehensive investigative analytics platform
 */

class AuditLogger {
    constructor() {
        this.auditLog = [];
        this.sessionId = this.generateSessionId();
        this.maxLogSize = 10000; // Maximum number of log entries
        this.retentionDays = 90; // Days to retain logs
        this.batchSize = 100; // Batch size for bulk operations
        
        this.eventCategories = {
            'DATA': ['data_upload', 'data_normalized', 'data_transformed', 'data_cleaned'],
            'SEARCH': ['search_executed', 'search_results', 'visual_query_built', 'query_executed'],
            'GRAPH': ['graph_layout_changed', 'graph_filter_applied', 'graph_analytics_executed', 'clustering_performed'],
            'CASE': ['case_created', 'case_entity_added', 'case_note_added', 'case_shared', 'case_exported'],
            'COLLABORATION': ['collaboration_invite_sent', 'collaboration_access_granted', 'collaboration_permissions_changed', 'collaboration_conflict_resolved'],
            'SESSION': ['session_created', 'session_saved', 'session_loaded', 'session_exported', 'session_imported'],
            'SECURITY': ['user_login', 'user_logout', 'authentication_failed', 'permission_denied'],
            'SYSTEM': ['system_error', 'system_warning', 'system_info'],
            'REPORT': ['report_generated', 'report_exported'],
            'ENTITY': ['entity_resolved', 'entity_merged', 'entity_deduplication'],
            'GEO': ['geocoding_performed', 'spatial_analysis_performed'],
            'NLP': ['nlp_entity_extraction', 'nlp_sentiment_analysis', 'nlp_pattern_detection']
        };
        
        this.init();
    }

    init() {
        this.loadAuditLog();
        this.setupPeriodicCleanup();
        console.log('✓ Audit logger initialized');
    }

    logEvent(eventType, eventData = {}, severity = 'INFO') {
        const logEntry = {
            id: this.generateLogId(),
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            eventType: eventType,
            category: this.getEventCategory(eventType),
            severity: severity,
            userId: this.getCurrentUserId(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            data: this.sanitizeData(eventData),
            metadata: {
                platform: 'LinkChart Analytics',
                version: '1.0',
                environment: this.getEnvironment()
            }
        };

        // Add to audit log
        this.auditLog.push(logEntry);
        
        // Maintain log size
        if (this.auditLog.length > this.maxLogSize) {
            this.auditLog = this.auditLog.slice(-this.maxLogSize);
        }
        
        // Auto-save periodically
        this.scheduleAutoSave();
        
        // Dispatch audit event for real-time monitoring
        this.dispatchAuditEvent(logEntry);
        
        return logEntry;
    }

    logUserAction(action, details = {}) {
        return this.logEvent(`user_${action}`, {
            action: action,
            ...details
        }, 'INFO');
    }

    logSecurityEvent(event, details = {}, severity = 'WARN') {
        return this.logEvent(event, {
            securityEvent: true,
            ...details
        }, severity);
    }

    logSystemEvent(event, details = {}, severity = 'INFO') {
        return this.logEvent(`system_${event}`, {
            systemEvent: true,
            ...details
        }, severity);
    }

    logError(error, context = {}) {
        return this.logEvent('system_error', {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context: context
        }, 'ERROR');
    }

    logPerformance(operation, duration, details = {}) {
        return this.logEvent('performance_metric', {
            operation: operation,
            duration: duration,
            performanceData: details
        }, 'INFO');
    }

    logDataAccess(resource, action, details = {}) {
        return this.logEvent('data_access', {
            resource: resource,
            action: action,
            dataAccess: true,
            ...details
        }, 'INFO');
    }

    // Data management
    async loadAuditLog() {
        try {
            const stored = localStorage.getItem('audit_log');
            if (stored) {
                const data = JSON.parse(stored);
                this.auditLog = Array.isArray(data) ? data : data.entries || [];
                
                // Clean old entries
                this.cleanOldEntries();
            }
        } catch (error) {
            console.warn('Failed to load audit log:', error);
            this.auditLog = [];
        }
    }

    async saveAuditLog() {
        try {
            const data = {
                entries: this.auditLog,
                metadata: {
                    savedAt: new Date().toISOString(),
                    sessionId: this.sessionId,
                    version: '1.0'
                }
            };
            
            localStorage.setItem('audit_log', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save audit log:', error);
            return false;
        }
    }

    async createBackup() {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                entries: this.auditLog,
                sessionId: this.sessionId
            };
            
            const backupKey = `audit_backup_${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify(backupData));
            
            // Manage backup retention
            this.manageBackups();
            
            return backupKey;
        } catch (error) {
            console.error('Failed to create audit backup:', error);
            return null;
        }
    }

    // Querying and filtering
    getFilteredLog(filters = {}) {
        let filteredLog = [...this.auditLog];
        
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filteredLog = filteredLog.filter(entry => new Date(entry.timestamp) >= startDate);
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            filteredLog = filteredLog.filter(entry => new Date(entry.timestamp) <= endDate);
        }
        
        if (filters.eventType) {
            filteredLog = filteredLog.filter(entry => entry.eventType === filters.eventType);
        }
        
        if (filters.category) {
            filteredLog = filteredLog.filter(entry => entry.category === filters.category);
        }
        
        if (filters.severity) {
            filteredLog = filteredLog.filter(entry => entry.severity === filters.severity);
        }
        
        if (filters.userId) {
            filteredLog = filteredLog.filter(entry => entry.userId === filters.userId);
        }
        
        if (filters.sessionId) {
            filteredLog = filteredLog.filter(entry => entry.sessionId === filters.sessionId);
        }
        
        return filteredLog;
    }

    async searchLog(query, filters = {}) {
        const searchTerms = query.toLowerCase().split(' ');
        let results = this.getFilteredLog(filters);
        
        results = results.filter(entry => {
            const searchableText = [
                entry.eventType,
                entry.category,
                entry.severity,
                JSON.stringify(entry.data),
                entry.userId
            ].join(' ').toLowerCase();
            
            return searchTerms.every(term => searchableText.includes(term));
        });
        
        return results;
    }

    // Statistics and reporting
    getStatistics() {
        const stats = {
            totalEntries: this.auditLog.length,
            dateRange: this.getDateRange(),
            eventTypes: this.getEventTypeStats(),
            categories: this.getCategoryStats(),
            severityDistribution: this.getSeverityStats(),
            userActivity: this.getUserActivityStats(),
            sessionActivity: this.getSessionStats(),
            errorRate: this.getErrorRate(),
            recentActivity: this.getRecentActivity()
        };
        
        return stats;
    }

    generateComplianceReport(startDate, endDate) {
        const filtered = this.getFilteredLog({ startDate, endDate });
        
        return {
            reportId: this.generateReportId(),
            generatedAt: new Date().toISOString(),
            period: { startDate, endDate },
            summary: {
                totalEvents: filtered.length,
                uniqueUsers: new Set(filtered.map(e => e.userId)).size,
                uniqueSessions: new Set(filtered.map(e => e.sessionId)).size,
                securityEvents: filtered.filter(e => e.category === 'SECURITY').length,
                dataAccess: filtered.filter(e => e.data.dataAccess).length,
                errors: filtered.filter(e => e.severity === 'ERROR').length
            },
            breakdown: {
                byCategory: this.groupBy(filtered, 'category'),
                bySeverity: this.groupBy(filtered, 'severity'),
                byUser: this.groupBy(filtered, 'userId'),
                byDay: this.groupByDay(filtered)
            },
            securityEvents: filtered.filter(e => e.category === 'SECURITY'),
            dataAccessEvents: filtered.filter(e => e.data.dataAccess),
            errors: filtered.filter(e => e.severity === 'ERROR')
        };
    }

    // Export functionality
    async exportLog(format = 'json', options = {}) {
        const data = options.filtered ? this.getFilteredLog(options.filters) : this.auditLog;
        
        switch (format.toLowerCase()) {
            case 'json':
                return this.exportAsJSON(data, options);
            case 'csv':
                return this.exportAsCSV(data, options);
            case 'xml':
                return this.exportAsXML(data, options);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    exportAsJSON(data, options) {
        const exportData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                totalEntries: data.length,
                platform: 'LinkChart Analytics',
                version: '1.0'
            },
            entries: data
        };
        
        return {
            data: JSON.stringify(exportData, null, 2),
            filename: `audit-log-${new Date().toISOString().split('T')[0]}.json`,
            mimeType: 'application/json'
        };
    }

    exportAsCSV(data, options) {
        const headers = ['Timestamp', 'Event Type', 'Category', 'Severity', 'User ID', 'Session ID', 'Data'];
        const rows = data.map(entry => [
            entry.timestamp,
            entry.eventType,
            entry.category,
            entry.severity,
            entry.userId,
            entry.sessionId,
            JSON.stringify(entry.data)
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        
        return {
            data: csvContent,
            filename: `audit-log-${new Date().toISOString().split('T')[0]}.csv`,
            mimeType: 'text/csv'
        };
    }

    exportAsXML(data, options) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<auditLog>\n';
        
        data.forEach(entry => {
            xml += '  <entry>\n';
            xml += `    <timestamp>${entry.timestamp}</timestamp>\n`;
            xml += `    <eventType>${entry.eventType}</eventType>\n`;
            xml += `    <category>${entry.category}</category>\n`;
            xml += `    <severity>${entry.severity}</severity>\n`;
            xml += `    <userId>${entry.userId}</userId>\n`;
            xml += `    <sessionId>${entry.sessionId}</sessionId>\n`;
            xml += `    <data><![CDATA[${JSON.stringify(entry.data)}]]></data>\n`;
            xml += '  </entry>\n';
        });
        
        xml += '</auditLog>';
        
        return {
            data: xml,
            filename: `audit-log-${new Date().toISOString().split('T')[0]}.xml`,
            mimeType: 'application/xml'
        };
    }

    // Utility methods
    getEventCategory(eventType) {
        for (const [category, events] of Object.entries(this.eventCategories)) {
            if (events.includes(eventType)) {
                return category;
            }
        }
        return 'OTHER';
    }

    sanitizeData(data) {
        // Remove sensitive information
        const sanitized = { ...data };
        
        // Remove common sensitive fields
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
        
        function cleanObject(obj) {
            if (typeof obj !== 'object' || obj === null) return obj;
            
            const cleaned = {};
            for (const [key, value] of Object.entries(obj)) {
                if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                    cleaned[key] = '[REDACTED]';
                } else if (typeof value === 'object') {
                    cleaned[key] = cleanObject(value);
                } else {
                    cleaned[key] = value;
                }
            }
            return cleaned;
        }
        
        return cleanObject(sanitized);
    }

    getCurrentUserId() {
        // In a real implementation, get from authentication system
        return 'anonymous_user';
    }

    getEnvironment() {
        return 'development'; // In practice, detect environment
    }

    generateSessionId() {
        return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    generateLogId() {
        return 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    generateReportId() {
        return 'report-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    dispatchAuditEvent(logEntry) {
        document.dispatchEvent(new CustomEvent('audit:logged', {
            detail: logEntry
        }));
    }

    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            this.saveAuditLog();
        }, 5000); // Save after 5 seconds of inactivity
    }

    setupPeriodicCleanup() {
        // Clean up old entries every hour
        setInterval(() => {
            this.cleanOldEntries();
        }, 3600000);
    }

    cleanOldEntries() {
        const cutoffDate = new Date(Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000));
        this.auditLog = this.auditLog.filter(entry => new Date(entry.timestamp) > cutoffDate);
    }

    manageBackups() {
        // Keep only last 10 backups
        const backupKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('audit_backup_'))
            .sort()
            .reverse();
        
        // Remove excess backups
        backupKeys.slice(10).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    // Statistics helpers
    getDateRange() {
        if (this.auditLog.length === 0) return null;
        
        const timestamps = this.auditLog.map(e => new Date(e.timestamp));
        return {
            earliest: new Date(Math.min(...timestamps)),
            latest: new Date(Math.max(...timestamps))
        };
    }

    getEventTypeStats() {
        return this.groupBy(this.auditLog, 'eventType');
    }

    getCategoryStats() {
        return this.groupBy(this.auditLog, 'category');
    }

    getSeverityStats() {
        return this.groupBy(this.auditLog, 'severity');
    }

    getUserActivityStats() {
        return this.groupBy(this.auditLog, 'userId');
    }

    getSessionStats() {
        return this.groupBy(this.auditLog, 'sessionId');
    }

    getErrorRate() {
        const totalEvents = this.auditLog.length;
        const errorEvents = this.auditLog.filter(e => e.severity === 'ERROR').length;
        return totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;
    }

    getRecentActivity(hours = 24) {
        const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
        return this.auditLog.filter(entry => new Date(entry.timestamp) > cutoff);
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = (groups[group] || 0) + 1;
            return groups;
        }, {});
    }

    groupByDay(array) {
        return array.reduce((groups, item) => {
            const day = item.timestamp.split('T')[0];
            groups[day] = (groups[day] || 0) + 1;
            return groups;
        }, {});
    }
}

// Legacy function exports for compatibility
export function logAudit(eventType, eventData) {
    if (window.auditLogger) {
        return window.auditLogger.logEvent(eventType, eventData);
    }
}

export function logUserAction(action, details) {
    if (window.auditLogger) {
        return window.auditLogger.logUserAction(action, details);
    }
}

// Export class
export { AuditLogger };
