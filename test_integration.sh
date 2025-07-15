#!/bin/bash

# Frontend-Backend Integration Test Script

echo "🔗 Testing Frontend-Backend Integration"
echo "======================================"

# Test 1: Check if backend is running
echo "📡 Testing backend connection..."
if curl -s http://localhost:8000/api/products/ > /dev/null; then
    echo "✅ Backend is running and accessible"
else
    echo "❌ Backend is not running! Please start with:"
    echo "   cd backend && python manage.py runserver"
    exit 1
fi

# Test 2: Check products API
echo "📦 Testing products API..."
products=$(curl -s http://localhost:8000/api/products/)
product_count=$(echo $products | jq '. | length' 2>/dev/null || echo "0")
if [ "$product_count" -gt 0 ]; then
    echo "✅ Found $product_count products"
else
    echo "❌ No products found. Run: python manage.py seed_products"
fi

# Test 3: Check blockchain connection
echo "🔗 Testing blockchain connection..."
blockchain_info=$(curl -s http://localhost:8000/api/blockchain/info/)
if echo $blockchain_info | grep -q "is_connected.*true"; then
    echo "✅ Blockchain connected successfully"
else
    echo "❌ Blockchain not connected. Make sure Ganache is running"
fi

# Test 4: Check CORS headers
echo "🌐 Testing CORS headers..."
cors_test=$(curl -s -H "Origin: http://localhost:3000" -I http://localhost:8000/api/products/)
if echo $cors_test | grep -q "Access-Control-Allow"; then
    echo "✅ CORS headers are configured correctly"
else
    echo "❌ CORS headers missing. Check Django CORS settings"
fi

# Test 5: Check if frontend directory exists and has dependencies
echo "📱 Checking frontend setup..."
if [ -d "frontend" ]; then
    echo "✅ Frontend directory exists"
    if [ -f "frontend/package.json" ]; then
        echo "✅ package.json found"
        if [ -d "frontend/node_modules" ]; then
            echo "✅ Node modules installed"
        else
            echo "⚠️  Node modules not installed. Run: cd frontend && npm install"
        fi
    else
        echo "❌ package.json not found"
    fi
else
    echo "❌ Frontend directory not found"
fi

echo ""
echo "🚀 Integration Test Complete!"
echo ""
echo "To start the full system:"
echo "1. Backend: cd backend && python manage.py runserver"
echo "2. Frontend: cd frontend && npm run dev"
echo "3. Visit: http://localhost:3000"
echo ""
echo "📖 For detailed instructions, see: frontend/FRONTEND_INTEGRATION.md"
