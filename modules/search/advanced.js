// Advanced Search Module
// Handles complex search operations including fuzzy search, fielded search, and filters

/**
 * Performs advanced search using Fuse.js
 * @param {Object} fuse - Fuse.js search instance
 * @param {string} query - Search query
 * @param {Object} options - Advanced search options
 * @returns {Array} - Search results
 */
export function advancedSearch(fuse, query, options = {}) {
  // If fuse isn't available or query is empty, return empty results
  if (!fuse || !query || query.trim() === '') {
    return [];
  }
  
  // Process query for advanced syntax
  const { processedQuery, fieldFilters } = processAdvancedQuery(query);
  
  // Check for field-specific searches
  if (fieldFilters.length > 0 && typeof fuse.search === 'function') {
    return performFieldedSearch(fuse, processedQuery, fieldFilters, options);
  }
  
  // Default search
  try {
    const results = fuse.search(processedQuery);
    
    // Apply any additional filters
    let filteredResults = applyAdditionalFilters(results, options);
    
    // Track search in analytics if available
    if (window.uxManager) {
      window.uxManager.trackUserAction('advanced_search_performed', {
        query: processedQuery,
        resultCount: filteredResults.length,
        filters: Object.keys(options).length
      });
    }
    
    return filteredResults;
  } catch (error) {
    console.error('Search error:', error);
    
    // Fallback to basic filtering if search fails
    return fallbackSearch(fuse._docs || [], processedQuery);
  }
}

/**
 * Process advanced query syntax to extract field filters
 * Supports syntax like: name:John type:Person
 */
function processAdvancedQuery(query) {
  const fieldFilters = [];
  
  // Regular expression to match field:value patterns
  const fieldPattern = /(\w+):(["']?(.*?)["']?(?:\s|$))/g;
  let match;
  let processedQuery = query;
  
  // Extract all field:value pairs
  while ((match = fieldPattern.exec(query)) !== null) {
    const [fullMatch, field, _, value] = match;
    fieldFilters.push({ field, value });
    
    // Remove the field:value from the main query
    processedQuery = processedQuery.replace(fullMatch, ' ');
  }
  
  return {
    processedQuery: processedQuery.trim(),
    fieldFilters
  };
}

/**
 * Perform search with specific field filters
 */
function performFieldedSearch(fuse, query, fieldFilters, options) {
  // Create field-specific search configuration
  const searchOptions = { ...options };
  
  // If query is empty, search only by fields
  if (!query) {
    // Filter the original dataset directly
    const docs = fuse._docs || [];
    return docs.filter(doc => {
      return fieldFilters.every(filter => {
        const fieldValue = doc[filter.field];
        if (!fieldValue) return false;
        
        // Case insensitive match
        return fieldValue.toString().toLowerCase()
          .includes(filter.value.toLowerCase());
      });
    }).map(item => ({ item, score: 0 }));
  }
  
  // Combine field filters with general query
  searchOptions.keys = fieldFilters.map(filter => filter.field);
  
  // Perform filtered search
  return fuse.search({
    $or: [
      { $and: fieldFilters.map(filter => ({ 
        [filter.field]: filter.value 
      })) },
      query
    ]
  });
}

/**
 * Apply additional filters based on options
 */
function applyAdditionalFilters(results, options) {
  if (!options || !results) return results;
  
  let filtered = [...results];
  
  // Apply date range filter if present
  if (options.dateRange) {
    const { start, end, field = 'date' } = options.dateRange;
    
    if (start || end) {
      filtered = filtered.filter(result => {
        const itemDate = new Date(result.item[field]);
        if (isNaN(itemDate)) return true; // Keep items without valid dates
        
        const startDate = start ? new Date(start) : new Date(0);
        const endDate = end ? new Date(end) : new Date(8640000000000000); // Max date
        
        return itemDate >= startDate && itemDate <= endDate;
      });
    }
  }
  
  // Apply numeric range filter if present
  if (options.numericRange) {
    const { min, max, field = 'amount' } = options.numericRange;
    
    if (min !== undefined || max !== undefined) {
      filtered = filtered.filter(result => {
        let value = result.item[field];
        
        // Try to extract numeric value from string (e.g., "$1,234.56" -> 1234.56)
        if (typeof value === 'string') {
          value = parseFloat(value.replace(/[^0-9.-]+/g, ''));
        }
        
        if (isNaN(value)) return true; // Keep items without valid numbers
        
        const minVal = min !== undefined ? min : Number.NEGATIVE_INFINITY;
        const maxVal = max !== undefined ? max : Number.POSITIVE_INFINITY;
        
        return value >= minVal && value <= maxVal;
      });
    }
  }
  
  // Apply exclude filter if present
  if (options.exclude && Array.isArray(options.exclude)) {
    filtered = filtered.filter(result => {
      return !options.exclude.includes(result.item.id);
    });
  }
  
  // Apply category filter if present
  if (options.categories && Array.isArray(options.categories) && options.categories.length > 0) {
    filtered = filtered.filter(result => {
      return options.categories.includes(result.item.category || result.item.type);
    });
  }
  
  return filtered;
}

/**
 * Fallback search for when Fuse.js fails
 */
function fallbackSearch(docs, query) {
  if (!docs || !Array.isArray(docs) || !query) return [];
  
  const lowerQuery = query.toLowerCase();
  
  return docs.filter(doc => {
    // Search in common fields
    const searchFields = ['name', 'type', 'category', 'description', 'location'];
    
    return searchFields.some(field => {
      const value = doc[field];
      return value && value.toString().toLowerCase().includes(lowerQuery);
    });
  }).map(item => ({ item, score: 0 }));
}
