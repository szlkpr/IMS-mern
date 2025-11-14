# 📦 Inventory Management System

A comprehensive, full-stack inventory management system with advanced ML-powered forecasting and analytics capabilities. Built with modern technologies including React, Node.js, MongoDB, and Python FastAPI.

## 🌟 Features

### Core Functionality
- **Product Management**: Complete CRUD operations with dual pricing (retail/wholesale), barcode support, and stock tracking
- **Sales Management**: Multi-item invoicing with automatic invoice number generation, discount support, and payment tracking
- **Purchase Management**: Purchase order tracking and supplier management
- **Category Management**: Hierarchical product categorization
- **User Management**: Role-based access control (Admin/Sub-admin) with JWT authentication

### Advanced Analytics
- **Profit Margin Analysis**: Product and category-level profit calculations
- **Inventory Turnover**: Ratio analysis with product categorization (Fast/Medium/Slow/Dead Stock)
- **Dead Stock Identification**: Automatic detection of non-moving inventory with risk levels
- **Customer Segmentation**: RFM analysis (Recency, Frequency, Monetary) for customer classification
- **Market Basket Analysis**: Frequently bought together product identification
- **Performance Benchmarking**: Target vs actual performance tracking
- **Executive Dashboard**: Business health score (0-100) with key performance indicators

### ML-Powered Predictions
- **Demand Forecasting**: 30-day horizon predictions with confidence intervals
- **Market Stability Analysis**: Market dynamics and trend analysis
- **Inventory Optimization**: ML-driven reorder recommendations
- **Knowledge Graph Insights**: Product relationship mapping
- **Prediction Explanations**: Interpretable AI with causal reasoning

### Real-time Features
- WebSocket integration for live dashboard updates
- Real-time inventory alerts
- Live sales tracking

### Security
- Helmet.js security headers (CSP, X-Frame-Options)
- JWT authentication with refresh tokens
- Password hashing (bcrypt)
- CORS configuration
- Input validation and sanitization

### Internationalization
- Support for 9 languages: English, Hindi, Tamil, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Telugu
- Browser language detection
- Comprehensive translation coverage

---

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **Charts**: Chart.js with react-chartjs-2
- **Internationalization**: i18next (9 languages)
- **Real-time**: Socket.io Client

#### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 4.21
- **Database**: MongoDB with Mongoose 8.13
- **Authentication**: JWT (access + refresh tokens)
- **File Upload**: Multer + Cloudinary
- **Security**: Helmet.js
- **Real-time**: Socket.io Server
- **PDF Generation**: PDFKit
- **Testing**: Jest + Supertest

#### ML Service
- **Framework**: FastAPI (Python)
- **ML Libraries**: PyTorch, scikit-learn, pandas, numpy, transformers
- **Models**: Neuro-Symbolic Physics-Informed Forecasting System
- **Features**: Knowledge graphs, causal inference, symbolic reasoning

### Project Structure

```
inventory/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── controllers/  # Business logic (6 controllers)
│   │   ├── models/       # MongoDB schemas (6 models)
│   │   ├── routes/       # API endpoints (9 route files)
│   │   ├── services/     # Business services (analytics, ML, WebSocket)
│   │   ├── middlewares/  # Auth, error handling, file upload
│   │   ├── utils/        # Helpers (PDF, API errors, Cloudinary)
│   │   └── db/           # Database connection
│   ├── __tests__/        # Jest test suite
│   └── coverage/         # Test coverage reports
├── src/                  # React frontend
│   ├── Pages/            # 8 main pages
│   ├── Components/       # Reusable components
│   ├── services/         # API clients, WebSocket service
│   └── locales/          # i18n translations (9 languages)
├── ml-service/           # Python FastAPI ML service
│   └── app.py            # ML prediction endpoints
├── k6/                   # Load/stress testing scripts
└── capmodel.py           # Core ML model implementation
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- Python 3.9+ (for ML service)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inventory
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Install ML Service Dependencies**
   ```bash
   cd ml-service
   pip install -r requirements.txt
   ```

5. **Environment Configuration**

   Create `.env` files in the respective directories:

   **Backend (`backend/.env`):**
   ```env
   MONGODB_URI=mongodb://localhost:27017
   PORT=4200
   CORS_ORIGIN=http://localhost:5173
   ACCESS_TOKEN_SECRET=your_access_token_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   ACCESS_TOKEN_EXPIRES=15m
   REFRESH_TOKEN_EXPIRES=7d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ML_SERVICE_URL=http://localhost:8000
   ```

   **Frontend (`src/.env`):**
   ```env
   VITE_API_URL=http://localhost:4200
   VITE_WS_URL=ws://localhost:4200
   ```

   **ML Service (`ml-service/.env`):**
   ```env
   PORT=8000
   ```

### Running the Application

1. **Start MongoDB**
   ```bash
   mongod
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on `http://localhost:4200`

3. **Start ML Service** (Optional - for ML predictions)
   ```bash
   cd ml-service
   uvicorn app:app --reload --port 8000
   ```
   ML service will run on `http://localhost:8000`

4. **Start Frontend Development Server**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

### Production Build

**Frontend:**
```bash
npm run build
npm run preview
```

**Backend:**
```bash
cd backend
NODE_ENV=production node src/index.js
```

---

## 🔌 API Endpoints

### Main Routes
- `/api/v1/users` - User management
- `/api/v1/products` - Product CRUD operations
- `/api/v1/categories` - Category management
- `/api/v1/sales` - Sales operations
- `/api/v1/purchases` - Purchase management
- `/api/v1/reports` - Report generation
- `/api/v1/analytics` - Analytics dashboard
- `/api/v1/ml` - ML predictions
- `/api/status` - Health check

### ML Service Endpoints
- `GET /health` - Service health check
- `POST /predict/demand` - Demand forecasting
- `POST /analyze/market-stability` - Market analysis
- `POST /explain/prediction` - Prediction explanations
- `POST /optimize/inventory` - Inventory optimization
- `GET /insights/knowledge-graph/{product}` - Knowledge graph insights

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Test Coverage
```bash
npm test -- --coverage
```

### Load Testing (k6)
```bash
# Install k6: https://k6.io/docs/get-started/installation/

# Load test
k6 run -e BASE_URL=http://localhost:4200 k6/load_test.js

# Stress test
k6 run \
  -e BASE_URL=http://localhost:4200 \
  -e K6_AUTH_TOKEN=YOUR_JWT \
  -e K6_CATEGORY_ID=64b... \
  -e K6_PRODUCT_ID=64c... \
  k6/stress_test.js
```

### ML Service Tests
```bash
cd ml-service
pytest
pytest --cov
```

---

## 🔐 Security Features

### Implemented Security Measures
- **Helmet.js**: Security headers (CSP, X-Frame-Options)
- **Content Security Policy**: XSS protection
- **X-Frame-Options**: Clickjacking prevention
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **CORS**: Configured for allowed origins
- **Input Validation**: Request sanitization

### Production Security Checklist
- [ ] Remove `unsafe-inline` and `unsafe-eval` from CSP
- [ ] Use nonces for inline scripts
- [ ] Enable HTTPS upgrade in CSP
- [ ] Set up CSP violation reporting
- [ ] Use strong, unique secrets for JWT
- [ ] Enable rate limiting
- [ ] Set up security monitoring

See [SECURITY-HEADERS.md](./SECURITY-HEADERS.md) for detailed security documentation.

---

## 📊 Analytics & Reporting

### Available Analytics
- **Profit Margin Analysis**: Product and category-level margins
- **Inventory Turnover**: Fast/Medium/Slow/Dead stock categorization
- **Dead Stock Analysis**: Products not sold in X days with risk levels
- **Customer Segmentation**: RFM analysis (Champions, Loyal, At Risk, etc.)
- **Market Basket Analysis**: Frequently bought together products
- **Performance Benchmarks**: Target vs actual comparisons
- **Executive Summary**: Business health score with KPIs
- **Real-time Metrics**: Live dashboard updates
- **Trend Analysis**: Sales growth rate calculations

### ML Predictions
- **Demand Forecasting**: 30-day predictions with confidence intervals
- **Market Stability**: Market dynamics analysis
- **Inventory Optimization**: ML-driven reorder recommendations
- **Knowledge Graph**: Product relationship insights
- **Causal Explanations**: Interpretable prediction reasoning

---

## 🌐 Internationalization

The application supports 9 languages:
- English (en)
- Hindi (hi)
- Tamil (ta)
- Bengali (bn)
- Gujarati (gu)
- Kannada (kn)
- Malayalam (ml)
- Marathi (mr)
- Odia (or)
- Punjabi (pa)
- Telugu (te)

Language detection is automatic based on browser settings, with manual switching available.

---

## 📈 Performance & Scalability

### Optimizations
- MongoDB aggregation pipelines for complex queries
- Pagination support for large datasets
- WebSocket for efficient real-time updates
- Caching strategies in data services
- Load testing with k6

### Monitoring
- Health check endpoints
- Error logging and handling
- Performance metrics tracking

---

## 🗄️ Database Schema

### Main Models
- **Product**: Inventory items with pricing, stock, and metadata
- **Sale**: Sales transactions with multi-item support
- **Purchase**: Purchase orders and supplier tracking
- **Category**: Product categorization
- **User**: Admin/Sub-admin accounts
- **Reports**: Generated report storage

See individual model files in `backend/src/models/` for detailed schemas.

---

## 🛠️ Development

### Code Style
- ESLint for JavaScript/React
- Consistent code formatting
- ES Modules throughout

### Adding New Features
1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit pull request

### Project Statistics
- **Controllers**: 6
- **Models**: 6
- **Routes**: 9
- **Frontend Pages**: 8
- **Supported Languages**: 9
- **API Endpoints**: 30+

---

## 📝 License

[Specify your license here]

## 👥 Contributors

[Add contributors here]

## 🙏 Acknowledgments

- React team for the excellent framework
- Express.js for the robust backend framework
- MongoDB for the flexible database
- FastAPI for the modern Python framework
- All open-source contributors

---

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

## 🔮 Future Enhancements

- [ ] OpenAPI/Swagger documentation
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Enhanced error handling
- [ ] Structured logging (Winston)
- [ ] Database indexing optimization
- [ ] Frontend state management (Redux/Zustand)
- [ ] Advanced monitoring and APM tools

---

**Built with ❤️ using React, Node.js, MongoDB, and Python**





