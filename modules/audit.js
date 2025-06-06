// Investigative Analytics Platform - Audit Module
// Handles audit logging, user action logging, and audit log viewing/export.
// All submodules are imported and used in a standardized, robust workflow.
// Comments included for AI-assisted development and extensibility.

import { AuditLogger } from './audit/logging.js';
import { AuditViewer } from './audit/viewer.js';

let auditLogger = null;
let auditViewer = null;
let auditLog = [];

// Handles audit trail (localStorage, download)
export async function initAudit() {
  // Initialize audit components
  auditLogger = new AuditLogger();
  auditViewer = new AuditViewer();
  
  // Make globally available
  window.auditLogger = auditLogger;
  window.auditViewer = auditViewer;
  
  // Setup UI event handlers
  const downloadAudit = document.getElementById('downloadAudit');
  if (downloadAudit) {
    downloadAudit.addEventListener('click', downloadAuditLog);
  }
  
  const viewAudit = document.getElementById('viewAudit');
  if (viewAudit) {
    viewAudit.addEventListener('click', () => showAuditViewer());
  }
  
  // Load existing audit log
  await loadAuditLog();
  
  // Setup comprehensive event listeners for all platform activities
  setupAuditEventListeners();
  
  // Setup periodic audit log backup
  setupAuditBackup();
  
  console.log('✓ Audit system initialized');
}

async function loadAuditLog() {
  if (auditLogger) {
    auditLog = await auditLogger.loadAuditLog();
  }
}

function setupAuditEventListeners() {
  // Data-related events
  window.addEventListener('data:uploaded', (e) => auditLogger?.logEvent('data_upload', e.detail));
  window.addEventListener('data:normalized', (e) => auditLogger?.logEvent('data_normalized', e.detail));
  window.addEventListener('data:transformed', (e) => auditLogger?.logEvent('data_transformed', e.detail));
  window.addEventListener('data:cleaned', (e) => auditLogger?.logEvent('data_cleaned', e.detail));
  
  // Search and query events
  window.addEventListener('search:executed', (e) => auditLogger?.logEvent('search_executed', e.detail));
  window.addEventListener('search:results', (e) => auditLogger?.logEvent('search_results', e.detail));
  window.addEventListener('query:visual_built', (e) => auditLogger?.logEvent('visual_query_built', e.detail));
  window.addEventListener('query:executed', (e) => auditLogger?.logEvent('query_executed', e.detail));
  
  // Graph analysis events
  window.addEventListener('graph:layout_changed', (e) => auditLogger?.logEvent('graph_layout_changed', e.detail));
  window.addEventListener('graph:filter_applied', (e) => auditLogger?.logEvent('graph_filter_applied', e.detail));
  window.addEventListener('graph:analytics_run', (e) => auditLogger?.logEvent('graph_analytics_executed', e.detail));
  window.addEventListener('graph:cluster_detected', (e) => auditLogger?.logEvent('clustering_performed', e.detail));
  
  // Case workspace events
  window.addEventListener('case:created', (e) => auditLogger?.logEvent('case_created', e.detail));
  window.addEventListener('case:entity_added', (e) => auditLogger?.logEvent('case_entity_added', e.detail));
  window.addEventListener('case:note_added', (e) => auditLogger?.logEvent('case_note_added', e.detail));
  window.addEventListener('case:shared', (e) => auditLogger?.logEvent('case_shared', e.detail));
  window.addEventListener('case:exported', (e) => auditLogger?.logEvent('case_exported', e.detail));
  
  // Collaboration events
  window.addEventListener('collaboration:invite_sent', (e) => auditLogger?.logEvent('collaboration_invite_sent', e.detail));
  window.addEventListener('collaboration:access_granted', (e) => auditLogger?.logEvent('collaboration_access_granted', e.detail));
  window.addEventListener('collaboration:permissions_changed', (e) => auditLogger?.logEvent('collaboration_permissions_changed', e.detail));
  window.addEventListener('collaboration:conflict_resolved', (e) => auditLogger?.logEvent('collaboration_conflict_resolved', e.detail));
  
  // Session management events
  window.addEventListener('session:created', (e) => auditLogger?.logEvent('session_created', e.detail));
  window.addEventListener('session:saved', (e) => auditLogger?.logEvent('session_saved', e.detail));
  window.addEventListener('session:loaded', (e) => auditLogger?.logEvent('session_loaded', e.detail));
  window.addEventListener('session:exported', (e) => auditLogger?.logEvent('session_exported', e.detail));
  window.addEventListener('session:imported', (e) => auditLogger?.logEvent('session_imported', e.detail));
  
  // Security and access events
  window.addEventListener('auth:login', (e) => auditLogger?.logEvent('user_login', e.detail));
  window.addEventListener('auth:logout', (e) => auditLogger?.logEvent('user_logout', e.detail));
  window.addEventListener('auth:failed', (e) => auditLogger?.logEvent('authentication_failed', e.detail));
  window.addEventListener('permission:denied', (e) => auditLogger?.logEvent('permission_denied', e.detail));
  
  // System events
  window.addEventListener('error', (e) => auditLogger?.logEvent('system_error', {
    error: e.error?.message,
    stack: e.error?.stack,
    url: e.filename,
    line: e.lineno
  }));
  
  // Report generation events
  window.addEventListener('report:generated', (e) => auditLogger?.logEvent('report_generated', e.detail));
  window.addEventListener('report:exported', (e) => auditLogger?.logEvent('report_exported', e.detail));
  
  // Entity resolution events
  window.addEventListener('entity:resolved', (e) => auditLogger?.logEvent('entity_resolved', e.detail));
  window.addEventListener('entity:merged', (e) => auditLogger?.logEvent('entity_merged', e.detail));
  window.addEventListener('entity:deduplication', (e) => auditLogger?.logEvent('entity_deduplication', e.detail));
  
  // Geospatial events
  window.addEventListener('geo:geocoded', (e) => auditLogger?.logEvent('geocoding_performed', e.detail));
  window.addEventListener('geo:analysis', (e) => auditLogger?.logEvent('spatial_analysis_performed', e.detail));
  
  // NLP events
  window.addEventListener('nlp:entity_extracted', (e) => auditLogger?.logEvent('nlp_entity_extraction', e.detail));
  window.addEventListener('nlp:sentiment_analyzed', (e) => auditLogger?.logEvent('nlp_sentiment_analysis', e.detail));
  window.addEventListener('nlp:pattern_detected', (e) => auditLogger?.logEvent('nlp_pattern_detection', e.detail));
}

function setupAuditBackup() {
  // Backup audit log every hour
  setInterval(async () => {
    if (auditLogger) {
      await auditLogger.createBackup();
    }
  }, 3600000); // 1 hour
  
  // Also backup on page unload
  window.addEventListener('beforeunload', async () => {
    if (auditLogger) {
      await auditLogger.saveAuditLog();
    }
  });
}

async function downloadAuditLog() {
  if (auditViewer) {
    await auditViewer.showAuditLogModal(auditLog);
  }
  
  // Also trigger download as JSON
  const blob = new Blob([JSON.stringify(auditLog, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit_log_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Audit management functions
export function getAuditLog(filters = {}) {
  return auditLogger ? auditLogger.getFilteredLog(filters) : [];
}

export function getAuditStatistics() {
  return auditLogger ? auditLogger.getStatistics() : {};
}

export async function exportAuditLog(format = 'json', options = {}) {
  if (!auditLogger) return null;
  return await auditLogger.exportLog(format, options);
}

export async function searchAuditLog(query, filters = {}) {
  if (!auditLogger) return [];
  return await auditLogger.searchLog(query, filters);
}

export function getComplianceReport(startDate, endDate) {
  return auditLogger ? auditLogger.generateComplianceReport(startDate, endDate) : null;
}

// Enhanced UI functions for audit viewer
export function showAuditViewer() {
  if (auditViewer && auditLogger) {
    auditViewer.showAuditLog(auditLogger);
  } else {
    console.warn('Audit viewer or logger not initialized');
  }
}

export function showAuditLogModal(filters = {}) {
  // Legacy compatibility function
  showAuditViewer();
}

// Make audit system globally available
if (typeof window !== 'undefined') {
  window.auditModule = {
    getAuditLog,
    getAuditStatistics,
    exportAuditLog,
    searchAuditLog,
    getComplianceReport,
    showAuditViewer,
    showAuditLogModal,
    logEvent: (event, data) => auditLogger?.logEvent(event, data)
  };
}

export { logAudit } from './audit/logging.js';

// AI/Dev Note: This module now provides comprehensive audit logging covering all platform 
// activities including data operations, user actions, security events, collaboration activities, 
// and system events. It includes compliance reporting, search capabilities, and multiple export 
// formats for audit analysis and regulatory requirements.
