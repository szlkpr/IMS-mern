import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import slugify from "slugify";

// Add new category
const createCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name) {
        throw new ApiError(400, "Category name is required");
    }

    const slug = slugify(name, { lower: true });

    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
        throw new ApiError(400, "Category already exists");
    }

    const category = await Category.create({ name, slug });

    return res.status(201).json(
        new ApiResponse(201, category, "Category created successfully")
    );
});

// List all categories
const getAllCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = 'name', sortType = 'asc' } = req.query;

    const aggregate = Category.aggregate([]); // Start with an empty pipeline

    // Add sorting to the pipeline
    const sortStage = {};
    sortStage[sortBy] = sortType === 'asc' ? 1 : -1;
    aggregate.sort(sortStage);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const categories = await Category.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, categories, "Categories fetched successfully")
    );
});

// Get category details
const getCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res.status(200).json(
        new ApiResponse(200, category, "Category fetched successfully")
    );
});

// Update category
const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        throw new ApiError(400, "Category name is required");
    }

    const slug = slugify(name, { lower: true });

    const updatedCategory = await Category.findByIdAndUpdate(
        id,
        { name, slug },
        { new: true }
    );

    if (!updatedCategory) {
        throw new ApiError(404, "Category not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedCategory, "Category updated successfully")
    );
});

// Remove category
const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    const products = await Product.find({ category: id });
    if (products.length > 0) {
        throw new ApiError(400, "Cannot delete category with associated products");
    }

    await Category.deleteOne({ _id: id });

    return res.status(200).json(
        new ApiResponse(200, { _id: id }, "Category deleted successfully")
    );
});

export {
    createCategory,
    getAllCategories,
    getCategory,
    updateCategory,
    deleteCategory,
};