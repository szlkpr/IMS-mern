import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";
import { Category } from "../models/category.model.js";

// Add new product
const createProduct = asyncHandler(async (req, res) => {
    // 1. Destructure fields from request body
    const {
        name,
        description,
        retailPrice,
        wholesalePrice,
        wholesaleThreshold,
        stock,
        category,
        barcode
    } = req.body;

    // 2. Robust Validation
    if (
        [name, description, category].some((field) => !field || String(field).trim() === "") ||
        [retailPrice, wholesalePrice, wholesaleThreshold, stock].some(field => field === undefined || field === null)
    ) {
        throw new ApiError(400, "All required fields must be provided with valid values.");
    }

    // 3. Check if the provided category ID is valid and exists
    if (!mongoose.Types.ObjectId.isValid(category)) {
        throw new ApiError(400, "Invalid Category ID format.");
    }
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
        throw new ApiError(404, "The category you are trying to assign does not exist.");
    }

    // 4. Check if a product with the same name already exists
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
        throw new ApiError(409, `A product with the name '${name}' already exists.`);
    }

    // 5. Create the product in the database
    const product = await Product.create({
        name,
        description,
        retailPrice,
        wholesalePrice,
        wholesaleThreshold,
        stock,
        category,
        barcode: barcode || undefined // Ensure barcode is not an empty string if not provided
    });

    if (!product) {
        throw new ApiError(500, "Something went wrong while creating the product.");
    }

    // 6. Return a success response
    return res.status(201).json(
        new ApiResponse(201, product, "Product created successfully")
    );
});

// List products (with filters)
const getAllProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        category,
        status,
        sortBy = 'createdAt',
        sortType = 'desc',
        includeArchived = 'false',
        search = '' // New: for text search
    } = req.query;

    const pipeline = [];

    // --- Build the match stage for filtering ---
    const matchStage = {
        isArchived: includeArchived === 'true'
    };

    if (search) {
        matchStage.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    if (category) {
        if (!mongoose.Types.ObjectId.isValid(category)) {
            throw new ApiError(400, "Invalid Category ID format for filtering.");
        }
        matchStage.category = new mongoose.Types.ObjectId(category);
    }
    if (status) {
        matchStage.status = status;
    }
    pipeline.push({ $match: matchStage });

    // --- Add a sort stage ---
    const sortStage = {};
    sortStage[sortBy] = sortType === 'asc' ? 1 : -1;
    pipeline.push({ $sort: sortStage });

    const aggregate = Product.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        populate: "category" // The plugin can populate the category details for us
    };

    const products = await Product.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, products, "Products fetched successfully")
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
    const {
        name,
        description,
        retailPrice,
        wholesalePrice,
        wholesaleThreshold,
        stock,
        category,
        barcode
    } = req.body;

    // Find the product to be updated
    const product = await Product.findById(id);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // If category is being updated, validate it
    if (category) {
        if (!mongoose.Types.ObjectId.isValid(category)) {
            throw new ApiError(400, "Invalid Category ID format.");
        }
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            throw new ApiError(404, "The category you are trying to assign does not exist.");
        }
        product.category = category;
    }

    // Update fields if they are provided in the request body
    if (name) product.name = name;
    if (description) product.description = description;
    if (retailPrice !== undefined) product.retailPrice = retailPrice;
    if (wholesalePrice !== undefined) product.wholesalePrice = wholesalePrice;
    if (wholesaleThreshold !== undefined) product.wholesaleThreshold = wholesaleThreshold;
    if (stock !== undefined) product.stock = stock;
    // Use hasOwnProperty to allow setting barcode to null or an empty string to remove it
    if (Object.prototype.hasOwnProperty.call(req.body, 'barcode')) product.barcode = barcode || undefined;

    const updatedProduct = await product.save({ validateBeforeSave: true });

    return res.status(200).json(
        new ApiResponse(200, updatedProduct, "Product updated successfully")
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