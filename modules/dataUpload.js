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
  if (fileInput) fileInput.setAttribute('multiple', 'multiple');

  // Standardized file upload handler
  if (fileInput) {
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
  }

  // Sample data loader for demo/testing purposes
  if (loadSampleBtn) {
    loadSampleBtn.addEventListener('click', () => {
      // Show loading
      if (window.uxManager) {
        window.uxManager.showLoading('Loading sample data...');
      }
      
      // Simulate loading delay for UX demonstration
      setTimeout(() => {
        const sample = [
          // Entities
          { id: '1', name: 'John Smith', type: 'Person', date: '2024-01-15', amount: 25000, location: 'New York', category: 'Investigator', from: '', to: '' },
          { id: '2', name: 'Jane Doe', type: 'Person', date: '2024-02-20', amount: 18000, location: 'Los Angeles', category: 'Suspect', from: '', to: '' },
          { id: '3', name: 'ACME Corp', type: 'Company', date: '2024-01-10', amount: 500000, location: 'Chicago', category: 'Corporation', from: '', to: '' },
          { id: '4', name: 'BankFirst', type: 'Bank', date: '2024-03-05', amount: 2000000, location: 'Miami', category: 'Financial', from: '', to: '' },
          { id: '5', name: 'Property Alpha', type: 'Asset', date: '2024-02-15', amount: 750000, location: 'Boston', category: 'Real Estate', from: '', to: '' },
          
          // Relationships
          { from: '1', to: '3', label: 'Employed By', type: 'employment', date: '2024-01-15', amount: 1, weight: 1 },
          { from: '2', to: '4', label: 'Account Holder', type: 'financial', date: '2024-02-20', amount: 1, weight: 1 },
          { from: '3', to: '5', label: 'Owns', type: 'ownership', date: '2024-02-15', amount: 1, weight: 1 },
          { from: '2', to: '3', label: 'Consultant', type: 'business', date: '2024-02-01', amount: 0.5, weight: 0.5 },
          { from: '5', to: '4', label: 'Financed By', type: 'financial', date: '2024-02-16', amount: 1, weight: 1 }
        ];
        
        originalData = sample;
        
        // Bypass cleaning modal for sample data, go straight to field mapping
        const roles = getFieldRoles(sample);
        
        if (window.uxManager) {
          window.uxManager.hideLoading();
          window.uxManager.showNotification(
            `Loaded ${sample.length} sample records for demonstration`,
            'success',
            3000
          );
        }
        
        showFieldMappingModal(roles, (userRoles) => {
          // Normalize data
          normalizedData = normalizeData(sample, userRoles);
          cleanedData = sample;
          
          // Notify downstream modules
          window.dispatchEvent(new CustomEvent('data:normalized', { detail: normalizedData }));
        });
      }, 1000); // 1 second delay for demonstration
    });
  }
}
