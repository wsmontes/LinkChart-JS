// Submodule for chart export (PNG, SVG, JPG)
// Provides comprehensive chart export functionality for investigative analytics

// Chart.js instance registry for export operations
const chartInstances = new Map();

// Register a chart instance for export capabilities
export function registerChartForExport(chartId, chartInstance) {
  chartInstances.set(chartId, chartInstance);
}

// Unregister a chart instance (cleanup)
export function unregisterChart(chartId) {
  chartInstances.delete(chartId);
}

// Export a specific chart as an image
export function exportChartImage(chartId, type = 'png', filename = null, quality = 0.9) {
  const chartInstance = chartInstances.get(chartId);
  if (!chartInstance) {
    console.error(`Chart instance not found for ID: ${chartId}`);
    return false;
  }

  try {
    // Get the canvas element from Chart.js
    const canvas = chartInstance.canvas;
    if (!canvas) {
      console.error(`Canvas not found for chart: ${chartId}`);
      return false;
    }

    // Generate filename if not provided
    const defaultFilename = filename || `${chartId}_${new Date().toISOString().split('T')[0]}.${type}`;
    
    // Export based on type
    switch (type.toLowerCase()) {
      case 'png':
        return exportAsPNG(canvas, defaultFilename, quality);
      case 'jpg':
      case 'jpeg':
        return exportAsJPEG(canvas, defaultFilename, quality);
      case 'svg':
        return exportAsSVG(chartInstance, defaultFilename);
      default:
        console.error(`Unsupported export type: ${type}`);
        return false;
    }
  } catch (error) {
    console.error('Error exporting chart:', error);
    return false;
  }
}

// Export canvas as PNG
function exportAsPNG(canvas, filename, quality) {
  try {
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, filename);
      }
    }, 'image/png', quality);
    return true;
  } catch (error) {
    console.error('Error exporting PNG:', error);
    return false;
  }
}

// Export canvas as JPEG
function exportAsJPEG(canvas, filename, quality) {
  try {
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, filename);
      }
    }, 'image/jpeg', quality);
    return true;
  } catch (error) {
    console.error('Error exporting JPEG:', error);
    return false;
  }
}

// Export as SVG (requires special handling for Chart.js)
function exportAsSVG(chartInstance, filename) {
  try {
    // For SVG export, we'll create a high-quality PNG and convert
    // Real SVG export from Chart.js requires additional plugins
    const canvas = chartInstance.canvas;
    const ctx = canvas.getContext('2d');
    
    // Create a higher resolution canvas for better quality
    const scaleFactor = 2;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width * scaleFactor;
    tempCanvas.height = canvas.height * scaleFactor;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Scale the context and redraw
    tempCtx.scale(scaleFactor, scaleFactor);
    tempCtx.drawImage(canvas, 0, 0);
    
    // Export as high-quality PNG (SVG export would require chart.js plugin)
    tempCanvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, filename.replace('.svg', '.png'));
      }
    }, 'image/png', 0.95);
    
    return true;
  } catch (error) {
    console.error('Error exporting SVG:', error);
    return false;
  }
}

// Download blob as file
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export all visible charts in dashboard
export function exportAllCharts(format = 'png') {
  const exportPromises = [];
  
  chartInstances.forEach((chartInstance, chartId) => {
    if (chartInstance && chartInstance.canvas) {
      const canvas = chartInstance.canvas;
      const container = canvas.closest('.tab-pane');
      
      // Only export visible charts
      if (container && container.classList.contains('active')) {
        exportPromises.push(exportChartImage(chartId, format));
      }
    }
  });
  
  return Promise.all(exportPromises);
}

// Export dashboard as PDF report
export function exportDashboardAsPDF() {
  return new Promise((resolve, reject) => {
    try {
      // Collect all chart canvases
      const chartElements = [];
      chartInstances.forEach((chartInstance, chartId) => {
        if (chartInstance && chartInstance.canvas) {
          const canvas = chartInstance.canvas;
          const container = canvas.closest('.tab-pane');
          if (container) {
            chartElements.push({
              id: chartId,
              canvas: canvas,
              title: getChartTitle(chartId)
            });
          }
        }
      });

      // Create PDF content
      const pdfContent = createPDFContent(chartElements);
      
      // Generate PDF using html2pdf
      const options = {
        margin: 1,
        filename: `investigative_analytics_report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().set(options).from(pdfContent).save().then(resolve).catch(reject);
    } catch (error) {
      console.error('Error creating PDF report:', error);
      reject(error);
    }
  });
}

// Create PDF content from charts
function createPDFContent(chartElements) {
  const timestamp = new Date().toLocaleString();
  
  let content = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">
        Investigative Analytics Report
      </h1>
      <p style="color: #7f8c8d; margin-bottom: 30px;">Generated on ${timestamp}</p>
  `;

  chartElements.forEach((chart, index) => {
    content += `
      <div style="page-break-inside: avoid; margin-bottom: 30px;">
        <h2 style="color: #34495e; margin-bottom: 15px;">${chart.title}</h2>
        <div style="text-align: center; margin-bottom: 20px;">
          <canvas id="pdf-${chart.id}" style="max-width: 100%; height: auto;"></canvas>
        </div>
      </div>
    `;
  });

  content += `</div>`;
  
  // Create temporary element for PDF generation
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  tempDiv.style.display = 'none';
  document.body.appendChild(tempDiv);

  // Copy canvases to PDF content
  chartElements.forEach((chart) => {
    const pdfCanvas = tempDiv.querySelector(`#pdf-${chart.id}`);
    if (pdfCanvas && chart.canvas) {
      pdfCanvas.width = chart.canvas.width;
      pdfCanvas.height = chart.canvas.height;
      const ctx = pdfCanvas.getContext('2d');
      ctx.drawImage(chart.canvas, 0, 0);
    }
  });

  return tempDiv;
}

// Get chart title from chart instance or container
function getChartTitle(chartId) {
  const titleMap = {
    'timelineChart': 'Timeline Analysis',
    'barChart': 'Bar Chart Analysis', 
    'scatterChart': 'Scatter Plot Analysis',
    'entityTypeChart': 'Entity Type Distribution',
    'connectionChart': 'Connection Analysis'
  };
  
  return titleMap[chartId] || chartId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// Cleanup function for when dashboard is destroyed
export function cleanup() {
  chartInstances.clear();
}
