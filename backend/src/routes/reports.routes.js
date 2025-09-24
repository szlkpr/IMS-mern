import { Router } from "express";
import {
    getDashboardMetrics,
    getSalesReport,
    getInventoryReport,
    getLowStockAlerts,
    exportSalesData,
    exportInventoryData
} from "../controllers/reports.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Dashboard metrics endpoint
router.route("/dashboard-metrics").get(getDashboardMetrics);

// Reports endpoints
router.route("/sales").get(getSalesReport);
router.route("/inventory").get(getInventoryReport);

// Alerts endpoint
router.route("/low-stock-alerts").get(getLowStockAlerts);

// Export endpoints
router.route("/export/sales").get(exportSalesData);
router.route("/export/inventory").get(exportInventoryData);

export default router;