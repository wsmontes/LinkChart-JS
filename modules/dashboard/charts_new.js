// filepath: /Users/wagnermontes/Documents/GitHub/_TESTS/LinkChart_TEST/modules/dashboard/charts.js
// Dashboard Charts Submodule - Enhanced Version
// Handles chart rendering, chart builder UI, visual query builder, and advanced visualizations

export { exportDashboardAsPDF } from './exportImage.js';
export { showFieldPicker } from './fieldPicker.js';

import { registerChartForExport } from './exportImage.js';

let dashboardData = null;
let chartInstances = {};

// Main dashboard rendering function
export function renderDashboard(data) {
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    // Optionally, show a user-friendly error in the dashboard UI
    console.warn('Dashboard data is missing or malformed:', data);
    clearCharts();
    // Optionally, display a message in the dashboard container
    const dashboardContainer = document.getElementById('dashboardContainer');
    if (dashboardContainer) {
      dashboardContainer.innerHTML = `<div class="alert alert-warning">Dashboard data is missing or invalid.</div>`;
    }
    return;
  }
  
  dashboardData = data;
  const { nodes, edges } = data;
  
  // Clear existing charts
  clearCharts();
  
  // Render basic statistics
  renderStatistics(nodes, edges);
  
  // Render tab-based charts
  renderTabCharts(nodes, edges);
  
  // Enable chart builder and export functionality
  enableChartBuilder(data);
  enableExportFunctionality();
}

// Render charts in dashboard tabs
function renderTabCharts(nodes, edges) {
  // Initialize tab event listeners
  initializeTabHandlers();
  
  // Render charts for each tab
  renderTimelineTab(nodes);
  renderBarTab(nodes, edges);
  renderScatterTab(nodes);
  
  // Set default active tab
  showActiveTabChart();
}

// Initialize tab change handlers
function initializeTabHandlers() {
  const tabButtons = document.querySelectorAll('#chartTabs button[data-bs-toggle="tab"]');
  
  tabButtons.forEach(button => {
    button.addEventListener('shown.bs.tab', (e) => {
      const targetTab = e.target.getAttribute('data-bs-target');
      
      // Resize charts when tab becomes visible
      setTimeout(() => {
        resizeChartsInTab(targetTab);
      }, 100);
    });
  });
}

// Render timeline chart in timeline tab
function renderTimelineTab(nodes) {
  const canvas = document.getElementById('timelineChart');
  if (!canvas) return;
  
  // Extract date information
  const datedNodes = nodes.filter(node => node.date || node.timestamp || node.created_at);
  if (datedNodes.length === 0) {
    const container = canvas.parentElement;
    container.innerHTML = `
      <div class="text-center p-4">
        <i class="fas fa-clock fa-3x text-muted mb-3"></i>
        <p class="text-muted">No temporal data available</p>
        <small>Nodes need date, timestamp, or created_at fields</small>
      </div>
    `;
    return;
  }
  
  const timeGroups = {};
  datedNodes.forEach(node => {
    const dateValue = node.date || node.timestamp || node.created_at;
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      timeGroups[monthKey] = (timeGroups[monthKey] || 0) + 1;
    }
  });
  
  const sortedDates = Object.keys(timeGroups).sort();
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart if it exists
  if (chartInstances.timeline) {
    chartInstances.timeline.destroy();
  }
  
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
  gradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)');
  
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedDates,
      datasets: [{
        label: 'Activity Over Time',
        data: sortedDates.map(date => timeGroups[date]),
        borderColor: '#667eea',
        backgroundColor: gradient,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#667eea',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Time Period'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Activity Count'
          },
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
  
  chartInstances.timeline = chart;
  registerChartForExport('timelineChart', chart);
}

// Render bar chart in bar tab
function renderBarTab(nodes, edges) {
  const canvas = document.getElementById('barChart');
  if (!canvas) return;
  
  // Create entity type distribution chart
  const entityTypes = {};
  nodes.forEach(node => {
    const type = node.type || node.category || 'Unknown';
    entityTypes[type] = (entityTypes[type] || 0) + 1;
  });
  
  if (Object.keys(entityTypes).length === 0) {
    const container = canvas.parentElement;
    container.innerHTML = `
      <div class="text-center p-4">
        <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
        <p class="text-muted">No data available for bar chart</p>
      </div>
    `;
    return;
  }
  
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart if it exists
  if (chartInstances.bar) {
    chartInstances.bar.destroy();
  }
  
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#a8edea', '#d299c2'
  ];
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(entityTypes),
      datasets: [{
        label: 'Entity Count',
        data: Object.values(entityTypes),
        backgroundColor: colors.slice(0, Object.keys(entityTypes).length),
        borderColor: colors.slice(0, Object.keys(entityTypes).length).map(color => color + 'FF'),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#667eea',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Entity Types'
          },
          grid: {
            display: false
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Count'
          },
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
  
  chartInstances.bar = chart;
  registerChartForExport('barChart', chart);
}

// Render scatter chart in scatter tab
function renderScatterTab(nodes) {
  const canvas = document.getElementById('scatterChart');
  if (!canvas) return;
  
  // Try to find numeric fields for scatter plot
  const numericFields = findNumericFields(nodes);
  
  if (numericFields.length < 2) {
    const container = canvas.parentElement;
    container.innerHTML = `
      <div class="text-center p-4">
        <i class="fas fa-braille fa-3x text-muted mb-3"></i>
        <p class="text-muted">Insufficient numeric data for scatter plot</p>
        <small>Need at least 2 numeric fields</small>
        <div class="mt-3">
          <button class="btn btn-primary btn-sm" onclick="showCustomChartBuilder()">
            <i class="fas fa-plus me-1"></i>Create Custom Chart
          </button>
        </div>
      </div>
    `;
    return;
  }
  
  // Use first two numeric fields
  const xField = numericFields[0];
  const yField = numericFields[1];
  
  const scatterData = nodes
    .filter(node => node[xField] !== undefined && node[yField] !== undefined)
    .map(node => ({
      x: parseFloat(node[xField]) || 0,
      y: parseFloat(node[yField]) || 0,
      label: node.name || node.id || 'Unknown'
    }));
  
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart if it exists
  if (chartInstances.scatter) {
    chartInstances.scatter.destroy();
  }
  
  const chart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: `${xField} vs ${yField}`,
        data: scatterData,
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: '#667eea',
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return context[0].raw.label || 'Data Point';
            },
            label: function(context) {
              return `${xField}: ${context.raw.x}, ${yField}: ${context.raw.y}`;
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#667eea',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          type: 'linear',
          display: true,
          title: {
            display: true,
            text: xField
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: yField
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
  
  chartInstances.scatter = chart;
  registerChartForExport('scatterChart', chart);
}

// Utility functions for chart management

// Find numeric fields in the dataset
function findNumericFields(nodes) {
  if (!nodes || nodes.length === 0) return [];
  
  const sample = nodes[0];
  const numericFields = [];
  
  for (const [key, value] of Object.entries(sample)) {
    if (typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value))) {
      numericFields.push(key);
    }
  }
  
  return numericFields;
}

// Show active tab chart
function showActiveTabChart() {
  const activeTab = document.querySelector('#chartTabs .nav-link.active');
  if (activeTab) {
    const targetTab = activeTab.getAttribute('data-bs-target');
    resizeChartsInTab(targetTab);
  }
}

// Resize charts in specific tab
function resizeChartsInTab(tabSelector) {
  const tab = document.querySelector(tabSelector);
  if (!tab) return;
  
  const canvasElements = tab.querySelectorAll('canvas');
  canvasElements.forEach(canvas => {
    const chartId = canvas.id.replace('Chart', '').replace('Canvas', '');
    if (chartInstances[chartId]) {
      chartInstances[chartId].resize();
    }
  });
}

// Enable export functionality
function enableExportFunctionality() {
  const exportButton = document.getElementById('exportPDF');
  if (exportButton) {
    exportButton.addEventListener('click', () => {
      exportButton.disabled = true;
      exportButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Exporting...';
      
      exportDashboardAsPDF()
        .then(() => {
          exportButton.disabled = false;
          exportButton.innerHTML = '<i class="fa fa-file-export me-1"></i>Export Report (PDF)';
          
          // Show success message
          showNotification('PDF report exported successfully!', 'success');
        })
        .catch((error) => {
          console.error('Export failed:', error);
          exportButton.disabled = false;
          exportButton.innerHTML = '<i class="fa fa-file-export me-1"></i>Export Report (PDF)';
          
          // Show error message
          showNotification('Failed to export PDF report', 'error');
        });
    });
  }
}

// Show notification message
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

// Global function for custom chart builder (accessible from HTML)
window.showCustomChartBuilder = function() {
  if (!dashboardData) {
    showNotification('No data available for chart creation', 'error');
    return;
  }
  
  const nodes = dashboardData.nodes || [];
  if (nodes.length === 0) {
    showNotification('No node data available', 'error');
    return;
  }
  
  // Extract field names from the first node
  const fields = Object.keys(nodes[0] || {});
  
  showFieldPicker(fields, (config) => {
    createCustomChartFromConfig(config);
  }, {
    title: 'Create Custom Chart',
    chartTypes: ['bar', 'line', 'pie', 'doughnut', 'scatter'],
    allowMultiSelect: false,
    showAggregation: true,
    showGrouping: true
  });
};

// Create custom chart from configuration
function createCustomChartFromConfig(config) {
  const { chartType, xAxisField, yAxisField, aggregationType, groupByField, chartTitle, colorScheme, showLegend, enableAnimation } = config;
  
  // Find a suitable container or create one
  const customContainer = document.getElementById('customChartContainer') || createCustomChartContainer();
  
  // Clear existing custom chart
  customContainer.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="mb-0">${chartTitle}</h6>
      <button class="btn btn-sm btn-outline-secondary" onclick="removeCustomChart()">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <canvas id="customChart" width="400" height="300"></canvas>
  `;
  
  const canvas = document.getElementById('customChart');
  const ctx = canvas.getContext('2d');
  
  // Process data for the chart
  const processedData = processDataForChart(dashboardData.nodes, config);
  
  // Create chart
  const chart = new Chart(ctx, {
    type: chartType,
    data: processedData,
    options: createChartOptions(config)
  });
  
  // Register for export
  chartInstances.custom = chart;
  registerChartForExport('customChart', chart);
  
  // Show success message
  showNotification(`${chartTitle} created successfully!`, 'success');
}

// Create custom chart container if it doesn't exist
function createCustomChartContainer() {
  const container = document.createElement('div');
  container.id = 'customChartContainer';
  container.className = 'mt-3 p-3';
  container.style.cssText = 'background: rgba(255, 255, 255, 0.9); border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
  
  // Insert after the dashboard tabs
  const dashboardTabs = document.getElementById('dashboardTabs');
  if (dashboardTabs && dashboardTabs.parentNode) {
    dashboardTabs.parentNode.insertBefore(container, dashboardTabs.nextSibling);
  }
  
  return container;
}

// Remove custom chart
window.removeCustomChart = function() {
  const container = document.getElementById('customChartContainer');
  if (container) {
    // Destroy chart instance
    if (chartInstances.custom) {
      chartInstances.custom.destroy();
      delete chartInstances.custom;
    }
    container.remove();
  }
};

// Statistics rendering function
function renderStatistics(nodes, edges) {
  const statsContainer = document.getElementById('dashboardStats');
  if (!statsContainer) return;
  
  const entityTypes = {};
  const edgeTypes = {};
  
  nodes.forEach(node => {
    const type = node.type || 'Unknown';
    entityTypes[type] = (entityTypes[type] || 0) + 1;
  });
  
  edges.forEach(edge => {
    const type = edge.label || 'Unknown';
    edgeTypes[type] = (edgeTypes[type] || 0) + 1;
  });
  
  statsContainer.innerHTML = `
    <div class="row">
      <div class="col-md-3">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <h5 class="card-title">${nodes.length}</h5>
            <p class="card-text">Total Entities</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body">
            <h5 class="card-title">${edges.length}</h5>
            <p class="card-text">Total Connections</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body">
            <h5 class="card-title">${Object.keys(entityTypes).length}</h5>
            <p class="card-text">Entity Types</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-white">
          <div class="card-body">
            <h5 class="card-title">${Object.keys(edgeTypes).length}</h5>
            <p class="card-text">Relation Types</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Data processing for custom charts
function processDataForChart(nodes, config) {
  const { chartType, xAxisField, yAxisField, aggregationType, groupByField } = config;
  
  let processedData = {};
  
  if (chartType === 'pie' || chartType === 'doughnut') {
    // For pie/doughnut charts, count occurrences of xAxisField
    const counts = {};
    nodes.forEach(node => {
      const value = node[xAxisField] || 'Unknown';
      counts[value] = (counts[value] || 0) + 1;
    });
    
    processedData = {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: getColorPalette(Object.keys(counts).length, config.colorScheme)
      }]
    };
  } else {
    // For other chart types
    if (groupByField) {
      // Group data by the specified field
      const groups = {};
      nodes.forEach(node => {
        const groupValue = node[groupByField] || 'Unknown';
        if (!groups[groupValue]) groups[groupValue] = [];
        groups[groupValue].push(node);
      });
      
      const labels = Object.keys(groups);
      const data = labels.map(label => {
        const groupNodes = groups[label];
        if (aggregationType === 'count') {
          return groupNodes.length;
        } else if (aggregationType === 'sum') {
          return groupNodes.reduce((sum, node) => sum + (parseFloat(node[yAxisField]) || 0), 0);
        } else if (aggregationType === 'avg') {
          const sum = groupNodes.reduce((sum, node) => sum + (parseFloat(node[yAxisField]) || 0), 0);
          return sum / groupNodes.length;
        }
        return groupNodes.length;
      });
      
      processedData = {
        labels: labels,
        datasets: [{
          label: `${aggregationType} of ${yAxisField || xAxisField}`,
          data: data,
          backgroundColor: getColorPalette(labels.length, config.colorScheme),
          borderColor: getColorPalette(labels.length, config.colorScheme, true),
          borderWidth: 2
        }]
      };
    } else {
      // Simple x/y mapping
      const data = nodes
        .filter(node => node[xAxisField] !== undefined && (yAxisField ? node[yAxisField] !== undefined : true))
        .map(node => ({
          x: node[xAxisField],
          y: yAxisField ? (parseFloat(node[yAxisField]) || 0) : 1
        }));
      
      processedData = {
        datasets: [{
          label: yAxisField ? `${xAxisField} vs ${yAxisField}` : xAxisField,
          data: data,
          backgroundColor: getColorPalette(1, config.colorScheme)[0],
          borderColor: getColorPalette(1, config.colorScheme, true)[0],
          borderWidth: 2
        }]
      };
    }
  }
  
  return processedData;
}

// Create chart options based on configuration
function createChartOptions(config) {
  const { chartType, showLegend, enableAnimation } = config;
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top'
      }
    },
    animation: enableAnimation ? {
      duration: 1000,
      easing: 'easeInOutQuart'
    } : false,
    scales: (chartType !== 'pie' && chartType !== 'doughnut') ? {
      x: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    } : undefined
  };
}

// Get color palette based on scheme
function getColorPalette(count, scheme = 'default', border = false) {
  const palettes = {
    default: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b', '#fa709a', '#fee140'],
    professional: ['#2c3e50', '#34495e', '#3498db', '#2980b9', '#27ae60', '#16a085', '#f39c12', '#e67e22'],
    vibrant: ['#e74c3c', '#9b59b6', '#3498db', '#1abc9c', '#2ecc71', '#f1c40f', '#e67e22', '#95a5a6'],
    pastel: ['#fadbd8', '#d5dbdb', '#d6eaf8', '#d1f2eb', '#d5f4e6', '#fdeaa7', '#fab1a0', '#dda0dd'],
    monochrome: ['#2c3e50', '#34495e', '#5d6d7e', '#85929e', '#aeb6bf', '#d5dbdb', '#eaeded', '#f8f9fa']
  };
  
  const palette = palettes[scheme] || palettes.default;
  const colors = [];
  
  for (let i = 0; i < count; i++) {
    const color = palette[i % palette.length];
    colors.push(border ? color + 'FF' : color);
  }
  
  return colors;
}

// Clear all charts
function clearCharts() {
  Object.values(chartInstances).forEach(chart => {
    if (chart && chart.destroy) {
      chart.destroy();
    }
  });
  chartInstances = {};
}

// Chart builder UI functions
export function showChartBuilderUI(fields, onBuild) {
  showFieldPicker(fields, onBuild, {
    title: 'Chart Builder',
    chartTypes: ['bar', 'line', 'pie', 'doughnut', 'scatter'],
    allowMultiSelect: true,
    showAggregation: true,
    showGrouping: true
  });
}

// Enable chart builder functionality
export function enableChartBuilder(data) {
  // Add chart builder button if it doesn't exist
  const dashboardTabs = document.getElementById('dashboardTabs');
  if (dashboardTabs && !document.getElementById('chartBuilderBtn')) {
    const builderButton = document.createElement('button');
    builderButton.id = 'chartBuilderBtn';
    builderButton.className = 'btn btn-outline-primary btn-sm mt-2 w-100';
    builderButton.innerHTML = '<i class="fas fa-plus me-1"></i>Create Custom Chart';
    builderButton.onclick = () => showCustomChartBuilder();
    
    dashboardTabs.appendChild(builderButton);
  }
}

// Visual query builder (placeholder for future implementation)
export function initVisualQueryBuilder() {
  // This function is kept for compatibility with the main dashboard module
  console.log('Visual query builder initialized');
}

// Query engine (placeholder for future implementation)
export function initQueryEngine(nodes, edges) {
  // This function is kept for compatibility with the main dashboard module
  console.log('Query engine initialized');
}
