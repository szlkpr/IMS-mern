import axios from 'axios';
import { Product } from '../models/product.model.js';
import { Sale } from '../models/sale.model.js';
import { Purchase } from '../models/purchase.model.js';

class MLService {
    constructor() {
        this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        this.isConnected = false;
        this.checkConnection();
    }

    async checkConnection() {
        try {
            const response = await axios.get(`${this.mlServiceUrl}/health`, {
                timeout: 5000
            });
            this.isConnected = response.data.status === 'healthy';
            console.log(`ML Service connection: ${this.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
        } catch {
            this.isConnected = false;
            console.log('❌ ML Service not available - predictions will use fallback methods');
        }
    }

    async prepareHistoricalData(productId, days = 90) {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            // Get sales data
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

            const sales = await Sale.find({
                'products.product': productId,
                createdAt: { $gte: startDate, $lte: endDate }
            }).sort({ createdAt: 1 });

            const purchases = await Purchase.find({
                'products.product': productId,
                createdAt: { $gte: startDate, $lte: endDate }
            }).sort({ createdAt: 1 });

            // Aggregate daily data
            const dailyData = new Map();
            
            // Initialize all days with base data
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                dailyData.set(dateKey, {
                    date: dateKey,
                    value: product.retailPrice,
                    quantity: 0,
                    sales: 0,
                    purchases: 0
                });
            }

            // Add sales data
            sales.forEach(sale => {
                const dateKey = sale.createdAt.toISOString().split('T')[0];
                const productSale = sale.products.find(p => p.product.toString() === productId.toString());
                
                if (productSale && dailyData.has(dateKey)) {
                    const dayData = dailyData.get(dateKey);
                    dayData.sales += productSale.quantity;
                    dayData.quantity += productSale.quantity;
                    dayData.value = productSale.sellingPrice || product.retailPrice;
                }
            });

            // Add purchase data
            purchases.forEach(purchase => {
                const dateKey = purchase.createdAt.toISOString().split('T')[0];
                const productPurchase = purchase.products.find(p => p.product.toString() === productId.toString());
                
                if (productPurchase && dailyData.has(dateKey)) {
                    const dayData = dailyData.get(dateKey);
                    dayData.purchases += productPurchase.quantity;
                }
            });

            return Array.from(dailyData.values()).map(data => ({
                date: data.date,
                value: data.value,
                quantity: data.quantity,
                price: data.value
            }));

        } catch (error) {
            console.error('Error preparing historical data:', error);
            throw error;
        }
    }

    async predictDemand(productId, options = {}) {
        const {
            forecastHorizon = 30,
            includeScenarios = true
        } = options;

        try {
            if (!this.isConnected) {
                return this.fallbackPrediction(productId, forecastHorizon);
            }

            const product = await Product.findById(productId).populate('category');
            if (!product) {
                throw new Error('Product not found');
            }

            // Prepare historical data
            const historicalData = await this.prepareHistoricalData(productId);
            
            if (historicalData.length < 7) {
                console.log('Insufficient historical data, using fallback prediction');
                return this.fallbackPrediction(productId, forecastHorizon);
            }

            // Make ML prediction request
            const response = await axios.post(`${this.mlServiceUrl}/predict/demand`, {
                product_name: product.name,
                historical_data: historicalData,
                forecast_horizon: forecastHorizon,
                include_scenarios: includeScenarios
            }, {
                timeout: 30000 // 30 second timeout for ML predictions
            });

            return {
                success: true,
                product: {
                    id: productId,
                    name: product.name,
                    category: product.category?.name || 'Unknown'
                },
                predictions: response.data.predictions,
                confidence_intervals: response.data.confidence_intervals,
                certainty_score: response.data.certainty_score,
                explanations: response.data.explanations,
                recommendations: response.data.recommendations,
                narrative: response.data.narrative,
                forecast_horizon: forecastHorizon,
                generated_at: new Date().toISOString(),
                method: 'ml_advanced'
            };

        } catch (error) {
            console.error('ML prediction error:', error.message);
            return this.fallbackPrediction(productId, forecastHorizon);
        }
    }

    async fallbackPrediction(productId, forecastHorizon) {
        try {
            const product = await Product.findById(productId);
            const historicalData = await this.prepareHistoricalData(productId, 30);
            
            if (historicalData.length === 0) {
                return {
                    success: false,
                    error: 'No historical data available',
                    method: 'fallback'
                };
            }

            // Simple trend-based prediction
            const values = historicalData.map(d => d.quantity);
            const n = values.length;
            
            // Calculate linear trend
            const xMean = (n - 1) / 2;
            const yMean = values.reduce((a, b) => a + b, 0) / n;
            
            let numerator = 0;
            let denominator = 0;
            
            for (let i = 0; i < n; i++) {
                numerator += (i - xMean) * (values[i] - yMean);
                denominator += (i - xMean) ** 2;
            }
            
            const slope = denominator === 0 ? 0 : numerator / denominator;
            const intercept = yMean - slope * xMean;
            
            // Generate predictions
            const predictions = [];
            
            for (let i = 1; i <= forecastHorizon; i++) {
                const predicted = Math.max(0, intercept + slope * (n + i - 1));
                predictions.push(predicted);
            }

            return {
                success: true,
                product: {
                    id: productId,
                    name: product.name
                },
                predictions,
                confidence_intervals: {
                    lower: predictions.map(p => p * 0.8),
                    upper: predictions.map(p => p * 1.2)
                },
                certainty_score: 0.6,
                explanations: {
                    method: 'linear_trend',
                    trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
                    note: 'Fallback prediction using simple trend analysis'
                },
                recommendations: [
                    slope > 0 ? 'Demand trending upward - consider increasing stock' : 
                    slope < 0 ? 'Demand trending downward - consider reducing orders' : 
                    'Demand is stable - maintain current stock levels'
                ],
                narrative: `Based on ${n} days of historical data, ${product.name} shows a ${slope > 0 ? 'growing' : slope < 0 ? 'declining' : 'stable'} demand pattern.`,
                forecast_horizon: forecastHorizon,
                generated_at: new Date().toISOString(),
                method: 'fallback_trend'
            };

        } catch (error) {
            console.error('Fallback prediction error:', error);
            return {
                success: false,
                error: error.message,
                method: 'fallback'
            };
        }
    }

    async analyzeMarketStability(productIds) {
        try {
            if (!this.isConnected) {
                return { success: false, message: 'ML service not available' };
            }

            const products = await Product.find({ _id: { $in: productIds } });
            const productNames = products.map(p => p.name);

            const response = await axios.post(`${this.mlServiceUrl}/analyze/market-stability`, {
                products: productNames,
                analysis_type: 'stability'
            });

            return response.data;

        } catch (error) {
            console.error('Market stability analysis error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async optimizeInventoryLevels(productData, goal = 'minimize_cost') {
        try {
            if (!this.isConnected) {
                return this.fallbackOptimization(productData, goal);
            }

            const response = await axios.post(`${this.mlServiceUrl}/optimize/inventory`, 
                productData, 
                { params: { optimization_goal: goal } }
            );

            return response.data;

        } catch (error) {
            console.error('Inventory optimization error:', error);
            return this.fallbackOptimization(productData, goal);
        }
    }

    fallbackOptimization(productData, goal) {
        const results = {};
        
        for (const [productName, data] of Object.entries(productData)) {
            const currentStock = data.current_stock || 0;
            const avgDemand = data.avg_demand || 5;
            const maxStock = data.max_stock || 100;
            
            let recommendedStock;
            if (goal === 'minimize_cost') {
                recommendedStock = Math.min(avgDemand * 5, maxStock); // 5 days supply
            } else if (goal === 'maximize_availability') {
                recommendedStock = Math.min(avgDemand * 10, maxStock); // 10 days supply
            } else {
                recommendedStock = Math.min(avgDemand * 7, maxStock); // 7 days supply
            }
            
            results[productName] = {
                current_stock: currentStock,
                predicted_demand: avgDemand,
                recommended_stock: recommendedStock,
                reorder_needed: currentStock < recommendedStock,
                reorder_quantity: Math.max(0, recommendedStock - currentStock),
                risk_level: currentStock < avgDemand * 2 ? 'high' : 'low'
            };
        }
        
        return {
            success: true,
            optimization_goal: goal,
            products_optimized: Object.keys(productData).length,
            results,
            method: 'fallback',
            summary: {
                total_products: Object.keys(results).length,
                reorder_needed: Object.values(results).filter(r => r.reorder_needed).length,
                high_risk_products: Object.values(results).filter(r => r.risk_level === 'high').length
            }
        };
    }

    async getKnowledgeGraphInsights(productName) {
        try {
            if (!this.isConnected) {
                return { success: false, message: 'ML service not available' };
            }

            const response = await axios.get(`${this.mlServiceUrl}/insights/knowledge-graph/${encodeURIComponent(productName)}`);
            return response.data;

        } catch (error) {
            console.error('Knowledge graph insights error:', error);
            return { success: false, error: error.message };
        }
    }

    async explainPrediction(productName, predictionValue, context = {}) {
        try {
            if (!this.isConnected) {
                return {
                    success: false,
                    message: 'ML service not available - explanation not possible'
                };
            }

            const response = await axios.post(`${this.mlServiceUrl}/explain/prediction`, null, {
                params: {
                    product_name: productName,
                    prediction_value: predictionValue
                },
                data: context
            });

            return response.data;

        } catch (error) {
            console.error('Prediction explanation error:', error);
            return { success: false, error: error.message };
        }
    }

    // Batch prediction for multiple products
    async batchPredict(productIds, options = {}) {
        const results = {};
        
        for (const productId of productIds) {
            try {
                results[productId] = await this.predictDemand(productId, options);
            } catch (error) {
                results[productId] = {
                    success: false,
                    error: error.message,
                    product: { id: productId }
                };
            }
        }
        
        return {
            success: true,
            predictions: results,
            processed: Object.keys(results).length,
            generated_at: new Date().toISOString()
        };
    }
}

export default new MLService();