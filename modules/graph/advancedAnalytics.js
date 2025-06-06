// Submodule for advanced analytics (centrality, pathfinding, etc.)

export function computeCentrality(nodes, edges, type = 'degree') {
  // Returns centrality scores for nodes
  const centrality = {};
  
  switch (type) {
    case 'degree':
      return computeDegreeCentrality(nodes, edges);
    case 'betweenness':
      return computeBetweennessCentrality(nodes, edges);
    case 'closeness':
      return computeClosenessCentrality(nodes, edges);
    case 'pagerank':
      return computePageRank(nodes, edges);
    case 'eigenvector':
      return computeEigenvectorCentrality(nodes, edges);
    default:
      return computeDegreeCentrality(nodes, edges);
  }
}

export function computeDegreeCentrality(nodes, edges) {
  const centrality = {};
  nodes.forEach(node => centrality[node.id] = 0);
  
  edges.forEach(edge => {
    centrality[edge.source] = (centrality[edge.source] || 0) + 1;
    centrality[edge.target] = (centrality[edge.target] || 0) + 1;
  });
  
  return centrality;
}

export function computeBetweennessCentrality(nodes, edges) {
  const centrality = {};
  nodes.forEach(node => centrality[node.id] = 0);
  
  // Build adjacency list
  const adj = {};
  nodes.forEach(node => adj[node.id] = []);
  edges.forEach(edge => {
    adj[edge.source].push(edge.target);
    adj[edge.target].push(edge.source);
  });
  
  // For each pair of nodes, find shortest paths and update betweenness
  nodes.forEach(s => {
    const stack = [];
    const predecessors = {};
    const sigma = {};
    const delta = {};
    const distance = {};
    
    nodes.forEach(node => {
      predecessors[node.id] = [];
      sigma[node.id] = 0;
      delta[node.id] = 0;
      distance[node.id] = -1;
    });
    
    sigma[s.id] = 1;
    distance[s.id] = 0;
    
    const queue = [s.id];
    
    while (queue.length > 0) {
      const v = queue.shift();
      stack.push(v);
      
      adj[v].forEach(w => {
        if (distance[w] < 0) {
          queue.push(w);
          distance[w] = distance[v] + 1;
        }
        if (distance[w] === distance[v] + 1) {
          sigma[w] += sigma[v];
          predecessors[w].push(v);
        }
      });
    }
    
    while (stack.length > 0) {
      const w = stack.pop();
      predecessors[w].forEach(v => {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      });
      if (w !== s.id) {
        centrality[w] += delta[w];
      }
    }
  });
  
  // Normalize by 2 for undirected graphs
  Object.keys(centrality).forEach(node => {
    centrality[node] /= 2;
  });
  
  return centrality;
}

export function computeClosenessCentrality(nodes, edges) {
  const centrality = {};
  
  // Build adjacency list
  const adj = {};
  nodes.forEach(node => adj[node.id] = []);
  edges.forEach(edge => {
    adj[edge.source].push(edge.target);
    adj[edge.target].push(edge.source);
  });
  
  nodes.forEach(source => {
    const distances = dijkstra(adj, source.id, nodes);
    const totalDistance = Object.values(distances).reduce((sum, dist) => sum + (dist === Infinity ? 0 : dist), 0);
    const reachableNodes = Object.values(distances).filter(dist => dist !== Infinity && dist > 0).length;
    
    centrality[source.id] = reachableNodes > 0 ? reachableNodes / totalDistance : 0;
  });
  
  return centrality;
}

export function computePageRank(nodes, edges, damping = 0.85, iterations = 100) {
  const pagerank = {};
  const inDegree = {};
  const outDegree = {};
  const outLinks = {};
  
  // Initialize
  nodes.forEach(node => {
    pagerank[node.id] = 1.0 / nodes.length;
    inDegree[node.id] = 0;
    outDegree[node.id] = 0;
    outLinks[node.id] = [];
  });
  
  // Build link structure
  edges.forEach(edge => {
    outLinks[edge.source].push(edge.target);
    outDegree[edge.source]++;
    inDegree[edge.target]++;
  });
  
  // Iterate
  for (let i = 0; i < iterations; i++) {
    const newPagerank = {};
    nodes.forEach(node => {
      newPagerank[node.id] = (1 - damping) / nodes.length;
    });
    
    nodes.forEach(source => {
      if (outDegree[source.id] > 0) {
        const contribution = pagerank[source.id] / outDegree[source.id];
        outLinks[source.id].forEach(target => {
          newPagerank[target] += damping * contribution;
        });
      }
    });
    
    Object.assign(pagerank, newPagerank);
  }
  
  return pagerank;
}

export function computeEigenvectorCentrality(nodes, edges, iterations = 100) {
  const centrality = {};
  
  // Initialize
  nodes.forEach(node => centrality[node.id] = 1.0);
  
  // Build adjacency matrix
  const adj = {};
  nodes.forEach(node => {
    adj[node.id] = {};
    nodes.forEach(other => adj[node.id][other.id] = 0);
  });
  
  edges.forEach(edge => {
    adj[edge.source][edge.target] = 1;
    adj[edge.target][edge.source] = 1;
  });
  
  // Power iteration
  for (let i = 0; i < iterations; i++) {
    const newCentrality = {};
    
    nodes.forEach(node => {
      newCentrality[node.id] = 0;
      nodes.forEach(neighbor => {
        newCentrality[node.id] += adj[neighbor.id][node.id] * centrality[neighbor.id];
      });
    });
    
    // Normalize
    const norm = Math.sqrt(Object.values(newCentrality).reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      Object.keys(newCentrality).forEach(node => {
        newCentrality[node] /= norm;
      });
    }
    
    Object.assign(centrality, newCentrality);
  }
  
  return centrality;
}

export function findAllPaths(nodes, edges, fromId, toId, maxHops = 3) {
  // Returns all paths up to maxHops
  const adj = {};
  nodes.forEach(node => adj[node.id] = []);
  edges.forEach(edge => {
    adj[edge.source].push(edge.target);
    adj[edge.target].push(edge.source);
  });
  
  const allPaths = [];
  
  function dfs(current, target, path, visited, hops) {
    if (hops > maxHops) return;
    if (current === target && path.length > 1) {
      allPaths.push([...path]);
      return;
    }
    
    adj[current].forEach(neighbor => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        path.push(neighbor);
        dfs(neighbor, target, path, visited, hops + 1);
        path.pop();
        visited.delete(neighbor);
      }
    });
  }
  
  const visited = new Set([fromId]);
  dfs(fromId, toId, [fromId], visited, 0);
  
  return allPaths;
}

export function detectCommunities(nodes, edges) {
  // Simple modularity-based community detection (Louvain-like)
  const communities = {};
  let communityId = 0;
  
  // Initialize each node in its own community
  nodes.forEach(node => {
    communities[node.id] = communityId++;
  });
  
  // Build adjacency list and weights
  const adj = {};
  const weights = {};
  nodes.forEach(node => {
    adj[node.id] = [];
    weights[node.id] = {};
  });
  
  edges.forEach(edge => {
    adj[edge.source].push(edge.target);
    adj[edge.target].push(edge.source);
    weights[edge.source][edge.target] = 1;
    weights[edge.target][edge.source] = 1;
  });
  
  let improved = true;
  let iterations = 0;
  const maxIterations = 10;
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    for (const nodeId of Object.keys(communities)) {
      const currentCommunity = communities[nodeId];
      let bestCommunity = currentCommunity;
      let bestGain = 0;
      
      // Try moving to each neighbor's community
      const neighborCommunities = new Set();
      adj[nodeId].forEach(neighbor => {
        neighborCommunities.add(communities[neighbor]);
      });
      
      neighborCommunities.forEach(community => {
        if (community !== currentCommunity) {
          const gain = calculateModularityGain(nodeId, community, communities, adj, weights);
          if (gain > bestGain) {
            bestGain = gain;
            bestCommunity = community;
          }
        }
      });
      
      if (bestCommunity !== currentCommunity) {
        communities[nodeId] = bestCommunity;
        improved = true;
      }
    }
  }
  
  return communities;
}

function calculateModularityGain(nodeId, newCommunity, communities, adj, weights) {
  // Simplified modularity gain calculation
  let gain = 0;
  
  adj[nodeId].forEach(neighbor => {
    const weight = weights[nodeId][neighbor] || 0;
    if (communities[neighbor] === newCommunity) {
      gain += weight;
    } else {
      gain -= weight;
    }
  });
  
  return gain;
}

function dijkstra(adj, source, nodes) {
  const distances = {};
  const visited = new Set();
  const queue = [];
  
  nodes.forEach(node => {
    distances[node.id] = node.id === source ? 0 : Infinity;
    queue.push(node.id);
  });
  
  while (queue.length > 0) {
    // Find node with minimum distance
    let minNode = null;
    let minDistance = Infinity;
    
    queue.forEach(node => {
      if (!visited.has(node) && distances[node] < minDistance) {
        minDistance = distances[node];
        minNode = node;
      }
    });
    
    if (minNode === null) break;
    
    visited.add(minNode);
    queue.splice(queue.indexOf(minNode), 1);
    
    // Update distances to neighbors
    adj[minNode].forEach(neighbor => {
      if (!visited.has(neighbor)) {
        const newDistance = distances[minNode] + 1;
        if (newDistance < distances[neighbor]) {
          distances[neighbor] = newDistance;
        }
      }
    });
  }
  
  return distances;
}
