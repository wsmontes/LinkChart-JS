// Investigative Analytics Platform - Entity Resolution Module
// Handles deduplication, implicit link inference, and merge rules.
// All submodules are imported and used in a standardized, robust workflow.
// Comments included for AI-assisted development and extensibility.

import { deduplicateEntities, inferImplicitLinks, showManualMergeUI } from './entityResolution/deduplication.js';
import { showMergeRulesModal } from './entityResolution/mergeRules.js';

// Main entry point for entity resolution
export function initEntityResolution() {
  window.addEventListener('data:normalized', (e) => {
    let { nodes, edges } = e.detail;
    // 1. Deduplicate entities (fuzzy/exact)
    nodes = deduplicateEntities(nodes);
    // 2. Implicit link inference (shared attributes)
    edges = edges.concat(inferImplicitLinks(nodes));
    // 3. (Optional) Manual merge UI or merge rules
    // showManualMergeUI(nodes, ...)
    // showMergeRulesModal(...)
    // 4. Notify downstream modules
    window.dispatchEvent(new CustomEvent('data:entitiesResolved', { detail: { nodes, edges } }));
  });
}

// AI/Dev Note: This module is ready for extension with more advanced entity resolution logic, including user-defined rules, network-based deduplication, and manual review workflows.
