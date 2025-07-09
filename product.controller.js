import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

// Add new product
const createProduct = asyncHandler(async (req, res) => {
    const { name, category, price, stock, barcode } = req.body;

    if (!name || !category || !price || !stock || !barcode) {
        throw new ApiError(400, "All fields are required");
    }

    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
        throw new ApiError(404, "Category not found");
    }

    const existingProduct = await Product.findOne({ barcode });
    if (existingProduct) {
        throw new ApiError(400, "Product with this barcode already exists");
    }

    const product = await Product.create({
        name,
        category,
        price,
        stock,
        barcode,
        status: stock > 0 ? "in-stock" : "out-of-stock",
    });

    return res.status(201).json(
        new ApiResponse(201, product, "Product created successfully")
    );
});

// List products (with filters)
const getAllProducts = asyncHandler(async (req, res) => {
    const { category, status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

    const products = await Product.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, { products, total }, "Products fetched successfully")
    );
});

// Get product details
const getProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id).populate("category");
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(
        new ApiResponse(200, product, "Product fetched successfully")
    );
});

// Update product
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, category, price, stock, barcode } = req.body;

    const product = await Product.findById(id);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (category) {
        const existingCategory = await Category.findById(category);
        if (!existingCategory) {
            throw new ApiError(404, "Category not found");
        }
    }

    product.name = name || product.name;
    product.category = category || product.category;
    product.price = price || product.price;
    product.stock = stock !== undefined ? stock : product.stock;
    product.barcode = barcode || product.barcode;
    product.status = product.stock > 0 ? "in-stock" : "out-of-stock";

    await product.save();

    return res.status(200).json(
        new ApiResponse(200, product, "Product updated successfully")
    );
});

// Archive product
const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    product.isArchived = true;
    await product.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Product archived successfully")
    );
});

// Check real-time stock
const checkStock = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { stock: product.stock }, "Stock checked successfully")
    );
});

// List low-stock items
const getLowStock = asyncHandler(async (req, res) => {
    const { threshold = 5 } = req.query;

    const lowStockProducts = await Product.find({ stock: { $lte: threshold } });

    return res.status(200).json(
        new ApiResponse(200, lowStockProducts, "Low-stock products fetched successfully")
    );
});

export {
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    checkStock,
    getLowStock,
};