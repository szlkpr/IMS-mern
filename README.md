# 🧾 Inventory Management System (IMS) - Full Stack Application

A comprehensive **full-stack Inventory Management System** built with the **MERN stack** (MongoDB, Express.js, React, Node.js). This application is designed for managing over 500+ car accessory products with real-time stock tracking, role-based user access, sales analytics, and more.

## 🚀 Features

### Backend Features
- 🔐 **JWT Authentication with Role-Based Access Control**  
  Separate roles for admin and sub-admin with restricted routes.

- 📦 **Product Inventory CRUD**  
  Add, edit, delete, and fetch car accessories with stock and pricing info.

- 💰 **Sales & Purchase Order Tracking**  
  Endpoints to handle daily sales and procurement operations.

- 📉 **Monthly Revenue Analytics**  
  Sales data aggregation by month, designed to work with Chart.js.

- ⚠️ **Real-time Stock Alerts**  
  Low-stock detection and alert-ready APIs.

- 📄 **CSV Export**  
  Export inventory and sales data to CSV for audit or Excel.

- 📷 **Barcode Scanning Support**  
  API-ready structure for integrating barcode/QR-based item lookup.

### Frontend Features
- ⚡ **React 19 with Vite** for fast development and building
- 🎨 **TailwindCSS** for responsive design
- 🔐 **Protected Routing** with authentication guards
- 📱 **Responsive Layout** with navigation
- 📊 **Dashboard** with real-time analytics
- 📦 **Inventory Management** interface
- 💼 **Sales & Purchase** tracking pages

## 🛠️ Tech Stack

### Frontend
- **React 19** with hooks and functional components
- **Vite** for development and building
- **TailwindCSS** for styling
- **React Router DOM** for routing
- **Axios** for API calls

### Backend
- **Node.js + Express.js**
- **MongoDB + Mongoose** with aggregation pipeline
- **JWT Auth + bcrypt** for security
- **Cloudinary** for image storage
- **Multer** for file uploads
- **PDFKit** for PDF generation

## 📁 Project Structure

```
inventory/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── models/            # Database schemas
│   │   ├── routes/            # API routes
│   │   ├── middlewares/       # Custom middleware
│   │   ├── utils/             # Utility functions
│   │   └── db/                # Database connection
│   ├── public/temp/           # Temporary file storage
│   ├── .env                   # Backend environment variables
│   └── package.json
├── src/                       # Frontend React app
│   ├── Components/            # Reusable components
│   ├── Pages/                 # Page components
│   ├── api.js                 # API configuration
│   └── main.jsx               # React entry point
├── .env                       # Frontend environment variables
├── package.json               # Frontend dependencies
├── tailwind.config.js         # TailwindCSS configuration
└── vite.config.js             # Vite configuration
```

## 🚦 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/szlkpr/IMS-mern.git
   cd IMS-mern
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Environment Setup**
   
   **Frontend (`.env` in root directory):**
   ```env
   VITE_API_BASE_URL=http://localhost:4200
   VITE_APP_TITLE=Inventory Management System
   VITE_DEV_MODE=true
   ```

   **Backend (`backend/.env`):**
   ```env
   PORT=4200
   MONGODB_URI=your_mongodb_connection_string
   CORS_ORIGIN=http://localhost:5173
   
   ACCESS_TOKEN_SECRET=your_access_token_secret
   ACCESS_TOKEN_EXPIRES=1d
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   REFRESH_TOKEN_EXPIRES=7d
   
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

### Running the Application

1. **Start the backend server** (in `/backend` directory):
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:4200`

2. **Start the frontend development server** (in root directory):
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

## 📚 API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout

### Products
- `GET /api/v1/products` - Get all products
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Categories
- `GET /api/v1/categories` - Get all categories
- `POST /api/v1/categories` - Create category

### Sales & Purchases
- `GET /api/v1/sales` - Get sales records
- `POST /api/v1/sales` - Create sale record
- `GET /api/v1/purchases` - Get purchase records
- `POST /api/v1/purchases` - Create purchase record

## 🔧 Development

### Available Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

**Backend:**
- `npm run dev` - Start development server with nodemon

### Database Models

- **User**: Authentication and role management
- **Product**: Inventory items with pricing and stock
- **Category**: Product categorization
- **Sale**: Sales transaction records
- **Purchase**: Purchase order records

## 📈 Deployment

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Deploy backend** to your preferred platform (Heroku, Railway, etc.)

4. **Deploy frontend** to Netlify, Vercel, or similar

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**szlkpr** - [GitHub Profile](https://github.com/szlkpr)

## ⭐ Show your support

Give a ⭐️ if this project helped you!