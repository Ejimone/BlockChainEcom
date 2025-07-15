---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.E-commerce Project Documentation
Table of Contents

Introduction
Project Architecture
Backend (Django)
Project Setup
Models
Serializers
Views
URLs
Database Configuration


Frontend (React.js + Web3.js)
Project Setup
Components and State Management
API Integration
Web3 Integration


Smart Contracts (Hardhat)
Project Setup
Contract Development
Testing
Deployment


Interaction Flow
Security Considerations
AI Bot Integration
Purpose
Implementation


Conclusion


Introduction
This project is a decentralized e-commerce platform that allows users to browse products, add them to a cart, and pay using cryptocurrency tokens. It leverages blockchain technology for secure, transparent transactions and includes an AI-powered bot for user assistance.

Technologies Used:
Backend: Django, Django REST Framework
Frontend: React.js, Web3.js
Blockchain: Ethereum (or EVM-compatible chain), Hardhat
AI Bot: OpenAI API




Project Architecture
The platform follows a client-server architecture with blockchain integration:

Backend (Django): Manages product data, user authentication, and order processing via RESTful APIs.
Frontend (React.js + Web3.js): Provides the user interface and blockchain interaction.
Smart Contracts (Hardhat): Handles token payments and order confirmation events.
AI Bot: Enhances user experience with product recommendations and assistance.


Backend (Django)
Project Setup

Create a new Django project:django-admin startproject ecommerce
cd ecommerce


Create apps:python manage.py startapp products
python manage.py startapp users
python manage.py startapp orders


Install dependencies:pip install djangorestframework


Update INSTALLED_APPS in settings.py:INSTALLED_APPS = [
    ...
    'rest_framework',
    'products',
    'users',
    'orders',
]



Models

Products App (products/models.py):
from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/')
    created_at = models.DateTimeField(auto_now_add=True)


Users App: Use Django’s built-in User model.

Orders App (orders/models.py):
from django.db import models
from django.contrib.auth.models import User
from products.models import Product

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    products = models.ManyToManyField(Product, through='OrderItem')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()



Serializers

Products App (products/serializers.py):
from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


Orders App (orders/serializers.py):
from rest_framework import serializers
from .models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    class Meta:
        model = Order
        fields = ['id', 'user', 'items', 'total_price', 'status', 'created_at']



Views

Products App (products/views.py):
from rest_framework import generics
from .models import Product
from .serializers import ProductSerializer

class ProductList(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


Orders App (orders/views.py):
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Order
from .serializers import OrderSerializer

class OrderCreate(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]



URLs

Main urls.py:
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
]


Products App (products/urls.py):
from django.urls import path
from .views import ProductList

urlpatterns = [
    path('', ProductList.as_view(), name='product-list'),
]


Orders App (orders/urls.py):
from django.urls import path
from .views import OrderCreate

urlpatterns = [
    path('create/', OrderCreate.as_view(), name='order-create'),
]



Database Configuration

Use SQLite for development and PostgreSQL for production:DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}




Frontend (React.js + Web3.js)
Project Setup

Create a React app:npx create-react-app frontend
cd frontend


Install dependencies:npm install web3 axios react-router-dom



Components and State Management

Components:
ProductList: Displays products.
ProductDetail: Shows product details.
Cart: Manages cart items.
Checkout: Processes payments.
NavBar: Navigation menu.


State Management: Use Context API or Redux for cart and user state.

API Integration

Fetch data from Django:import axios from 'axios';

const API_URL = 'http://localhost:8000/api/';

export const getProducts = () => axios.get(`${API_URL}products/`);
export const createOrder = (orderData) => axios.post(`${API_URL}orders/create/`, orderData);



Web3 Integration

Connect wallet and interact with smart contracts:import Web3 from 'web3';

const web3 = new Web3(window.ethereum);

const connectWallet = async () => {
    const accounts = await web3.eth.requestAccounts();
    return accounts[0];
};

const payWithTokens = async (contractAddress, abi, orderId, amount) => {
    const contract = new web3.eth.Contract(abi, contractAddress);
    const account = await connectWallet();
    await contract.methods.payForOrder(orderId, amount).send({ from: account });
};




Smart Contracts (Hardhat)
Project Setup

Initialize Hardhat:npx hardhat


Select basic sample project.

Contract Development

Payment.sol:pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Payment {
    address public platformWallet;
    IERC20 public token;

    event PaymentMade(uint256 orderId, address payer, uint256 amount);

    constructor(address _platform 몇allet, address _tokenAddress) {
        platformWallet = _platformWallet;
        token = IERC20(_tokenAddress);
    }

    function payForOrder(uint256 orderId, uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(token.transferFrom(msg.sender, platformWallet, amount), "Token transfer failed");
        emit PaymentMade(orderId, msg.sender, amount);
    }
}



Testing

Test script:const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Payment Contract", function () {
    it("Should allow payment", async function () {
        // Add test logic
    });
});



Deployment

Deploy script:async function main() {
    const Payment = await ethers.getContractFactory("Payment");
    const payment = await Payment.deploy(platformWalletAddress, tokenAddress);
    await payment.deployed();
    console.log("Payment deployed to:", payment.address);
}

main();




Interaction Flow

User Authentication: Connect wallet via Web3.js; optionally link to Django user.
Product Browsing: Frontend fetches products from Django API.
Adding to Cart: Cart managed in frontend state.
Checkout: Frontend sends order to Django, receives order ID, prompts payment via smart contract.
Payment Processing: Smart contract processes payment and emits event; backend updates order status.
Order Confirmation: Order status updated to "paid."


Security Considerations

Authentication: Use wallet signatures for passwordless login.
Data Validation: Validate inputs on frontend and backend.
Smart Contract: Test or audit to prevent vulnerabilities (e.g., reentrancy).


AI Bot Integration
Purpose
Assist users with product recommendations and queries.
Implementation

Backend (bot/views.py):
from rest_framework.views import APIView
from rest_framework.response import Response
import openai

class BotAPIView(APIView):
    def post(self, request):
        user_message = request.data.get('message')
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=user_message,
            max_tokens=150
        )
        return Response({'reply': response.choices[0].text.strip()})


Frontend: Add a chat widget to send messages to /api/bot/ and display responses.



Conclusion
This documentation outlines a fully functional decentralized e-commerce platform. Follow these steps to set up and integrate Django, React.js, Web3.js, and Hardhat, with an AI bot for enhanced user interaction.






some endpoints:
GET  /api/products/                 - List products
POST /api/orders/                   - Create order
POST /api/orders/{id}/payment/      - Process payment
GET  /api/orders/{id}/status/       - Get order status
GET  /api/orders/list/              - List all orders
POST /api/orders/{id}/cancel/       - Cancel order
POST /api/orders/{id}/refund/       - Initiate refund
GET  /api/blockchain/info/          - Get blockchain info