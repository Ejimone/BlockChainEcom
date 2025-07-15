#!/usr/bin/env python
"""
Test script for payment functionality
Run this script to test the complete payment flow
"""
import os
import sys
import django
import requests
import json
import time

# Add the backend directory to the Python path
sys.path.append('/Users/evidenceejimone/BlockChainEcom/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Product, Order
from api.blockchain import SmartContract

BASE_URL = 'http://localhost:8000/api'

def test_blockchain_connection():
    """Test if blockchain connection is working"""
    print("🔗 Testing blockchain connection...")
    try:
        response = requests.get(f'{BASE_URL}/blockchain/info/')
        if response.status_code == 200:
            info = response.json()
            print(f"✅ Connected to blockchain (Chain ID: {info['chain_id']})")
            print(f"   Latest block: {info['latest_block']}")
            print(f"   Buyer balance: {info['buyer_balance']} ETH")
            return True
        else:
            print(f"❌ Failed to connect to blockchain: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error connecting to blockchain: {e}")
        return False

def test_create_order():
    """Test creating a new order"""
    print("\n📝 Testing order creation...")
    try:
        # Get first product
        products_response = requests.get(f'{BASE_URL}/products/')
        if products_response.status_code != 200:
            print("❌ Failed to get products")
            return None
            
        products = products_response.json()
        if not products:
            print("❌ No products found")
            return None
        
        product = products[0]
        print(f"   Creating order for: {product['name']} (${product['price']})")
        
        # Create order
        order_data = {"product_id": product['id']}
        response = requests.post(f'{BASE_URL}/orders/', json=order_data)
        
        if response.status_code == 201:
            order = response.json()
            print(f"✅ Order created successfully!")
            print(f"   Order ID: {order['id']}")
            print(f"   Blockchain Order ID: {order['order_id_chain']}")
            print(f"   Status: {order['status']}")
            return order
        else:
            print(f"❌ Failed to create order: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error creating order: {e}")
        return None

def test_process_payment(order_id):
    """Test processing payment for an order"""
    print(f"\n💳 Testing payment processing for order {order_id}...")
    try:
        response = requests.post(f'{BASE_URL}/orders/{order_id}/payment/')
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Payment processed successfully!")
            print(f"   Transaction Hash: {result['transaction_hash']}")
            print(f"   Order Status: {result['status']}")
            return True
        else:
            print(f"❌ Payment failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error processing payment: {e}")
        return False

def test_order_status(order_id):
    """Test getting order status"""
    print(f"\n📊 Testing order status for order {order_id}...")
    try:
        response = requests.get(f'{BASE_URL}/orders/{order_id}/status/')
        
        if response.status_code == 200:
            status_info = response.json()
            print(f"✅ Order status retrieved successfully!")
            print(f"   Database Status: {status_info['status']}")
            print(f"   Blockchain Status: {status_info['blockchain_status']}")
            print(f"   Amount: ${status_info['amount']}")
            return status_info
        else:
            print(f"❌ Failed to get order status: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error getting order status: {e}")
        return None

def test_list_orders():
    """Test listing all orders"""
    print("\n📋 Testing order listing...")
    try:
        response = requests.get(f'{BASE_URL}/orders/list/')
        
        if response.status_code == 200:
            orders = response.json()
            print(f"✅ Found {len(orders)} orders:")
            for order in orders:
                print(f"   Order {order['id']}: {order['product']['name']} - {order['status']}")
            return orders
        else:
            print(f"❌ Failed to list orders: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error listing orders: {e}")
        return None

def main():
    """Run all tests"""
    print("🚀 Starting Payment API Tests\n")
    
    # Test blockchain connection
    if not test_blockchain_connection():
        print("❌ Cannot proceed without blockchain connection")
        return
    
    # Test creating an order
    order = test_create_order()
    if not order:
        print("❌ Cannot proceed without creating an order")
        return
    
    # Wait a moment for blockchain to process
    print("\n⏳ Waiting for blockchain to process...")
    time.sleep(2)
    
    # Test processing payment
    if test_process_payment(order['id']):
        # Wait a moment for payment to process
        print("\n⏳ Waiting for payment to process...")
        time.sleep(2)
        
        # Test getting order status
        test_order_status(order['id'])
    
    # Test listing orders
    test_list_orders()
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    main()
