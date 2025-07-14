# Decentralized E-commerce Platform

A modern, secure decentralized e-commerce platform that enables users to browse products, manage their cart, and make payments using cryptocurrency tokens. Built with blockchain technology for transparent and secure transactions.

## 🚀 Features

- **Decentralized Payments**: Secure cryptocurrency transactions via smart contracts
- **Product Browsing**: Browse and search through a wide range of products
- **Shopping Cart**: Add/remove items with real-time cart management
- **AI Assistant**: AI-powered bot for product recommendations and customer support
- **Wallet Integration**: Connect your crypto wallet for seamless transactions
- **Order Management**: Track orders and payment status
- **Responsive Design**: Modern, mobile-friendly user interface

## 🛠 Tech Stack

### Backend
- **Django**: Web framework for API development
- **Django REST Framework**: RESTful API creation
- **PostgreSQL**: Production database
- **OpenAI API**: AI bot integration

### Frontend
- **React.js**: Modern JavaScript library for UI
- **Web3.js**: Blockchain interaction
- **Vite**: Fast build tool
- **TypeScript**: Type-safe JavaScript
- **React Router**: Client-side routing

### Blockchain
- **Ethereum**: Blockchain platform
- **Hardhat**: Development environment
- **Solidity**: Smart contract language
- **OpenZeppelin**: Security-focused contract library

## 📁 Project Structure

```
BlockChainEcom/
├── backend/                 # Django backend
│   ├── ecommerce/          # Main Django project
│   ├── products/           # Product management app
│   ├── users/              # User authentication app
│   ├── orders/             # Order processing app
│   └── bot/                # AI bot integration
├── frontend/               # React frontend
│   ├── app/                # Main app components
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
├── contracts/              # Smart contracts
│   ├── contracts/          # Solidity contracts
│   ├── test/               # Contract tests
│   └── scripts/            # Deployment scripts
└── docs/                   # Documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- Git
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/BlockChainEcom.git
   cd BlockChainEcom
   ```

2. **Setup Backend (Django)**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

3. **Setup Frontend (React)**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Setup Smart Contracts (Hardhat)**
   ```bash
   cd contracts
   npm install
   npx hardhat compile
   npx hardhat test
   ```

### Environment Variables

Create `.env` files in respective directories:

**Backend (.env)**
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost/dbname
OPENAI_API_KEY=your-openai-api-key
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:8000/api
VITE_CONTRACT_ADDRESS=0x...
VITE_NETWORK_ID=1337
```

## 🔧 Development

### Running the Development Environment

1. **Start the backend server**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Start local blockchain (optional)**
   ```bash
   cd contracts
   npx hardhat node
   ```

### Testing

**Backend Tests**
```bash
cd backend
python manage.py test
```

**Frontend Tests**
```bash
cd frontend
npm test
```

**Smart Contract Tests**
```bash
cd contracts
npx hardhat test
```

## 🔐 Security

- All smart contracts are audited for common vulnerabilities
- User authentication via wallet signatures
- Input validation on both frontend and backend
- HTTPS enforced in production
- Environment variables for sensitive data

## 🤖 AI Bot Integration

The platform includes an AI-powered assistant that helps users with:
- Product recommendations
- Order assistance
- General customer support
- Navigation help

## 📱 Mobile Support

The platform is fully responsive and supports mobile devices with:
- Touch-optimized interface
- Mobile wallet integration
- Responsive design patterns

## 🚀 Deployment

### Production Deployment

1. **Backend**: Deploy to platforms like Heroku, AWS, or DigitalOcean
2. **Frontend**: Deploy to Vercel, Netlify, or AWS S3
3. **Smart Contracts**: Deploy to Ethereum mainnet or testnets

### Environment Setup

- Configure production environment variables
- Set up SSL certificates
- Configure domain names
- Set up monitoring and logging

## 📖 API Documentation

API documentation is available at `/api/docs/` when running the backend server.

### Key Endpoints

- `GET /api/products/` - List all products
- `POST /api/orders/create/` - Create new order
- `POST /api/bot/` - AI bot interaction
- `GET /api/user/profile/` - User profile

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@yourapp.com or create an issue in the GitHub repository.

## 🔄 Roadmap

- [ ] Multi-chain support
- [ ] NFT marketplace integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Multi-language support
- [ ] Enhanced AI features

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- The Django and React.js communities
- Ethereum Foundation for blockchain infrastructure
- OpenAI for AI capabilities

---

Built with ❤️ by the BlockChain E-commerce Team
