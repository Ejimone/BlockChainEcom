# Payment API Documentation

This document describes the payment functionality endpoints integrated with Ganache blockchain.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment
Update your `.env` file with your Ganache private keys:
```env
GANACHE_URL=http://127.0.0.1:7545
OWNER_PRIVATE_KEY=your_owner_private_key_here
BUYER_PRIVATE_KEY=your_buyer_private_key_here
```

### 3. Deploy Smart Contracts
Make sure you have deployed your smart contracts first:
```bash
cd ..
npx hardhat run scripts/deploy.js --network ganache
```

### 4. Run Django Server
```bash
cd backend
python manage.py migrate
python manage.py seed_products
python manage.py runserver
```

## API Endpoints

### Base URL: `http://localhost:8000/api/`

### 1. Products

#### Get All Products
```
GET /products/
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Laptop",
    "description": "A high-performance laptop.",
    "price": "1200.00",
    "image_url": "https://via.placeholder.com/150"
  }
]
```

### 2. Orders

#### Create Order
```
POST /orders/
Content-Type: application/json

{
  "product_id": 1
}
```

**Response:**
```json
{
  "id": 1,
  "order_id_chain": 1,
  "buyer_address": "0x...",
  "amount": 1200.0,
  "token_address": "0x...",
  "status": "Pending",
  "product": {
    "id": 1,
    "name": "Laptop",
    "description": "A high-performance laptop.",
    "price": "1200.00",
    "image_url": "https://via.placeholder.com/150"
  },
  "created_at": "2025-01-15T10:30:00Z"
}
```

#### Process Payment
```
POST /orders/{order_id}/payment/
```

**Response:**
```json
{
  "message": "Payment processed successfully",
  "transaction_hash": "0x...",
  "order_id": 1,
  "order_id_chain": 1,
  "status": "Paid"
}
```

#### Get Order Status
```
GET /orders/{order_id}/status/
```

**Response:**
```json
{
  "order_id": 1,
  "order_id_chain": 1,
  "status": "Paid",
  "blockchain_status": "Paid",
  "amount": 1200.0,
  "buyer_address": "0x...",
  "token_address": "0x...",
  "product": {
    "id": 1,
    "name": "Laptop",
    "description": "A high-performance laptop.",
    "price": "1200.00",
    "image_url": "https://via.placeholder.com/150"
  },
  "created_at": "2025-01-15T10:30:00Z"
}
```

#### Cancel Order
```
POST /orders/{order_id}/cancel/
```

**Response:**
```json
{
  "message": "Order cancelled successfully",
  "transaction_hash": "0x...",
  "order_id": 1,
  "order_id_chain": 1,
  "status": "Cancelled"
}
```

#### Initiate Refund
```
POST /orders/{order_id}/refund/
```

**Response:**
```json
{
  "message": "Refund initiated successfully",
  "transaction_hash": "0x...",
  "order_id": 1,
  "order_id_chain": 1,
  "status": "Refunded"
}
```

#### List All Orders
```
GET /orders/list/
```

**Response:**
```json
[
  {
    "id": 1,
    "product": {
      "id": 1,
      "name": "Laptop",
      "description": "A high-performance laptop.",
      "price": "1200.00",
      "image_url": "https://via.placeholder.com/150"
    },
    "order_id_chain": 1,
    "buyer_address": "0x...",
    "amount": "1200.00",
    "token_address": "0x...",
    "status": "Paid",
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

### 3. Blockchain Information

#### Get Blockchain Info
```
GET /blockchain/info/
```

**Response:**
```json
{
  "is_connected": true,
  "chain_id": 1337,
  "latest_block": 15,
  "owner_address": "0x...",
  "buyer_address": "0x...",
  "ecommerce_contract_address": "0x...",
  "mock_erc20_contract_address": "0x...",
  "buyer_balance": 0.0,
  "contract_balance": 1200.0
}
```

## Payment Flow

### 1. Create Order
1. User selects a product
2. POST to `/orders/` with `product_id`
3. Backend creates order on blockchain
4. Order is stored in database with status "Pending"

### 2. Process Payment
1. User initiates payment
2. POST to `/orders/{order_id}/payment/`
3. Backend:
   - Mints tokens to buyer address
   - Approves contract to spend tokens
   - Processes payment through smart contract
   - Updates order status to "Paid"

### 3. Order Management
- Check status: GET `/orders/{order_id}/status/`
- Cancel order: POST `/orders/{order_id}/cancel/`
- Refund order: POST `/orders/{order_id}/refund/`

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request or business logic error
- `404 Not Found`: Resource not found

Error responses include a descriptive error message:
```json
{
  "error": "Cannot process payment. Order status is 'Paid'. Only pending orders can be processed."
}
```

## Testing with cURL

### Create Order
```bash
curl -X POST http://localhost:8000/api/orders/ \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1}'
```

### Process Payment
```bash
curl -X POST http://localhost:8000/api/orders/1/payment/
```

### Check Order Status
```bash
curl http://localhost:8000/api/orders/1/status/
```

### Get Blockchain Info
```bash
curl http://localhost:8000/api/blockchain/info/
```

## Integration with Frontend

The frontend can integrate with these endpoints using standard HTTP requests. Make sure to:

1. Handle loading states during payment processing
2. Poll order status to show real-time updates
3. Display transaction hashes for transparency
4. Handle errors gracefully

Example JavaScript integration:
```javascript
// Create order
const createOrder = async (productId) => {
  const response = await fetch('/api/orders/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ product_id: productId }),
  });
  return response.json();
};

// Process payment
const processPayment = async (orderId) => {
  const response = await fetch(`/api/orders/${orderId}/payment/`, {
    method: 'POST',
  });
  return response.json();
};
```

## Security Considerations

1. **Private Keys**: Never expose private keys in production
2. **Error Handling**: Don't expose sensitive blockchain errors to users
3. **Rate Limiting**: Implement rate limiting for payment endpoints
4. **Validation**: All inputs are validated before blockchain interactions
5. **Logging**: All transactions are logged for audit purposes

## Troubleshooting

### Common Issues

1. **"Failed to connect to Ganache"**
   - Make sure Ganache is running on the correct port
   - Check GANACHE_URL in .env file

2. **"Contracts not initialized"**
   - Deploy contracts first using `npx hardhat run scripts/deploy.js --network ganache`
   - Check that contract-info.json exists

3. **"Insufficient balance"**
   - Make sure the owner account has sufficient tokens
   - Check balances using `/blockchain/info/` endpoint

4. **"Transaction failed"**
   - Check gas settings in blockchain.py
   - Verify contract addresses are correct
   - Check Ganache console for errors

### Debug Commands

```bash
# Check blockchain connection
curl http://localhost:8000/api/blockchain/info/

# View all orders
curl http://localhost:8000/api/orders/list/

# Check specific order status
curl http://localhost:8000/api/orders/1/status/
```
