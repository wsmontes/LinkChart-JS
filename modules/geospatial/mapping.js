// Submodule for map initialization and rendering

export function initMap(containerId) {
  // Initialize map using Leaflet (fallback implementation)
  if (typeof L === 'undefined') {
    console.warn('Leaflet not loaded, using fallback map implementation');
    return createFallbackMap(containerId);
  }
  
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Map container ${containerId} not found`);
  }
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create map
  const map = L.map(containerId).setView([40.7128, -74.0060], 10); // Default to NYC
  
  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  return {
    instance: map,
    type: 'leaflet',
    markers: [],
    layers: {}
  };
}

function createFallbackMap(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Map container ${containerId} not found`);
  }
  
  container.innerHTML = `
    <div class="d-flex justify-content-center align-items-center h-100 bg-light">
      <div class="text-center">
        <i class="fas fa-map fa-3x text-muted mb-3"></i>
        <p class="text-muted">Interactive map not available</p>
        <p class="small text-muted">Enable Leaflet library for full mapping features</p>
      </div>
    </div>
  `;
  
  return {
    instance: null,
    type: 'fallback',
    markers: [],
    layers: {}
  };
}

export function renderMapPoints(mapWrapper, nodes) {
  if (mapWrapper.type === 'fallback') {
    renderFallbackPoints(mapWrapper, nodes);
    return;
  }
  
  const map = mapWrapper.instance;
  const validNodes = nodes.filter(node => node.latitude && node.longitude);
  
  if (validNodes.length === 0) {
    console.warn('No valid coordinates found for mapping');
    return;
  }
  
  // Clear existing markers
  mapWrapper.markers.forEach(marker => map.removeLayer(marker));
  mapWrapper.markers = [];
  
  // Add markers for each node
  validNodes.forEach(node => {
    const marker = L.marker([node.latitude, node.longitude])
      .bindPopup(createPopupContent(node))
      .addTo(map);
    
    mapWrapper.markers.push(marker);
    
    // Color marker based on node type
    if (node.type) {
      marker.setIcon(createColoredIcon(node.type));
    }
  });
  
  // Fit map to show all markers
  if (validNodes.length > 1) {
    const group = new L.featureGroup(mapWrapper.markers);
    map.fitBounds(group.getBounds().pad(0.1));
  } else {
    map.setView([validNodes[0].latitude, validNodes[0].longitude], 12);
  }
}

function renderFallbackPoints(mapWrapper, nodes) {
  const container = document.getElementById(mapWrapper.containerId);
  const validNodes = nodes.filter(node => node.latitude && node.longitude);
  
  container.innerHTML = `
    <div class="p-3">
      <h6>Location Points (${validNodes.length})</h6>
      <div class="list-group" style="max-height: 200px; overflow-y: auto;">
        ${validNodes.map(node => `
          <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="mb-1">${node.name || node.id}</h6>
                <p class="mb-1 small">${node.type || 'Unknown type'}</p>
                <small class="text-muted">${node.latitude}, ${node.longitude}</small>
              </div>
              <span class="badge bg-secondary">${getLocationTypeIcon(node.type)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function createPopupContent(node) {
  return `
    <div class="map-popup">
      <h6>${node.name || node.id}</h6>
      <p class="mb-1"><strong>Type:</strong> ${node.type || 'Unknown'}</p>
      ${node.address ? `<p class="mb-1"><strong>Address:</strong> ${node.address}</p>` : ''}
      ${node.amount ? `<p class="mb-1"><strong>Amount:</strong> ${node.amount}</p>` : ''}
      ${node.date ? `<p class="mb-1"><strong>Date:</strong> ${node.date}</p>` : ''}
      <p class="small text-muted mb-0">
        <strong>Coordinates:</strong> ${node.latitude}, ${node.longitude}
      </p>
      <div class="mt-2">
        <button class="btn btn-primary btn-sm" onclick="addToCase({id: '${node.id}', name: '${node.name}', type: '${node.type}'})">
          Add to Case
        </button>
      </div>
    </div>
  `;
}

function createColoredIcon(nodeType) {
  const colors = {
    'person': '#ff6b6b',
    'company': '#4ecdc4',
    'location': '#45b7d1',
    'transaction': '#96ceb4',
    'event': '#ffeaa7',
    'vehicle': '#dda0dd',
    'phone': '#98d8c8',
    'email': '#f7dc6f',
    'document': '#bb8fce',
    'unknown': '#85c1e9'
  };
  
  const color = colors[nodeType.toLowerCase()] || colors['unknown'];
  
  if (typeof L !== 'undefined') {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }
  
  return null;
}

function getLocationTypeIcon(type) {
  const icons = {
    'person': '👤',
    'company': '🏢',
    'location': '📍',
    'transaction': '💰',
    'event': '📅',
    'vehicle': '🚗',
    'phone': '📞',
    'email': '📧',
    'document': '📄'
  };
  
  return icons[type?.toLowerCase()] || '📍';
}

export function addHeatLayer(mapWrapper, nodes) {
  if (mapWrapper.type === 'fallback') {
    console.log('Heatmap not available in fallback mode');
    return;
  }
  
  const map = mapWrapper.instance;
  const validNodes = nodes.filter(node => node.latitude && node.longitude);
  
  if (validNodes.length === 0) return;
  
  // Remove existing heat layer
  if (mapWrapper.layers.heat) {
    map.removeLayer(mapWrapper.layers.heat);
  }
  
  // Create heat map data
  const heatData = validNodes.map(node => [
    node.latitude, 
    node.longitude, 
    1 // intensity - could be based on node.amount or other metrics
  ]);
  
  // Note: This requires Leaflet.heat plugin
  if (typeof L.heatLayer !== 'undefined') {
    mapWrapper.layers.heat = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17
    }).addTo(map);
  } else {
    console.warn('Leaflet.heat plugin not available');
  }
}

export function addClusterLayer(mapWrapper, nodes) {
  if (mapWrapper.type === 'fallback') {
    console.log('Clustering not available in fallback mode');
    return;
  }
  
  const map = mapWrapper.instance;
  const validNodes = nodes.filter(node => node.latitude && node.longitude);
  
  if (validNodes.length === 0) return;
  
  // Remove existing cluster layer
  if (mapWrapper.layers.cluster) {
    map.removeLayer(mapWrapper.layers.cluster);
  }
  
  // Note: This requires Leaflet.markercluster plugin
  if (typeof L.markerClusterGroup !== 'undefined') {
    const clusters = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50
    });
    
    validNodes.forEach(node => {
      const marker = L.marker([node.latitude, node.longitude])
        .bindPopup(createPopupContent(node));
      
      if (node.type) {
        marker.setIcon(createColoredIcon(node.type));
      }
      
      clusters.addLayer(marker);
    });
    
    mapWrapper.layers.cluster = clusters;
    map.addLayer(clusters);
  } else {
    console.warn('Leaflet.markercluster plugin not available');
  }
}

export function addRouteLayer(mapWrapper, waypoints) {
  if (mapWrapper.type === 'fallback') {
    console.log('Routing not available in fallback mode');
    return;
  }
  
  const map = mapWrapper.instance;
  
  // Remove existing route layer
  if (mapWrapper.layers.route) {
    map.removeLayer(mapWrapper.layers.route);
  }
  
  if (waypoints.length < 2) return;
  
  // Simple polyline for demonstration (real routing would use routing service)
  const route = L.polyline(waypoints.map(wp => [wp.lat, wp.lng]), {
    color: 'red',
    weight: 3,
    opacity: 0.7
  }).addTo(map);
  
  mapWrapper.layers.route = route;
  map.fitBounds(route.getBounds());
}

// Utility function to add case functionality to popups
window.addToCase = function(entity) {
  window.dispatchEvent(new CustomEvent('graph:addToCase', { detail: entity }));
  console.log('Added to case:', entity);
};
