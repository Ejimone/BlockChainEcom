#!/bin/bash

# Frontend-Backend Troubleshooting Script

echo "🔍 Frontend-Backend Troubleshooting"
echo "=================================="

# Check if frontend is running
echo "📱 Checking frontend status..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running at http://localhost:3000"
else
    echo "❌ Frontend is not running. Start with: cd frontend && npm run dev"
fi

# Check if backend is running
echo "🔧 Checking backend status..."
if curl -s http://localhost:8000/api/products/ > /dev/null 2>&1; then
    echo "✅ Backend is running at http://localhost:8000"
else
    echo "❌ Backend is not running. Start with: cd backend && python manage.py runserver"
fi

# Check if products are available
echo "📦 Checking products..."
product_count=$(curl -s http://localhost:8000/api/products/ | jq '. | length' 2>/dev/null || echo "0")
if [ "$product_count" -gt 0 ]; then
    echo "✅ Found $product_count products"
    echo "   Testing image URLs..."
    
    # Test first product image
    first_image=$(curl -s http://localhost:8000/api/products/ | jq -r '.[0].image_path' 2>/dev/null || echo "")
    if [ -n "$first_image" ] && [ "$first_image" != "null" ]; then
        if curl -s -o /dev/null -w "%{http_code}" "$first_image" | grep -q "200"; then
            echo "✅ First product image is accessible"
        else
            echo "⚠️  First product image may have issues: $first_image"
        fi
    fi
else
    echo "❌ No products found. Run: cd backend && python manage.py seed_products"
fi

# Check blockchain connection
echo "🔗 Checking blockchain connection..."
if curl -s http://localhost:8000/api/blockchain/info/ | grep -q "is_connected.*true"; then
    echo "✅ Blockchain connected successfully"
else
    echo "❌ Blockchain not connected. Make sure Ganache is running on port 7545"
fi

# Check for common Next.js issues
echo "🖼️  Checking Next.js image configuration..."
if [ -f "frontend/next.config.mjs" ]; then
    if grep -q "images.unsplash.com" frontend/next.config.mjs; then
        echo "✅ External image domains configured"
    else
        echo "❌ External image domains not configured in next.config.mjs"
    fi
else
    echo "❌ next.config.mjs not found"
fi

# Check environment variables
echo "🌍 Checking environment variables..."
if [ -f "frontend/.env.local" ]; then
    if grep -q "NEXT_PUBLIC_API_URL" frontend/.env.local; then
        echo "✅ API URL configured"
    else
        echo "❌ API URL not configured in .env.local"
    fi
else
    echo "❌ .env.local not found"
fi

echo ""
echo "📋 Common Solutions:"
echo "1. Image errors: Check next.config.mjs has remotePatterns configured"
echo "2. API errors: Ensure backend is running and CORS is enabled"
echo "3. No products: Run python manage.py seed_products"
echo "4. Blockchain errors: Make sure Ganache is running"
echo ""
echo "🌐 Access your app at: http://localhost:3000"
