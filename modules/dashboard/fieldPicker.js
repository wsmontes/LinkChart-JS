// Submodule for dashboard field picker UI
// Advanced field selection interface for custom chart creation

let currentModal = null;
let currentCallback = null;

// Show field picker modal for chart configuration
export function showFieldPicker(fields, onPick, options = {}) {
  const {
    title = 'Configure Chart',
    chartTypes = ['bar', 'line', 'pie', 'doughnut', 'scatter'],
    allowMultiSelect = false,
    showAggregation = true,
    showGrouping = true
  } = options;

  // Create modal if it doesn't exist
  if (!currentModal) {
    currentModal = createFieldPickerModal();
  }

  currentCallback = onPick;
  
  // Populate modal content
  populateFieldPicker(fields, { title, chartTypes, allowMultiSelect, showAggregation, showGrouping });
  
  // Show modal
  const modalInstance = new bootstrap.Modal(currentModal);
  modalInstance.show();
  
  return modalInstance;
}

// Create the field picker modal DOM structure
function createFieldPickerModal() {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'fieldPickerModal';
  modal.setAttribute('tabindex', '-1');
  modal.setAttribute('aria-labelledby', 'fieldPickerModalLabel');
  modal.setAttribute('aria-hidden', 'true');
  
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content" style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);">
        <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
          <h5 class="modal-title" id="fieldPickerModalLabel">
            <i class="fas fa-chart-line me-2"></i>Configure Chart
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div id="fieldPickerContent">
            <!-- Content will be populated dynamically -->
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            <i class="fas fa-times me-1"></i>Cancel
          </button>
          <button type="button" class="btn btn-primary" id="applyFieldSelection">
            <i class="fas fa-check me-1"></i>Create Chart
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  modal.querySelector('#applyFieldSelection').addEventListener('click', handleApplySelection);
  modal.addEventListener('hidden.bs.modal', cleanup);
  
  return modal;
}

// Populate the field picker with options
function populateFieldPicker(fields, options) {
  const content = document.getElementById('fieldPickerContent');
  const { title, chartTypes, allowMultiSelect, showAggregation, showGrouping } = options;
  
  // Update modal title
  document.getElementById('fieldPickerModalLabel').innerHTML = `
    <i class="fas fa-chart-line me-2"></i>${title}
  `;
  
  content.innerHTML = `
    <div class="row">
      <!-- Chart Type Selection -->
      <div class="col-md-6">
        <div class="card mb-3" style="background: rgba(255, 255, 255, 0.8);">
          <div class="card-header">
            <i class="fas fa-chart-bar me-2"></i>Chart Type
          </div>
          <div class="card-body">
            <div class="row">
              ${chartTypes.map(type => `
                <div class="col-6 mb-2">
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="chartType" id="chart-${type}" value="${type}" ${type === 'bar' ? 'checked' : ''}>
                    <label class="form-check-label" for="chart-${type}">
                      <i class="fas fa-${getChartIcon(type)} me-1"></i>${capitalizeFirst(type)}
                    </label>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Field Selection -->
      <div class="col-md-6">
        <div class="card mb-3" style="background: rgba(255, 255, 255, 0.8);">
          <div class="card-header">
            <i class="fas fa-columns me-2"></i>Data Fields
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label for="xAxisField" class="form-label">X-Axis Field</label>
              <select class="form-select" id="xAxisField">
                <option value="">Select field...</option>
                ${fields.map(field => `<option value="${field}">${field}</option>`).join('')}
              </select>
            </div>
            <div class="mb-3">
              <label for="yAxisField" class="form-label">Y-Axis Field</label>
              <select class="form-select" id="yAxisField">
                <option value="">Select field...</option>
                ${fields.map(field => `<option value="${field}">${field}</option>`).join('')}
              </select>
            </div>
            ${allowMultiSelect ? `
              <div class="mb-3">
                <label class="form-label">Additional Fields</label>
                <div class="additional-fields">
                  ${fields.map(field => `
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="field-${field}" value="${field}">
                      <label class="form-check-label" for="field-${field}">${field}</label>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
    
    ${showAggregation ? `
      <div class="row">
        <div class="col-md-6">
          <div class="card mb-3" style="background: rgba(255, 255, 255, 0.8);">
            <div class="card-header">
              <i class="fas fa-calculator me-2"></i>Aggregation
            </div>
            <div class="card-body">
              <select class="form-select" id="aggregationType">
                <option value="count">Count</option>
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
              </select>
            </div>
          </div>
        </div>
        
        ${showGrouping ? `
          <div class="col-md-6">
            <div class="card mb-3" style="background: rgba(255, 255, 255, 0.8);">
              <div class="card-header">
                <i class="fas fa-layer-group me-2"></i>Group By
              </div>
              <div class="card-body">
                <select class="form-select" id="groupByField">
                  <option value="">No grouping</option>
                  ${fields.map(field => `<option value="${field}">${field}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    ` : ''}
    
    <div class="row">
      <div class="col-12">
        <div class="card" style="background: rgba(255, 255, 255, 0.8);">
          <div class="card-header">
            <i class="fas fa-palette me-2"></i>Chart Options
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-4">
                <div class="mb-3">
                  <label for="chartTitle" class="form-label">Chart Title</label>
                  <input type="text" class="form-control" id="chartTitle" placeholder="Enter chart title">
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label for="colorScheme" class="form-label">Color Scheme</label>
                  <select class="form-select" id="colorScheme">
                    <option value="default">Default</option>
                    <option value="professional">Professional</option>
                    <option value="vibrant">Vibrant</option>
                    <option value="pastel">Pastel</option>
                    <option value="monochrome">Monochrome</option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label">Chart Options</label>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="showLegend" checked>
                    <label class="form-check-label" for="showLegend">Show Legend</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="enableAnimation" checked>
                    <label class="form-check-label" for="enableAnimation">Enable Animation</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add dynamic field validation
  addFieldValidation();
}

// Add validation and dynamic updates to field selection
function addFieldValidation() {
  const chartTypeInputs = document.querySelectorAll('input[name="chartType"]');
  const xAxisField = document.getElementById('xAxisField');
  const yAxisField = document.getElementById('yAxisField');
  
  // Update field requirements based on chart type
  chartTypeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      updateFieldRequirements(e.target.value);
    });
  });
  
  // Real-time validation
  [xAxisField, yAxisField].forEach(field => {
    field.addEventListener('change', validateFieldSelection);
  });
}

// Update field requirements based on selected chart type
function updateFieldRequirements(chartType) {
  const yAxisField = document.getElementById('yAxisField');
  const yAxisLabel = document.querySelector('label[for="yAxisField"]');
  
  if (chartType === 'pie' || chartType === 'doughnut') {
    yAxisField.disabled = true;
    yAxisLabel.textContent = 'Y-Axis Field (Not needed for pie charts)';
  } else {
    yAxisField.disabled = false;
    yAxisLabel.textContent = 'Y-Axis Field';
  }
  
  validateFieldSelection();
}

// Validate current field selection
function validateFieldSelection() {
  const chartType = document.querySelector('input[name="chartType"]:checked')?.value;
  const xAxisField = document.getElementById('xAxisField').value;
  const yAxisField = document.getElementById('yAxisField').value;
  const applyButton = document.getElementById('applyFieldSelection');
  
  let isValid = false;
  
  if (chartType === 'pie' || chartType === 'doughnut') {
    isValid = xAxisField !== '';
  } else {
    isValid = xAxisField !== '' && yAxisField !== '';
  }
  
  applyButton.disabled = !isValid;
  applyButton.className = isValid ? 'btn btn-primary' : 'btn btn-secondary';
}

// Handle apply selection button click
function handleApplySelection() {
  const config = gatherConfiguration();
  
  if (config && currentCallback) {
    currentCallback(config);
    bootstrap.Modal.getInstance(currentModal).hide();
  }
}

// Gather all configuration from the form
function gatherConfiguration() {
  const chartType = document.querySelector('input[name="chartType"]:checked')?.value;
  const xAxisField = document.getElementById('xAxisField').value;
  const yAxisField = document.getElementById('yAxisField').value;
  const aggregationType = document.getElementById('aggregationType')?.value || 'count';
  const groupByField = document.getElementById('groupByField')?.value || '';
  const chartTitle = document.getElementById('chartTitle').value || 'Custom Chart';
  const colorScheme = document.getElementById('colorScheme').value || 'default';
  const showLegend = document.getElementById('showLegend')?.checked ?? true;
  const enableAnimation = document.getElementById('enableAnimation')?.checked ?? true;
  
  // Get additional fields if multi-select is enabled
  const additionalFields = [];
  document.querySelectorAll('.additional-fields input[type="checkbox"]:checked').forEach(checkbox => {
    additionalFields.push(checkbox.value);
  });
  
  if (!chartType || !xAxisField || (!yAxisField && chartType !== 'pie' && chartType !== 'doughnut')) {
    alert('Please select required fields for the chart.');
    return null;
  }
  
  return {
    chartType,
    xAxisField,
    yAxisField,
    additionalFields,
    aggregationType,
    groupByField,
    chartTitle,
    colorScheme,
    showLegend,
    enableAnimation
  };
}

// Get appropriate icon for chart type
function getChartIcon(type) {
  const icons = {
    bar: 'chart-bar',
    line: 'chart-line',
    pie: 'chart-pie',
    doughnut: 'circle-notch',
    scatter: 'braille'
  };
  return icons[type] || 'chart-bar';
}

// Capitalize first letter
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Cleanup function
function cleanup() {
  currentCallback = null;
}

// Quick field picker for simple charts
export function showQuickFieldPicker(fields, chartType, onPick) {
  const quickConfig = {
    title: `Create ${capitalizeFirst(chartType)} Chart`,
    chartTypes: [chartType],
    allowMultiSelect: false,
    showAggregation: true,
    showGrouping: false
  };
  
  return showFieldPicker(fields, onPick, quickConfig);
}

// Export current modal instance for external control
export function getCurrentModal() {
  return currentModal;
}

// Destroy modal (cleanup)
export function destroyFieldPicker() {
  if (currentModal) {
    document.body.removeChild(currentModal);
    currentModal = null;
    currentCallback = null;
  }
}
