// Submodule for file ingestion (CSV, JSON, TSV)

export function ingestFiles(files, onLoaded) {
  const allData = [];
  let filesProcessed = 0;
  
  if (files.length === 0) {
    onLoaded([]);
    return;
  }

  // Show loading state
  if (window.uxManager) {
    window.uxManager.showLoading('Processing uploaded files...');
  }

  files.forEach((file, index) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const content = e.target.result;
        let parsedData = [];
        
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          parsedData = parseJSON(content, file.name);
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          parsedData = parseCSV(content, file.name);
        } else if (file.name.endsWith('.tsv')) {
          parsedData = parseTSV(content, file.name);
        } else {
          // Try to auto-detect format
          parsedData = autoDetectAndParse(content, file.name);
        }
        
        // Add metadata to each row
        parsedData.forEach(row => {
          row._source_file = file.name;
          row._file_index = index;
          row._row_id = generateRowId();
        });
        
        allData.push(...parsedData);
        filesProcessed++;
        
        // Update progress
        const progress = (filesProcessed / files.length) * 100;
        if (window.uxManager) {
          window.uxManager.updateProgress('file-upload', progress, `Processing file ${filesProcessed} of ${files.length}`);
        }
        
        if (filesProcessed === files.length) {
          // All files processed
          if (window.uxManager) {
            window.uxManager.hideLoading();
            window.uxManager.showNotification(
              `Successfully loaded ${allData.length} records from ${files.length} file(s)`,
              'success',
              3000
            );
          }
          onLoaded(allData);
        }
      } catch (error) {
        console.error('Error parsing file:', file.name, error);
        if (window.uxManager) {
          window.uxManager.showNotification(
            `Error parsing file ${file.name}: ${error.message}`,
            'error',
            5000
          );
        }
        filesProcessed++;
        if (filesProcessed === files.length) {
          onLoaded(allData);
        }
      }
    };
    
    reader.onerror = function() {
      console.error('Error reading file:', file.name);
      if (window.uxManager) {
        window.uxManager.showNotification(
          `Error reading file ${file.name}`,
          'error',
          3000
        );
      }
      filesProcessed++;
      if (filesProcessed === files.length) {
        onLoaded(allData);
      }
    };
    
    reader.readAsText(file);
  });
}

function parseJSON(content, filename) {
  try {
    const data = JSON.parse(content);
    
    // Handle different JSON structures
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (data.records && Array.isArray(data.records)) {
      return data.records;
    } else if (data.nodes || data.edges) {
      // Graph format
      const result = [];
      if (data.nodes) {
        data.nodes.forEach(node => {
          result.push({ ...node, _type: 'node' });
        });
      }
      if (data.edges) {
        data.edges.forEach(edge => {
          result.push({ ...edge, _type: 'edge' });
        });
      }
      return result;
    } else {
      // Single object, wrap in array
      return [data];
    }
  } catch (error) {
    throw new Error(`Invalid JSON format in ${filename}: ${error.message}`);
  }
}

function parseCSV(content, filename) {
  if (typeof Papa === 'undefined') {
    throw new Error('PapaParse library not loaded');
  }
  
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    trimHeaders: true,
    transform: (value) => {
      // Auto-convert numbers and booleans
      if (value === '') return null;
      if (value === 'true') return true;
      if (value === 'false') return false;
      if (!isNaN(value) && !isNaN(parseFloat(value))) {
        return parseFloat(value);
      }
      return value;
    }
  });
  
  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }
  
  return result.data;
}

function parseTSV(content, filename) {
  if (typeof Papa === 'undefined') {
    throw new Error('PapaParse library not loaded');
  }
  
  const result = Papa.parse(content, {
    header: true,
    delimiter: '\t',
    skipEmptyLines: true,
    trimHeaders: true
  });
  
  return result.data;
}

function autoDetectAndParse(content, filename) {
  // Try JSON first
  try {
    return parseJSON(content, filename);
  } catch (e) {
    // Try CSV
    try {
      return parseCSV(content, filename);
    } catch (e2) {
      throw new Error(`Unable to parse file ${filename}. Supported formats: JSON, CSV, TSV`);
    }
  }
}

function generateRowId() {
  return 'row_' + Math.random().toString(36).substr(2, 9);
}

// Export utility functions for testing
export { parseJSON, parseCSV, parseTSV, autoDetectAndParse };
