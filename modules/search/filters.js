// Search Filters Module
// Handles search filter UI and filter application

/**
 * Shows the filter panel for search refinement
 * @param {HTMLElement} container - Container element for filters
 * @param {Array} data - Data to analyze for filter options
 * @param {Function} onFilterChange - Callback when filters change
 */
export function showFilterPanel(container, data, onFilterChange) {
  if (!container || !data || !Array.isArray(data) || !data.length) {
    console.warn('Invalid parameters for filter panel');
    return;
  }

  // Extract filter options from data
  const filterOptions = extractFilterOptions(data);
  
  // Generate filter UI
  container.innerHTML = generateFilterUI(filterOptions);
  
  // Add event listeners
  addFilterEventListeners(container, filterOptions, onFilterChange);
}

/**
 * Extract filter options from dataset
 */
function extractFilterOptions(data) {
  const options = {
    types: new Set(),
    categories: new Set(),
    dateRange: { min: null, max: null },
    numericFields: []
  };
  
  // Find common fields to use for filters
  const sampleItems = data.slice(0, Math.min(100, data.length));
  const fields = new Set();
  
  sampleItems.forEach(item => {
    Object.keys(item).forEach(key => fields.add(key));
    
    // Extract types and categories
    if (item.type) options.types.add(item.type);
    if (item.category) options.categories.add(item.category);
    
    // Extract date range
    if (item.date) {
      const date = new Date(item.date);
      if (!isNaN(date.getTime())) {
        if (!options.dateRange.min || date < new Date(options.dateRange.min)) {
          options.dateRange.min = date.toISOString().split('T')[0];
        }
        if (!options.dateRange.max || date > new Date(options.dateRange.max)) {
          options.dateRange.max = date.toISOString().split('T')[0];
        }
      }
    }
  });
  
  // Identify numeric fields
  fields.forEach(field => {
    let isNumeric = true;
    let hasValues = false;
    
    for (const item of sampleItems) {
      if (item[field] === undefined || item[field] === null) continue;
      
      hasValues = true;
      const value = item[field];
      
      // Try to extract numeric value
      const numValue = typeof value === 'string' 
        ? parseFloat(value.replace(/[^0-9.-]+/g, ''))
        : (typeof value === 'number' ? value : NaN);
        
      if (isNaN(numValue)) {
        isNumeric = false;
        break;
      }
    }
    
    if (isNumeric && hasValues && !['id', 'index'].includes(field)) {
      const values = sampleItems
        .map(item => {
          if (item[field] === undefined || item[field] === null) return null;
          const value = typeof item[field] === 'string' 
            ? parseFloat(item[field].replace(/[^0-9.-]+/g, ''))
            : (typeof item[field] === 'number' ? item[field] : NaN);
          return isNaN(value) ? null : value;
        })
        .filter(v => v !== null);
        
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      options.numericFields.push({
        field,
        min,
        max,
        label: field.charAt(0).toUpperCase() + field.slice(1)
      });
    }
  });
  
  return {
    types: [...options.types].sort(),
    categories: [...options.categories].sort(),
    dateRange: options.dateRange,
    numericFields: options.numericFields
  };
}

/**
 * Generate HTML for filter UI
 */
function generateFilterUI(filterOptions) {
  let html = '<div class="search-filters">';
  
  // Type filter
  if (filterOptions.types.length > 0) {
    html += `
      <div class="filter-section mb-3">
        <label class="form-label small fw-bold">Types</label>
        <div class="type-filters">
          ${filterOptions.types.map(type => `
            <div class="form-check">
              <input class="form-check-input filter-type" type="checkbox" value="${type}" id="type-${type.replace(/\s+/g, '-').toLowerCase()}">
              <label class="form-check-label small" for="type-${type.replace(/\s+/g, '-').toLowerCase()}">
                ${type}
              </label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Category filter
  if (filterOptions.categories.length > 0) {
    html += `
      <div class="filter-section mb-3">
        <label class="form-label small fw-bold">Categories</label>
        <div class="category-filters">
          ${filterOptions.categories.map(category => `
            <div class="form-check">
              <input class="form-check-input filter-category" type="checkbox" value="${category}" id="category-${category.replace(/\s+/g, '-').toLowerCase()}">
              <label class="form-check-label small" for="category-${category.replace(/\s+/g, '-').toLowerCase()}">
                ${category}
              </label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Date range filter
  if (filterOptions.dateRange.min && filterOptions.dateRange.max) {
    html += `
      <div class="filter-section mb-3">
        <label class="form-label small fw-bold">Date Range</label>
        <div class="date-range-filter">
          <div class="input-group input-group-sm mb-2">
            <span class="input-group-text">From</span>
            <input type="date" class="form-control filter-date-from" 
                   min="${filterOptions.dateRange.min}" max="${filterOptions.dateRange.max}" 
                   value="${filterOptions.dateRange.min}">
          </div>
          <div class="input-group input-group-sm">
            <span class="input-group-text">To</span>
            <input type="date" class="form-control filter-date-to" 
                   min="${filterOptions.dateRange.min}" max="${filterOptions.dateRange.max}" 
                   value="${filterOptions.dateRange.max}">
          </div>
        </div>
      </div>
    `;
  }
  
  // Numeric field filters
  if (filterOptions.numericFields.length > 0) {
    html += `
      <div class="filter-section mb-3">
        <label class="form-label small fw-bold">Numeric Filters</label>
        ${filterOptions.numericFields.map(field => `
          <div class="numeric-filter mb-2">
            <label class="form-label small">${field.label}</label>
            <div class="d-flex align-items-center gap-2">
              <input type="number" class="form-control form-control-sm filter-numeric-min" 
                     data-field="${field.field}" placeholder="Min" 
                     min="${field.min}" max="${field.max}" step="any">
              <span class="small">to</span>
              <input type="number" class="form-control form-control-sm filter-numeric-max" 
                     data-field="${field.field}" placeholder="Max" 
                     min="${field.min}" max="${field.max}" step="any">
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // Filter actions
  html += `
    <div class="filter-actions">
      <button class="btn btn-sm btn-primary apply-filters">Apply Filters</button>
      <button class="btn btn-sm btn-outline-secondary ms-2 reset-filters">Reset</button>
    </div>
  `;
  
  html += '</div>';
  return html;
}

/**
 * Add event listeners to filter UI
 */
function addFilterEventListeners(container, filterOptions, onFilterChange) {
  const applyButton = container.querySelector('.apply-filters');
  const resetButton = container.querySelector('.reset-filters');
  
  if (!applyButton || !resetButton) return;
  
  // Apply filters button
  applyButton.addEventListener('click', () => {
    const filters = collectFilterValues(container);
    
    if (typeof onFilterChange === 'function') {
      onFilterChange(filters);
    }
    
    // Track filter usage if UX manager is available
    if (window.uxManager) {
      window.uxManager.trackUserAction('filters_applied', {
        filterCount: Object.keys(filters).filter(k => 
          filters[k] !== null && 
          (!Array.isArray(filters[k]) || filters[k].length > 0)
        ).length
      });
    }
    
    // Dispatch filter event for other components
    window.dispatchEvent(new CustomEvent('search:filtersChanged', {
      detail: { filters }
    }));
  });
  
  // Reset filters button
  resetButton.addEventListener('click', () => {
    resetFilterValues(container, filterOptions);
    
    if (typeof onFilterChange === 'function') {
      onFilterChange({});
    }
    
    // Track filter reset if UX manager is available
    if (window.uxManager) {
      window.uxManager.trackUserAction('filters_reset');
    }
    
    // Dispatch filter event for other components
    window.dispatchEvent(new CustomEvent('search:filtersChanged', {
      detail: { filters: {} }
    }));
  });
}

/**
 * Collect filter values from UI
 */
function collectFilterValues(container) {
  const filters = {};
  
  // Type filters
  const typeCheckboxes = container.querySelectorAll('.filter-type:checked');
  if (typeCheckboxes.length > 0) {
    filters.types = Array.from(typeCheckboxes).map(cb => cb.value);
  }
  
  // Category filters
  const categoryCheckboxes = container.querySelectorAll('.filter-category:checked');
  if (categoryCheckboxes.length > 0) {
    filters.categories = Array.from(categoryCheckboxes).map(cb => cb.value);
  }
  
  // Date range filter
  const dateFrom = container.querySelector('.filter-date-from');
  const dateTo = container.querySelector('.filter-date-to');
  if (dateFrom && dateTo && (dateFrom.value || dateTo.value)) {
    filters.dateRange = {
      start: dateFrom.value || null,
      end: dateTo.value || null,
      field: 'date'
    };
  }
  
  // Numeric filters
  const numericMins = container.querySelectorAll('.filter-numeric-min');
  const numericMaxs = container.querySelectorAll('.filter-numeric-max');
  
  numericMins.forEach(input => {
    const field = input.dataset.field;
    const min = input.value ? parseFloat(input.value) : null;
    const maxInput = Array.from(numericMaxs).find(m => m.dataset.field === field);
    const max = maxInput && maxInput.value ? parseFloat(maxInput.value) : null;
    
    if ((min !== null || max !== null) && field) {
      filters[`${field}Range`] = {
        min,
        max,
        field
      };
    }
  });
  
  return filters;
}

/**
 * Reset filter values to defaults
 */
function resetFilterValues(container, filterOptions) {
  // Reset type checkboxes
  container.querySelectorAll('.filter-type').forEach(cb => {
    cb.checked = false;
  });
  
  // Reset category checkboxes
  container.querySelectorAll('.filter-category').forEach(cb => {
    cb.checked = false;
  });
  
  // Reset date range
  const dateFrom = container.querySelector('.filter-date-from');
  const dateTo = container.querySelector('.filter-date-to');
  
  if (dateFrom && dateTo) {
    dateFrom.value = filterOptions.dateRange.min || '';
    dateTo.value = filterOptions.dateRange.max || '';
  }
  
  // Reset numeric filters
  container.querySelectorAll('.filter-numeric-min, .filter-numeric-max').forEach(input => {
    input.value = '';
  });
}
