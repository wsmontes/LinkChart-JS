// Investigative Analytics Platform - Data Upload Module
// This module orchestrates data ingestion, cleaning, transformation, field mapping, and normalization.
// All submodules are imported and used in a standardized, robust workflow.
// Comments are included for AI-assisted development and future extensibility.

import { ingestFiles } from './dataUpload/ingest.js';
import { showDataCleaningModal, showFieldMappingModal, normalizeData, getFieldRoles } from './dataUpload/cleaning.js';
import { applyTransformations } from './dataUpload/transform.js';
import { showManualEntryModal } from './dataUpload/manualEntry.js';

// Data lineage tracking
export let originalData = null;
export let cleanedData = null;
export let normalizedData = [];

// Main entry point for data upload
export function initDataUpload() {
  const fileInput = document.getElementById('fileInput');
  const loadSampleBtn = document.getElementById('loadSample');
  fileInput.setAttribute('multiple', 'multiple');

  // Standardized file upload handler
  fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    // 1. Ingest files (CSV/JSON/TSV)
    ingestFiles(files, (mergedRows) => {
      originalData = mergedRows;
      // 2. Data cleaning UI
      showDataCleaningModal(mergedRows, (cleanedRows) => {
        cleanedData = cleanedRows;
        // 3. Optional: Apply transformation rules (future)
        // cleanedData = applyTransformations(cleanedRows, rules);
        // 4. Field mapping UI
        const roles = getFieldRoles(cleanedData);
        showFieldMappingModal(roles, (userRoles) => {
          // 5. Normalize data
          normalizedData = normalizeData(cleanedData, userRoles);
          // 6. (Optional) Manual entry
          // showManualEntryModal(...)
          // 7. Notify downstream modules
          window.dispatchEvent(new CustomEvent('data:normalized', { detail: normalizedData }));
        });
      });
    });
  });

  // Sample data loader (for demo/testing)
  loadSampleBtn.addEventListener('click', () => {
    const sample = [
      { id: '1', name: 'Alice', type: 'Person', date: '2024-01-01', from: '', to: '' },
      { id: '2', name: 'Bob', type: 'Person', date: '2024-01-02', from: '', to: '' },
      { id: '3', name: 'Acme Corp', type: 'Company', date: '2024-01-03', from: '', to: '' },
      { from: '1', to: '2', label: 'knows', date: '2024-01-01' },
      { from: '2', to: '3', label: 'works_at', date: '2024-01-02' }
    ];
    originalData = sample;
    showDataCleaningModal(sample, (cleanedRows) => {
      cleanedData = cleanedRows;
      const roles = getFieldRoles(cleanedData);
      showFieldMappingModal(roles, (userRoles) => {
        normalizedData = normalizeData(cleanedData, userRoles);
        window.dispatchEvent(new CustomEvent('data:normalized', { detail: normalizedData }));
      });
    });
  });
}
