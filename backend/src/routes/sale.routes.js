import { Router } from "express";
import {
    createSale,
    getAllSales,
    getSale,
    generateInvoice,
    getSalesStats,
    refundSale,
    getNextInvoiceNumber,
} from "../controllers/sale.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyDevice } from "../middlewares/deviceAuth.middleware.js";
import { handleScan } from "../controllers/rfid.controller.js";

const router = Router();

// Device-facing route (API Key Auth)
// This route is for device-triggered RFID sales and is secured with device credentials.
router.route("/rfid-sale").post(verifyDevice, handleScan);

// User-facing routes (JWT Auth)
router.route("/")
    .post(verifyJWT, createSale) // Admin/Sub-admin
    .get(verifyJWT, getAllSales); // Admin/Sub-admin

router.route("/:id")
    .get(verifyJWT, getSale) // Admin/Sub-admin
    .post(verifyJWT, refundSale); // Admin only

router.route("/:id/invoice")
    .get(verifyJWT, generateInvoice); // Admin/Sub-admin

router.route("/stats/daily")
    .get(verifyJWT, getSalesStats); // Admin only

router.route("/next-invoice-number")
    .get(verifyJWT, getNextInvoiceNumber); // Admin/Sub-admin

export default router;
