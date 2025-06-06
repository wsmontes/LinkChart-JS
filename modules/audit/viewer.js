/**
 * Comprehensive Audit Viewer Module
 * Provides advanced UI for viewing, filtering, searching, and exporting audit logs
 * Part of the comprehensive investigative analytics platform
 */

class AuditViewer {
    constructor() {
        this.currentFilters = {};
        this.sortBy = 'timestamp';
        this.sortOrder = 'desc';
        this.pageSize = 50;
        this.currentPage = 1;
        this.searchQuery = '';
        this.selectedEntries = new Set();
        
        this.init();
    }

    init() {
        this.createViewerUI();
        this.setupEventListeners();
        console.log('✓ Audit viewer initialized');
    }

    createViewerUI() {
        // Create audit viewer modal structure
        const modal = document.createElement('div');
        modal.id = 'auditViewerModal';
        modal.className = 'modal audit-viewer-modal';
        modal.innerHTML = `
            <div class="modal-content audit-viewer-content">
                <div class="modal-header">
                    <h2><i class="fas fa-clipboard-list"></i> Audit Log Viewer</h2>
                    <button class="modal-close" onclick="this.closest('.modal').style.display='none'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="audit-viewer-toolbar">
                    <div class="search-section">
                        <input type="text" id="auditSearch" placeholder="Search audit logs..." class="search-input">
                        <button id="auditSearchBtn" class="btn btn-primary">
                            <i class="fas fa-search"></i> Search
                        </button>
                        <button id="clearAuditSearch" class="btn btn-secondary">
                            <i class="fas fa-times"></i> Clear
                        </button>
                    </div>
                    
                    <div class="filter-section">
                        <select id="categoryFilter" class="filter-select">
                            <option value="">All Categories</option>
                            <option value="DATA">Data Operations</option>
                            <option value="SEARCH">Search & Query</option>
                            <option value="GRAPH">Graph Analysis</option>
                            <option value="CASE">Case Management</option>
                            <option value="COLLABORATION">Collaboration</option>
                            <option value="SESSION">Session Management</option>
                            <option value="SECURITY">Security Events</option>
                            <option value="SYSTEM">System Events</option>
                            <option value="REPORT">Reporting</option>
                            <option value="ENTITY">Entity Resolution</option>
                            <option value="GEO">Geospatial</option>
                            <option value="NLP">Natural Language</option>
                        </select>
                        
                        <select id="severityFilter" class="filter-select">
                            <option value="">All Severities</option>
                            <option value="INFO">Info</option>
                            <option value="WARN">Warning</option>
                            <option value="ERROR">Error</option>
                            <option value="DEBUG">Debug</option>
                        </select>
                        
                        <input type="date" id="startDateFilter" class="filter-input">
                        <input type="date" id="endDateFilter" class="filter-input">
                        
                        <button id="applyFilters" class="btn btn-primary">
                            <i class="fas fa-filter"></i> Apply Filters
                        </button>
                        <button id="clearFilters" class="btn btn-secondary">
                            <i class="fas fa-eraser"></i> Clear
                        </button>
                    </div>
                    
                    <div class="action-section">
                        <button id="refreshAudit" class="btn btn-secondary">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                        <button id="exportAudit" class="btn btn-success">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <button id="generateReport" class="btn btn-info">
                            <i class="fas fa-chart-bar"></i> Generate Report
                        </button>
                        <button id="bulkActions" class="btn btn-warning">
                            <i class="fas fa-tasks"></i> Bulk Actions
                        </button>
                    </div>
                </div>
                
                <div class="audit-stats-bar">
                    <div class="stat-item">
                        <span class="stat-label">Total Entries:</span>
                        <span id="totalEntries" class="stat-value">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Filtered:</span>
                        <span id="filteredEntries" class="stat-value">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Selected:</span>
                        <span id="selectedEntries" class="stat-value">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Error Rate:</span>
                        <span id="errorRate" class="stat-value">0%</span>
                    </div>
                </div>
                
                <div class="audit-table-container">
                    <table id="auditTable" class="audit-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" id="selectAll"></th>
                                <th class="sortable" data-sort="timestamp">
                                    Timestamp <i class="fas fa-sort"></i>
                                </th>
                                <th class="sortable" data-sort="category">
                                    Category <i class="fas fa-sort"></i>
                                </th>
                                <th class="sortable" data-sort="eventType">
                                    Event Type <i class="fas fa-sort"></i>
                                </th>
                                <th class="sortable" data-sort="severity">
                                    Severity <i class="fas fa-sort"></i>
                                </th>
                                <th class="sortable" data-sort="userId">
                                    User <i class="fas fa-sort"></i>
                                </th>
                                <th>Details</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="auditTableBody">
                        </tbody>
                    </table>
                </div>
                
                <div class="audit-pagination">
                    <div class="page-info">
                        <span>Show</span>
                        <select id="pageSize" class="page-size-select">
                            <option value="25">25</option>
                            <option value="50" selected>50</option>
                            <option value="100">100</option>
                            <option value="200">200</option>
                        </select>
                        <span>entries per page</span>
                    </div>
                    
                    <div class="pagination-controls">
                        <button id="firstPage" class="btn btn-sm">First</button>
                        <button id="prevPage" class="btn btn-sm">Previous</button>
                        <span id="pageInfo">Page 1 of 1</span>
                        <button id="nextPage" class="btn btn-sm">Next</button>
                        <button id="lastPage" class="btn btn-sm">Last</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Create export modal
        this.createExportModal();
        
        // Create entry detail modal
        this.createEntryDetailModal();
    }

    createExportModal() {
        const exportModal = document.createElement('div');
        exportModal.id = 'auditExportModal';
        exportModal.className = 'modal';
        exportModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Export Audit Log</h3>
                    <button class="modal-close" onclick="this.closest('.modal').style.display='none'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="export-options">
                        <div class="option-group">
                            <label>Export Format:</label>
                            <div class="radio-group">
                                <label><input type="radio" name="exportFormat" value="json" checked> JSON</label>
                                <label><input type="radio" name="exportFormat" value="csv"> CSV</label>
                                <label><input type="radio" name="exportFormat" value="xml"> XML</label>
                            </div>
                        </div>
                        
                        <div class="option-group">
                            <label>Export Scope:</label>
                            <div class="radio-group">
                                <label><input type="radio" name="exportScope" value="all" checked> All Entries</label>
                                <label><input type="radio" name="exportScope" value="filtered"> Filtered Entries</label>
                                <label><input type="radio" name="exportScope" value="selected"> Selected Entries</label>
                            </div>
                        </div>
                        
                        <div class="option-group">
                            <label>Include Options:</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" id="includeMetadata" checked> Metadata</label>
                                <label><input type="checkbox" id="includeSensitive"> Sensitive Data</label>
                                <label><input type="checkbox" id="includeStats" checked> Statistics</label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button id="performExport" class="btn btn-primary">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(exportModal);
    }

    createEntryDetailModal() {
        const detailModal = document.createElement('div');
        detailModal.id = 'auditEntryDetailModal';
        detailModal.className = 'modal';
        detailModal.innerHTML = `
            <div class="modal-content entry-detail-content">
                <div class="modal-header">
                    <h3>Audit Entry Details</h3>
                    <button class="modal-close" onclick="this.closest('.modal').style.display='none'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div id="entryDetailContent" class="entry-detail">
                        <!-- Entry details will be populated here -->
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button id="exportSingleEntry" class="btn btn-secondary">
                        <i class="fas fa-download"></i> Export Entry
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(detailModal);
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('auditSearchBtn')?.addEventListener('click', () => this.performSearch());
        document.getElementById('auditSearch')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        document.getElementById('clearAuditSearch')?.addEventListener('click', () => this.clearSearch());

        // Filter functionality
        document.getElementById('applyFilters')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFilters')?.addEventListener('click', () => this.clearFilters());

        // Action buttons
        document.getElementById('refreshAudit')?.addEventListener('click', () => this.refreshData());
        document.getElementById('exportAudit')?.addEventListener('click', () => this.showExportModal());
        document.getElementById('generateReport')?.addEventListener('click', () => this.generateComplianceReport());

        // Sorting
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => this.handleSort(header.dataset.sort));
        });

        // Pagination
        document.getElementById('pageSize')?.addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value);
            this.currentPage = 1;
            this.renderTable();
        });

        document.getElementById('firstPage')?.addEventListener('click', () => this.goToPage(1));
        document.getElementById('prevPage')?.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        document.getElementById('nextPage')?.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        document.getElementById('lastPage')?.addEventListener('click', () => this.goToPage(this.getTotalPages()));

        // Select all checkbox
        document.getElementById('selectAll')?.addEventListener('change', (e) => this.selectAll(e.target.checked));

        // Export modal
        document.getElementById('performExport')?.addEventListener('click', () => this.performExport());
    }

    async showAuditLog(auditLogger) {
        this.auditLogger = auditLogger;
        await this.refreshData();
        document.getElementById('auditViewerModal').style.display = 'block';
    }

    async refreshData() {
        if (!this.auditLogger) return;
        
        this.auditLog = this.auditLogger.auditLog || [];
        this.updateStats();
        this.renderTable();
    }

    updateStats() {
        const stats = this.auditLogger?.getStatistics() || {};
        
        document.getElementById('totalEntries').textContent = this.auditLog.length;
        document.getElementById('filteredEntries').textContent = this.getFilteredData().length;
        document.getElementById('selectedEntries').textContent = this.selectedEntries.size;
        document.getElementById('errorRate').textContent = `${(stats.errorRate || 0).toFixed(1)}%`;
    }

    getFilteredData() {
        let filtered = [...this.auditLog];

        // Apply search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(entry => {
                const searchableText = [
                    entry.eventType,
                    entry.category,
                    entry.severity,
                    entry.userId,
                    JSON.stringify(entry.data)
                ].join(' ').toLowerCase();
                return searchableText.includes(query);
            });
        }

        // Apply filters
        if (this.currentFilters.category) {
            filtered = filtered.filter(entry => entry.category === this.currentFilters.category);
        }
        
        if (this.currentFilters.severity) {
            filtered = filtered.filter(entry => entry.severity === this.currentFilters.severity);
        }
        
        if (this.currentFilters.startDate) {
            const startDate = new Date(this.currentFilters.startDate);
            filtered = filtered.filter(entry => new Date(entry.timestamp) >= startDate);
        }
        
        if (this.currentFilters.endDate) {
            const endDate = new Date(this.currentFilters.endDate);
            endDate.setHours(23, 59, 59, 999); // Include entire end day
            filtered = filtered.filter(entry => new Date(entry.timestamp) <= endDate);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aVal = a[this.sortBy];
            let bVal = b[this.sortBy];
            
            if (this.sortBy === 'timestamp') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }
            
            if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }

    renderTable() {
        const filtered = this.getFilteredData();
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = filtered.slice(startIndex, endIndex);

        const tbody = document.getElementById('auditTableBody');
        tbody.innerHTML = '';

        pageData.forEach(entry => {
            const row = this.createTableRow(entry);
            tbody.appendChild(row);
        });

        this.updatePagination(filtered.length);
        this.updateStats();
    }

    createTableRow(entry) {
        const row = document.createElement('tr');
        row.className = `audit-row severity-${entry.severity.toLowerCase()}`;
        
        const isSelected = this.selectedEntries.has(entry.id);
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="row-select" data-entry-id="${entry.id}" ${isSelected ? 'checked' : ''}>
            </td>
            <td class="timestamp-cell">
                <div class="timestamp">${this.formatTimestamp(entry.timestamp)}</div>
                <div class="session-id">${entry.sessionId}</div>
            </td>
            <td>
                <span class="category-badge category-${entry.category.toLowerCase()}">${entry.category}</span>
            </td>
            <td class="event-type">${entry.eventType}</td>
            <td>
                <span class="severity-badge severity-${entry.severity.toLowerCase()}">${entry.severity}</span>
            </td>
            <td class="user-cell">${entry.userId}</td>
            <td class="details-cell">
                <button class="btn btn-sm btn-info view-details" data-entry-id="${entry.id}">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-secondary export-single" data-entry-id="${entry.id}">
                    <i class="fas fa-download"></i>
                </button>
            </td>
        `;

        // Add event listeners
        const checkbox = row.querySelector('.row-select');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.selectedEntries.add(entry.id);
            } else {
                this.selectedEntries.delete(entry.id);
            }
            this.updateStats();
        });

        const viewButton = row.querySelector('.view-details');
        viewButton.addEventListener('click', () => this.showEntryDetails(entry));

        const exportButton = row.querySelector('.export-single');
        exportButton.addEventListener('click', () => this.exportSingleEntry(entry));

        return row;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    showEntryDetails(entry) {
        const modal = document.getElementById('auditEntryDetailModal');
        const content = document.getElementById('entryDetailContent');
        
        content.innerHTML = `
            <div class="entry-header">
                <h4>${entry.eventType}</h4>
                <span class="severity-badge severity-${entry.severity.toLowerCase()}">${entry.severity}</span>
                <span class="category-badge category-${entry.category.toLowerCase()}">${entry.category}</span>
            </div>
            
            <div class="entry-metadata">
                <div class="metadata-row">
                    <strong>Timestamp:</strong> ${this.formatTimestamp(entry.timestamp)}
                </div>
                <div class="metadata-row">
                    <strong>Session ID:</strong> ${entry.sessionId}
                </div>
                <div class="metadata-row">
                    <strong>User ID:</strong> ${entry.userId}
                </div>
                <div class="metadata-row">
                    <strong>Entry ID:</strong> ${entry.id}
                </div>
                <div class="metadata-row">
                    <strong>URL:</strong> ${entry.url}
                </div>
            </div>
            
            <div class="entry-data">
                <h5>Event Data:</h5>
                <pre class="data-content">${JSON.stringify(entry.data, null, 2)}</pre>
            </div>
            
            <div class="entry-metadata-section">
                <h5>System Metadata:</h5>
                <pre class="metadata-content">${JSON.stringify(entry.metadata, null, 2)}</pre>
            </div>
        `;
        
        // Store current entry for export
        this.currentDetailEntry = entry;
        
        modal.style.display = 'block';
    }

    performSearch() {
        this.searchQuery = document.getElementById('auditSearch').value;
        this.currentPage = 1;
        this.renderTable();
    }

    clearSearch() {
        document.getElementById('auditSearch').value = '';
        this.searchQuery = '';
        this.currentPage = 1;
        this.renderTable();
    }

    applyFilters() {
        this.currentFilters = {
            category: document.getElementById('categoryFilter').value,
            severity: document.getElementById('severityFilter').value,
            startDate: document.getElementById('startDateFilter').value,
            endDate: document.getElementById('endDateFilter').value
        };
        this.currentPage = 1;
        this.renderTable();
    }

    clearFilters() {
        document.getElementById('categoryFilter').value = '';
        document.getElementById('severityFilter').value = '';
        document.getElementById('startDateFilter').value = '';
        document.getElementById('endDateFilter').value = '';
        this.currentFilters = {};
        this.currentPage = 1;
        this.renderTable();
    }

    handleSort(sortBy) {
        if (this.sortBy === sortBy) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = sortBy;
            this.sortOrder = 'desc';
        }
        
        // Update sort indicators
        document.querySelectorAll('.sortable i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });
        
        const currentHeader = document.querySelector(`[data-sort="${sortBy}"] i`);
        if (currentHeader) {
            currentHeader.className = `fas fa-sort-${this.sortOrder === 'asc' ? 'up' : 'down'}`;
        }
        
        this.renderTable();
    }

    selectAll(checked) {
        const checkboxes = document.querySelectorAll('.row-select');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const entryId = checkbox.dataset.entryId;
            if (checked) {
                this.selectedEntries.add(entryId);
            } else {
                this.selectedEntries.delete(entryId);
            }
        });
        this.updateStats();
    }

    showExportModal() {
        document.getElementById('auditExportModal').style.display = 'block';
    }

    async performExport() {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        const scope = document.querySelector('input[name="exportScope"]:checked').value;
        const includeMetadata = document.getElementById('includeMetadata').checked;
        const includeSensitive = document.getElementById('includeSensitive').checked;
        const includeStats = document.getElementById('includeStats').checked;

        let dataToExport;
        switch (scope) {
            case 'filtered':
                dataToExport = this.getFilteredData();
                break;
            case 'selected':
                dataToExport = this.auditLog.filter(entry => this.selectedEntries.has(entry.id));
                break;
            default:
                dataToExport = this.auditLog;
        }

        const options = {
            includeMetadata,
            includeSensitive,
            includeStats,
            filtered: scope !== 'all',
            filters: scope === 'filtered' ? this.currentFilters : undefined
        };

        try {
            const exportResult = await this.auditLogger.exportLog(format, options);
            this.downloadFile(exportResult.data, exportResult.filename, exportResult.mimeType);
            
            document.getElementById('auditExportModal').style.display = 'none';
            this.showNotification('Export completed successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Export failed: ' + error.message, 'error');
        }
    }

    exportSingleEntry(entry) {
        const data = JSON.stringify(entry, null, 2);
        const filename = `audit-entry-${entry.id}.json`;
        this.downloadFile(data, filename, 'application/json');
    }

    downloadFile(data, filename, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async generateComplianceReport() {
        if (!this.auditLogger) return;

        const startDate = this.currentFilters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = this.currentFilters.endDate || new Date().toISOString().split('T')[0];

        try {
            const report = this.auditLogger.generateComplianceReport(startDate, endDate);
            const reportData = JSON.stringify(report, null, 2);
            const filename = `compliance-report-${startDate}-to-${endDate}.json`;
            
            this.downloadFile(reportData, filename, 'application/json');
            this.showNotification('Compliance report generated successfully', 'success');
        } catch (error) {
            console.error('Report generation failed:', error);
            this.showNotification('Report generation failed: ' + error.message, 'error');
        }
    }

    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.pageSize);
        
        document.getElementById('pageInfo').textContent = `Page ${this.currentPage} of ${totalPages}`;
        
        document.getElementById('firstPage').disabled = this.currentPage === 1;
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages;
        document.getElementById('lastPage').disabled = this.currentPage === totalPages;
    }

    getTotalPages() {
        const filtered = this.getFilteredData();
        return Math.ceil(filtered.length / this.pageSize);
    }

    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTable();
        }
    }

    showNotification(message, type) {
        // Create notification system if it doesn't exist
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
            <span>${message}</span>
            <button class="notification-close">×</button>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Add close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.parentNode.removeChild(notification);
        });
    }
}

// Legacy function exports for compatibility
export function showAuditLogModal(auditLog) {
    if (window.auditViewer) {
        window.auditViewer.showAuditLog(window.auditLogger);
    }
}

// Export class
export { AuditViewer };
