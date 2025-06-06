// Submodule for PDF/CSV/JSON export

// Export data in various formats
export function exportData(data, type = 'csv', filename = 'investigative_data') {
  try {
    switch (type.toLowerCase()) {
      case 'csv':
        exportAsCSV(data, filename);
        break;
      case 'json':
        exportAsJSON(data, filename);
        break;
      case 'pdf':
        exportAsPDF(data, filename);
        break;
      default:
        throw new Error(`Unsupported export type: ${type}`);
    }
    
    // Show success notification
    window.dispatchEvent(new CustomEvent('notification:show', {
      detail: {
        type: 'success',
        message: `Data exported as ${type.toUpperCase()} successfully`
      }
    }));
  } catch (error) {
    console.error('Export error:', error);
    window.dispatchEvent(new CustomEvent('notification:show', {
      detail: {
        type: 'error',
        message: `Export failed: ${error.message}`
      }
    }));
  }
}

// Export as CSV
function exportAsCSV(data, filename) {
  let csvContent = '';
  
  if (data.nodes && data.nodes.length > 0) {
    // Export nodes
    const nodeHeaders = Object.keys(data.nodes[0]);
    csvContent += 'NODES\n';
    csvContent += nodeHeaders.join(',') + '\n';
    
    data.nodes.forEach(node => {
      const row = nodeHeaders.map(header => {
        const value = node[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvContent += row.join(',') + '\n';
    });
    
    csvContent += '\n';
  }
  
  if (data.edges && data.edges.length > 0) {
    // Export edges
    const edgeHeaders = Object.keys(data.edges[0]);
    csvContent += 'RELATIONSHIPS\n';
    csvContent += edgeHeaders.join(',') + '\n';
    
    data.edges.forEach(edge => {
      const row = edgeHeaders.map(header => {
        const value = edge[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvContent += row.join(',') + '\n';
    });
  }
  
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

// Export as JSON
function exportAsJSON(data, filename) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

// Export as PDF (basic implementation)
function exportAsPDF(data, filename) {
  // For a full PDF implementation, you'd typically use jsPDF or similar
  // This is a simplified version that creates a text-based PDF
  
  let content = 'INVESTIGATIVE ANALYTICS REPORT\n';
  content += '='.repeat(40) + '\n\n';
  content += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  if (data.nodes) {
    content += `ENTITIES (${data.nodes.length} total)\n`;
    content += '-'.repeat(20) + '\n';
    data.nodes.forEach((node, index) => {
      content += `${index + 1}. ${node.name || node.id || 'Unknown'}\n`;
      if (node.type) content += `   Type: ${node.type}\n`;
      if (node.description) content += `   Description: ${node.description}\n`;
      content += '\n';
    });
  }
  
  if (data.edges) {
    content += `RELATIONSHIPS (${data.edges.length} total)\n`;
    content += '-'.repeat(20) + '\n';
    data.edges.forEach((edge, index) => {
      content += `${index + 1}. ${edge.source} → ${edge.target}\n`;
      if (edge.type) content += `   Type: ${edge.type}\n`;
      if (edge.description) content += `   Description: ${edge.description}\n`;
      content += '\n';
    });
  }
  
  // For now, download as text file (in a real implementation, use jsPDF)
  downloadFile(content, `${filename}_report.txt`, 'text/plain');
}

// Helper function to download file
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Build report template
export function buildReportTemplate(data) {
  if (!data || !data.nodes) {
    return {
      title: 'Investigation Report',
      summary: 'No data available',
      entities: [],
      relationships: [],
      insights: []
    };
  }
  
  const summary = `Analysis of ${data.nodes.length} entities and ${data.edges?.length || 0} relationships`;
  
  const entityTypes = {};
  data.nodes.forEach(node => {
    const type = node.type || 'Unknown';
    entityTypes[type] = (entityTypes[type] || 0) + 1;
  });
  
  const relationshipTypes = {};
  if (data.edges) {
    data.edges.forEach(edge => {
      const type = edge.type || 'Unknown';
      relationshipTypes[type] = (relationshipTypes[type] || 0) + 1;
    });
  }
  
  return {
    title: 'Investigative Analytics Report',
    summary,
    entities: data.nodes.slice(0, 10), // Top 10 entities
    relationships: data.edges?.slice(0, 10) || [], // Top 10 relationships
    insights: [
      `Entity types distribution: ${Object.entries(entityTypes).map(([type, count]) => `${type} (${count})`).join(', ')}`,
      `Relationship types distribution: ${Object.entries(relationshipTypes).map(([type, count]) => `${type} (${count})`).join(', ')}`,
      `Most connected entities: ${findMostConnectedEntities(data).map(e => e.name || e.id).join(', ')}`
    ]
  };
}

// Helper function to find most connected entities
function findMostConnectedEntities(data, limit = 3) {
  if (!data.edges || !data.nodes) return [];
  
  const connections = {};
  data.edges.forEach(edge => {
    connections[edge.source] = (connections[edge.source] || 0) + 1;
    connections[edge.target] = (connections[edge.target] || 0) + 1;
  });
  
  return data.nodes
    .map(node => ({ ...node, connections: connections[node.id] || 0 }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, limit);
}
