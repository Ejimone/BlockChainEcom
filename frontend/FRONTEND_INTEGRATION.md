# Frontend Integration Guide

## 🎯 Overview
Your backend is now successfully integrated with the frontend! The system fetches products from your Django backend and displays them with images, prices, and descriptions. Users can also make purchases directly through the blockchain integration.

## 🚀 Quick Start

### 1. Start the Backend
```bash
# In the backend directory
cd backend
python manage.py runserver
```

### 2. Start the Frontend
```bash
# In the frontend directory
cd frontend
npm install
npm run dev
```

## 📱 Features Implemented

### ✅ Product Display
- **Dynamic Product Loading**: Products are fetched from Django backend
- **Image Support**: Both uploaded images and external URLs are supported
- **Real-time Updates**: Products update automatically when backend changes

### ✅ Purchase Flow
- **One-Click Purchase**: "Buy Now" button creates order and processes payment
- **Real-time Status**: Shows order creation, payment processing, and completion
- **Blockchain Integration**: Transactions are processed through your smart contracts

### ✅ Order Management
- **Order History**: View all past orders at `/orders`
- **Status Tracking**: Real-time order status from blockchain
- **Transaction Details**: View transaction hashes and addresses

## 🔧 Technical Implementation

### Backend Changes
1. **Image Support**: Added `ImageField` to Product model
2. **Media Files**: Configured Django to serve uploaded images
3. **API Enhancements**: Added `image_path` property for flexible image handling
4. **CORS Support**: Enabled cross-origin requests for frontend

### Frontend Changes
1. **API Service**: Created centralized API service for backend communication
2. **Dynamic Loading**: Products load from backend with loading states
3. **Error Handling**: Comprehensive error handling for API failures
4. **State Management**: Cart context for managing shopping cart

## 🛠️ File Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.js          # Root layout with cart context
│   │   ├── page.js            # Home page
│   │   └── orders/
│   │       └── page.js        # Order history page
│   ├── components/
│   │   ├── ProductList/
│   │   │   └── index.js       # Product listing with API integration
│   │   ├── ProductCard/
│   │   │   └── index.js       # Individual product with purchase button
│   │   └── NavBar/
│   │       └── index.js       # Navigation with cart counter
│   ├── contexts/
│   │   └── CartContext.js     # Cart state management
│   └── services/
│       └── api.js             # API service for backend calls
├── .env.local                 # Environment variables
└── package.json
```

## 🌐 API Integration

### Product Data Structure
```json
{
  "id": 7,
  "name": "Laptop",
  "description": "A high-performance laptop perfect for work and gaming.",
  "price": "1200.00",
  "image": null,
  "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
  "image_path": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop"
}
```

### Purchase Flow
1. User clicks "Buy Now" on product
2. Frontend calls `POST /api/orders/` with product ID
3. Backend creates order on blockchain
4. Frontend calls `POST /api/orders/{id}/payment/`
5. Backend processes payment through smart contract
6. User sees success message with transaction hash

## 📊 Available Pages

### Home Page (`/`)
- Displays all products from backend
- Shows loading states and error handling
- Direct purchase functionality

### Orders Page (`/orders`)
- Shows purchase history
- Displays order status and transaction details
- Links to blockchain transactions

## 🔍 Testing the Integration

### 1. Product Display
- Visit `http://localhost:3000`
- Should see products loaded from backend
- Images should display properly

### 2. Purchase Flow
- Click "Buy Now" on any product
- Should see "Creating order..." → "Processing payment..." → "Payment successful!"
- Transaction hash should be displayed

### 3. Order History
- Visit `http://localhost:3000/orders`
- Should see all completed orders
- Status should show "Paid" for successful transactions

## 📝 Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Backend (`.env`)
```
GANACHE_URL=http://127.0.0.1:7545
OWNER_PRIVATE_KEY=your_owner_private_key
BUYER_PRIVATE_KEY=your_buyer_private_key
```

## 🎨 Image Handling

### Upload Images via Django Admin
1. Visit `http://localhost:8000/admin/`
2. Login with admin credentials
3. Go to Products → Add/Edit Product
4. Upload image file in the "Image" field

### Using External URLs
- Products can use `image_url` for external images
- Both uploaded images and URLs are supported
- Frontend automatically handles both types

## 🚨 Troubleshooting

### "Failed to fetch products"
- Ensure Django backend is running on port 8000
- Check CORS settings in Django settings
- Verify API endpoint is accessible

### "Error processing order"
- Ensure Ganache is running
- Check smart contracts are deployed
- Verify private keys in backend `.env`

### Images not displaying
- Check image URLs are valid
- Verify Django media settings are configured
- Ensure uploaded images are in correct directory

## 🔄 Next Steps

1. **Styling**: Enhance the UI with better styling and animations
2. **Cart Functionality**: Implement shopping cart with multiple items
3. **User Authentication**: Add user accounts and order history
4. **Payment Options**: Add more payment methods
5. **Mobile Optimization**: Improve responsive design

## 📞 Support

If you encounter any issues:
1. Check the browser console for JavaScript errors
2. Check Django logs for backend errors
3. Verify all services are running (Django, Ganache, Next.js)
4. Review the API documentation in `backend/PAYMENT_API.md`

Your blockchain e-commerce platform is now fully integrated and ready for use! 🎉
