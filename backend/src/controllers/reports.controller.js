import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Sale } from "../models/sale.model.js";
import { Product } from "../models/product.model.js";

// Get comprehensive dashboard metrics
const getDashboardMetrics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    // Default to current month if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Sales metrics
    const salesMetrics = await Sale.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: null,
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: "$saleCost" },
                averageOrderValue: { $avg: "$saleCost" }
            }
        }
    ]);

    // Inventory metrics
    const inventoryMetrics = await Product.aggregate([
        {
            $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                totalInventoryValue: { $sum: { $multiply: ["$stock", "$retailPrice"] } },
                lowStockItems: {
                    $sum: {
                        $cond: [{ $lt: ["$stock", "$lowStockThreshold"] }, 1, 0]
                    }
                },
                outOfStockItems: {
                    $sum: {
                        $cond: [{ $eq: ["$stock", 0] }, 1, 0]
                    }
                }
            }
        }
    ]);

    // Monthly revenue trend
    const monthlyRevenue = await Sale.aggregate([
        {
            $match: {
                createdAt: { $gte: new Date(new Date().getFullYear() - 1, 0, 1) }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                revenue: { $sum: "$saleCost" },
                sales: { $sum: 1 }
            }
        },
        {
            $sort: { "_id.year": 1, "_id.month": 1 }
        }
    ]);

    // Top selling products
    const topProducts = await Sale.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end }
            }
        },
        {
            $unwind: "$soldProducts"
        },
        {
            $group: {
                _id: "$soldProducts.productId",
                totalQuantity: { $sum: "$soldProducts.quantity" },
                totalRevenue: { $sum: { $multiply: ["$soldProducts.quantity", "$soldProducts.price"] } }
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }
        },
        {
            $unwind: "$product"
        },
        {
            $sort: { totalQuantity: -1 }
        },
        {
            $limit: 10
        },
        {
            $project: {
                productName: "$product.name",
                totalQuantity: 1,
                totalRevenue: 1
            }
        }
    ]);

    const metrics = {
        sales: salesMetrics[0] || { totalSales: 0, totalRevenue: 0, averageOrderValue: 0 },
        inventory: inventoryMetrics[0] || { 
            totalProducts: 0, 
            totalInventoryValue: 0, 
            lowStockItems: 0, 
            outOfStockItems: 0 
        },
        monthlyRevenue,
        topProducts,
        period: { start, end }
    };

    return res.status(200).json(
        new ApiResponse(200, metrics, "Dashboard metrics retrieved successfully")
    );
});

// Get detailed sales report
const getSalesReport = asyncHandler(async (req, res) => {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const pipeline = [
        {
            $match: {
                createdAt: { $gte: start, $lte: end }
            }
        },
        // Note: soldBy field doesn't exist in current Sale model
        // Remove this lookup for now
        {
            $sort: { createdAt: -1 }
        }
    ];

    const aggregate = Sale.aggregate(pipeline);
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const salesReport = await Sale.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, salesReport, "Sales report retrieved successfully")
    );
});

// Get detailed inventory report
const getInventoryReport = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, lowStock = false } = req.query;

    const matchStage = {};
    
    if (category) {
        matchStage.category = category;
    }
    
    if (lowStock === 'true') {
        matchStage.$expr = { $lt: ["$stock", "$lowStockThreshold"] };
    }

    const pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $unwind: {
                path: "$category",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                inventoryValue: { $multiply: ["$stock", "$retailPrice"] },
                stockStatus: {
                    $cond: {
                        if: { $eq: ["$stock", 0] },
                        then: "Out of Stock",
                        else: {
                            $cond: {
                                if: { $lt: ["$stock", "$lowStockThreshold"] },
                                then: "Low Stock",
                                else: "In Stock"
                            }
                        }
                    }
                }
            }
        },
        {
            $sort: { stock: 1 }
        }
    ];

    const aggregate = Product.aggregate(pipeline);
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const inventoryReport = await Product.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, inventoryReport, "Inventory report retrieved successfully")
    );
});

// Get low stock alerts
const getLowStockAlerts = asyncHandler(async (req, res) => {
    const lowStockProducts = await Product.aggregate([
        {
            $match: {
                $expr: { $lt: ["$stock", "$lowStockThreshold"] }
            }
        },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $unwind: {
                path: "$category",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                stockStatus: {
                    $cond: {
                        if: { $eq: ["$stock", 0] },
                        then: "Out of Stock",
                        else: "Low Stock"
                    }
                },
                urgency: {
                    $cond: {
                        if: { $eq: ["$stock", 0] },
                        then: "critical",
                        else: {
                            $cond: {
                                if: { $lte: ["$stock", { $divide: ["$lowStockThreshold", 2] }] },
                                then: "high",
                                else: "medium"
                            }
                        }
                    }
                }
            }
        },
        {
            $sort: { stock: 1 }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, lowStockProducts, "Low stock alerts retrieved successfully")
    );
});

// Export sales data to CSV format (returns data, frontend handles CSV creation)
const exportSalesData = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const salesData = await Sale.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end }
            }
        },
        {
            $unwind: "$soldProducts"
        },
        {
            $lookup: {
                from: "products",
                localField: "soldProducts.productId",
                foreignField: "_id",
                as: "product"
            }
        },
        {
            $unwind: "$product"
        },
        {
            $project: {
                saleId: "$_id",
                date: {
                    $dateToString: {
                        format: "%Y-%m-%d %H:%M:%S",
                        date: "$createdAt"
                    }
                },
                productName: "$product.name",
                quantity: "$soldProducts.quantity",
                unitPrice: "$soldProducts.price",
                totalPrice: { $multiply: ["$soldProducts.quantity", "$soldProducts.price"] },
                customerName: 1,
                customerContact: 1,
                saleCost: 1
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, salesData, "Sales data exported successfully")
    );
});

// Export inventory data to CSV format
const exportInventoryData = asyncHandler(async (req, res) => {
    const { category } = req.query;
    
    const matchStage = {};
    if (category) {
        matchStage.category = category;
    }

    const inventoryData = await Product.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $unwind: {
                path: "$category",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                brand: 1,
                variant: 1,
                compatibility: 1,
                category: "$category.name",
                stock: 1,
                lowStockThreshold: 1,
                retailPrice: 1,
                wholesalePrice: 1,
                buyingPrice: 1,
                inventoryValue: { $multiply: ["$stock", "$retailPrice"] },
                stockStatus: {
                    $cond: {
                        if: { $eq: ["$stock", 0] },
                        then: "Out of Stock",
                        else: {
                            $cond: {
                                if: { $lt: ["$stock", "$lowStockThreshold"] },
                                then: "Low Stock",
                                else: "In Stock"
                            }
                        }
                    }
                },
                createdAt: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt"
                    }
                }
            }
        },
        {
            $sort: { name: 1 }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, inventoryData, "Inventory data exported successfully")
    );
});

export {
    getDashboardMetrics,
    getSalesReport,
    getInventoryReport,
    getLowStockAlerts,
    exportSalesData,
    exportInventoryData
};