// Search Autocomplete Module
// Handles search index building and autocomplete suggestions

/**
 * Builds search indexes using Fuse.js and lunr.js
 * @param {Array} nodes - Entity nodes to index
 * @returns {Object} - Contains fuse and lunr search indexes
 */
export function buildSearchIndexes(nodes) {
  // Check for required global libraries
  if (typeof Fuse === 'undefined') {
    console.error('Fuse.js not loaded! Make sure it is included via script tag.');
    return { fuse: null, searchIndex: null };
  }
  if (!Array.isArray(nodes)) {
    console.warn('buildSearchIndexes: nodes is missing or not an array:', nodes);
    return { fuse: null, searchIndex: null };
  }

  // Configure Fuse.js options
  const fuseOptions = {
    includeScore: true,
    threshold: 0.4,
    keys: [
      { name: 'name', weight: 2 },
      { name: 'type', weight: 1.5 },
      'category',
      'location',
      'description'
    ]
  };

  // Initialize Fuse search
  const fuse = new Fuse(nodes, fuseOptions);

  // Create lunr index if available
  let searchIndex = null;
  if (typeof lunr !== 'undefined') {
    try {
      searchIndex = lunr(function() {
        this.ref('id');
        this.field('name', { boost: 10 });
        this.field('type', { boost: 5 });
        this.field('category');
        this.field('location');
        
        nodes.forEach(node => {
          this.add(node);
        });
      });
    } catch (error) {
      console.warn('Error creating lunr index:', error);
    }
  }

  return { fuse, searchIndex };
}

/**
 * Adds autocomplete suggestions to a search input
 * @param {HTMLElement} inputElement - The search input element
 * @param {Object} fuse - Fuse.js instance
 * @param {Object} options - Autocomplete configuration options
 */
export function addSearchAutocomplete(inputElement, fuse, options = {}) {
  if (!inputElement || !fuse) return;
  
  const defaults = {
    maxSuggestions: 5,
    minLength: 2,
    delay: 200
  };
  
  const config = { ...defaults, ...options };
  let debounceTimer;
  
  // Create suggestion container if it doesn't exist
  let suggestionsContainer = document.getElementById('search-suggestions');
  if (!suggestionsContainer) {
    suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'search-suggestions';
    suggestionsContainer.className = 'search-suggestions';
    suggestionsContainer.style.position = 'absolute';
    suggestionsContainer.style.display = 'none';
    suggestionsContainer.style.zIndex = '1000';
    suggestionsContainer.style.backgroundColor = 'white';
    suggestionsContainer.style.width = '100%';
    suggestionsContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    suggestionsContainer.style.borderRadius = '0 0 4px 4px';
    suggestionsContainer.style.maxHeight = '300px';
    suggestionsContainer.style.overflowY = 'auto';
    inputElement.parentNode.style.position = 'relative';
    inputElement.parentNode.appendChild(suggestionsContainer);
  }
  
  // Input event listeners
  inputElement.addEventListener('input', function() {
    const query = this.value.trim();
    clearTimeout(debounceTimer);
    
    if (query.length < config.minLength) {
      suggestionsContainer.style.display = 'none';
      return;
    }
    
    debounceTimer = setTimeout(() => {
      const results = fuse.search(query).slice(0, config.maxSuggestions);
      displaySuggestions(results, query);
    }, config.delay);
  });
  
  inputElement.addEventListener('blur', function() {
    // Small delay to allow clicking on suggestions
    setTimeout(() => {
      suggestionsContainer.style.display = 'none';
    }, 200);
  });
  
  inputElement.addEventListener('focus', function() {
    const query = this.value.trim();
    if (query.length >= config.minLength) {
      const results = fuse.search(query).slice(0, config.maxSuggestions);
      displaySuggestions(results, query);
    }
  });
  
  // Display suggestions in the container
  function displaySuggestions(results, query) {
    if (results.length === 0) {
      suggestionsContainer.style.display = 'none';
      return;
    }
    
    suggestionsContainer.innerHTML = '';
    results.forEach(result => {
      const item = document.createElement('div');
      const node = result.item;
      item.className = 'suggestion-item';
      item.style.padding = '8px 12px';
      item.style.cursor = 'pointer';
      item.style.borderBottom = '1px solid #eee';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      
      // Highlight the matching text
      const name = highlightMatch(node.name || 'Unnamed', query);
      const type = node.type ? `<span style="color:#888; margin-left:8px; font-size:0.9em;">${node.type}</span>` : '';
      
      item.innerHTML = `${name}${type}`;
      
      item.addEventListener('mousedown', function() {
        inputElement.value = node.name || '';
        suggestionsContainer.style.display = 'none';
        
        // Trigger search with this value
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Dispatch custom event for search result selection
        window.dispatchEvent(new CustomEvent('search:selected', { 
          detail: node
        }));
      });
      
      item.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#f5f5f5';
      });
      
      item.addEventListener('mouseout', function() {
        this.style.backgroundColor = 'transparent';
      });
      
      suggestionsContainer.appendChild(item);
    });
    
    suggestionsContainer.style.display = 'block';
  }
  
  // Highlight matching text in results
  function highlightMatch(text, query) {
    if (!query) return text;
    
    try {
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<strong style="background-color:rgba(102,126,234,0.2);">$1</strong>');
    } catch (e) {
      return text;
    }
  }
}
