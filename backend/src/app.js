import statusRoutes from "./routes/status.routes.js"
import userRoutes from "./routes/user.routes.js"
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import cookieParser from "cookie-parser"
import express from "express"
import cors from "cors"
import { errorHandler } from "./middlewares/error.middleware.js"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "20kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/status", statusRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/categories", categoryRoutes)
app.use("/api/v1/products", productRoutes)
app.use("/api/v1/sales", saleRoutes)
app.use("/api/v1/purchases", purchaseRoutes)
app.use("/api/v1/reports", reportsRoutes)
app.use("/api/v1/analytics", analyticsRoutes)

// Global error handler middleware - must be last
app.use(errorHandler)

export default app
