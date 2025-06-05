import DataProcessor from './core/processor.js';
import TypeDetector from './core/type-detector.js';

// Import recognizers
import EmailRecognizer from './recognizers/email-recognizer.js';
import PhoneRecognizer from './recognizers/phone-recognizer.js';
import AddressRecognizer from './recognizers/address-recognizer.js';
import CoordinatesRecognizer from './recognizers/coordinates-recognizer.js';
// Import other recognizers as needed

// Import pattern files
import fieldPatterns from './patterns/field-patterns.json';
import entityTypePatterns from './patterns/entity-types.json';

/**
 * Data Processor Module
 * 
 * Automatically processes imported data before loading into views:
 * - Extracts relevant fields
 * - Recognizes common data types
 * - Cleans and normalizes data values
 * - Transforms data structures if needed
 */
class DataProcessorModule {
    constructor() {
        // Initialize type detector
        this.typeDetector = new TypeDetector(entityTypePatterns);
        
        // Initialize recognizers
        this.recognizers = {
            email: new EmailRecognizer(fieldPatterns.email),
            phone: new PhoneRecognizer(fieldPatterns.phone),
            address: new AddressRecognizer(fieldPatterns.address),
            coordinates: new CoordinatesRecognizer(fieldPatterns.coordinates)
            // Add other recognizers as needed
        };
        
        // Initialize processor with injected dependencies
        this.processor = new DataProcessor(this.typeDetector, this.recognizers);
        
        // Listen for import events
        this.init();
    }
    
    /**
     * Initialize the data processor
     */
    init() {
        // Listen for data import events before they reach the universal viewer
        eventBus.on('import:data', this.handleImportData.bind(this), true);
        
        console.log('Data Processor Module initialized');
    }
    
    /**
     * Handle imported data
     * @param {Object} data - Import data event object
     */
    handleImportData(data) {
        console.log('Data processor intercepting imported data');
        
        // Process the data
        const processedData = this.processor.processData(data.data);
        
        // Update the event data with processed data
        data.data = processedData;
        data.processed = true;
        
        // Allow event to continue to the next handler
        return true;
    }
    
    /**
     * Configure additional recognition patterns
     * @param {Object} patterns - Custom patterns to add
     */
    addPatterns(patterns) {
        // Create or update recognizers for new patterns
        if (patterns.fieldPatterns) {
            Object.entries(patterns.fieldPatterns).forEach(([type, pattern]) => {
                // Add patterns to existing recognizer or create new one
                if (this.recognizers[type]) {
                    this.recognizers[type].patterns = {
                        ...this.recognizers[type].patterns,
                        ...pattern
                    };
                }
                // Add code to create new recognizer types if needed
            });
        }
        
        // Update entity type patterns if provided
        if (patterns.entityTypes) {
            this.typeDetector.entityTypePatterns = {
                ...this.typeDetector.entityTypePatterns,
                ...patterns.entityTypes
            };
        }
        
        return this;
    }
}

// Create singleton instance
const dataProcessor = new DataProcessorModule();

export default dataProcessor;
