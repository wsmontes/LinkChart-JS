// Investigative Analytics Platform - Report Module
// Handles PDF/CSV/JSON export and report template customization.
// All submodules are imported and used in a standardized, robust workflow.
// Comments included for AI-assisted development and extensibility.

import { exportData, buildReportTemplate } from './report/export.js';
import { showReportTemplateModal } from './report/template.js';

let currentData = null;

export function initReport() {
  console.log('Initializing report module...');
  
  // Listen for data updates
  window.addEventListener('data:entitiesResolved', (e) => {
    currentData = e.detail;
    console.log('Report module received data:', currentData);
  });
  
  // Initialize export buttons
  initExportButtons();
  
  // Initialize report template functionality
  initReportTemplate();
}

function initExportButtons() {
  // CSV Export
  const csvBtn = document.getElementById('exportCSV');
  if (csvBtn) {
    csvBtn.addEventListener('click', () => {
      if (!currentData) {
        showNoDataWarning();
        return;
      }
      exportData(currentData, 'csv', 'investigation_data');
    });
  }
  
  // JSON Export
  const jsonBtn = document.getElementById('exportJSON');
  if (jsonBtn) {
    jsonBtn.addEventListener('click', () => {
      if (!currentData) {
        showNoDataWarning();
        return;
      }
      exportData(currentData, 'json', 'investigation_data');
    });
  }
  
  // PDF Export
  const pdfBtn = document.getElementById('exportPDF');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      if (!currentData) {
        showNoDataWarning();
        return;
      }
      exportData(currentData, 'pdf', 'investigation_report');
    });
  }
  
  // Generic export from dropdown or other UI elements
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-export]')) {
      const format = e.target.getAttribute('data-export');
      if (!currentData) {
        showNoDataWarning();
        return;
      }
      exportData(currentData, format, 'investigation_data');
    }
  });
}

function initReportTemplate() {
  // Report template builder button
  const templateBtn = document.getElementById('reportTemplate');
  if (templateBtn) {
    templateBtn.addEventListener('click', () => {
      if (!currentData) {
        showNoDataWarning();
        return;
      }
      showReportTemplateModal(currentData);
    });
  }
}

function showNoDataWarning() {
  window.dispatchEvent(new CustomEvent('notification:show', {
    detail: {
      type: 'warning',
      message: 'No data available to export. Please upload and process data first.'
    }
  }));
}

// Export functions for external use
export { exportData, buildReportTemplate };

// Get current report data
export function getCurrentData() {
  return currentData;
}

// Export specific case data
export function exportCaseData(caseData, format = 'json') {
  if (!caseData) {
    showNoDataWarning();
    return;
  }
  
  const filename = `case_${caseData.name || 'unnamed'}_${Date.now()}`;
  exportData(caseData, format, filename);
}

// AI/Dev Note: This module is ready for extension with more export formats, custom templates, and integration with other reporting tools. All report operations are delegated to submodules for clarity and testability.
