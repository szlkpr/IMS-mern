import { Product } from '../models/product.model.js';
import { Sale } from '../models/sale.model.js';
import { Purchase } from '../models/purchase.model.js';
import { Category } from '../models/category.model.js';
import mongoose from 'mongoose';

class AnalyticsService {
  
  /**
   * Calculate profit margins by product and category
   */
  async getProfitMarginAnalysis(dateRange = {}) {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange);
      
      // Aggregate profit margins by product
      const productProfitMargins = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'paid'] }
          }
        },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: {
              productId: '$product._id',
              productName: '$product.name',
              category: '$product.category'
            },
            totalRevenue: { $sum: '$items.totalPrice' },
            totalQuantitySold: { $sum: '$items.quantity' },
            averageSellingPrice: { $avg: '$items.price' },
            totalCostOfGoodsSold: { $sum: { $multiply: ['$items.quantity', '$product.costPrice'] } }
          }
        },
        {
          $addFields: {
            profitMargin: {
              $multiply: [
                { $divide: [
                  { $subtract: ['$totalRevenue', '$totalCostOfGoodsSold'] },
                  '$totalRevenue'
                ]},
                100
              ]
            },
            grossProfit: { $subtract: ['$totalRevenue', '$totalCostOfGoodsSold'] }
          }
        },
        { $sort: { profitMargin: -1 } }
      ]);

      // Aggregate profit margins by category
      const categoryProfitMargins = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'paid'] }
          }
        },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: 'categories',
            localField: 'product.category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: {
              categoryId: '$category._id',
              categoryName: { $ifNull: ['$category.name', 'Uncategorized'] }
            },
            totalRevenue: { $sum: '$items.totalPrice' },
            totalQuantitySold: { $sum: '$items.quantity' },
            totalCostOfGoodsSold: { $sum: { $multiply: ['$items.quantity', '$product.costPrice'] } },
            productCount: { $addToSet: '$product._id' }
          }
        },
        {
          $addFields: {
            profitMargin: {
              $multiply: [
                { $divide: [
                  { $subtract: ['$totalRevenue', '$totalCostOfGoodsSold'] },
                  '$totalRevenue'
                ]},
                100
              ]
            },
            grossProfit: { $subtract: ['$totalRevenue', '$totalCostOfGoodsSold'] },
            productCount: { $size: '$productCount' }
          }
        },
        { $sort: { profitMargin: -1 } }
      ]);

      return {
        products: productProfitMargins,
        categories: categoryProfitMargins,
        summary: {
          totalProducts: productProfitMargins.length,
          totalCategories: categoryProfitMargins.length,
          averageProfitMargin: productProfitMargins.reduce((sum, p) => sum + (p.profitMargin || 0), 0) / productProfitMargins.length || 0
        }
      };
    } catch (error) {
      throw new Error(`Profit margin analysis failed: ${error.message}`);
    }
  }

  /**
   * Calculate inventory turnover ratios
   */
  async getInventoryTurnoverAnalysis(dateRange = {}) {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange);
      
      // Calculate inventory turnover for each product
      const inventoryTurnover = await Product.aggregate([
        {
          $lookup: {
            from: 'sales',
            let: { productId: '$_id' },
            pipeline: [
              {
                $match: {
                  createdAt: { $gte: startDate, $lte: endDate },
                  status: { $in: ['completed', 'paid'] }
                }
              },
              { $unwind: '$items' },
              {
                $match: {
                  $expr: { $eq: ['$items.product', '$$productId'] }
                }
              },
              {
                $group: {
                  _id: null,
                  totalQuantitySold: { $sum: '$items.quantity' },
                  totalCOGS: { $sum: { $multiply: ['$items.quantity', '$items.costPrice'] } }
                }
              }
            ],
            as: 'salesData'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            salesData: { $arrayElemAt: ['$salesData', 0] },
            averageInventoryValue: { $multiply: ['$stock', '$costPrice'] }
          }
        },
        {
          $addFields: {
            quantitySold: { $ifNull: ['$salesData.totalQuantitySold', 0] },
            cogs: { $ifNull: ['$salesData.totalCOGS', 0] },
            inventoryTurnoverRatio: {
              $cond: {
                if: { $gt: ['$averageInventoryValue', 0] },
                then: { $divide: [{ $ifNull: ['$salesData.totalCOGS', 0] }, '$averageInventoryValue'] },
                else: 0
              }
            },
            daysInPeriod: { $divide: [{ $subtract: [endDate, startDate] }, 1000 * 60 * 60 * 24] }
          }
        },
        {
          $addFields: {
            daysInInventory: {
              $cond: {
                if: { $gt: ['$inventoryTurnoverRatio', 0] },
                then: { $divide: ['$daysInPeriod', '$inventoryTurnoverRatio'] },
                else: null
              }
            }
          }
        },
        {
          $project: {
            name: 1,
            category: '$category.name',
            stock: 1,
            costPrice: 1,
            averageInventoryValue: 1,
            quantitySold: 1,
            cogs: 1,
            inventoryTurnoverRatio: 1,
            daysInInventory: 1,
            turnoverCategory: {
              $switch: {
                branches: [
                  { case: { $gte: ['$inventoryTurnoverRatio', 12] }, then: 'Fast Moving' },
                  { case: { $gte: ['$inventoryTurnoverRatio', 6] }, then: 'Medium Moving' },
                  { case: { $gte: ['$inventoryTurnoverRatio', 2] }, then: 'Slow Moving' },
                  { case: { $gt: ['$inventoryTurnoverRatio', 0] }, then: 'Very Slow Moving' }
                ],
                default: 'Dead Stock'
              }
            }
          }
        },
        { $sort: { inventoryTurnoverRatio: -1 } }
      ]);

      // Category-wise turnover summary
      const categoryTurnover = await Product.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'sales',
            let: { productId: '$_id' },
            pipeline: [
              {
                $match: {
                  createdAt: { $gte: startDate, $lte: endDate },
                  status: { $in: ['completed', 'paid'] }
                }
              },
              { $unwind: '$items' },
              {
                $match: {
                  $expr: { $eq: ['$items.product', '$$productId'] }
                }
              },
              {
                $group: {
                  _id: null,
                  totalCOGS: { $sum: { $multiply: ['$items.quantity', '$items.costPrice'] } }
                }
              }
            ],
            as: 'salesData'
          }
        },
        {
          $group: {
            _id: {
              categoryId: '$category._id',
              categoryName: { $ifNull: ['$category.name', 'Uncategorized'] }
            },
            totalInventoryValue: { $sum: { $multiply: ['$stock', '$costPrice'] } },
            totalCOGS: { 
              $sum: { 
                $ifNull: [{ $arrayElemAt: ['$salesData.totalCOGS', 0] }, 0] 
              } 
            },
            productCount: { $sum: 1 }
          }
        },
        {
          $addFields: {
            averageTurnoverRatio: {
              $cond: {
                if: { $gt: ['$totalInventoryValue', 0] },
                then: { $divide: ['$totalCOGS', '$totalInventoryValue'] },
                else: 0
              }
            }
          }
        },
        { $sort: { averageTurnoverRatio: -1 } }
      ]);

      return {
        products: inventoryTurnover,
        categories: categoryTurnover,
        summary: {
          totalProducts: inventoryTurnover.length,
          fastMoving: inventoryTurnover.filter(p => p.turnoverCategory === 'Fast Moving').length,
          slowMoving: inventoryTurnover.filter(p => p.turnoverCategory === 'Slow Moving').length,
          deadStock: inventoryTurnover.filter(p => p.turnoverCategory === 'Dead Stock').length,
          averageTurnoverRatio: inventoryTurnover.reduce((sum, p) => sum + (p.inventoryTurnoverRatio || 0), 0) / inventoryTurnover.length || 0
        }
      };
    } catch (error) {
      throw new Error(`Inventory turnover analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze dead stock - products not selling
   */
  async getDeadStockAnalysis(daysSinceLastSale = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastSale);

      const deadStock = await Product.aggregate([
        {
          $lookup: {
            from: 'sales',
            let: { productId: '$_id' },
            pipeline: [
              { $unwind: '$items' },
              {
                $match: {
                  $expr: { $eq: ['$items.product', '$$productId'] },
                  status: { $in: ['completed', 'paid'] }
                }
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 }
            ],
            as: 'lastSale'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            lastSaleDate: { $arrayElemAt: ['$lastSale.createdAt', 0] },
            inventoryValue: { $multiply: ['$stock', '$costPrice'] },
            daysSinceLastSale: {
              $divide: [
                { $subtract: [new Date(), { $ifNull: [{ $arrayElemAt: ['$lastSale.createdAt', 0] }, '$createdAt'] }] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $match: {
            $or: [
              { lastSaleDate: { $lt: cutoffDate } },
              { lastSaleDate: { $exists: false } }
            ],
            stock: { $gt: 0 }
          }
        },
        {
          $addFields: {
            riskLevel: {
              $switch: {
                branches: [
                  { case: { $gte: ['$daysSinceLastSale', 180] }, then: 'High Risk' },
                  { case: { $gte: ['$daysSinceLastSale', 120] }, then: 'Medium Risk' },
                  { case: { $gte: ['$daysSinceLastSale', daysSinceLastSale] }, then: 'Low Risk' }
                ],
                default: 'New Product'
              }
            }
          }
        },
        {
          $project: {
            name: 1,
            brand: 1,
            category: '$category.name',
            stock: 1,
            costPrice: 1,
            sellingPrice: 1,
            inventoryValue: 1,
            lastSaleDate: 1,
            daysSinceLastSale: 1,
            riskLevel: 1,
            createdAt: 1
          }
        },
        { $sort: { daysSinceLastSale: -1 } }
      ]);

      // Category-wise dead stock summary
      const categoryDeadStock = await Product.aggregate([
        {
          $lookup: {
            from: 'sales',
            let: { productId: '$_id' },
            pipeline: [
              { $unwind: '$items' },
              {
                $match: {
                  $expr: { $eq: ['$items.product', '$$productId'] },
                  status: { $in: ['completed', 'paid'] }
                }
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 }
            ],
            as: 'lastSale'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            lastSaleDate: { $arrayElemAt: ['$lastSale.createdAt', 0] },
            inventoryValue: { $multiply: ['$stock', '$costPrice'] }
          }
        },
        {
          $match: {
            $or: [
              { lastSaleDate: { $lt: cutoffDate } },
              { lastSaleDate: { $exists: false } }
            ],
            stock: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: {
              categoryId: '$category._id',
              categoryName: { $ifNull: ['$category.name', 'Uncategorized'] }
            },
            deadStockCount: { $sum: 1 },
            totalDeadStockValue: { $sum: '$inventoryValue' },
            totalStock: { $sum: '$stock' }
          }
        },
        { $sort: { totalDeadStockValue: -1 } }
      ]);

      return {
        products: deadStock,
        categories: categoryDeadStock,
        summary: {
          totalDeadStockItems: deadStock.length,
          totalDeadStockValue: deadStock.reduce((sum, p) => sum + p.inventoryValue, 0),
          highRiskItems: deadStock.filter(p => p.riskLevel === 'High Risk').length,
          mediumRiskItems: deadStock.filter(p => p.riskLevel === 'Medium Risk').length,
          lowRiskItems: deadStock.filter(p => p.riskLevel === 'Low Risk').length,
          daysSinceLastSaleThreshold: daysSinceLastSale
        }
      };
    } catch (error) {
      throw new Error(`Dead stock analysis failed: ${error.message}`);
    }
  }

  /**
   * Customer segmentation analysis
   */
  async getCustomerSegmentation(dateRange = {}) {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange);

      // Customer segmentation based on RFM analysis (Recency, Frequency, Monetary)
      const customerSegmentation = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'paid'] },
            customerId: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$customerId',
            totalPurchases: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            averageOrderValue: { $avg: '$totalAmount' },
            lastPurchaseDate: { $max: '$createdAt' },
            firstPurchaseDate: { $min: '$createdAt' }
          }
        },
        {
          $addFields: {
            daysSinceLastPurchase: {
              $divide: [
                { $subtract: [new Date(), '$lastPurchaseDate'] },
                1000 * 60 * 60 * 24
              ]
            },
            customerLifespanDays: {
              $divide: [
                { $subtract: ['$lastPurchaseDate', '$firstPurchaseDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $addFields: {
            recencyScore: {
              $switch: {
                branches: [
                  { case: { $lte: ['$daysSinceLastPurchase', 30] }, then: 5 },
                  { case: { $lte: ['$daysSinceLastPurchase', 60] }, then: 4 },
                  { case: { $lte: ['$daysSinceLastPurchase', 90] }, then: 3 },
                  { case: { $lte: ['$daysSinceLastPurchase', 180] }, then: 2 }
                ],
                default: 1
              }
            },
            frequencyScore: {
              $switch: {
                branches: [
                  { case: { $gte: ['$totalPurchases', 20] }, then: 5 },
                  { case: { $gte: ['$totalPurchases', 10] }, then: 4 },
                  { case: { $gte: ['$totalPurchases', 5] }, then: 3 },
                  { case: { $gte: ['$totalPurchases', 2] }, then: 2 }
                ],
                default: 1
              }
            }
          }
        },
        // Calculate monetary score based on percentiles
        { $sort: { totalSpent: 1 } },
        {
          $group: {
            _id: null,
            customers: { $push: '$$ROOT' },
            totalCustomers: { $sum: 1 }
          }
        },
        {
          $unwind: {
            path: '$customers',
            includeArrayIndex: 'index'
          }
        },
        {
          $addFields: {
            'customers.monetaryScore': {
              $switch: {
                branches: [
                  { case: { $gte: [{ $divide: ['$index', '$totalCustomers'] }, 0.8] }, then: 5 },
                  { case: { $gte: [{ $divide: ['$index', '$totalCustomers'] }, 0.6] }, then: 4 },
                  { case: { $gte: [{ $divide: ['$index', '$totalCustomers'] }, 0.4] }, then: 3 },
                  { case: { $gte: [{ $divide: ['$index', '$totalCustomers'] }, 0.2] }, then: 2 }
                ],
                default: 1
              }
            }
          }
        },
        {
          $addFields: {
            'customers.rfmScore': {
              $add: ['$customers.recencyScore', '$customers.frequencyScore', '$customers.monetaryScore']
            }
          }
        },
        {
          $addFields: {
            'customers.segment': {
              $switch: {
                branches: [
                  { 
                    case: { 
                      $and: [
                        { $gte: ['$customers.recencyScore', 4] },
                        { $gte: ['$customers.frequencyScore', 4] },
                        { $gte: ['$customers.monetaryScore', 4] }
                      ]
                    }, 
                    then: 'Champions' 
                  },
                  {
                    case: {
                      $and: [
                        { $gte: ['$customers.recencyScore', 3] },
                        { $gte: ['$customers.frequencyScore', 3] },
                        { $gte: ['$customers.monetaryScore', 4] }
                      ]
                    },
                    then: 'Loyal Customers'
                  },
                  {
                    case: {
                      $and: [
                        { $gte: ['$customers.recencyScore', 4] },
                        { $lte: ['$customers.frequencyScore', 2] },
                        { $gte: ['$customers.monetaryScore', 3] }
                      ]
                    },
                    then: 'Potential Loyalists'
                  },
                  {
                    case: {
                      $and: [
                        { $gte: ['$customers.recencyScore', 4] },
                        { $eq: ['$customers.frequencyScore', 1] }
                      ]
                    },
                    then: 'New Customers'
                  },
                  {
                    case: {
                      $and: [
                        { $gte: ['$customers.recencyScore', 3] },
                        { $lte: ['$customers.frequencyScore', 2] },
                        { $lte: ['$customers.monetaryScore', 2] }
                      ]
                    },
                    then: 'Promising'
                  },
                  {
                    case: {
                      $and: [
                        { $lte: ['$customers.recencyScore', 2] },
                        { $gte: ['$customers.frequencyScore', 3] }
                      ]
                    },
                    then: 'At Risk'
                  },
                  {
                    case: {
                      $and: [
                        { $lte: ['$customers.recencyScore', 2] },
                        { $lte: ['$customers.frequencyScore', 2] },
                        { $gte: ['$customers.monetaryScore', 4] }
                      ]
                    },
                    then: "Can't Lose Them"
                  }
                ],
                default: 'Others'
              }
            }
          }
        },
        { $replaceRoot: { newRoot: '$customers' } },
        { $sort: { rfmScore: -1 } }
      ]);

      // Segment summary
      const segmentSummary = customerSegmentation.reduce((acc, customer) => {
        const segment = customer.segment;
        if (!acc[segment]) {
          acc[segment] = {
            count: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
            avgPurchaseFrequency: 0
          };
        }
        acc[segment].count++;
        acc[segment].totalRevenue += customer.totalSpent;
        acc[segment].avgOrderValue += customer.averageOrderValue;
        acc[segment].avgPurchaseFrequency += customer.totalPurchases;
        return acc;
      }, {});

      // Calculate averages
      Object.keys(segmentSummary).forEach(segment => {
        const seg = segmentSummary[segment];
        seg.avgOrderValue = seg.avgOrderValue / seg.count;
        seg.avgPurchaseFrequency = seg.avgPurchaseFrequency / seg.count;
      });

      return {
        customers: customerSegmentation,
        segmentSummary,
        totalCustomers: customerSegmentation.length
      };
    } catch (error) {
      throw new Error(`Customer segmentation analysis failed: ${error.message}`);
    }
  }

  /**
   * Market basket analysis - frequently bought together products
   */
  async getMarketBasketAnalysis(dateRange = {}) {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange);

      // Find frequently bought together products
      const marketBasketData = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'paid'] },
            'items.1': { $exists: true } // Ensure at least 2 items
          }
        },
        {
          $project: {
            itemPairs: {
              $map: {
                input: { $range: [0, { $subtract: [{ $size: '$items' }, 1] }] },
                as: 'i',
                in: {
                  $map: {
                    input: { $range: [{ $add: ['$$i', 1] }, { $size: '$items' }] },
                    as: 'j',
                    in: {
                      product1: { $arrayElemAt: ['$items.product', '$$i'] },
                      product2: { $arrayElemAt: ['$items.product', '$$j'] }
                    }
                  }
                }
              }
            },
            totalAmount: 1
          }
        },
        { $unwind: '$itemPairs' },
        { $unwind: '$itemPairs' },
        {
          $group: {
            _id: {
              product1: '$itemPairs.product1',
              product2: '$itemPairs.product2'
            },
            frequency: { $sum: 1 },
            totalTransactionValue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { frequency: -1 } },
        { $limit: 50 },
        {
          $lookup: {
            from: 'products',
            localField: '_id.product1',
            foreignField: '_id',
            as: 'product1Details'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id.product2',
            foreignField: '_id',
            as: 'product2Details'
          }
        },
        { $unwind: '$product1Details' },
        { $unwind: '$product2Details' },
        {
          $project: {
            product1: {
              id: '$product1Details._id',
              name: '$product1Details.name',
              category: '$product1Details.category'
            },
            product2: {
              id: '$product2Details._id',
              name: '$product2Details.name',
              category: '$product2Details.category'
            },
            frequency: 1,
            totalTransactionValue: 1,
            averageTransactionValue: { $divide: ['$totalTransactionValue', '$frequency'] }
          }
        }
      ]);

      // Calculate support and confidence metrics
      const totalTransactions = await Sale.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['completed', 'paid'] }
      });

      const enhancedMarketBasket = await Promise.all(
        marketBasketData.map(async (pair) => {
          // Support: frequency of the pair / total transactions
          const support = pair.frequency / totalTransactions;

          // Confidence: frequency of pair / frequency of product1
          const product1Frequency = await Sale.countDocuments({
            'items.product': pair.product1.id,
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'paid'] }
          });

          const confidence = product1Frequency > 0 ? pair.frequency / product1Frequency : 0;

          return {
            ...pair,
            support,
            confidence,
            lift: support / (await this.calculateProductSupport(pair.product2.id, startDate, endDate))
          };
        })
      );

      return {
        productPairs: enhancedMarketBasket,
        totalTransactions,
        summary: {
          totalPairs: enhancedMarketBasket.length,
          averageSupport: enhancedMarketBasket.reduce((sum, p) => sum + p.support, 0) / enhancedMarketBasket.length,
          averageConfidence: enhancedMarketBasket.reduce((sum, p) => sum + p.confidence, 0) / enhancedMarketBasket.length
        }
      };
    } catch (error) {
      throw new Error(`Market basket analysis failed: ${error.message}`);
    }
  }

  /**
   * Helper method to calculate product support for lift calculation
   */
  async calculateProductSupport(productId, startDate, endDate) {
    const productFrequency = await Sale.countDocuments({
      'items.product': productId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] }
    });

    const totalTransactions = await Sale.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] }
    });

    return totalTransactions > 0 ? productFrequency / totalTransactions : 0;
  }

  /**
   * Helper method to get date range
   */
  getDateRange(dateRange) {
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  }

  /**
   * Performance benchmarking against targets
   */
  async getPerformanceBenchmarks(targets = {}, dateRange = {}) {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange);
      
      // Default targets if not provided
      const defaultTargets = {
        monthlyRevenue: 100000,
        monthlySales: 100,
        inventoryTurnover: 6,
        profitMargin: 25,
        customerGrowth: 10
      };

      const benchmarkTargets = { ...defaultTargets, ...targets };

      // Calculate actual performance
      const actualPerformance = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'paid'] }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$saleCost' },
            totalSales: { $sum: 1 },
            averageOrderValue: { $avg: '$saleCost' }
          }
        }
      ]);

      const performance = actualPerformance[0] || { totalRevenue: 0, totalSales: 0, averageOrderValue: 0 };

      // Calculate variances
      const benchmarks = {
        revenue: {
          target: benchmarkTargets.monthlyRevenue,
          actual: performance.totalRevenue,
          variance: ((performance.totalRevenue - benchmarkTargets.monthlyRevenue) / benchmarkTargets.monthlyRevenue) * 100,
          status: performance.totalRevenue >= benchmarkTargets.monthlyRevenue ? 'Above Target' : 'Below Target'
        },
        sales: {
          target: benchmarkTargets.monthlySales,
          actual: performance.totalSales,
          variance: ((performance.totalSales - benchmarkTargets.monthlySales) / benchmarkTargets.monthlySales) * 100,
          status: performance.totalSales >= benchmarkTargets.monthlySales ? 'Above Target' : 'Below Target'
        },
        averageOrderValue: {
          target: benchmarkTargets.monthlyRevenue / benchmarkTargets.monthlySales,
          actual: performance.averageOrderValue,
          variance: ((performance.averageOrderValue - (benchmarkTargets.monthlyRevenue / benchmarkTargets.monthlySales)) / (benchmarkTargets.monthlyRevenue / benchmarkTargets.monthlySales)) * 100,
          status: performance.averageOrderValue >= (benchmarkTargets.monthlyRevenue / benchmarkTargets.monthlySales) ? 'Above Target' : 'Below Target'
        }
      };

      return {
        benchmarks,
        overallStatus: Object.values(benchmarks).filter(b => b.status === 'Above Target').length >= 2 ? 'Meeting Targets' : 'Below Expectations',
        targetAchievementRate: (Object.values(benchmarks).filter(b => b.status === 'Above Target').length / Object.keys(benchmarks).length) * 100
      };
    } catch (error) {
      throw new Error(`Performance benchmarking failed: ${error.message}`);
    }
  }

  /**
   * Executive Summary Dashboard
   */
  async getExecutiveSummary(dateRange = {}) {
    try {
      const { startDate, endDate } = this.getDateRange(dateRange);
      
      // Parallel execution of all analytics
      const [salesMetrics, profitAnalysis, inventoryMetrics, customerMetrics, topPerformers, trends] = await Promise.all([
        this.getSalesMetrics(dateRange),
        this.getProfitMarginAnalysis(dateRange),
        this.getInventoryMetrics(dateRange),
        this.getCustomerMetrics(dateRange),
        this.getTopPerformers(dateRange),
        this.getTrendAnalysis(dateRange)
      ]);

      // Key Performance Indicators
      const kpis = {
        totalRevenue: salesMetrics.totalRevenue,
        totalSales: salesMetrics.totalSales,
        averageOrderValue: salesMetrics.averageOrderValue,
        grossProfitMargin: profitAnalysis.summary.averageProfitMargin,
        inventoryTurnover: inventoryMetrics.averageTurnoverRatio,
        totalCustomers: customerMetrics.totalCustomers,
        repeatCustomerRate: customerMetrics.repeatCustomerRate,
        lowStockItems: inventoryMetrics.lowStockCount
      };

      // Business Health Score (0-100)
      const healthScore = this.calculateBusinessHealthScore({
        profitMargin: kpis.grossProfitMargin,
        inventoryTurnover: kpis.inventoryTurnover,
        salesGrowth: trends.salesGrowthRate,
        customerRetention: kpis.repeatCustomerRate
      });

      return {
        kpis,
        healthScore,
        salesMetrics,
        profitAnalysis: {
          totalGrossProfit: profitAnalysis.categories.reduce((sum, cat) => sum + cat.grossProfit, 0),
          averageMargin: profitAnalysis.summary.averageProfitMargin,
          topProfitableCategory: profitAnalysis.categories[0]
        },
        inventoryMetrics: {
          totalValue: inventoryMetrics.totalInventoryValue,
          turnoverRatio: inventoryMetrics.averageTurnoverRatio,
          deadStockValue: inventoryMetrics.deadStockValue,
          lowStockItems: inventoryMetrics.lowStockCount
        },
        customerInsights: {
          totalCustomers: customerMetrics.totalCustomers,
          newCustomers: customerMetrics.newCustomers,
          repeatRate: customerMetrics.repeatCustomerRate,
          averageLifetimeValue: customerMetrics.averageLifetimeValue
        },
        topPerformers,
        trends,
        alerts: await this.generateExecutiveAlerts(kpis, trends),
        recommendations: this.generateRecommendations(kpis, trends),
        dateRange: { startDate, endDate },
        generatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Executive summary generation failed: ${error.message}`);
    }
  }

  /**
   * Sales Metrics for Executive Summary
   */
  async getSalesMetrics(dateRange = {}) {
    const { startDate, endDate } = this.getDateRange(dateRange);
    
    const metrics = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'paid'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$totalAmount', '$saleCost'] } },
          totalSales: { $sum: 1 },
          averageOrderValue: { $avg: { $ifNull: ['$totalAmount', '$saleCost'] } },
          totalItemsSold: { $sum: { $sum: '$soldProducts.quantity' } }
        }
      }
    ]);

    return metrics[0] || {
      totalRevenue: 0,
      totalSales: 0,
      averageOrderValue: 0,
      totalItemsSold: 0
    };
  }

  /**
   * Customer Metrics for Executive Summary
   */
  async getCustomerMetrics(dateRange = {}) {
    const { startDate, endDate } = this.getDateRange(dateRange);
    
    const customerData = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'paid'] },
          customerName: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$customerName',
          totalPurchases: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$totalAmount', '$saleCost'] } },
          firstPurchase: { $min: '$createdAt' },
          lastPurchase: { $max: '$createdAt' }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          repeatCustomers: {
            $sum: {
              $cond: [{ $gt: ['$totalPurchases', 1] }, 1, 0]
            }
          },
          averageLifetimeValue: { $avg: '$totalSpent' },
          newCustomers: {
            $sum: {
              $cond: [{ $gte: ['$firstPurchase', startDate] }, 1, 0]
            }
          }
        }
      }
    ]);

    const data = customerData[0] || {
      totalCustomers: 0,
      repeatCustomers: 0,
      averageLifetimeValue: 0,
      newCustomers: 0
    };

    return {
      ...data,
      repeatCustomerRate: data.totalCustomers > 0 ? (data.repeatCustomers / data.totalCustomers) * 100 : 0
    };
  }

  /**
   * Inventory Metrics for Executive Summary
   */
  async getInventoryMetrics(dateRange = {}) {
    const totalInventoryValue = await Product.aggregate([
      {
        $match: { isArchived: false }
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$stock', '$buyingPrice'] } },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$stock', '$lowStockThreshold'] }, 1, 0]
            }
          },
          totalProducts: { $sum: 1 }
        }
      }
    ]);

    const inventoryData = totalInventoryValue[0] || {
      totalValue: 0,
      lowStockCount: 0,
      totalProducts: 0
    };

    // Get turnover analysis summary
    const turnoverAnalysis = await this.getInventoryTurnoverAnalysis(dateRange);
    
    return {
      totalInventoryValue: inventoryData.totalValue,
      lowStockCount: inventoryData.lowStockCount,
      totalProducts: inventoryData.totalProducts,
      averageTurnoverRatio: turnoverAnalysis.summary.averageTurnoverRatio,
      deadStockValue: turnoverAnalysis.summary.deadStock * 1000 // Estimated
    };
  }

  /**
   * Top Performers Analysis
   */
  async getTopPerformers(dateRange = {}) {
    const { startDate, endDate } = this.getDateRange(dateRange);
    
    // Top selling products
    const topProducts = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'paid'] }
        }
      },
      { $unwind: '$soldProducts' },
      {
        $group: {
          _id: '$soldProducts.productId',
          totalQuantity: { $sum: '$soldProducts.quantity' },
          totalRevenue: { $sum: { $multiply: ['$soldProducts.quantity', { $ifNull: ['$soldProducts.unitPrice', '$soldProducts.price'] }] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          category: '$product.category',
          totalQuantity: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Top categories by revenue
    const topCategories = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'paid'] }
        }
      },
      { $unwind: '$soldProducts' },
      {
        $lookup: {
          from: 'products',
          localField: 'soldProducts.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          name: { $first: '$category.name' },
          totalRevenue: { $sum: { $multiply: ['$soldProducts.quantity', { $ifNull: ['$soldProducts.unitPrice', '$soldProducts.price'] }] } },
          totalQuantity: { $sum: '$soldProducts.quantity' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    return {
      products: topProducts,
      categories: topCategories
    };
  }

  /**
   * Trend Analysis
   */
  async getTrendAnalysis(dateRange = {}) {
    const { startDate, endDate } = this.getDateRange(dateRange);
    
    // Calculate previous period for comparison
    const periodLength = endDate - startDate;
    const prevStartDate = new Date(startDate - periodLength);
    const prevEndDate = new Date(startDate);

    const [currentPeriod, previousPeriod] = await Promise.all([
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'paid'] }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $ifNull: ['$totalAmount', '$saleCost'] } },
            totalSales: { $sum: 1 }
          }
        }
      ]),
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: prevStartDate, $lte: prevEndDate },
            status: { $in: ['completed', 'paid'] }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $ifNull: ['$totalAmount', '$saleCost'] } },
            totalSales: { $sum: 1 }
          }
        }
      ])
    ]);

    const current = currentPeriod[0] || { totalRevenue: 0, totalSales: 0 };
    const previous = previousPeriod[0] || { totalRevenue: 0, totalSales: 0 };

    const revenueGrowthRate = previous.totalRevenue > 0 
      ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100 
      : 0;
      
    const salesGrowthRate = previous.totalSales > 0 
      ? ((current.totalSales - previous.totalSales) / previous.totalSales) * 100 
      : 0;

    return {
      revenueGrowthRate,
      salesGrowthRate,
      currentPeriod: current,
      previousPeriod: previous,
      trend: revenueGrowthRate > 0 ? 'upward' : revenueGrowthRate < 0 ? 'downward' : 'stable'
    };
  }

  /**
   * Calculate Business Health Score (0-100)
   */
  calculateBusinessHealthScore(metrics) {
    let score = 0;
    
    // Profit Margin (30 points)
    if (metrics.profitMargin >= 25) score += 30;
    else if (metrics.profitMargin >= 15) score += 20;
    else if (metrics.profitMargin >= 5) score += 10;
    
    // Inventory Turnover (25 points)
    if (metrics.inventoryTurnover >= 8) score += 25;
    else if (metrics.inventoryTurnover >= 4) score += 15;
    else if (metrics.inventoryTurnover >= 2) score += 8;
    
    // Sales Growth (25 points)
    if (metrics.salesGrowth >= 10) score += 25;
    else if (metrics.salesGrowth >= 5) score += 15;
    else if (metrics.salesGrowth >= 0) score += 10;
    
    // Customer Retention (20 points)
    if (metrics.customerRetention >= 70) score += 20;
    else if (metrics.customerRetention >= 50) score += 15;
    else if (metrics.customerRetention >= 30) score += 8;
    
    return Math.min(score, 100);
  }

  /**
   * Generate Executive Alerts
   */
  async generateExecutiveAlerts(kpis, trends) {
    const alerts = [];
    
    // Revenue decline alert
    if (trends.revenueGrowthRate < -10) {
      alerts.push({
        type: 'critical',
        category: 'revenue',
        message: `Revenue declined by ${Math.abs(trends.revenueGrowthRate).toFixed(1)}% compared to previous period`,
        recommendation: 'Review pricing strategy and marketing campaigns'
      });
    }
    
    // Low profit margin alert
    if (kpis.grossProfitMargin < 15) {
      alerts.push({
        type: 'warning',
        category: 'profitability',
        message: `Gross profit margin is low at ${kpis.grossProfitMargin.toFixed(1)}%`,
        recommendation: 'Review cost structure and supplier negotiations'
      });
    }
    
    // Inventory issues alert
    if (kpis.lowStockItems > 10) {
      alerts.push({
        type: 'warning',
        category: 'inventory',
        message: `${kpis.lowStockItems} products are running low on stock`,
        recommendation: 'Review reorder points and supplier lead times'
      });
    }
    
    return alerts;
  }

  /**
   * Generate Business Recommendations
   */
  generateRecommendations(kpis, trends) {
    const recommendations = [];
    
    // Revenue growth recommendations
    if (trends.revenueGrowthRate < 5) {
      recommendations.push({
        category: 'Growth',
        priority: 'High',
        action: 'Implement customer retention programs',
        impact: 'Increase repeat purchase rate by 15-25%'
      });
    }
    
    // Inventory optimization
    if (kpis.inventoryTurnover < 4) {
      recommendations.push({
        category: 'Operations',
        priority: 'Medium',
        action: 'Optimize inventory levels and reduce slow-moving stock',
        impact: 'Improve cash flow and reduce carrying costs'
      });
    }
    
    // Profitability improvement
    if (kpis.grossProfitMargin < 20) {
      recommendations.push({
        category: 'Profitability',
        priority: 'High',
        action: 'Review pricing strategy for low-margin products',
        impact: 'Increase overall profitability by 5-10%'
      });
    }
    
    return recommendations;
  }

  /**
   * Real-time Performance Tracking
   */
  async getRealTimeMetrics() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    
    const [todaysMetrics, hourlyTrend] = await Promise.all([
      this.getSalesMetrics({ startDate: startOfDay }),
      this.getHourlyTrend()
    ]);
    
    return {
      today: todaysMetrics,
      hourlyTrend,
      timestamp: new Date()
    };
  }

  /**
   * Hourly sales trend for today
   */
  async getHourlyTrend() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    
    return await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay },
          status: { $in: ['completed', 'paid'] }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          salesCount: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$totalAmount', '$saleCost'] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }
}

export default new AnalyticsService();