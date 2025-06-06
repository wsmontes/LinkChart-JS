// Geospatial Analysis Submodule
// Handles spatial calculations, proximity analysis, and geographic statistics

export function spatialAnalysis(nodes) {
  if (!nodes || !Array.isArray(nodes)) {
    return { totalPoints: 0, bounds: null, center: null, clusters: [] };
  }

  const validNodes = nodes.filter(node => 
    node.latitude && node.longitude && 
    typeof node.latitude === 'number' && 
    typeof node.longitude === 'number'
  );

  if (validNodes.length === 0) {
    return { totalPoints: 0, bounds: null, center: null, clusters: [] };
  }

  // Calculate bounding box
  const bounds = calculateBounds(validNodes);
  
  // Calculate center point
  const center = calculateCentroid(validNodes);
  
  // Basic clustering analysis
  const clusters = performSimpleClustering(validNodes);
  
  // Distance statistics
  const distances = calculateDistanceStatistics(validNodes);
  
  // Density analysis
  const density = calculateDensity(validNodes, bounds);

  return {
    totalPoints: validNodes.length,
    bounds,
    center,
    clusters,
    distances,
    density,
    coverage: calculateCoverage(bounds),
    dispersion: calculateDispersion(validNodes, center)
  };
}

export function findNearbyEntities(nodes, centerPoint, radius, unit = 'km') {
  if (!nodes || !centerPoint || !radius) {
    return [];
  }

  const validNodes = nodes.filter(node => 
    node.latitude && node.longitude && 
    typeof node.latitude === 'number' && 
    typeof node.longitude === 'number'
  );

  return validNodes
    .map(node => ({
      ...node,
      distance: calculateDistance(
        centerPoint.lat, centerPoint.lng,
        node.latitude, node.longitude,
        unit
      ),
      distanceUnit: unit
    }))
    .filter(node => node.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}

export function calculateDistance(lat1, lng1, lat2, lng2, unit = 'km') {
  if (typeof lat1 !== 'number' || typeof lng1 !== 'number' || 
      typeof lat2 !== 'number' || typeof lng2 !== 'number') {
    return NaN;
  }

  const R = unit === 'miles' ? 3959 : 6371; // Earth's radius
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateBounds(nodes) {
  const lats = nodes.map(n => n.latitude);
  const lngs = nodes.map(n => n.longitude);
  
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  };
}

function calculateCentroid(nodes) {
  const sumLat = nodes.reduce((sum, node) => sum + node.latitude, 0);
  const sumLng = nodes.reduce((sum, node) => sum + node.longitude, 0);
  
  return {
    lat: sumLat / nodes.length,
    lng: sumLng / nodes.length
  };
}

function performSimpleClustering(nodes, maxDistance = 0.1) {
  const clusters = [];
  const processed = new Set();

  nodes.forEach((node, index) => {
    if (processed.has(index)) return;

    const cluster = {
      center: { lat: node.latitude, lng: node.longitude },
      members: [node],
      memberIndices: [index]
    };

    // Find nearby nodes
    nodes.forEach((otherNode, otherIndex) => {
      if (otherIndex === index || processed.has(otherIndex)) return;

      const distance = calculateDistance(
        node.latitude, node.longitude,
        otherNode.latitude, otherNode.longitude
      );

      if (distance <= maxDistance) {
        cluster.members.push(otherNode);
        cluster.memberIndices.push(otherIndex);
        processed.add(otherIndex);
      }
    });

    // Recalculate cluster center
    if (cluster.members.length > 1) {
      cluster.center = calculateCentroid(cluster.members);
    }

    clusters.push(cluster);
    processed.add(index);
  });

  return clusters.sort((a, b) => b.members.length - a.members.length);
}

function calculateDistanceStatistics(nodes) {
  if (nodes.length < 2) {
    return { min: 0, max: 0, mean: 0, median: 0 };
  }

  const distances = [];
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = calculateDistance(
        nodes[i].latitude, nodes[i].longitude,
        nodes[j].latitude, nodes[j].longitude
      );
      distances.push(dist);
    }
  }

  distances.sort((a, b) => a - b);

  return {
    min: distances[0],
    max: distances[distances.length - 1],
    mean: distances.reduce((sum, d) => sum + d, 0) / distances.length,
    median: distances[Math.floor(distances.length / 2)],
    count: distances.length
  };
}

function calculateDensity(nodes, bounds) {
  if (!bounds || nodes.length === 0) return 0;

  // Calculate area in square kilometers (approximate)
  const latDiff = bounds.north - bounds.south;
  const lngDiff = bounds.east - bounds.west;
  const area = latDiff * lngDiff * 111 * 111; // Rough conversion to km²

  return area > 0 ? nodes.length / area : 0;
}

function calculateCoverage(bounds) {
  if (!bounds) return 0;

  const latSpan = Math.abs(bounds.north - bounds.south);
  const lngSpan = Math.abs(bounds.east - bounds.west);
  
  return {
    latitudeSpan: latSpan,
    longitudeSpan: lngSpan,
    totalSpan: Math.sqrt(latSpan * latSpan + lngSpan * lngSpan)
  };
}

function calculateDispersion(nodes, center) {
  if (!center || nodes.length === 0) return 0;

  const distances = nodes.map(node => 
    calculateDistance(center.lat, center.lng, node.latitude, node.longitude)
  );

  const mean = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  const variance = distances.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / distances.length;
  
  return {
    mean: mean,
    variance: variance,
    standardDeviation: Math.sqrt(variance),
    maxDistance: Math.max(...distances),
    minDistance: Math.min(...distances)
  };
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Advanced spatial analysis functions

export function calculateConvexHull(nodes) {
  if (nodes.length < 3) return nodes;

  // Graham scan algorithm for convex hull
  const points = nodes.map(node => ({ x: node.longitude, y: node.latitude, ...node }));
  
  // Find the bottom-most point (and left-most in case of tie)
  let start = points.reduce((min, p) => 
    p.y < min.y || (p.y === min.y && p.x < min.x) ? p : min
  );

  // Sort points by polar angle with respect to start point
  const sorted = points
    .filter(p => p !== start)
    .sort((a, b) => {
      const angleA = Math.atan2(a.y - start.y, a.x - start.x);
      const angleB = Math.atan2(b.y - start.y, b.x - start.x);
      return angleA - angleB;
    });

  const hull = [start];
  
  for (const point of sorted) {
    while (hull.length > 1 && crossProduct(hull[hull.length-2], hull[hull.length-1], point) <= 0) {
      hull.pop();
    }
    hull.push(point);
  }

  return hull;
}

function crossProduct(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

export function findOptimalViewport(nodes, padding = 0.1) {
  if (!nodes || nodes.length === 0) {
    return { center: { lat: 0, lng: 0 }, zoom: 2 };
  }

  const bounds = calculateBounds(nodes);
  const center = calculateCentroid(nodes);
  
  // Add padding to bounds
  const latPadding = (bounds.north - bounds.south) * padding;
  const lngPadding = (bounds.east - bounds.west) * padding;
  
  const paddedBounds = {
    north: bounds.north + latPadding,
    south: bounds.south - latPadding,
    east: bounds.east + lngPadding,
    west: bounds.west - lngPadding
  };

  // Estimate appropriate zoom level
  const latSpan = paddedBounds.north - paddedBounds.south;
  const lngSpan = paddedBounds.east - paddedBounds.west;
  const maxSpan = Math.max(latSpan, lngSpan);
  
  let zoom = 1;
  if (maxSpan < 0.01) zoom = 15;
  else if (maxSpan < 0.1) zoom = 12;
  else if (maxSpan < 1) zoom = 9;
  else if (maxSpan < 10) zoom = 6;
  else if (maxSpan < 50) zoom = 4;
  else zoom = 2;

  return {
    center,
    bounds: paddedBounds,
    zoom
  };
}

export function spatialJoin(primaryNodes, secondaryNodes, maxDistance = 1, unit = 'km') {
  const results = [];

  primaryNodes.forEach(primaryNode => {
    if (!primaryNode.latitude || !primaryNode.longitude) return;

    const nearbySecondary = findNearbyEntities(
      secondaryNodes, 
      { lat: primaryNode.latitude, lng: primaryNode.longitude },
      maxDistance, 
      unit
    );

    if (nearbySecondary.length > 0) {
      results.push({
        primary: primaryNode,
        nearby: nearbySecondary,
        count: nearbySecondary.length
      });
    }
  });

  return results.sort((a, b) => b.count - a.count);
}

export function calculateSpatialAutocorrelation(nodes, property) {
  // Moran's I calculation for spatial autocorrelation
  if (!nodes || nodes.length < 2 || !property) return null;

  const validNodes = nodes.filter(node => 
    node[property] !== undefined && 
    node.latitude && node.longitude
  );

  if (validNodes.length < 2) return null;

  const n = validNodes.length;
  const mean = validNodes.reduce((sum, node) => sum + parseFloat(node[property]), 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  let weightSum = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const distance = calculateDistance(
          validNodes[i].latitude, validNodes[i].longitude,
          validNodes[j].latitude, validNodes[j].longitude
        );
        
        // Simple distance-based weight (inverse distance)
        const weight = distance > 0 ? 1 / distance : 0;
        weightSum += weight;
        
        const deviation_i = parseFloat(validNodes[i][property]) - mean;
        const deviation_j = parseFloat(validNodes[j][property]) - mean;
        
        numerator += weight * deviation_i * deviation_j;
      }
    }
    
    const deviation_i = parseFloat(validNodes[i][property]) - mean;
    denominator += deviation_i * deviation_i;
  }

  if (weightSum === 0 || denominator === 0) return null;

  const moransI = (n / weightSum) * (numerator / denominator);
  
  return {
    moransI,
    interpretation: moransI > 0 ? 'Clustered' : moransI < 0 ? 'Dispersed' : 'Random',
    strength: Math.abs(moransI)
  };
}

// AI/Dev Note: This analysis module provides comprehensive spatial analysis capabilities
// including distance calculations, clustering, density analysis, and advanced statistical
// methods for geographic data analysis.
