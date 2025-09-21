import { Router } from "express";
import {
    createSale,
    getAllSales,
    getSale,
    generateInvoice,
    getSalesStats,
    refundSale,
} from "../controllers/sale.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

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

export default router;