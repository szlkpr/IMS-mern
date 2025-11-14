import statusRoutes from "./routes/status.routes.js"
import userRoutes from "./routes/user.routes.js"
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import mlRoutes from "./routes/ml.routes.js";
import rfidRoutes from "./routes/rfid.routes.js";
import cookieParser from "cookie-parser"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import { errorHandler } from "./middlewares/error.middleware.js"

const app = express()

// Allow multiple origins via comma-separated CORS_ORIGIN env
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Security Headers Configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Required for Vite HMR in development
                "'unsafe-eval'", // Required for Vite in development
                "https://cdn.jsdelivr.net", // For Chart.js if using CDN
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'", // Required for inline styles and Tailwind
                "https://fonts.googleapis.com",
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "data:",
            ],
            imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https://res.cloudinary.com", // Cloudinary for product images
            ],
            connectSrc: [
                "'self'",
                ...allowedOrigins,
                `ws://localhost:${process.env.PORT || 4200}`,
                `wss://localhost:${process.env.PORT || 4200}`,
            ],
            frameSrc: ["'none'"], // Anti-clickjacking - prevents embedding in iframes
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
        },
    },
    frameOptions: {
        action: "deny", // X-Frame-Options: DENY - prevents clickjacking
    },
    crossOriginEmbedderPolicy: false, // Disabled for compatibility with some assets
}))

// CORS configuration and explicit preflight handling
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware to parse JSON bodies. This is crucial for API endpoints that receive JSON.
app.use(express.json({ limit: "16kb" }));

// Middleware to parse URL-encoded bodies (form submissions).
app.use(express.urlencoded({extended: true, limit: "20kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/v1/status", statusRoutes)
app.use("/api/v1/users", userRoutes) // This seems to be the intended setup. Let's revert the change to app.js and focus on the .env files.
app.use("/api/v1/categories", categoryRoutes)
app.use("/api/v1/products", productRoutes)
app.use("/api/v1/sales", saleRoutes)
app.use("/api/v1/purchases", purchaseRoutes)
app.use("/api/v1/reports", reportsRoutes)
app.use("/api/v1/analytics", analyticsRoutes)
app.use("/api/v1/ml", mlRoutes)
app.use("/api/v1/rfid", rfidRoutes)

// Global error handler middleware - must be last
app.use(errorHandler)

export default app
