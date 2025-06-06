/**
 * Data Validation and Transformation Rules Engine
 * Provides comprehensive data quality, validation, and transformation capabilities
 * Part of the comprehensive investigative analytics platform
 */

import { logAudit } from './audit.js';

class DataValidationEngine {
    constructor() {
        this.validationRules = new Map();
        this.transformationRules = new Map();
        this.dataProfiles = new Map();
        this.validationHistory = [];
        this.transformationHistory = [];
        
        this.init();
    }

    init() {
        this.setupDefaultRules();
        this.setupEventListeners();
        console.log('✓ Data Validation Engine initialized');
    }

    setupDefaultRules() {
        // Default validation rules
        this.addValidationRule('email', {
            name: 'Email Validation',
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Invalid email format',
            severity: 'error'
        });

        this.addValidationRule('phone', {
            name: 'Phone Number Validation',
            pattern: /^[\+]?[1-9][\d]{0,15}$/,
            message: 'Invalid phone number format',
            severity: 'warning'
        });

        this.addValidationRule('date', {
            name: 'Date Validation',
            validator: (value) => !isNaN(Date.parse(value)),
            message: 'Invalid date format',
            severity: 'error'
        });

        this.addValidationRule('currency', {
            name: 'Currency Validation',
            pattern: /^[\$\€\£]?\d+\.?\d{0,2}$/,
            message: 'Invalid currency format',
            severity: 'warning'
        });

        this.addValidationRule('required', {
            name: 'Required Field',
            validator: (value) => value !== null && value !== undefined && value !== '',
            message: 'Field is required',
            severity: 'error'
        });

        // Default transformation rules
        this.addTransformationRule('normalize_email', {
            name: 'Normalize Email',
            transformer: (value) => typeof value === 'string' ? value.toLowerCase().trim() : value
        });

        this.addTransformationRule('normalize_phone', {
            name: 'Normalize Phone',
            transformer: (value) => {
                if (typeof value !== 'string') return value;
                return value.replace(/[^\d\+]/g, '');
            }
        });

        this.addTransformationRule('capitalize_name', {
            name: 'Capitalize Name',
            transformer: (value) => {
                if (typeof value !== 'string') return value;
                return value.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            }
        });

        this.addTransformationRule('parse_date', {
            name: 'Parse Date',
            transformer: (value) => {
                if (!value) return value;
                const date = new Date(value);
                return isNaN(date.getTime()) ? value : date.toISOString();
            }
        });

        this.addTransformationRule('trim_whitespace', {
            name: 'Trim Whitespace',
            transformer: (value) => typeof value === 'string' ? value.trim() : value
        });
    }

    setupEventListeners() {
        // Listen for data upload events to trigger validation
        window.addEventListener('data:uploaded', (event) => {
            this.validateDataset(event.detail);
        });

        // Listen for manual validation requests
        window.addEventListener('validation:request', (event) => {
            this.performValidation(event.detail);
        });

        // Listen for transformation requests
        window.addEventListener('transformation:request', (event) => {
            this.performTransformation(event.detail);
        });
    }

    // Validation Rules Management
    addValidationRule(name, rule) {
        this.validationRules.set(name, {
            ...rule,
            id: this.generateId(),
            createdAt: new Date().toISOString()
        });
        
        logAudit('validation_rule_added', { ruleName: name, rule });
    }

    removeValidationRule(name) {
        const removed = this.validationRules.delete(name);
        if (removed) {
            logAudit('validation_rule_removed', { ruleName: name });
        }
        return removed;
    }

    getValidationRule(name) {
        return this.validationRules.get(name);
    }

    getAllValidationRules() {
        return Array.from(this.validationRules.entries()).map(([name, rule]) => ({
            name,
            ...rule
        }));
    }

    // Transformation Rules Management
    addTransformationRule(name, rule) {
        this.transformationRules.set(name, {
            ...rule,
            id: this.generateId(),
            createdAt: new Date().toISOString()
        });
        
        logAudit('transformation_rule_added', { ruleName: name, rule });
    }

    removeTransformationRule(name) {
        const removed = this.transformationRules.delete(name);
        if (removed) {
            logAudit('transformation_rule_removed', { ruleName: name });
        }
        return removed;
    }

    getTransformationRule(name) {
        return this.transformationRules.get(name);
    }

    getAllTransformationRules() {
        return Array.from(this.transformationRules.entries()).map(([name, rule]) => ({
            name,
            ...rule
        }));
    }

    // Data Validation
    async validateDataset(dataset) {
        const validationId = this.generateId();
        const startTime = performance.now();
        
        logAudit('validation_started', {
            validationId,
            datasetSize: dataset.length,
            rulesCount: this.validationRules.size
        });

        const results = {
            id: validationId,
            timestamp: new Date().toISOString(),
            dataset: dataset,
            totalRecords: dataset.length,
            validRecords: 0,
            invalidRecords: 0,
            warnings: 0,
            errors: [],
            warnings: [],
            fieldProfiles: {},
            summary: {}
        };

        try {
            // Profile the dataset first
            const profile = this.profileDataset(dataset);
            results.fieldProfiles = profile;

            // Validate each record
            for (let i = 0; i < dataset.length; i++) {
                const record = dataset[i];
                const recordValidation = await this.validateRecord(record, i);
                
                if (recordValidation.isValid) {
                    results.validRecords++;
                } else {
                    results.invalidRecords++;
                }
                
                results.errors.push(...recordValidation.errors);
                results.warnings.push(...recordValidation.warnings);
            }

            // Generate summary
            results.summary = {
                validityRate: (results.validRecords / results.totalRecords) * 100,
                errorRate: (results.invalidRecords / results.totalRecords) * 100,
                totalErrors: results.errors.length,
                totalWarnings: results.warnings.length,
                processingTime: performance.now() - startTime
            };

            this.validationHistory.push(results);
            
            logAudit('validation_completed', {
                validationId,
                summary: results.summary,
                errorsFound: results.errors.length,
                warningsFound: results.warnings.length
            });

            // Dispatch validation complete event
            window.dispatchEvent(new CustomEvent('validation:completed', {
                detail: results
            }));

            return results;

        } catch (error) {
            logAudit('validation_failed', {
                validationId,
                error: error.message,
                processingTime: performance.now() - startTime
            });
            throw error;
        }
    }

    async validateRecord(record, index) {
        const result = {
            index,
            isValid: true,
            errors: [],
            warnings: []
        };

        for (const [fieldName, value] of Object.entries(record)) {
            const fieldValidation = await this.validateField(fieldName, value, index);
            
            if (fieldValidation.errors.length > 0) {
                result.isValid = false;
                result.errors.push(...fieldValidation.errors);
            }
            
            result.warnings.push(...fieldValidation.warnings);
        }

        return result;
    }

    async validateField(fieldName, value, recordIndex) {
        const result = {
            fieldName,
            value,
            errors: [],
            warnings: []
        };

        // Apply all relevant validation rules
        for (const [ruleName, rule] of this.validationRules) {
            try {
                let isValid = true;

                if (rule.pattern) {
                    isValid = rule.pattern.test(String(value));
                } else if (rule.validator) {
                    isValid = await rule.validator(value, fieldName, recordIndex);
                }

                if (!isValid) {
                    const violation = {
                        ruleName,
                        fieldName,
                        value,
                        recordIndex,
                        message: rule.message,
                        severity: rule.severity || 'error'
                    };

                    if (rule.severity === 'warning') {
                        result.warnings.push(violation);
                    } else {
                        result.errors.push(violation);
                    }
                }
            } catch (error) {
                result.errors.push({
                    ruleName,
                    fieldName,
                    value,
                    recordIndex,
                    message: `Validation rule error: ${error.message}`,
                    severity: 'error'
                });
            }
        }

        return result;
    }

    // Data Transformation
    async transformDataset(dataset, transformationPlan) {
        const transformationId = this.generateId();
        const startTime = performance.now();
        
        logAudit('transformation_started', {
            transformationId,
            datasetSize: dataset.length,
            planSteps: transformationPlan.length
        });

        const results = {
            id: transformationId,
            timestamp: new Date().toISOString(),
            originalDataset: dataset,
            transformedDataset: [],
            plan: transformationPlan,
            errors: [],
            statistics: {}
        };

        try {
            // Apply transformations
            for (let i = 0; i < dataset.length; i++) {
                const record = { ...dataset[i] };
                const transformedRecord = await this.transformRecord(record, transformationPlan);
                results.transformedDataset.push(transformedRecord);
            }

            // Generate statistics
            results.statistics = {
                recordsTransformed: results.transformedDataset.length,
                processingTime: performance.now() - startTime,
                transformationSteps: transformationPlan.length
            };

            this.transformationHistory.push(results);
            
            logAudit('transformation_completed', {
                transformationId,
                statistics: results.statistics,
                errorsEncountered: results.errors.length
            });

            // Dispatch transformation complete event
            window.dispatchEvent(new CustomEvent('transformation:completed', {
                detail: results
            }));

            return results;

        } catch (error) {
            logAudit('transformation_failed', {
                transformationId,
                error: error.message,
                processingTime: performance.now() - startTime
            });
            throw error;
        }
    }

    async transformRecord(record, transformationPlan) {
        const transformedRecord = { ...record };

        for (const step of transformationPlan) {
            try {
                if (step.field && step.transformation) {
                    const rule = this.transformationRules.get(step.transformation);
                    if (rule && rule.transformer) {
                        transformedRecord[step.field] = await rule.transformer(
                            transformedRecord[step.field],
                            step.field,
                            transformedRecord
                        );
                    }
                }
            } catch (error) {
                console.warn(`Transformation error for field ${step.field}:`, error);
                // Continue with other transformations
            }
        }

        return transformedRecord;
    }

    // Data Profiling
    profileDataset(dataset) {
        if (!dataset || dataset.length === 0) return {};

        const profile = {};
        const sampleSize = Math.min(dataset.length, 1000); // Sample for large datasets

        // Get all field names
        const allFields = new Set();
        dataset.slice(0, sampleSize).forEach(record => {
            Object.keys(record).forEach(field => allFields.add(field));
        });

        // Profile each field
        allFields.forEach(fieldName => {
            profile[fieldName] = this.profileField(fieldName, dataset, sampleSize);
        });

        return profile;
    }

    profileField(fieldName, dataset, sampleSize) {
        const values = dataset.slice(0, sampleSize)
            .map(record => record[fieldName])
            .filter(value => value !== null && value !== undefined);

        const profile = {
            fieldName,
            totalValues: values.length,
            nullCount: sampleSize - values.length,
            nullRate: ((sampleSize - values.length) / sampleSize) * 100,
            uniqueCount: new Set(values).size,
            dataTypes: this.detectDataTypes(values),
            patterns: this.detectPatterns(values),
            statistics: this.calculateStatistics(values)
        };

        return profile;
    }

    detectDataTypes(values) {
        const types = {
            string: 0,
            number: 0,
            boolean: 0,
            date: 0,
            email: 0,
            phone: 0,
            url: 0
        };

        values.forEach(value => {
            if (typeof value === 'boolean') {
                types.boolean++;
            } else if (typeof value === 'number') {
                types.number++;
            } else if (typeof value === 'string') {
                types.string++;
                
                // Check for specialized string types
                if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    types.email++;
                } else if (/^[\+]?[1-9][\d]{0,15}$/.test(value)) {
                    types.phone++;
                } else if (/^https?:\/\//.test(value)) {
                    types.url++;
                } else if (!isNaN(Date.parse(value))) {
                    types.date++;
                }
            }
        });

        return types;
    }

    detectPatterns(values) {
        const patterns = {};
        const sampleValues = values.slice(0, 100); // Sample for pattern detection

        // Common patterns
        const commonPatterns = {
            numeric: /^\d+$/,
            alphanumeric: /^[a-zA-Z0-9]+$/,
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[\+]?[1-9][\d]{0,15}$/,
            date_iso: /^\d{4}-\d{2}-\d{2}/,
            currency: /^[\$\€\£]?\d+\.?\d{0,2}$/
        };

        Object.entries(commonPatterns).forEach(([patternName, regex]) => {
            const matches = sampleValues.filter(value => 
                typeof value === 'string' && regex.test(value)
            ).length;
            
            if (matches > 0) {
                patterns[patternName] = {
                    matches,
                    percentage: (matches / sampleValues.length) * 100
                };
            }
        });

        return patterns;
    }

    calculateStatistics(values) {
        const numericValues = values
            .map(v => typeof v === 'number' ? v : parseFloat(v))
            .filter(v => !isNaN(v));

        if (numericValues.length === 0) {
            return {
                type: 'non-numeric',
                min: null,
                max: null,
                mean: null,
                median: null,
                standardDeviation: null
            };
        }

        const sorted = numericValues.sort((a, b) => a - b);
        const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
        const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;

        return {
            type: 'numeric',
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean,
            median: sorted[Math.floor(sorted.length / 2)],
            standardDeviation: Math.sqrt(variance),
            count: numericValues.length
        };
    }

    // Utility Methods
    generateId() {
        return 'val-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Export/Import Rules
    exportRules() {
        return {
            validationRules: Array.from(this.validationRules.entries()),
            transformationRules: Array.from(this.transformationRules.entries()),
            exportedAt: new Date().toISOString()
        };
    }

    importRules(rulesData) {
        try {
            if (rulesData.validationRules) {
                rulesData.validationRules.forEach(([name, rule]) => {
                    this.validationRules.set(name, rule);
                });
            }

            if (rulesData.transformationRules) {
                rulesData.transformationRules.forEach(([name, rule]) => {
                    this.transformationRules.set(name, rule);
                });
            }

            logAudit('rules_imported', {
                validationRulesCount: rulesData.validationRules?.length || 0,
                transformationRulesCount: rulesData.transformationRules?.length || 0
            });

            return true;
        } catch (error) {
            logAudit('rules_import_failed', { error: error.message });
            throw error;
        }
    }

    // History and Reporting
    getValidationHistory(limit = 10) {
        return this.validationHistory.slice(-limit);
    }

    getTransformationHistory(limit = 10) {
        return this.transformationHistory.slice(-limit);
    }

    generateQualityReport(validationResults) {
        return {
            reportId: this.generateId(),
            generatedAt: new Date().toISOString(),
            validationId: validationResults.id,
            summary: validationResults.summary,
            qualityScore: this.calculateQualityScore(validationResults),
            recommendations: this.generateRecommendations(validationResults),
            fieldProfiles: validationResults.fieldProfiles,
            topIssues: this.getTopIssues(validationResults)
        };
    }

    calculateQualityScore(validationResults) {
        const { validityRate, errorRate } = validationResults.summary;
        
        // Base score from validity rate
        let score = validityRate;
        
        // Penalty for high error rate
        score -= errorRate * 0.5;
        
        // Ensure score is between 0 and 100
        return Math.max(0, Math.min(100, score));
    }

    generateRecommendations(validationResults) {
        const recommendations = [];
        const { summary, fieldProfiles } = validationResults;

        if (summary.errorRate > 10) {
            recommendations.push({
                type: 'high_error_rate',
                message: 'High error rate detected. Consider reviewing data source quality.',
                priority: 'high'
            });
        }

        Object.entries(fieldProfiles).forEach(([fieldName, profile]) => {
            if (profile.nullRate > 50) {
                recommendations.push({
                    type: 'high_null_rate',
                    field: fieldName,
                    message: `Field ${fieldName} has high null rate (${profile.nullRate.toFixed(1)}%)`,
                    priority: 'medium'
                });
            }
        });

        return recommendations;
    }

    getTopIssues(validationResults) {
        const errorCounts = {};
        
        validationResults.errors.forEach(error => {
            const key = `${error.ruleName}:${error.fieldName}`;
            errorCounts[key] = (errorCounts[key] || 0) + 1;
        });

        return Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([issue, count]) => ({ issue, count }));
    }
}

// Module initialization and exports
let validationEngine = null;

export async function initDataValidation() {
    validationEngine = new DataValidationEngine();
    
    // Make globally available
    window.dataValidationEngine = validationEngine;
    
    console.log('✓ Data Validation module initialized');
    return validationEngine;
}

// Export main functions
export function validateDataset(dataset) {
    return validationEngine?.validateDataset(dataset);
}

export function transformDataset(dataset, plan) {
    return validationEngine?.transformDataset(dataset, plan);
}

export function addValidationRule(name, rule) {
    return validationEngine?.addValidationRule(name, rule);
}

export function addTransformationRule(name, rule) {
    return validationEngine?.addTransformationRule(name, rule);
}

export function getDataProfile(dataset) {
    return validationEngine?.profileDataset(dataset);
}

export function generateQualityReport(validationResults) {
    return validationEngine?.generateQualityReport(validationResults);
}

// Export class
export { DataValidationEngine };
