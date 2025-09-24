import { Router } from "express";
import {
    createCategory,
    getAllCategories,
    getCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/")
    .post(verifyJWT, createCategory) // Admin only
    .get(getAllCategories); // Public

router.route("/:id")
    .get(getCategory) // Public
    .put(verifyJWT, updateCategory) // Admin only
    .patch(verifyJWT, updateCategory) // Admin only (for compatibility)
    .delete(verifyJWT, deleteCategory); // Admin only

export default router;