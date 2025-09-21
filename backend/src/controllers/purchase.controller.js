import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import Purchase from "../models/purchase.model.js";
import { Product } from "../models/product.model.js";

// Record supplier purchase
const createPurchase = asyncHandler(async (req, res) => {
    const { supplierName, items, totalCost, vendorContact } = req.body;

    if (!supplierName || !items || !totalCost || !vendorContact) {
        throw new ApiError(400, "All fields are required");
    }

    // Update product stock
    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new ApiError(404, `Product with ID ${item.productId} not found`);
        }
        product.stock += item.quantity;
        if (product.stock > 0 && product.status === 'out-of-stock') {
            product.status = 'in-stock';
        }
        await product.save();
    }

    const purchase = await Purchase.create({
        vendorCompanyName: supplierName,
        purchasedProducts: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
        })),
        saleCost: totalCost,
        vendorContact,
        purchaseDate: new Date(),
    });

    await purchase.populate("purchasedProducts.productId");

    return res.status(201).json(
        new ApiResponse(201, purchase, "Purchase order created successfully")
    );
});

// List purchases
const getAllPurchases = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const purchases = await Purchase.find()
        .populate("purchasedProducts.productId")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const total = await Purchase.countDocuments();

    return res.status(200).json(
        new ApiResponse(200, { purchases, total }, "Purchases fetched successfully")
    );
});

// Get purchase order
const getPurchase = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const purchase = await Purchase.findById(id);
    if (!purchase) {
        throw new ApiError(404, "Purchase order not found");
    }

    return res.status(200).json(
        new ApiResponse(200, purchase, "Purchase order fetched successfully")
    );
});

// Update purchase order status
const updatePurchase = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    const purchase = await Purchase.findByIdAndUpdate(
        id,
        { status },
        { new: true }
    );

    if (!purchase) {
        throw new ApiError(404, "Purchase order not found");
    }

    return res.status(200).json(
        new ApiResponse(200, purchase, "Purchase order updated successfully")
    );
});

// List unpaid purchase orders
const getPendingOrders = asyncHandler(async (req, res) => {
    const pendingOrders = await Purchase.find({ status: "pending" });

    return res.status(200).json(
        new ApiResponse(200, pendingOrders, "Pending purchase orders fetched successfully")
    );
});

// Mark items as received
const receiveStock = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const purchase = await Purchase.findById(id);
    if (!purchase) {
        throw new ApiError(404, "Purchase order not found");
    }

    for (const item of purchase.items) {
        const product = await Product.findById(item.productId);
        if (product) {
            product.stock += item.quantity;
            product.status = product.stock > 0 ? "in-stock" : "out-of-stock";
            await product.save();
        }
    }

    purchase.status = "received";
    await purchase.save();

    return res.status(200).json(
        new ApiResponse(200, purchase, "Stock received and inventory updated successfully")
    );
});

export {
    createPurchase,
    getAllPurchases,
    getPurchase,
    updatePurchase,
    getPendingOrders,
    receiveStock,
};