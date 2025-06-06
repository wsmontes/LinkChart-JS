// Submodule for clustering and community detection

export function detectCommunities(nodes, edges, algorithm = 'louvain') {
  // Returns clusters/groups for coloring or filtering
  switch (algorithm) {
    case 'louvain':
      return louvainCommunities(nodes, edges);
    case 'connected_components':
      return connectedComponents(nodes, edges);
    case 'modularity':
      return modularityCommunities(nodes, edges);
    default:
      return louvainCommunities(nodes, edges);
  }
}

function louvainCommunities(nodes, edges) {
  // Simplified Louvain algorithm implementation
  const communities = {};
  let communityCounter = 0;
  
  // Initialize: each node in its own community
  nodes.forEach(node => {
    communities[node.id] = communityCounter++;
  });
  
  // Build adjacency list and degree map
  const adj = {};
  const degree = {};
  const totalEdges = edges.length;
  
  nodes.forEach(node => {
    adj[node.id] = [];
    degree[node.id] = 0;
  });
  
  edges.forEach(edge => {
    adj[edge.source].push(edge.target);
    adj[edge.target].push(edge.source);
    degree[edge.source]++;
    degree[edge.target]++;
  });
  
  let improved = true;
  let iterations = 0;
  const maxIterations = 20;
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    // For each node, try moving to neighbor communities
    for (const nodeId of Object.keys(communities)) {
      const currentCommunity = communities[nodeId];
      let bestCommunity = currentCommunity;
      let bestModularity = 0;
      
      // Get neighboring communities
      const neighborCommunities = new Set();
      adj[nodeId].forEach(neighbor => {
        neighborCommunities.add(communities[neighbor]);
      });
      
      // Try each neighboring community
      neighborCommunities.forEach(community => {
        if (community !== currentCommunity) {
          const modularityGain = calculateModularityGain(
            nodeId, community, currentCommunity, communities, adj, degree, totalEdges
          );
          
          if (modularityGain > bestModularity) {
            bestModularity = modularityGain;
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
  
  // Renumber communities to be sequential
  const communityMap = {};
  let newId = 0;
  Object.values(communities).forEach(oldId => {
    if (!(oldId in communityMap)) {
      communityMap[oldId] = newId++;
    }
  });
  
  Object.keys(communities).forEach(nodeId => {
    communities[nodeId] = communityMap[communities[nodeId]];
  });
  
  return communities;
}

function calculateModularityGain(nodeId, newCommunity, oldCommunity, communities, adj, degree, totalEdges) {
  let deltaQ = 0;
  
  // Calculate edges within new community vs old community
  let edgesToNew = 0;
  let edgesToOld = 0;
  
  adj[nodeId].forEach(neighbor => {
    if (communities[neighbor] === newCommunity) {
      edgesToNew++;
    } else if (communities[neighbor] === oldCommunity) {
      edgesToOld++;
    }
  });
  
  // Simplified modularity gain calculation
  deltaQ = (edgesToNew - edgesToOld) / (2 * totalEdges);
  
  return deltaQ;
}

function connectedComponents(nodes, edges) {
  // Find connected components using DFS
  const visited = new Set();
  const communities = {};
  let componentId = 0;
  
  // Build adjacency list
  const adj = {};
  nodes.forEach(node => adj[node.id] = []);
  edges.forEach(edge => {
    adj[edge.source].push(edge.target);
    adj[edge.target].push(edge.source);
  });
  
  function dfs(nodeId, currentComponent) {
    visited.add(nodeId);
    communities[nodeId] = currentComponent;
    
    adj[nodeId].forEach(neighbor => {
      if (!visited.has(neighbor)) {
        dfs(neighbor, currentComponent);
      }
    });
  }
  
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id, componentId++);
    }
  });
  
  return communities;
}

function modularityCommunities(nodes, edges) {
  // Greedy modularity optimization
  const communities = {};
  let communityId = 0;
  
  // Start with each node in its own community
  nodes.forEach(node => {
    communities[node.id] = communityId++;
  });
  
  // Build adjacency list and calculate initial modularity
  const adj = {};
  const edgeWeights = {};
  let totalWeight = 0;
  
  nodes.forEach(node => {
    adj[node.id] = [];
    edgeWeights[node.id] = {};
  });
  
  edges.forEach(edge => {
    adj[edge.source].push(edge.target);
    adj[edge.target].push(edge.source);
    
    const weight = edge.weight || 1;
    edgeWeights[edge.source][edge.target] = weight;
    edgeWeights[edge.target][edge.source] = weight;
    totalWeight += weight;
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
      let bestModularity = calculateModularity(communities, adj, edgeWeights, totalWeight);
      
      // Try moving to each neighbor's community
      const neighborCommunities = new Set();
      adj[nodeId].forEach(neighbor => {
        neighborCommunities.add(communities[neighbor]);
      });
      
      neighborCommunities.forEach(testCommunity => {
        if (testCommunity !== currentCommunity) {
          // Temporarily move node
          const originalCommunity = communities[nodeId];
          communities[nodeId] = testCommunity;
          
          const newModularity = calculateModularity(communities, adj, edgeWeights, totalWeight);
          
          if (newModularity > bestModularity) {
            bestModularity = newModularity;
            bestCommunity = testCommunity;
          }
          
          // Restore original community
          communities[nodeId] = originalCommunity;
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

function calculateModularity(communities, adj, edgeWeights, totalWeight) {
  let modularity = 0;
  const communityDegrees = {};
  
  // Calculate degree for each community
  Object.keys(communities).forEach(nodeId => {
    const community = communities[nodeId];
    if (!(community in communityDegrees)) {
      communityDegrees[community] = 0;
    }
    
    adj[nodeId].forEach(neighbor => {
      const weight = edgeWeights[nodeId][neighbor] || 0;
      communityDegrees[community] += weight;
    });
  });
  
  // Calculate modularity
  Object.keys(communities).forEach(nodeId => {
    adj[nodeId].forEach(neighbor => {
      if (communities[nodeId] === communities[neighbor]) {
        const weight = edgeWeights[nodeId][neighbor] || 0;
        const expectedWeight = (communityDegrees[communities[nodeId]] * communityDegrees[communities[neighbor]]) / (2 * totalWeight);
        modularity += (weight - expectedWeight) / (2 * totalWeight);
      }
    });
  });
  
  return modularity;
}

export function applyCommunityColors(nodes, communities) {
  // Apply colors based on community assignments
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9',
    '#f8c471', '#82e0aa', '#f1948a', '#85c1e9', '#d7bde2'
  ];
  
  return nodes.map(node => ({
    ...node,
    color: colors[communities[node.id] % colors.length],
    community: communities[node.id]
  }));
}

export function getCommunitySummary(nodes, communities) {
  // Generate summary statistics for communities
  const summary = {};
  
  Object.keys(communities).forEach(nodeId => {
    const community = communities[nodeId];
    if (!(community in summary)) {
      summary[community] = {
        id: community,
        size: 0,
        nodes: [],
        types: {}
      };
    }
    
    summary[community].size++;
    summary[community].nodes.push(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (node && node.type) {
      summary[community].types[node.type] = (summary[community].types[node.type] || 0) + 1;
    }
  });
  
  // Sort communities by size
  return Object.values(summary).sort((a, b) => b.size - a.size);
}
