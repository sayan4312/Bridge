# Bridge Backend API

A comprehensive backend API for the Bridge platform that connects investors with business people, bankers, and business advisors.

## 🚀 Features

- **Multi-role Authentication System** (JWT-based)
- **Business Ideas Management**
- **Investment Proposals System**
- **Loan Offers Management**
- **Business Consultations**
- **Activity Logging**
- **File Upload Support**
- **Advanced Search & Filtering**
- **Rate Limiting & Security**

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **Validation**: Express Validator & Joi
- **File Upload**: Multer

## 📁 Project Structure

```
backend/
├── config/
│   ├── database.js          # MongoDB connection
│   └── logger.js            # Winston logger configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── businessIdeaController.js
│   └── investmentProposalController.js
├── middlewares/
│   ├── auth.js              # JWT authentication
│   ├── errorHandler.js      # Global error handling
│   ├── rateLimiter.js       # Rate limiting
│   └── validation.js        # Input validation
├── models/
│   ├── User.js              # User schema
│   ├── BusinessIdea.js      # Business idea schema
│   ├── InvestmentProposal.js
│   ├── LoanOffer.js
│   ├── Consultation.js
│   └── ActivityLog.js       # Activity logging schema
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── businessIdeas.js     # Business ideas routes
│   └── investmentProposals.js
├── uploads/                 # File upload directory
├── logs/                    # Application logs
├── .env                     # Environment variables
├── server.js                # Main server file
└── package.json
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone and Install

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### 2. Environment Configuration

**IMPORTANT**: Copy the example environment file and configure it:

```bash
# Copy the example environment file
cp .env.example .env
```

Then edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (IMPORTANT!)
MONGO_URI=mongodb://localhost:27017/bridge
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/Bridge?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure
JWT_EXPIRE=7d

# CORS Configuration
CLIENT_URL=http://localhost:5173
```

**⚠️ Note**: The `.env` file is gitignored for security. Each developer must create their own `.env` file using the `.env.example` template.

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

Make sure MongoDB is running:

```bash
# For local MongoDB
mongod

# Or use MongoDB Atlas cloud database
```

### 4. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/logout` | User logout | Private |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update profile | Private |
| PUT | `/api/auth/password` | Change password | Private |

### Business Ideas Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/business-ideas` | Get all business ideas | Public |
| GET | `/api/business-ideas/:id` | Get single business idea | Public |
| POST | `/api/business-ideas` | Create business idea | Business Person |
| PUT | `/api/business-ideas/:id` | Update business idea | Owner |
| DELETE | `/api/business-ideas/:id` | Delete business idea | Owner |
| POST | `/api/business-ideas/:id/like` | Like/Unlike idea | Private |
| GET | `/api/business-ideas/my/ideas` | Get user's ideas | Business Person |

### Investment Proposals Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/investment-proposals` | Get proposals | Private |
| GET | `/api/investment-proposals/:id` | Get single proposal | Private |
| POST | `/api/investment-proposals` | Create proposal | Investor |
| PUT | `/api/investment-proposals/:id/status` | Accept/Reject proposal | Business Owner |
| PUT | `/api/investment-proposals/:id/withdraw` | Withdraw proposal | Investor |

## 🔐 User Roles

1. **Business Person**: Can create business ideas, view proposals
2. **Investor**: Can browse ideas, make investment proposals
3. **Banker**: Can create loan offers, manage applications
4. **Business Advisor**: Can provide consultations and advice

## 🛡️ Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcryptjs
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **CORS Protection** with configurable origins
- **Helmet.js** for security headers
- **Activity Logging** for audit trails

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum,
  avatar: String,
  isActive: Boolean,
  profile: Object,
  timestamps: true
}
```

### Business Idea Model
```javascript
{
  title: String,
  description: String,
  category: Enum,
  investmentNeeded: Number,
  userId: ObjectId (ref: User),
  status: Enum,
  files: Array,
  views: Number,
  likes: Array,
  timestamps: true
}
```

### Investment Proposal Model
```javascript
{
  businessIdeaId: ObjectId (ref: BusinessIdea),
  investorId: ObjectId (ref: User),
  amount: Number,
  type: Enum,
  terms: String,
  status: Enum,
  timestamps: true
}
```

## 🔍 Query Features

- **Pagination** with page and limit parameters
- **Sorting** by various fields
- **Filtering** by category, status, etc.
- **Search** with text indexing
- **Population** of referenced documents

## 📝 Logging

The application uses Winston for comprehensive logging:

- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Console output** in development mode
- **Activity logging** for user actions

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=your_frontend_domain
```

### Deployment Platforms

- **Heroku**: Easy deployment with MongoDB Atlas
- **Railway**: Modern deployment platform
- **DigitalOcean**: VPS deployment
- **AWS**: EC2 with RDS/DocumentDB

## 📈 Performance Optimization

- **Database Indexing** for faster queries
- **Compression** middleware for response optimization
- **Rate Limiting** to prevent abuse
- **Efficient Pagination** for large datasets
- **Connection Pooling** with Mongoose

## � Troubleshooting

### Common Issues

#### "The 'uri' parameter to 'openUri()' must be a string, got 'undefined'"

This error occurs when the `MONGO_URI` environment variable is not set.

**Solution:**
1. Make sure you have a `.env` file in the backend directory
2. Copy from `.env.example`: `cp .env.example .env`
3. Set your MongoDB connection string in the `.env` file
4. For local development: `MONGO_URI=mongodb://localhost:27017/bridge`
5. For MongoDB Atlas: Use your cluster connection string

#### "JWT must be provided"

This error occurs when authentication tokens are missing or invalid.

**Solution:**
1. Make sure `JWT_SECRET` is set in your `.env` file
2. Use a strong, unique secret key
3. Check that the frontend is sending the authorization header

#### "Failed to connect to MongoDB"

This error occurs when MongoDB is not running or the connection string is incorrect.

**Solution:**
1. For local MongoDB: Make sure MongoDB service is running
2. For MongoDB Atlas: Check your connection string and network access
3. Verify your database credentials
4. Check firewall settings

## �🔧 Development Tools

```bash
# Install nodemon for development
npm install -g nodemon

# Run in development mode
npm run dev

# Check for security vulnerabilities
npm audit

# Fix security issues
npm audit fix
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Note**: This backend is designed to work with the Bridge frontend application. Make sure both applications are properly configured and running for full functionality.