# Blockchain E-commerce Payment System

A complete e-commerce payment system built with Django REST Framework and integrated with Ethereum smart contracts via Ganache.

## 🚀 Features

- **Smart Contract Integration**: Deployed on Ganache local blockchain
- **Token-based Payments**: Uses ERC20 tokens for transactions
- **Order Management**: Create, track, and manage orders
- **Payment Processing**: Automated payment flow with blockchain verification
- **Refund System**: Built-in refund and cancellation functionality
- **Real-time Status**: Track order status from blockchain
- **RESTful API**: Complete API for frontend integration

## 🏗️ Architecture

```
Frontend (React/Next.js)
     ↓
Backend (Django REST API)
     ↓
Blockchain (Ganache + Smart Contracts)
```

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **Ganache** (Desktop or CLI)
- **Hardhat** for smart contract deployment

## 🔧 Quick Start

### 1. Start Ganache
- Open Ganache desktop app
- Create a new workspace or use existing
- Ensure it's running on `http://127.0.0.1:7545`

### 2. Deploy Smart Contracts
```bash
# From project root
npx hardhat run scripts/deploy.js --network ganache
```

### 3. Start the Payment System
```bash
# Make executable (first time only)
chmod +x start_payment_system.sh

# Run the startup script
./start_payment_system.sh
```

Or manually:
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_products
python manage.py runserver
```

## 🔑 Environment Configuration

Update `backend/.env` with your Ganache private keys:

```env
GANACHE_URL=http://127.0.0.1:7545
OWNER_PRIVATE_KEY=your_ganache_account_0_private_key
BUYER_PRIVATE_KEY=your_ganache_account_1_private_key
```

## 📖 API Documentation

### Base URL: `http://localhost:8000/api/`

### 🛍️ Products
- `GET /products/` - List all products

### 📦 Orders
- `POST /orders/` - Create new order
- `GET /orders/list/` - List all orders
- `GET /orders/{id}/status/` - Get order status
- `POST /orders/{id}/payment/` - Process payment
- `POST /orders/{id}/cancel/` - Cancel order
- `POST /orders/{id}/refund/` - Initiate refund

### 🔗 Blockchain
- `GET /blockchain/info/` - Get blockchain connection info

For detailed API documentation, see: [backend/PAYMENT_API.md](backend/PAYMENT_API.md)

## 🧪 Testing

### Test Payment Flow
```bash
# Using Django management command
cd backend
python manage.py test_payment --product-id 1

# Using test script
python test_payment.py
```

### Test Individual Endpoints
```bash
# Get blockchain info
curl http://localhost:8000/api/blockchain/info/

# Create order
curl -X POST http://localhost:8000/api/orders/ \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1}'

# Process payment (replace 1 with actual order ID)
curl -X POST http://localhost:8000/api/orders/1/payment/

# Check order status
curl http://localhost:8000/api/orders/1/status/
```

## 🔄 Payment Flow

1. **Create Order**
   - User selects product
   - Backend creates order on blockchain
   - Order stored in database with "Pending" status

2. **Process Payment**
   - User initiates payment
   - Backend mints tokens to buyer
   - Backend approves contract spending
   - Payment processed through smart contract
   - Order status updated to "Paid"

3. **Order Completion**
   - Tokens transferred to contract
   - Transaction recorded on blockchain
   - Order status synchronized

## 🏗️ Smart Contract Details

### EcomercePayment Contract
- **Order Creation**: `createOrder(amount, token)`
- **Payment Processing**: `processTokenPayment(orderId)`
- **Order Status**: `getOrder(orderId)`
- **Cancellation**: `cancelOrders([orderIds])`
- **Refunds**: `initiateRefund(orderId)`

### MockERC20 Contract
- **Token Transfer**: `transfer(to, amount)`
- **Approval**: `approve(spender, amount)`
- **Balance Check**: `balanceOf(account)`

## 🔐 Security Features

- **Private Key Management**: Secure key handling
- **Transaction Validation**: All transactions verified
- **Error Handling**: Comprehensive error management
- **Logging**: All operations logged for audit
- **Rate Limiting**: Protection against spam requests

## 📊 Monitoring

### Blockchain Connection
```python
from api.blockchain import SmartContract
sc = SmartContract()
info = sc.get_connection_info()
```

### Order Status
```python
from api.models import Order
orders = Order.objects.filter(status='Pending')
```

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to connect to Ganache"**
   - Ensure Ganache is running on port 7545
   - Check firewall settings

2. **"Contracts not initialized"**
   - Run: `npx hardhat run scripts/deploy.js --network ganache`
   - Verify contract-info.json exists

3. **"Insufficient balance"**
   - Check token balances: `GET /api/blockchain/info/`
   - Ensure owner account has sufficient tokens

4. **"Transaction failed"**
   - Check gas settings in blockchain.py
   - Verify contract addresses are correct

### Debug Commands
```bash
# Check system status
curl http://localhost:8000/api/blockchain/info/

# View logs
tail -f backend/logs/payment.log

# Test payment system
python backend/manage.py test_payment
```

## 📁 Project Structure

```
BlockChainEcom/
├── backend/
│   ├── api/
│   │   ├── models.py          # Database models
│   │   ├── views.py           # API endpoints
│   │   ├── blockchain.py      # Blockchain integration
│   │   ├── serializers.py     # Data serialization
│   │   └── management/
│   │       └── commands/
│   │           ├── seed_products.py
│   │           └── test_payment.py
│   ├── backend/
│   │   └── settings.py        # Django configuration
│   ├── requirements.txt       # Python dependencies
│   ├── test_payment.py        # Payment testing script
│   └── PAYMENT_API.md         # API documentation
├── scripts/
│   ├── deploy.js              # Contract deployment
│   ├── createOrder.js         # Order creation script
│   ├── processPayment.js      # Payment processing script
│   └── contract-info.json     # Contract addresses & ABIs
├── contracts/
│   ├── Ecomerce.sol           # Main payment contract
│   └── MockERC20.sol          # Test token contract
└── start_payment_system.sh    # Startup script
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🔗 Links

- **Smart Contract Scripts**: [scripts/Readme.md](scripts/Readme.md)
- **API Documentation**: [backend/PAYMENT_API.md](backend/PAYMENT_API.md)
- **Ganache Documentation**: [Truffle Suite](https://trufflesuite.com/ganache/)
- **Hardhat Documentation**: [Hardhat.org](https://hardhat.org/)

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Test with the provided scripts
4. Check Ganache console for blockchain errors

## 🚀 Next Steps

1. **Frontend Integration**: Connect React/Next.js frontend
2. **Production Deployment**: Deploy to mainnet/testnet
3. **Security Audit**: Professional security review
4. **Performance Optimization**: Database and blockchain optimizations
5. **Additional Features**: Multi-token support, batch processing
