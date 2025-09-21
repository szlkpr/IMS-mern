import { Router } from "express";
import {
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    checkStock,
    getLowStock,
} from "../controllers/product.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/")
    .post(verifyJWT, createProduct) // Admin/Sub-admin
    .get(getAllProducts); // Public

router.route("/:id")
    .get(getProduct) // Public
    .patch(verifyJWT, updateProduct) // Admin/Sub-admin
    .delete(verifyJWT, deleteProduct); // Admin only

router.route("/stock/:id")
    .get(verifyJWT, checkStock); // Authenticated

router.route("/low-stock")
    .get(verifyJWT, getLowStock); // Admin/Sub-admin

export default router;