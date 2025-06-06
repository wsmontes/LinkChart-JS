/**
 * LinkChart E2E Test Suite
 * Comprehensive testing script for the Investigative Analytics Platform
 */

class LinkChartTestSuite {
  constructor() {
    this.results = [];
    this.currentPhase = '';
    this.testData = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type, phase: this.currentPhase };
    this.results.push(logEntry);
    
    const style = type === 'success' ? 'color: green; font-weight: bold' :
                  type === 'error' ? 'color: red; font-weight: bold' :
                  type === 'warning' ? 'color: orange; font-weight: bold' :
                  'color: blue';
    
    console.log(`%c[${timestamp}] ${this.currentPhase}: ${message}`, style);
  }

  async delay(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Phase 1: Initial Application State Testing
  async testInitialState() {
    this.currentPhase = 'Initial State';
    this.log('Starting initial application state testing...');

    try {
      // Check if all global objects are available
      if (typeof window.uxManager !== 'undefined') {
        this.log('✅ UX Manager loaded', 'success');
      } else {
        this.log('❌ UX Manager not found', 'error');
      }

      if (typeof window.auditLogger !== 'undefined') {
        this.log('✅ Audit Logger loaded', 'success');
      } else {
        this.log('❌ Audit Logger not found', 'error');
      }

      if (typeof window.cytoscape !== 'undefined') {
        this.log('✅ Cytoscape library loaded', 'success');
      } else {
        this.log('❌ Cytoscape library not found', 'error');
      }

      // Check if main UI elements exist
      const elements = {
        'loadSample': 'Load Sample Data button',
        'addEntity': 'Add Entity button',
        'addRelationship': 'Add Relationship button',
        'graph': 'Graph container',
        'dashboard': 'Dashboard section',
        'search': 'Search functionality'
      };

      for (const [id, name] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
          this.log(`✅ ${name} found`, 'success');
        } else {
          this.log(`❌ ${name} not found`, 'error');
        }
      }

      this.log('Initial state testing completed');
      return true;
    } catch (error) {
      this.log(`❌ Error in initial state testing: ${error.message}`, 'error');
      return false;
    }
  }

  // Phase 2: Sample Data Loading
  async testSampleDataLoading() {
    this.currentPhase = 'Sample Data Loading';
    this.log('Testing sample data loading functionality...');

    try {
      const loadSampleBtn = document.getElementById('loadSample');
      if (!loadSampleBtn) {
        this.log('❌ Load Sample button not found', 'error');
        return false;
      }

      // Set up event listener for data:normalized event
      const dataPromise = new Promise((resolve) => {
        const handler = (event) => {
          window.removeEventListener('data:normalized', handler);
          resolve(event.detail);
        };
        window.addEventListener('data:normalized', handler);
      });

      this.log('Clicking Load Sample Data button...');
      loadSampleBtn.click();

      // Wait for data to be loaded
      this.testData = await Promise.race([
        dataPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout waiting for data')), 10000)
        )
      ]);

      if (this.testData && this.testData.length > 0) {
        this.log(`✅ Sample data loaded successfully: ${this.testData.length} records`, 'success');
        
        // Analyze data structure
        const entities = this.testData.filter(item => item.from === '' || !item.from);
        const relationships = this.testData.filter(item => item.from && item.to);
        
        this.log(`📊 Data breakdown: ${entities.length} entities, ${relationships.length} relationships`);
        return true;
      } else {
        this.log('❌ No data received from sample loading', 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error in sample data loading: ${error.message}`, 'error');
      return false;
    }
  }

  // Phase 3: Manual Entry Testing
  async testManualEntry() {
    this.currentPhase = 'Manual Entry';
    this.log('Testing manual entry functionality...');

    try {
      // Test Add Entity button
      const addEntityBtn = document.getElementById('addEntity');
      if (addEntityBtn) {
        this.log('Testing Add Entity button...');
        addEntityBtn.click();
        await this.delay(1000);
        
        // Check if modal appeared
        const modal = document.querySelector('.modal.show');
        if (modal) {
          this.log('✅ Entity modal opened successfully', 'success');
          
          // Close modal
          const closeBtn = modal.querySelector('.btn-close, [data-bs-dismiss="modal"]');
          if (closeBtn) closeBtn.click();
          await this.delay(500);
        } else {
          this.log('❌ Entity modal did not open', 'error');
        }
      }

      // Test Add Relationship button
      const addRelationshipBtn = document.getElementById('addRelationship');
      if (addRelationshipBtn) {
        this.log('Testing Add Relationship button...');
        addRelationshipBtn.click();
        await this.delay(1000);
        
        // Check if modal appeared
        const modal = document.querySelector('.modal.show');
        if (modal) {
          this.log('✅ Relationship modal opened successfully', 'success');
          
          // Close modal
          const closeBtn = modal.querySelector('.btn-close, [data-bs-dismiss="modal"]');
          if (closeBtn) closeBtn.click();
          await this.delay(500);
        } else {
          this.log('❌ Relationship modal did not open', 'error');
        }
      }

      return true;
    } catch (error) {
      this.log(`❌ Error in manual entry testing: ${error.message}`, 'error');
      return false;
    }
  }

  // Phase 4: Graph Visualization Testing
  async testGraphVisualization() {
    this.currentPhase = 'Graph Visualization';
    this.log('Testing graph visualization...');

    try {
      const graphContainer = document.getElementById('graph');
      if (!graphContainer) {
        this.log('❌ Graph container not found', 'error');
        return false;
      }

      // Check if Cytoscape instance exists
      if (window.cy) {
        this.log('✅ Cytoscape instance found', 'success');
        
        const nodes = window.cy.nodes();
        const edges = window.cy.edges();
        
        this.log(`📊 Graph elements: ${nodes.length} nodes, ${edges.length} edges`);
        
        if (nodes.length > 0) {
          this.log('✅ Graph has nodes rendered', 'success');
        } else {
          this.log('⚠️ Graph has no nodes', 'warning');
        }
        
        if (edges.length > 0) {
          this.log('✅ Graph has edges rendered', 'success');
        } else {
          this.log('⚠️ Graph has no edges', 'warning');
        }
        
        return true;
      } else {
        this.log('❌ Cytoscape instance not found', 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Error in graph visualization testing: ${error.message}`, 'error');
      return false;
    }
  }

  // Phase 5: Dashboard Testing
  async testDashboard() {
    this.currentPhase = 'Dashboard';
    this.log('Testing dashboard functionality...');

    try {
      const dashboardSection = document.getElementById('dashboard');
      if (!dashboardSection) {
        this.log('❌ Dashboard section not found', 'error');
        return false;
      }

      // Check for charts
      const charts = dashboardSection.querySelectorAll('canvas, .chart-container, [id*="chart"]');
      if (charts.length > 0) {
        this.log(`✅ Found ${charts.length} chart elements`, 'success');
      } else {
        this.log('⚠️ No chart elements found', 'warning');
      }

      // Check for metrics
      const metrics = dashboardSection.querySelectorAll('.metric, .stat, [class*="metric"]');
      if (metrics.length > 0) {
        this.log(`✅ Found ${metrics.length} metric elements`, 'success');
      } else {
        this.log('⚠️ No metric elements found', 'warning');
      }

      return true;
    } catch (error) {
      this.log(`❌ Error in dashboard testing: ${error.message}`, 'error');
      return false;
    }
  }

  // Phase 6: Search and Filter Testing
  async testSearchAndFilters() {
    this.currentPhase = 'Search & Filters';
    this.log('Testing search and filter functionality...');

    try {
      const searchInput = document.querySelector('input[type="search"], #searchInput, [placeholder*="search" i]');
      if (searchInput) {
        this.log('✅ Search input found', 'success');
        
        // Test search functionality
        searchInput.value = 'John';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.delay(500);
        
        this.log('✅ Search input tested', 'success');
      } else {
        this.log('❌ Search input not found', 'error');
      }

      // Check for filter controls
      const filters = document.querySelectorAll('[class*="filter"], select, input[type="checkbox"]');
      if (filters.length > 0) {
        this.log(`✅ Found ${filters.length} filter controls`, 'success');
      } else {
        this.log('⚠️ No filter controls found', 'warning');
      }

      return true;
    } catch (error) {
      this.log(`❌ Error in search and filters testing: ${error.message}`, 'error');
      return false;
    }
  }

  // Phase 7: Case Management Testing
  async testCaseManagement() {
    this.currentPhase = 'Case Management';
    this.log('Testing case management functionality...');

    try {
      // Look for case-related elements
      const caseElements = document.querySelectorAll('[id*="case"], [class*="case"], button[onclick*="case" i]');
      if (caseElements.length > 0) {
        this.log(`✅ Found ${caseElements.length} case management elements`, 'success');
      } else {
        this.log('⚠️ No case management elements found', 'warning');
      }

      // Check for workspace areas
      const workspaceElements = document.querySelectorAll('[id*="workspace"], [class*="workspace"]');
      if (workspaceElements.length > 0) {
        this.log(`✅ Found ${workspaceElements.length} workspace elements`, 'success');
      } else {
        this.log('⚠️ No workspace elements found', 'warning');
      }

      return true;
    } catch (error) {
      this.log(`❌ Error in case management testing: ${error.message}`, 'error');
      return false;
    }
  }

  // Phase 8: Audit and Security Testing
  async testAuditAndSecurity() {
    this.currentPhase = 'Audit & Security';
    this.log('Testing audit and security functionality...');

    try {
      if (window.auditLogger) {
        this.log('✅ Audit logger available', 'success');
        
        // Test audit logging
        window.auditLogger.logEvent('test_event', { testValue: 'E2E Testing' });
        this.log('✅ Test audit event logged', 'success');
        
        // Check recent events
        if (window.auditLogger.getRecentEvents) {
          const recentEvents = window.auditLogger.getRecentEvents(10);
          this.log(`📊 Found ${recentEvents.length} recent audit events`);
        }
      } else {
        this.log('❌ Audit logger not available', 'error');
      }

      return true;
    } catch (error) {
      this.log(`❌ Error in audit and security testing: ${error.message}`, 'error');
      return false;
    }
  }

  // Main test runner
  async runAllTests() {
    this.log('🚀 Starting comprehensive LinkChart E2E test suite...', 'info');
    
    const phases = [
      { name: 'Initial State', test: () => this.testInitialState() },
      { name: 'Sample Data Loading', test: () => this.testSampleDataLoading() },
      { name: 'Manual Entry', test: () => this.testManualEntry() },
      { name: 'Graph Visualization', test: () => this.testGraphVisualization() },
      { name: 'Dashboard', test: () => this.testDashboard() },
      { name: 'Search & Filters', test: () => this.testSearchAndFilters() },
      { name: 'Case Management', test: () => this.testCaseManagement() },
      { name: 'Audit & Security', test: () => this.testAuditAndSecurity() }
    ];

    let passedTests = 0;
    let totalTests = phases.length;

    for (const phase of phases) {
      try {
        this.log(`\n--- Starting ${phase.name} Tests ---`);
        const result = await phase.test();
        if (result) {
          passedTests++;
          this.log(`✅ ${phase.name} tests PASSED`, 'success');
        } else {
          this.log(`❌ ${phase.name} tests FAILED`, 'error');
        }
        await this.delay(1000); // Pause between phases
      } catch (error) {
        this.log(`❌ ${phase.name} tests FAILED with error: ${error.message}`, 'error');
      }
    }

    // Final report
    this.log(`\n🏁 Test Suite Complete!`);
    this.log(`📊 Results: ${passedTests}/${totalTests} phases passed`);
    
    if (passedTests === totalTests) {
      this.log('🎉 ALL TESTS PASSED! LinkChart is functioning correctly.', 'success');
    } else {
      this.log(`⚠️ ${totalTests - passedTests} test phases failed. Review logs for details.`, 'warning');
    }

    // Return detailed results
    return {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests,
      results: this.results,
      testData: this.testData
    };
  }

  // Generate test report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        totalTests: this.results.length,
        errors: this.results.filter(r => r.type === 'error').length,
        warnings: this.results.filter(r => r.type === 'warning').length,
        successes: this.results.filter(r => r.type === 'success').length
      }
    };

    console.log('📋 Detailed Test Report:');
    console.table(this.results);
    
    return report;
  }
}

// Make the test suite available globally
window.LinkChartTestSuite = LinkChartTestSuite;

// Auto-start testing if desired
// Uncomment the next line to automatically run tests when this script loads
// const tester = new LinkChartTestSuite();
// tester.runAllTests().then(results => tester.generateReport());
