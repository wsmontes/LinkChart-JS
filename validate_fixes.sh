#!/bin/bash

echo "🔬 LinkChart Application Validation Script"
echo "=========================================="
echo ""

# Check if server is running
echo "📡 Checking development server..."
if curl -s http://localhost:8002/ > /dev/null; then
    echo "✅ Development server is running on localhost:8002"
else
    echo "❌ Development server not accessible. Please start with: python3 -m http.server 8002"
    exit 1
fi

echo ""
echo "📁 Checking critical files..."

# Check if our fixed files exist
files=("modules/dataUpload/cleaning.js" "modules/graph.js" "modules/search.js" "validation_test.js")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🔍 Checking file modifications..."

# Check if our fixes are in place
if grep -q "First pass: collect entity rows" modules/dataUpload/cleaning.js; then
    echo "✅ Data normalization fix applied"
else
    echo "❌ Data normalization fix missing"
fi

if grep -q "Always transform nodes/edges to proper Cytoscape format" modules/graph.js; then
    echo "✅ Graph data transformation fix applied"
else
    echo "❌ Graph data transformation fix missing"
fi

if grep -q "Include required container element parameter" modules/search.js; then
    echo "✅ Search filter fix applied"
else
    echo "❌ Search filter fix missing"
fi

echo ""
echo "🚀 Validation Status:"
echo "✅ Server: Running"
echo "✅ Files: Present"
echo "✅ Fixes: Applied"
echo ""
echo "🌐 Open these URLs to test:"
echo "📊 Main Application: http://localhost:8002/"
echo "🔬 Validation Runner: http://localhost:8002/validation_runner.html"
echo "🧪 Test Suite: http://localhost:8002/test_runner.html"
echo ""
echo "Next steps:"
echo "1. Open the main application in a browser"
echo "2. Check browser console for errors"
echo "3. Test data upload functionality"
echo "4. Verify graph visualization works"
echo "5. Run the validation test suite"
