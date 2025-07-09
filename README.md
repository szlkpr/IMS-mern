# 🧾 Inventory Management System (IMS) - Backend API

A secure, scalable **backend REST API** built with the **MERN stack** (Node.js, Express, MongoDB), designed for managing over 500+ car accessory products. This backend powers an Inventory Management System with real-time stock tracking, role-based user access, sales analytics, and more.

---

## 🚀 Features

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

---

## 🛠️ Tech Stack

- **Node.js + Express.js**
- **MongoDB + Mongoose**
- **JWT Auth + bcrypt**
- **Redux Toolkit (planned integration for frontend)**
- **Chart.js-compatible sales data APIs**
- **CSV-Writer + Barcode field support**

---

## 📁 Project Structure

backend/
│
├── config/ # DB connection & JWT config
├── controllers/ # Business logic for routes
├── models/ # Mongoose schemas
├── middleware/ # Auth, error handling
├── routes/ # Express route handlers
├── utils/ # Helpers (CSV export, barcode parser)
├── .env.example # Environment variables
└── server.js # Entry point


---


## 🧪 API Endpoints (Sample)

Method	Endpoint	Description
POST	/api/auth/register	Register new user
POST	/api/auth/login	Login with JWT token
GET	/api/products	List all products
POST	/api/products	Add new product (admin only)
PATCH	/api/products/:id	Edit product
POST	/api/orders/sales	Record a sale
GET	/api/analytics/monthly	Monthly revenue stats (Chart.js)
GET	/api/export/csv	Export inventory as CSV

💡 Learning Outcomes

    Built a secure, scalable REST API with authentication and role control

    Applied Mongoose models for structured data modeling

    Integrated analytics-ready endpoints for frontend dashboard

    Gained experience with barcode, CSV, and alert systems

🔗 Future Enhancements

    Add Swagger API documentation

    Implement frontend (React + Redux Toolkit + Chart.js)

    Enable real-time updates via Socket.IO

    Add support for multiple warehouses and suppliers

🙋‍♂️ About Me

I’m a passionate backend developer focused on building reliable and scalable systems. This project showcases my ability to create production-ready REST APIs with security, performance, and real-world features.

📫 Connect on LinkedIn
🔗 See more at GitHub
⭐ Like this project?

If you find this project useful, please star it and share. Contributions and feedback are always welcome!
