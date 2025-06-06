// Investigative Analytics Platform - Search Module
// Handles search index building, autocomplete, advanced search, and filter UI.
// All submodules are imported and used in a standardized, robust workflow.
// Comments included for AI-assisted development and extensibility.

// Remove direct imports and use globally loaded libraries
// import Fuse from 'fuse.js';
// import lunr from 'lunr';
import { buildSearchIndexes, addSearchAutocomplete } from './search/autocomplete.js';
import { advancedSearch } from './search/advanced.js';
import { showFilterPanel } from './search/filters.js';

let searchIndex = null;
let fuse = null;

// Handles search (Fuse.js/Lunr.js) and filters
export function initSearch() {
  // Check if the required libraries are loaded globally
  if (typeof Fuse === 'undefined') {
    console.error('Fuse.js not loaded! Make sure it is included via script tag before initializing.');
    if (window.uxManager) {
      window.uxManager.showNotification(
        'Search library (Fuse.js) not found. Please refresh the page or check the console for details.',
        'error',
        8000
      );
    }
    return;
  }

  if (typeof lunr === 'undefined') {
    console.warn('lunr.js not loaded! Some advanced search features may not be available.');
  }

  // Listen for data normalization events (correct event name)
  window.addEventListener('data:normalized', (e) => {
    const data = e.detail;
    console.log('Search: received normalized data', data);
    
    if (data && data.nodes && Array.isArray(data.nodes)) {
      // 1. Build search indexes
      const searchResult = buildSearchIndexes(data.nodes);
      fuse = searchResult.fuse;
      searchIndex = searchResult.searchIndex;
      
      // 2. Add autocomplete functionality
      const searchInput = document.getElementById('searchInput');
      if (searchInput && fuse) {
        addSearchAutocomplete(searchInput, fuse);
      }
      
      // 3. Initialize facet filters
      const filterContainer = document.getElementById('filterContainer');
      if (filterContainer) {
        showFilterPanel(filterContainer, data.nodes, (filters) => {
          // Handle filter changes
          console.log('Search filters updated:', filters);
        });
      }
      
      if (window.uxManager) {
        window.uxManager.showNotification(
          `Search index built for ${data.nodes.length} entities`,
          'success',
          3000
        );
      }
    }
  });
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (fuse && query.trim()) {
        // 3. Advanced search (fuzzy, fielded, regex, etc.)
        const results = advancedSearch(fuse, query, {});
        window.dispatchEvent(new CustomEvent('search:results', { detail: results }));
      } else if (!query.trim()) {
        // Clear search results
        window.dispatchEvent(new CustomEvent('search:results', { detail: [] }));
      }
    });
  }
  
  // Make search functionality globally available
  window.searchModule = {
    performSearch: (query) => {
      const results = advancedSearch(fuse, query, {});
      window.dispatchEvent(new CustomEvent('search:results', { detail: results }));
      return results;
    }
  };
  
  console.log('Search module initialized successfully');
}

// AI/Dev Note: This module is ready for extension with more advanced search options, fielded queries, and user-driven filters. All search operations are delegated to submodules for clarity and testability.
