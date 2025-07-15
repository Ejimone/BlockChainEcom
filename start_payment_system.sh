#!/bin/bash

# E-commerce Payment System Startup Script
# This script helps you get the payment system running

echo "🚀 E-commerce Payment System Startup"
echo "========================================"

# Check if Ganache is running
echo "📡 Checking Ganache connection..."
if curl -s http://127.0.0.1:7545 > /dev/null 2>&1; then
    echo "✅ Ganache is running"
else
    echo "❌ Ganache is not running!"
    echo "Please start Ganache first:"
    echo "  1. Open Ganache application"
    echo "  2. Create a new workspace or open existing one"
    echo "  3. Make sure it's running on port 7545"
    exit 1
fi

# Check if smart contracts are deployed
echo "📄 Checking smart contracts..."
if [ -f "scripts/contract-info.json" ]; then
    echo "✅ Contract info found"
else
    echo "❌ Smart contracts not deployed!"
    echo "Please deploy contracts first:"
    echo "  npx hardhat run scripts/deploy.js --network ganache"
    exit 1
fi

# Set up backend
echo "🔧 Setting up backend..."
cd backend

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Run migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Seed products
echo "🌱 Seeding products..."
python manage.py seed_products

# Start Django server
echo "🌐 Starting Django server..."
echo "API will be available at: http://localhost:8000/api/"
echo ""
echo "Available endpoints:"
echo "  GET  /api/products/                 - List products"
echo "  POST /api/orders/                   - Create order"
echo "  POST /api/orders/{id}/payment/      - Process payment"
echo "  GET  /api/orders/{id}/status/       - Get order status"
echo "  GET  /api/orders/list/              - List all orders"
echo "  GET  /api/blockchain/info/          - Get blockchain info"
echo ""
echo "📖 For detailed API documentation, see: backend/PAYMENT_API.md"
echo ""
echo "🧪 To test the payment system:"
echo "  python manage.py test_payment"
echo "  or run: python test_payment.py"
echo ""

python manage.py runserver
