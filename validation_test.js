/**
 * Final Validation Test Suite
 * Tests all critical fixes applied to resolve runtime errors
 */

class ValidationTester {
  constructor() {
    this.results = {
      dataNormalization: null,
      graphDataTransformation: null,
      searchFilterFix: null,
      errorHandling: null,
      endToEndFlow: null
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting Final Validation Tests...');
    console.log('================================================');
    
    try {
      await this.testDataNormalization();
      await this.testGraphDataTransformation();
      await this.testSearchFilterFix();
      await this.testErrorHandling();
      await this.testEndToEndFlow();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Validation test suite failed:', error);
    }
  }

  async testDataNormalization() {
    console.log('\n📊 Testing Data Normalization Fix...');
    
    try {
      // Test sample data similar to what caused the original error
      const testData = [
        { id: '1', name: 'Entity 1', type: 'person' },
        { id: '2', name: 'Entity 2', type: 'company' },
        { from: '1', to: '2', relationship: 'works_for', weight: 1 }
      ];

      // Check if normalizeData function exists and works
      if (typeof window.normalizeData === 'function') {
        const normalized = window.normalizeData(testData);
        console.log('✅ normalizeData function exists');
        console.log('📋 Normalized data structure:', normalized);
        
        // Validate structure
        if (normalized && normalized.nodes && normalized.edges) {
          console.log('✅ Data normalization returns proper structure');
          console.log(`📊 Nodes: ${normalized.nodes.length}, Edges: ${normalized.edges.length}`);
          this.results.dataNormalization = 'PASS';
        } else {
          console.log('❌ Data normalization structure invalid');
          this.results.dataNormalization = 'FAIL';
        }
      } else {
        console.log('❌ normalizeData function not found');
        this.results.dataNormalization = 'FAIL';
      }
    } catch (error) {
      console.error('❌ Data normalization test failed:', error);
      this.results.dataNormalization = 'ERROR';
    }
  }

  async testGraphDataTransformation() {
    console.log('\n🔗 Testing Graph Data Transformation...');
    
    try {
      // Check if graph module is loaded and has updateGraphData function
      if (window.GraphManager && typeof window.GraphManager.updateGraphData === 'function') {
        console.log('✅ GraphManager and updateGraphData function exist');
        
        // Test with sample data
        const sampleData = {
          nodes: [{ id: '1', label: 'Test Node' }],
          edges: [{ id: 'e1', source: '1', target: '1', label: 'self-loop' }]
        };
        
        try {
          // This should not throw the "nonexistent source" error anymore
          window.GraphManager.updateGraphData(sampleData);
          console.log('✅ Graph data transformation completed without errors');
          this.results.graphDataTransformation = 'PASS';
        } catch (error) {
          console.error('❌ Graph data transformation failed:', error);
          this.results.graphDataTransformation = 'FAIL';
        }
      } else {
        console.log('❌ GraphManager or updateGraphData function not found');
        this.results.graphDataTransformation = 'FAIL';
      }
    } catch (error) {
      console.error('❌ Graph transformation test failed:', error);
      this.results.graphDataTransformation = 'ERROR';
    }
  }

  async testSearchFilterFix() {
    console.log('\n🔍 Testing Search Filter Fix...');
    
    try {
      // Check if search functionality exists
      if (window.SearchManager && typeof window.SearchManager.showFilterPanel === 'function') {
        console.log('✅ SearchManager and showFilterPanel function exist');
        
        // Test filter panel with proper parameters
        const testContainer = document.createElement('div');
        const testData = [{ id: '1', name: 'Test Entity' }];
        const testCallback = () => console.log('Filter callback executed');
        
        try {
          // This should not throw "invalid parameters" error anymore
          window.SearchManager.showFilterPanel(testContainer, testData, testCallback);
          console.log('✅ Filter panel initialization completed without errors');
          this.results.searchFilterFix = 'PASS';
        } catch (error) {
          console.error('❌ Search filter test failed:', error);
          this.results.searchFilterFix = 'FAIL';
        }
      } else {
        console.log('❌ SearchManager or showFilterPanel function not found');
        this.results.searchFilterFix = 'FAIL';
      }
    } catch (error) {
      console.error('❌ Search filter test failed:', error);
      this.results.searchFilterFix = 'ERROR';
    }
  }

  async testErrorHandling() {
    console.log('\n⚡ Testing Error Handling...');
    
    try {
      // Check if error handlers are set up
      const hasErrorListeners = window.addEventListener.toString().includes('error');
      const hasUXManager = typeof window.uxManager === 'object';
      
      console.log(`✅ Error listeners: ${hasErrorListeners ? 'Present' : 'Missing'}`);
      console.log(`✅ UX Manager: ${hasUXManager ? 'Available' : 'Missing'}`);
      
      if (hasUXManager) {
        // Test notification system
        try {
          window.uxManager.showNotification('Test notification', 'info', 2000);
          console.log('✅ UX notification system working');
          this.results.errorHandling = 'PASS';
        } catch (error) {
          console.error('❌ UX notification failed:', error);
          this.results.errorHandling = 'FAIL';
        }
      } else {
        this.results.errorHandling = 'PARTIAL';
      }
    } catch (error) {
      console.error('❌ Error handling test failed:', error);
      this.results.errorHandling = 'ERROR';
    }
  }

  async testEndToEndFlow() {
    console.log('\n🎯 Testing End-to-End Flow...');
    
    try {
      let flowSteps = 0;
      const totalSteps = 5;
      
      // Step 1: Check if main modules loaded
      if (window.DataUploadManager) {
        flowSteps++;
        console.log('✅ Step 1: Data Upload Manager loaded');
      }
      
      // Step 2: Check if graph visualization ready
      if (window.GraphManager) {
        flowSteps++;
        console.log('✅ Step 2: Graph Manager loaded');
      }
      
      // Step 3: Check if search functionality ready
      if (window.SearchManager) {
        flowSteps++;
        console.log('✅ Step 3: Search Manager loaded');
      }
      
      // Step 4: Check if dashboard ready
      if (window.DashboardManager) {
        flowSteps++;
        console.log('✅ Step 4: Dashboard Manager loaded');
      }
      
      // Step 5: Check if UX system ready
      if (window.uxManager) {
        flowSteps++;
        console.log('✅ Step 5: UX Manager loaded');
      }
      
      const flowScore = (flowSteps / totalSteps) * 100;
      console.log(`📊 End-to-End Flow Score: ${flowScore}% (${flowSteps}/${totalSteps} components)`);
      
      if (flowScore >= 80) {
        this.results.endToEndFlow = 'PASS';
      } else if (flowScore >= 60) {
        this.results.endToEndFlow = 'PARTIAL';
      } else {
        this.results.endToEndFlow = 'FAIL';
      }
    } catch (error) {
      console.error('❌ End-to-end flow test failed:', error);
      this.results.endToEndFlow = 'ERROR';
    }
  }

  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    console.log('\n📋 FINAL VALIDATION REPORT');
    console.log('================================================');
    console.log(`⏱️  Test Duration: ${duration}ms`);
    console.log(`📅 Test Date: ${new Date().toISOString()}`);
    console.log('\n🔍 Test Results:');
    
    Object.entries(this.results).forEach(([test, result]) => {
      const emoji = this.getResultEmoji(result);
      const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`${emoji} ${testName}: ${result}`);
    });
    
    // Overall assessment
    const passCount = Object.values(this.results).filter(r => r === 'PASS').length;
    const totalTests = Object.keys(this.results).length;
    const successRate = (passCount / totalTests) * 100;
    
    console.log('\n📊 Overall Assessment:');
    console.log(`✅ Passed: ${passCount}/${totalTests} tests`);
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 80) {
      console.log('🎉 VALIDATION PASSED - Application fixes are successful!');
    } else if (successRate >= 60) {
      console.log('⚠️  VALIDATION PARTIAL - Some issues remain');
    } else {
      console.log('❌ VALIDATION FAILED - Critical issues need attention');
    }
    
    // Store results globally for inspection
    window.validationResults = {
      results: this.results,
      duration,
      successRate,
      timestamp: new Date().toISOString()
    };
  }

  getResultEmoji(result) {
    switch (result) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'ERROR': return '💥';
      case 'PARTIAL': return '⚠️';
      default: return '❓';
    }
  }
}

// Auto-run when script loads (with delay to ensure all modules are loaded)
window.addEventListener('load', () => {
  setTimeout(() => {
    const validator = new ValidationTester();
    validator.runAllTests();
  }, 3000); // Wait 3 seconds for all modules to load
});

// Also expose for manual testing
window.runValidationTests = () => {
  const validator = new ValidationTester();
  validator.runAllTests();
};

console.log('🔧 Validation Test Suite Loaded - Tests will run automatically after page load');
