// Central app entry point. Imports and initializes all modules.
import { initDataUpload } from './modules/dataUpload.js?v=2';
import { initEntityResolution } from './modules/entityResolution.js';
import { initGraph } from './modules/graph.js';
import { initDashboard } from './modules/dashboard.js';
import { initSearch } from './modules/search.js';
import { initCaseWorkspace } from './modules/caseWorkspace.js';
import { initReport } from './modules/report.js';
import { initPermissions } from './modules/permissions.js';
import { initAudit } from './modules/audit.js';
import { initGeospatial } from './modules/geospatial.js';
import { initNLP } from './modules/nlp.js';
import { initDataValidation } from './modules/dataValidation.js';

// Import UX enhancements
import './modules/ux.js';

// Do not try to import cytoscape directly - it's loaded via script tag

window.onload = function() {
  // Initialize core systems first
  initAudit();
  initPermissions();
  
  // Show initial loading
  if (window.uxManager) {
    window.uxManager.showLoading('Initializing application...', 'startup');
  }
  
  // Initialize modules with progress tracking
  const modules = [
    { name: 'Data Validation', init: initDataValidation },
    { name: 'Data Upload', init: initDataUpload },
    { name: 'Entity Resolution', init: initEntityResolution },
    { name: 'Graph Visualization', init: initGraph },
    { name: 'Dashboard', init: initDashboard },
    { name: 'Search', init: initSearch },
    { name: 'Case Workspace', init: initCaseWorkspace },
    { name: 'Reports', init: initReport },
    { name: 'Geospatial', init: initGeospatial },
    { name: 'NLP', init: initNLP }
  ];
  
  // Initialize modules with progress tracking
  initializeModulesWithProgress(modules);
};

// Generate sample audit data for testing purposes
function generateSampleAuditData() {
  const auditLogger = window.auditLogger;
  if (!auditLogger) return;
  
  console.log('Generating sample audit data for testing...');
  
  // Sample data operations
  auditLogger.logEvent('data_upload', {
    fileName: 'financial_records.csv',
    recordCount: 1250,
    fileSize: '2.3MB'
  });
  
  auditLogger.logEvent('data_normalized', {
    recordsProcessed: 1250,
    duplicatesRemoved: 45,
    validationErrors: 12
  });
  
  // Sample search operations
  auditLogger.logEvent('search_executed', {
    query: 'financial transactions',
    resultsCount: 234,
    searchTime: 0.45
  });
  
  auditLogger.logEvent('visual_query_built', {
    queryType: 'complex_filter',
    conditions: 3,
    fields: ['amount', 'date', 'category']
  });
  
  // Sample graph operations
  auditLogger.logEvent('graph_layout_changed', {
    layoutType: 'force-directed',
    nodeCount: 156,
    edgeCount: 423
  });
  
  auditLogger.logEvent('clustering_performed', {
    algorithm: 'community_detection',
    clustersFound: 8,
    processingTime: 1.2
  });
  
  // Sample case management
  auditLogger.logEvent('case_created', {
    caseName: 'Financial Investigation 2024-001',
    caseType: 'financial_fraud',
    priority: 'high'
  });
  
  auditLogger.logEvent('case_entity_added', {
    entityType: 'person',
    entityId: 'PER-001',
    caseName: 'Financial Investigation 2024-001'
  });
  
  // Sample collaboration events
  auditLogger.logEvent('collaboration_invite_sent', {
    inviteeEmail: 'analyst@example.com',
    permissionLevel: 'edit',
    caseName: 'Financial Investigation 2024-001'
  });
  
  // Sample security events
  auditLogger.logSecurityEvent('user_login', {
    loginMethod: 'password',
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome/120.0.0.0'
  });
  
  auditLogger.logSecurityEvent('authentication_failed', {
    reason: 'invalid_password',
    attempts: 3,
    ipAddress: '192.168.1.100'
  }, 'WARN');
  
  // Sample system events
  auditLogger.logSystemEvent('warning', {
    component: 'graph_renderer',
    message: 'Performance degradation detected',
    memoryUsage: '850MB'
  }, 'WARN');
  
  auditLogger.logError(new Error('Network timeout'), {
    operation: 'data_export',
    timeout: 30000
  });
  
  // Sample geospatial events
  auditLogger.logEvent('geocoding_performed', {
    addresses: 25,
    successRate: 0.92,
    provider: 'nominatim'
  });
  
  // Sample NLP events
  auditLogger.logEvent('nlp_entity_extraction', {
    textLength: 5420,
    entitiesFound: 34,
    confidence: 0.87
  });
  
  // Sample performance metrics
  auditLogger.logPerformance('search_operation', 1.23, {
    indexSize: 50000,
    queryComplexity: 'medium'
  });
  
  auditLogger.logPerformance('graph_rendering', 2.45, {
    nodeCount: 156,
    edgeCount: 423,
    layoutAlgorithm: 'force-directed'
  });
  
  console.log('✓ Sample audit data generated');
  
  // Test data validation with sample dataset
  if (window.dataValidationEngine) {
    setTimeout(() => {
      testDataValidation();
    }, 1000);
  }
}

// Test data validation functionality
function testDataValidation() {
  console.log('Testing data validation engine...');
  
  const sampleDataset = [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      amount: '$1,234.56',
      date: '2024-01-15',
      address: '123 Main St'
    },
    {
      name: 'jane smith',
      email: 'invalid-email',
      phone: '555-CALL-ME',
      amount: 'not a number',
      date: '2024/02/30', // Invalid date
      address: ''
    },
    {
      name: 'Bob Johnson',
      email: 'bob@test.com',
      phone: '5551234567',
      amount: '2500.00',
      date: '2024-03-01',
      address: '456 Oak Ave'
    },
    {
      name: '', // Missing required field
      email: 'alice@company.org',
      phone: '+44 20 7946 0958',
      amount: '€750.25',
      date: '2024-04-15T10:30:00Z',
      address: null
    }
  ];
  
  // Test validation
  window.dataValidationEngine.validateDataset(sampleDataset)
    .then(results => {
      console.log('✓ Data validation completed:', results);
      
      // Generate quality report
      const qualityReport = window.dataValidationEngine.generateQualityReport(results);
      console.log('✓ Quality report generated:', qualityReport);
    })
    .catch(error => {
      console.error('Data validation failed:', error);
    });
  
  // Test transformation
  const transformationPlan = [
    { field: 'name', transformation: 'capitalize_name' },
    { field: 'email', transformation: 'normalize_email' },
    { field: 'phone', transformation: 'normalize_phone' },
    { field: 'date', transformation: 'parse_date' }
  ];
  
  window.dataValidationEngine.transformDataset(sampleDataset, transformationPlan)
    .then(results => {
      console.log('✓ Data transformation completed:', results);
    })
    .catch(error => {
      console.error('Data transformation failed:', error);
    });
}

// Enhanced module initialization with progress tracking
function initializeModulesWithProgress(modules) {
  const progressId = 'module-init';
  
  if (window.uxManager) {
    window.uxManager.showProgress(progressId, 'Initializing modules...');
  }
  
  let completed = 0;
  const total = modules.length;
  
  modules.forEach((module, index) => {
    setTimeout(() => {
      try {
        console.log(`Initializing ${module.name}...`);
        module.init();
        completed++;
        
        const progress = (completed / total) * 100;
        if (window.uxManager) {
          window.uxManager.updateProgress(progressId, progress, `Loaded ${module.name}`);
        }
        
        if (completed === total) {
          // All modules loaded
          setTimeout(() => {
            if (window.uxManager) {
              window.uxManager.hideProgress(progressId);
              window.uxManager.hideLoading('startup');
              window.uxManager.showNotification(
                'Application initialized successfully!', 
                'success', 
                3000
              );
            }
            
            // Generate sample data after initialization
            setTimeout(() => {
              if (window.auditLogger && window.location.hostname === 'localhost') {
                generateSampleAuditData();
              }
            }, 1000);
            
            // Set up enhanced event listeners
            setupEnhancedEventListeners();
          }, 500);
        }
        
      } catch (error) {
        console.error(`Error initializing ${module.name}:`, error);
        if (window.uxManager) {
          window.uxManager.showNotification(
            `Failed to initialize ${module.name}: ${error.message}`, 
            'error', 
            5000
          );
        }
      }
    }, index * 100); // Stagger initialization
  });
}

// Enhanced event listeners for better UX
function setupEnhancedEventListeners() {
  // Enhanced file upload with drag & drop
  setupEnhancedFileUpload();
  
  // Enhanced search with debouncing
  setupEnhancedSearch();
  
  // Enhanced button interactions
  setupEnhancedButtons();
  
  // Enhanced case management
  setupEnhancedCaseManagement();
  
  // Performance monitoring
  setupPerformanceMonitoring();
  
  // Manual entry button handlers
  setupManualEntryButtons();
}

function setupEnhancedFileUpload() {
  const fileInput = document.getElementById('fileInput');
  const uploadArea = fileInput?.closest('.card-body');
  
  if (!uploadArea) return;
  
  // Add drag and drop styling
  uploadArea.style.position = 'relative';
  uploadArea.style.transition = 'all 0.3s ease';
  
  // Drag and drop events
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    uploadArea.style.background = 'rgba(102, 126, 234, 0.1)';
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.transform = 'scale(1.02)';
  }
  
  function unhighlight() {
    uploadArea.style.background = '';
    uploadArea.style.borderColor = '';
    uploadArea.style.transform = '';
  }
  
  uploadArea.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      fileInput.files = files;
      
      if (window.uxManager) {
        window.uxManager.showNotification(
          `File "${files[0].name}" ready for upload`, 
          'success', 
          3000
        );
        window.uxManager.trackUserAction('file_dropped', {
          fileName: files[0].name,
          fileSize: files[0].size
        });
      }
      
      // Trigger file processing
      const event = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(event);
    }
  }
}

function setupEnhancedSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  // Add search enhancement features
  searchInput.setAttribute('placeholder', '🔍 Search entities, relationships, attributes...');
  
  // Debounced search
  const debouncedSearch = window.uxManager ? 
    window.uxManager.debounce((query) => {
      if (window.searchModule && window.searchModule.performSearch) {
        window.searchModule.performSearch(query);
        
        if (window.uxManager) {
          window.uxManager.trackUserAction('search', { query: query.length });
        }
      }
    }, 300) : null;
  
  if (debouncedSearch) {
    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
  }
  
  // Search suggestions
  searchInput.addEventListener('focus', () => {
    if (window.uxManager) {
      window.uxManager.showNotification(
        'Try searching for names, companies, or relationship types', 
        'info', 
        2000
      );
    }
  });
}

function setupEnhancedButtons() {
  // Store original button states
  document.querySelectorAll('.btn').forEach(button => {
    button.dataset.originalText = button.innerHTML;
    button.dataset.originalClass = button.className;
  });
  
  // Enhanced save case button
  const saveButton = document.getElementById('saveCase');
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      if (window.uxManager) {
        window.uxManager.setButtonState('saveCase', 'loading');
        window.uxManager.trackUserAction('save_case');
        
        // Simulate save operation
        setTimeout(() => {
          window.uxManager.setButtonState('saveCase', 'success');
        }, 1000);
      }
    });
  }
  
  // Enhanced load case button
  const loadButton = document.getElementById('loadCase');
  if (loadButton) {
    loadButton.addEventListener('click', () => {
      if (window.uxManager) {
        window.uxManager.trackUserAction('load_case');
      }
    });
  }
  
  // Enhanced sample data button
  const sampleButton = document.getElementById('loadSample');
  if (sampleButton) {
    sampleButton.addEventListener('click', () => {
      if (window.uxManager) {
        window.uxManager.setButtonState('loadSample', 'loading');
        window.uxManager.trackUserAction('load_sample_data');
        
        setTimeout(() => {
          window.uxManager.setButtonState('loadSample', 'success');
          window.uxManager.showNotification(
            'Sample data loaded successfully!', 
            'success', 
            3000
          );
        }, 1500);
      }
    });
  }
}

function setupEnhancedCaseManagement() {
  const caseList = document.getElementById('caseList');
  if (!caseList) return;
  
  // Add enhanced case list interactions
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'LI') {
          // Add enhanced interactions to new case items
          node.addEventListener('mouseenter', () => {
            if (window.uxManager) {
              node.style.transform = 'translateX(8px) scale(1.02)';
            }
          });
          
          node.addEventListener('mouseleave', () => {
            node.style.transform = '';
          });
          
          node.addEventListener('click', () => {
            if (window.uxManager) {
              window.uxManager.trackUserAction('case_selected', {
                caseId: node.dataset.caseId || 'unknown'
              });
            }
          });
        }
      });
    });
  });
  
  observer.observe(caseList, { childList: true });
}

function setupPerformanceMonitoring() {
  // Monitor graph rendering performance
  if (window.cy) {
    const originalAdd = window.cy.add;
    window.cy.add = function(...args) {
      if (window.uxManager) {
        return window.uxManager.measurePerformance('graph_add_elements', () => {
          return originalAdd.apply(this, args);
        });
      }
      return originalAdd.apply(this, args);
    };
  }
  
  // Monitor data processing performance
  if (window.dataValidation) {
    const originalValidate = window.dataValidation.validateDataset;
    if (originalValidate) {
      window.dataValidation.validateDataset = function(...args) {
        if (window.uxManager) {
          return window.uxManager.measurePerformance('data_validation', () => {
            return originalValidate.apply(this, args);
          });
        }
        return originalValidate.apply(this, args);
      };
    }
  }
}

// Manual entry button handlers
function setupManualEntryButtons() {
  const addEntityBtn = document.getElementById('addEntity');
  const addRelationshipBtn = document.getElementById('addRelationship');
  
  if (addEntityBtn) {
    addEntityBtn.addEventListener('click', () => {
      if (window.uxManager) {
        window.uxManager.trackUserAction('manual_add_entity');
      }
      
      import('./modules/dataUpload/manualEntry.js').then(({ showManualEntryModal }) => {
        showManualEntryModal((entry, type) => {
          console.log('Manual entity added:', entry);
          
          // Add to current data if available
          if (window.normalizedData) {
            window.normalizedData.push(entry);
            
            // Trigger data update event
            window.dispatchEvent(new CustomEvent('data:updated', { 
              detail: { 
                data: window.normalizedData,
                action: 'add',
                type: 'entity',
                entry: entry
              }
            }));
          }
          
          if (window.uxManager) {
            window.uxManager.showNotification(
              'Entity added successfully',
              'success',
              3000
            );
          }
        }, null, 'entity');
      });
    });
  }
  
  if (addRelationshipBtn) {
    addRelationshipBtn.addEventListener('click', () => {
      if (window.uxManager) {
        window.uxManager.trackUserAction('manual_add_relationship');
      }
      
      import('./modules/dataUpload/manualEntry.js').then(({ showManualEntryModal }) => {
        showManualEntryModal((entry, type) => {
          console.log('Manual relationship added:', entry);
          
          // Add to current data if available
          if (window.normalizedData) {
            window.normalizedData.push(entry);
            
            // Trigger data update event
            window.dispatchEvent(new CustomEvent('data:updated', { 
              detail: { 
                data: window.normalizedData,
                action: 'add',
                type: 'relationship',
                entry: entry
              }
            }));
          }
          
          if (window.uxManager) {
            window.uxManager.showNotification(
              'Relationship added successfully',
              'success',
              3000
            );
          }
        }, null, 'relationship');
      });
    });
  }
}

// Call the function during initialization
setupManualEntryButtons();
