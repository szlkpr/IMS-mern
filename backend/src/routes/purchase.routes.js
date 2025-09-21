import { Router } from "express";
import {
    createPurchase,
    getAllPurchases,
    getPurchase,
    updatePurchase,
    getPendingOrders,
    receiveStock,
} from "../controllers/purchase.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/")
    .post(verifyJWT, createPurchase) // Admin only
    .get(verifyJWT, getAllPurchases); // Admin only

router.route("/:id")
    .get(verifyJWT, getPurchase) // Admin only
    .patch(verifyJWT, updatePurchase); // Admin only

router.route("/pending")
    .get(verifyJWT, getPendingOrders); // Admin only

router.route("/:id/receive")
    .post(verifyJWT, receiveStock); // Admin/Sub-admin

export default router;