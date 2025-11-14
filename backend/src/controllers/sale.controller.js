import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Sale } from "../models/sale.model.js";
import { Product } from "../models/product.model.js";
import { generatePDFInvoice } from "../utils/pdfGenerator.js";

// Record new multi-item sale with discounts
const createSale = asyncHandler(async (req, res) => {
    const { 
        soldProducts, 
        customerName, 
        customerContact, 
        customerEmail,
        customerAddress,
        discountType = 'none',
        discountValue = 0,
        paymentMethod = 'cash',
        paymentStatus = 'paid',
        notes,
        invoiceNumber
    } = req.body;

    // Validation
    if (!soldProducts || soldProducts.length === 0) {
        throw new ApiError(400, "At least one product must be sold");
    }

    // Validate discount
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
        throw new ApiError(400, "Discount percentage must be between 0 and 100");
    }
    if (discountType === 'fixed' && discountValue < 0) {
        throw new ApiError(400, "Fixed discount amount cannot be negative");
    }

    // Check stock availability for all items first
    const stockChecks = [];
    const productDetails = new Map();

    for (const item of soldProducts) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
            throw new ApiError(400, "Each product must have valid productId and quantity");
        }

        const product = await Product.findById(item.productId);
        if (!product) {
            throw new ApiError(404, `Product with ID ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
            throw new ApiError(400, `Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }

        productDetails.set(item.productId, product);
        stockChecks.push({ product, requestedQuantity: item.quantity });
    }

    // Calculate pricing and prepare sale items
    const soldProductsWithDetails = [];
    let subtotal = 0;

    for (const item of soldProducts) {
        const product = productDetails.get(item.productId);
        
        // Determine unit price based on wholesale threshold
        let unitPrice;
        if (item.unitPrice) {
            // Use provided unit price (allows for custom pricing)
            unitPrice = parseFloat(item.unitPrice);
        } else {
            // Use automatic pricing logic
            unitPrice = item.quantity >= (product.wholesaleThreshold || Infinity)
                ? product.wholesalePrice
                : product.retailPrice;
        }

        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        soldProductsWithDetails.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
            // For backward compatibility
            price: unitPrice
        });
    }

    // Create the sale (totals will be calculated by pre-save middleware)
    const saleData = {
        soldProducts: soldProductsWithDetails,
        subtotal,
        discountType,
        discountValue: discountType !== 'none' ? parseFloat(discountValue) : 0,
        customerName: customerName?.trim(),
        customerContact: customerContact?.trim(),
        customerEmail: customerEmail?.trim(),
        customerAddress: customerAddress?.trim(),
        paymentMethod,
        paymentStatus,
        notes: notes?.trim(),
        status: 'completed'
    };

    if (invoiceNumber) {
        saleData.invoiceNumber = invoiceNumber;
    }

    const sale = await Sale.create(saleData);

    // Update product stock after successful sale creation
    for (const item of soldProducts) {
        const product = productDetails.get(item.productId);
        product.stock -= item.quantity;
        product.status = product.stock > 0 ? "in-stock" : "out-of-stock";
        await product.save();
    }

    // Populate product details for response
    await sale.populate('soldProducts.productId');

    return res.status(201).json(
        new ApiResponse(201, sale, "Multi-item sale recorded successfully")
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

    try {
        const pdfBuffer = await generatePDFInvoice(sale);
        
        const filename = `invoice_${sale.invoiceNumber || sale._id}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        
        return res.status(200).send(pdfBuffer);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw new ApiError(500, "Failed to generate PDF invoice");
    }
});

// Daily sales analytics
const getSalesStats = asyncHandler(async (req, res) => {
    const stats = await Sale.aggregate([
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalSales: { $sum: { $ifNull: ["$totalAmount", "$saleCost"] } },
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

    await sale.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Sale refunded successfully")
    );
});

// Get next available invoice number
const getNextInvoiceNumber = asyncHandler(async (req, res) => {
    const invoiceNumber = await Sale.generateInvoiceNumber();
    
    return res.status(200).json(
        new ApiResponse(200, { invoiceNumber }, "Next invoice number generated")
    );
});

export {
    createSale,
    getAllSales,
    getSale,
    generateInvoice,
    getSalesStats,
    refundSale,
    getNextInvoiceNumber,
};
