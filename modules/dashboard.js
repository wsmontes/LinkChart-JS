// Investigative Analytics Platform - Dashboard Module
// Enhanced with Chart.js integration, export functionality, and custom chart builder
// Handles dashboard chart rendering, chart builder UI, visual query builder, and query engine.

import { renderDashboard, showChartBuilderUI, enableChartBuilder } from './dashboard/charts.js';
import { exportChartImage, exportDashboardAsPDF } from './dashboard/exportImage.js';
import { showFieldPicker } from './dashboard/fieldPicker.js';

// Dashboard data storage
let dashboardData = null;

// Initialize dashboard system
export function initDashboard() {
  console.log('Initializing enhanced dashboard system...');
  
  // Listen for data resolution events
  window.addEventListener('data:entitiesResolved', (e) => {
    dashboardData = e.detail;
    console.log('Dashboard data received:', dashboardData);
    renderDashboard(dashboardData);
  });
  
  // Initialize export functionality
  initExportSystem();
  
  // Initialize visual query builder
  initVisualQueryBuilder();
}

// Initialize export system
function initExportSystem() {
  // Individual chart export buttons (can be added to each chart)
  const addExportButtons = () => {
    document.querySelectorAll('.tab-pane canvas').forEach(canvas => {
      const container = canvas.parentElement;
      if (!container.querySelector('.chart-export-btn')) {
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-sm btn-outline-secondary chart-export-btn mt-2';
        exportBtn.innerHTML = '<i class="fas fa-download me-1"></i>Export';
        exportBtn.style.float = 'right';
        
        exportBtn.onclick = () => {
          const chartId = canvas.id;
          exportChartImage(chartId, 'png');
        };
        
        container.appendChild(exportBtn);
      }
    });
  };
  
  // Add export buttons when dashboard is rendered
  setTimeout(addExportButtons, 1000);
}

// Enhanced visual query builder
export function initVisualQueryBuilder() {
  const qb = document.getElementById('queryBuilder');
  if (!qb) return;
  
  qb.innerHTML = `
    <div class="row g-2 align-items-center">
      <div class="col-auto">
        <input type="text" class="form-control form-control-sm" id="qFrom" placeholder="From (ID or name)">
      </div>
      <div class="col-auto">
        <input type="text" class="form-control form-control-sm" id="qTo" placeholder="To (ID or name, optional)">
      </div>
      <div class="col-auto">
        <input type="number" class="form-control form-control-sm" id="qHops" placeholder="Hops" min="1" value="2" style="width:70px;">
      </div>
      <div class="col-auto">
        <input type="text" class="form-control form-control-sm" id="qProp" placeholder="Property filter (e.g. amount>1000)">
      </div>
      <div class="col-auto">
        <button class="btn btn-primary btn-sm" id="runQuery">
          <i class="fas fa-search me-1"></i>Query
        </button>
      </div>
      <div class="col-auto">
        <button class="btn btn-secondary btn-sm" id="clearQuery">
          <i class="fas fa-times me-1"></i>Clear
        </button>
      </div>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('runQuery').onclick = () => {
    const from = document.getElementById('qFrom').value.trim();
    const to = document.getElementById('qTo').value.trim();
    const hops = parseInt(document.getElementById('qHops').value, 10) || 2;
    const prop = document.getElementById('qProp').value.trim();
    
    window.dispatchEvent(new CustomEvent('query:run', { 
      detail: { from, to, hops, prop } 
    }));
  };
  
  document.getElementById('clearQuery').onclick = () => {
    document.getElementById('qFrom').value = '';
    document.getElementById('qTo').value = '';
    document.getElementById('qHops').value = '2';
    document.getElementById('qProp').value = '';
  };
}

// Enhanced query engine
export function initQueryEngine(nodes, edges) {
  console.log('Initializing enhanced query engine...');
  
  window.addEventListener('query:run', (e) => {
    const { from, to, hops, prop } = e.detail;
    console.log('Running query:', { from, to, hops, prop });
    
    let fromNode = nodes.find(n => n.id === from || n.name === from);
    let toNode = to ? nodes.find(n => n.id === to || n.name === to) : null;
    let result = [];
    
    if (fromNode && toNode) {
      // Find path between two nodes
      const path = findShortestPath(nodes, edges, fromNode.id, toNode.id);
      if (path && path.length - 1 <= hops) {
        result = path.map(id => nodes.find(n => n.id === id));
      }
    } else if (fromNode) {
      // Find all nodes within hops from starting node
      const visited = new Set([fromNode.id]);
      let frontier = [fromNode.id];
      
      for (let i = 0; i < hops; ++i) {
        const next = [];
        edges.forEach(e => {
          if (frontier.includes(e.source) && !visited.has(e.target)) {
            visited.add(e.target);
            next.push(e.target);
          }
          if (frontier.includes(e.target) && !visited.has(e.source)) {
            visited.add(e.source);
            next.push(e.source);
          }
        });
        frontier = next;
      }
      result = Array.from(visited).map(id => nodes.find(n => n.id === id));
    }
    
    // Apply property filter
    if (prop && result.length) {
      result = applyPropertyFilter(result, prop);
    }
    
    // Dispatch results
    window.dispatchEvent(new CustomEvent('query:results', { 
      detail: { 
        results: result, 
        query: { from, to, hops, prop },
        summary: `Found ${result.length} entities` 
      } 
    }));
    
    console.log('Query results:', result);
  });
}

// Apply property filter to results
function applyPropertyFilter(nodes, prop) {
  try {
    const [field, opval] = prop.split(/([<>=!]+)/);
    if (field && opval) {
      const op = opval.match(/[<>=!]+/)?.[0];
      const val = opval.replace(op, '').trim();
      
      return nodes.filter(n => {
        const v = n[field.trim()];
        if (v === undefined) return false;
        
        switch (op) {
          case '>': return parseFloat(v) > parseFloat(val);
          case '>=': return parseFloat(v) >= parseFloat(val);
          case '<': return parseFloat(v) < parseFloat(val);
          case '<=': return parseFloat(v) <= parseFloat(val);
          case '=': return v == val;
          case '!=': return v != val;
          default: return true;
        }
      });
    }
  } catch (error) {
    console.error('Error applying property filter:', error);
  }
  return nodes;
}

// Find shortest path between two nodes (Breadth-First Search)
function findShortestPath(nodes, edges, startId, endId) {
  if (startId === endId) return [startId];
  
  const visited = new Set();
  const queue = [[startId]];
  visited.add(startId);
  
  while (queue.length > 0) {
    const path = queue.shift();
    const currentId = path[path.length - 1];
    
    // Find neighbors
    const neighbors = edges
      .filter(e => e.source === currentId || e.target === currentId)
      .map(e => e.source === currentId ? e.target : e.source)
      .filter(id => !visited.has(id));
    
    for (const neighborId of neighbors) {
      const newPath = [...path, neighborId];
      
      if (neighborId === endId) {
        return newPath;
      }
      
      visited.add(neighborId);
      queue.push(newPath);
    }
  }
  
  return null; // No path found
}

// Export functions for external use
export { showChartBuilderUI, enableChartBuilder, exportChartImage, exportDashboardAsPDF, showFieldPicker };

// Get current dashboard data
export function getDashboardData() {
  return dashboardData;
}
