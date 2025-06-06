// Immediate execution test for LinkChart functionality
// This script can be pasted into the browser console for immediate testing

console.log('🚀 Starting immediate LinkChart functionality test...');

// Function to wait for elements and conditions
function waitFor(condition, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      if (condition()) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

// Test Phase 1: Check if application is loaded
async function testApplicationLoaded() {
  console.log('📋 Phase 1: Testing application state...');
  
  const checks = [
    { name: 'UX Manager', condition: () => typeof window.uxManager !== 'undefined' },
    { name: 'Audit Logger', condition: () => typeof window.auditLogger !== 'undefined' },
    { name: 'Cytoscape', condition: () => typeof window.cytoscape !== 'undefined' },
    { name: 'Load Sample Button', condition: () => document.getElementById('loadSample') !== null },
    { name: 'Add Entity Button', condition: () => document.getElementById('addEntity') !== null },
    { name: 'Add Relationship Button', condition: () => document.getElementById('addRelationship') !== null }
  ];
  
  let passed = 0;
  for (const check of checks) {
    if (check.condition()) {
      console.log(`✅ ${check.name}: PASS`);
      passed++;
    } else {
      console.log(`❌ ${check.name}: FAIL`);
    }
  }
  
  console.log(`📊 Phase 1 Results: ${passed}/${checks.length} checks passed`);
  return passed === checks.length;
}

// Test Phase 2: Sample data loading
async function testSampleDataLoading() {
  console.log('\n📋 Phase 2: Testing sample data loading...');
  
  const loadSampleBtn = document.getElementById('loadSample');
  if (!loadSampleBtn) {
    console.log('❌ Load Sample button not found');
    return false;
  }
  
  // Set up promise to listen for data events
  const dataPromise = new Promise((resolve) => {
    const handler = (event) => {
      console.log('📊 Data event received:', event.detail);
      window.removeEventListener('data:normalized', handler);
      resolve(event.detail);
    };
    window.addEventListener('data:normalized', handler);
  });
  
  console.log('🖱️ Clicking Load Sample Data button...');
  loadSampleBtn.click();
  
  try {
    const data = await Promise.race([
      dataPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);
    
    if (data && data.length > 0) {
      console.log(`✅ Sample data loaded: ${data.length} records`);
      
      // Store data globally for other tests
      window.testData = data;
      
      return true;
    } else {
      console.log('❌ No data received');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error loading sample data: ${error.message}`);
    return false;
  }
}

// Test Phase 3: Graph visualization
async function testGraphVisualization() {
  console.log('\n📋 Phase 3: Testing graph visualization...');
  
  try {
    // Wait for Cytoscape instance to be available
    await waitFor(() => window.cy !== undefined, 5000);
    
    const nodes = window.cy.nodes();
    const edges = window.cy.edges();
    
    console.log(`📊 Graph elements: ${nodes.length} nodes, ${edges.length} edges`);
    
    if (nodes.length > 0) {
      console.log('✅ Graph has nodes rendered');
      
      // Test interaction - select first node
      const firstNode = nodes[0];
      if (firstNode) {
        firstNode.select();
        console.log('✅ Node selection works');
      }
      
      return true;
    } else {
      console.log('❌ No nodes in graph');
      return false;
    }
  } catch (error) {
    console.log(`❌ Graph test error: ${error.message}`);
    return false;
  }
}

// Test Phase 4: Manual entry buttons
async function testManualEntryButtons() {
  console.log('\n📋 Phase 4: Testing manual entry buttons...');
  
  const addEntityBtn = document.getElementById('addEntity');
  const addRelationshipBtn = document.getElementById('addRelationship');
  
  let passed = 0;
  
  // Test Add Entity button
  if (addEntityBtn) {
    console.log('🖱️ Testing Add Entity button...');
    addEntityBtn.click();
    
    // Wait for modal to appear
    setTimeout(() => {
      const modal = document.querySelector('.modal.show');
      if (modal) {
        console.log('✅ Entity modal opened');
        // Close modal
        const closeBtn = modal.querySelector('.btn-close, [data-bs-dismiss="modal"]');
        if (closeBtn) closeBtn.click();
        passed++;
      } else {
        console.log('❌ Entity modal did not open');
      }
    }, 1000);
  }
  
  // Test Add Relationship button  
  if (addRelationshipBtn) {
    setTimeout(() => {
      console.log('🖱️ Testing Add Relationship button...');
      addRelationshipBtn.click();
      
      setTimeout(() => {
        const modal = document.querySelector('.modal.show');
        if (modal) {
          console.log('✅ Relationship modal opened');
          // Close modal
          const closeBtn = modal.querySelector('.btn-close, [data-bs-dismiss="modal"]');
          if (closeBtn) closeBtn.click();
          passed++;
        } else {
          console.log('❌ Relationship modal did not open');
        }
      }, 1000);
    }, 2000);
  }
  
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`📊 Manual entry tests: ${passed}/2 passed`);
      resolve(passed === 2);
    }, 4000);
  });
}

// Test Phase 5: Dashboard functionality
async function testDashboard() {
  console.log('\n📋 Phase 5: Testing dashboard...');
  
  const dashboardSection = document.getElementById('dashboard');
  if (!dashboardSection) {
    console.log('❌ Dashboard section not found');
    return false;
  }
  
  const charts = dashboardSection.querySelectorAll('canvas, .chart-container, [id*="chart"]');
  const metrics = dashboardSection.querySelectorAll('.metric, .stat, [class*="metric"]');
  
  console.log(`📊 Found ${charts.length} charts and ${metrics.length} metrics`);
  
  if (charts.length > 0 || metrics.length > 0) {
    console.log('✅ Dashboard elements found');
    return true;
  } else {
    console.log('⚠️ No dashboard elements found');
    return false;
  }
}

// Main test runner
async function runImmediateTests() {
  console.log('🎯 Running immediate LinkChart tests...\n');
  
  const results = [];
  
  try {
    results.push({ phase: 'Application Loaded', result: await testApplicationLoaded() });
    results.push({ phase: 'Sample Data Loading', result: await testSampleDataLoading() });
    
    // Wait a moment for data to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    results.push({ phase: 'Graph Visualization', result: await testGraphVisualization() });
    results.push({ phase: 'Manual Entry Buttons', result: await testManualEntryButtons() });
    results.push({ phase: 'Dashboard', result: await testDashboard() });
    
    // Summary
    const passed = results.filter(r => r.result).length;
    const total = results.length;
    
    console.log('\n🏁 Test Summary:');
    results.forEach(r => {
      console.log(`${r.result ? '✅' : '❌'} ${r.phase}`);
    });
    
    console.log(`\n📊 Final Score: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED! LinkChart is working correctly.');
    } else {
      console.log(`⚠️ ${total - passed} tests failed. Check the details above.`);
    }
    
    return { passed, total, results };
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    return { passed: 0, total: results.length, results, error: error.message };
  }
}

// Execute tests immediately
runImmediateTests();
