import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Sale } from "../models/sale.model.js";
import { Product } from "../models/product.model.js";
import { generatePDFInvoice } from "../utils/pdfGenerator.js";

// Record new sale
const createSale = asyncHandler(async (req, res) => {
    const { soldProducts, customerName, customerContact } = req.body;

    if (!soldProducts || soldProducts.length === 0) {
        throw new ApiError(400, "Sold products are required");
    }

    let totalCost = 0;
    const soldProductsWithDetails = [];

    for (const item of soldProducts) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new ApiError(404, `Product with ID ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
            throw new ApiError(400, `Insufficient stock for product: ${product.name}`);
        }

        // Determine pricing logic
        const price = item.quantity >= product.wholesaleThreshold
            ? product.wholesalePrice
            : product.retailPrice;

        totalCost += price * item.quantity;

        // Deduct stock
        product.stock -= item.quantity;
        product.status = product.stock > 0 ? "in-stock" : "out-of-stock";
        await product.save();

        soldProductsWithDetails.push({
            productId: item.productId,
            quantity: item.quantity,
            price: price,
        });
    }

    const sale = await Sale.create({
        soldProducts: soldProductsWithDetails,
        saleCost: totalCost,
        customerName,
        customerContact,
    });

    return res.status(201).json(
        new ApiResponse(201, sale, "Sale recorded successfully")
    );
});

// List sales (with filters)
const getAllSales = asyncHandler(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (startDate && endDate) {
        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const sales = await Sale.find(filter)
        .populate("soldProducts.productId")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const total = await Sale.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, { sales, total }, "Sales fetched successfully")
    );
});

// Get sale details
const getSale = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const sale = await Sale.findById(id).populate("soldProducts.productId");
    if (!sale) {
        throw new ApiError(404, "Sale not found");
    }

    return res.status(200).json(
        new ApiResponse(200, sale, "Sale details fetched successfully")
    );
});

// Generate PDF invoice
const generateInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const sale = await Sale.findById(id).populate("soldProducts.productId");
    if (!sale) {
        throw new ApiError(404, "Sale not found");
    }

    const pdfBuffer = await generatePDFInvoice(sale);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=sale_${id}_invoice.pdf`);
    return res.status(200).send(pdfBuffer);
});

// Daily sales analytics
const getSalesStats = asyncHandler(async (req, res) => {
    const stats = await Sale.aggregate([
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalSales: { $sum: "$saleCost" },
                totalTransactions: { $sum: 1 },
            },
        },
        { $sort: { _id: -1 } },
    ]);

    return res.status(200).json(
        new ApiResponse(200, stats, "Daily sales stats fetched successfully")
    );
});

// Process refund
const refundSale = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const sale = await Sale.findById(id);
    if (!sale) {
        throw new ApiError(404, "Sale not found");
    }

    for (const item of sale.soldProducts) {
        const product = await Product.findById(item.productId);
        if (product) {
            product.stock += item.quantity;
            product.status = product.stock > 0 ? "in-stock" : "out-of-stock";
            await product.save();
        }
    }

    await sale.remove();

    return res.status(200).json(
        new ApiResponse(200, {}, "Sale refunded successfully")
    );
});

export {
    createSale,
    getAllSales,
    getSale,
    generateInvoice,
    getSalesStats,
    refundSale,
};