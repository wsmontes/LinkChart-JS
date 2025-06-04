/**
 * Main application file for LinkChart JS
 */

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initApplication();
});

function initApplication() {
    // Create chart data
    const chartData = new ChartData();
    
    // Initialize the visualization
    const chart = new ChartVisualization('chart-container', chartData);
    chart.init();
    
    // Initialize the UI manager
    const uiManager = new UiManager(chart);
    uiManager.init();

    // Initialize CSV importer after UI manager is ready
    const csvImporter = new CsvImporter(chart, uiManager);
    csvImporter.init();
    
    // Initialize the entity type modal
    uiManager.initEntityTypeModal();
    
    // Initialize analyzer
    const analyzer = new GraphAnalysis(chartData);
    
    // Add auto-analysis tracking
    let lastEntityCount = 0;
    let lastRelationshipCount = 0;
    let analysisNeeded = false;
    
    // Set up observer to track changes and suggest analysis
    const dataObserver = new MutationObserver(() => {
        // Check if significant changes have been made
        const currentEntityCount = chart.data.entities.length;
        const currentRelationshipCount = chart.data.relationships.length;
        
        // Suggest analysis if the graph has grown by more than 20%
        if (currentEntityCount > 5 && 
            (currentEntityCount > lastEntityCount * 1.2 || 
             currentRelationshipCount > lastRelationshipCount * 1.2)) {
            
            // Mark that analysis would be helpful
            analysisNeeded = true;
            
            // Add visual indicator
            document.getElementById('analyze-chart').closest('.app-container')
                .classList.add('has-new-data');
        }
        
        lastEntityCount = currentEntityCount;
        lastRelationshipCount = currentRelationshipCount;
    });
    
    // Register data manager events
    chart.data.onChanged = () => {
        // Trigger the observer
        dataObserver.observe(document.body, { childList: true, subtree: true });
        
        // Disconnect immediately to avoid unnecessary observations
        setTimeout(() => dataObserver.disconnect(), 100);
    };
    
    // Check if there's saved data to load
    checkForSavedData(chart);
    
    // Add to global for debugging purposes
    window.linkChartApp = {
        chart,
        uiManager,
        dataManager,
        csvImporter,
        analyzer
    };
}

async function checkForSavedData(chart) {
    try {
        // Try to load saved data from local storage
        const savedData = await dataManager.loadChart();
        
        if (savedData && savedData.entities.length > 0) {
            chart.updateData(savedData);
            chart.fitView();
            
            // Check if we should apply analysis-based layout
            if (savedData.lastLayoutType === 'analysis') {
                // Create an analyzer and apply optimal layout
                const analyzer = new GraphAnalysis(chart.data);
                analyzer.analyzeGraph();
                analyzer.applyOptimalLayout(chart);
            }
            // Apply hierarchical layout if hierarchical relationships exist
            else if (savedData.relationships.some(r => r.type === 'hierarchical')) {
                setTimeout(() => chart.optimizeHierarchicalLayout(), 300);
            }
        } else {
            // Load sample data if no saved data
            loadSampleData(chart);
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
        loadSampleData(chart);
    }
}

function loadSampleData(chart) {
    // Check if we want to load issue tracking sample data or regular sample data
    const urlParams = new URLSearchParams(window.location.search);
    const dataType = urlParams.get('data') || 'default';
    
    if (dataType === 'issues') {
        const sampleData = dataManager.createIssueSampleData();
        chart.updateData(sampleData);
        chart.fitView();
        
        // Apply hierarchical layout for issue data
        setTimeout(() => chart.optimizeHierarchicalLayout(), 500);
    } else if (dataType === 'analysis') {
        // Load data specifically designed to showcase analysis features
        const complexData = dataManager.createComplexSampleData();
        chart.updateData(complexData);
        chart.fitView();
        
        // Run analysis after a delay to ensure rendering is complete
        setTimeout(() => {
            const analyzer = new GraphAnalysis(chart.data);
            analyzer.analyzeGraph();
            analyzer.applyOptimalLayout(chart);
        }, 700);
    } else {
        // Create standard sample data for first-time users
        const sampleData = dataManager.createSampleData();
        chart.updateData(sampleData);
        chart.fitView();
    }
}

// Add change tracking to ChartData
function enhanceChartData() {
    // Add change event support to ChartData
    const originalAddEntity = ChartData.prototype.addEntity;
    ChartData.prototype.addEntity = function(entity) {
        const result = originalAddEntity.call(this, entity);
        if (this.onChanged) this.onChanged();
        return result;
    };
    
    const originalAddRelationship = ChartData.prototype.addRelationship;
    ChartData.prototype.addRelationship = function(relationship) {
        const result = originalAddRelationship.call(this, relationship);
        if (this.onChanged) this.onChanged();
        return result;
    };
    
    const originalRemoveEntityById = ChartData.prototype.removeEntityById;
    ChartData.prototype.removeEntityById = function(id) {
        const result = originalRemoveEntityById.call(this, id);
        if (this.onChanged) this.onChanged();
        return result;
    };
    
    const originalRemoveRelationshipById = ChartData.prototype.removeRelationshipById;
    ChartData.prototype.removeRelationshipById = function(id) {
        const result = originalRemoveRelationshipById.call(this, id);
        if (this.onChanged) this.onChanged();
        return result;
    };
}

// Enhance ChartData with change tracking
enhanceChartData();
