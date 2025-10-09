import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import mlService from '../services/ml.service.js';
import { Product } from '../models/product.model.js';

const router = Router();

/**
 * @route   GET /api/v1/ml/health
 * @desc    Check ML service health
 * @access  Private
 */
// Public health endpoint (no auth) for connectivity checks
router.get('/health', asyncHandler(async (req, res) => {
    await mlService.checkConnection();
    
    res.json({
        success: true,
        ml_service_connected: mlService.isConnected,
        service_url: mlService.mlServiceUrl,
        timestamp: new Date().toISOString()
    });
}));

// Apply auth middleware to remaining ML routes
router.use(verifyJWT);

/**
 * @route   POST /api/v1/ml/predict/demand/:productId
 * @desc    Generate demand predictions for a specific product
 * @access  Private
 */
router.post('/predict/demand/:productId', asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { 
        forecastHorizon = 30, 
        includeScenarios = true 
    } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    try {
        const prediction = await mlService.predictDemand(productId, {
            forecastHorizon,
            includeScenarios
        });

        res.json({
            success: true,
            data: prediction,
            message: prediction.success ? 
                'Prediction generated successfully' : 
                'Prediction completed with fallback method'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate prediction',
            error: error.message
        });
    }
}));

/**
 * @route   POST /api/v1/ml/predict/batch
 * @desc    Generate predictions for multiple products
 * @access  Private
 */
router.post('/predict/batch', asyncHandler(async (req, res) => {
    const { 
        productIds, 
        forecastHorizon = 30, 
        includeScenarios = false 
    } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'productIds array is required'
        });
    }

    if (productIds.length > 20) {
        return res.status(400).json({
            success: false,
            message: 'Maximum 20 products allowed for batch prediction'
        });
    }

    try {
        const batchResults = await mlService.batchPredict(productIds, {
            forecastHorizon,
            includeScenarios
        });

        res.json({
            success: true,
            data: batchResults,
            message: `Batch prediction completed for ${batchResults.processed} products`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Batch prediction failed',
            error: error.message
        });
    }
}));

/**
 * @route   POST /api/v1/ml/analyze/market-stability
 * @desc    Analyze market stability for products
 * @access  Private
 */
router.post('/analyze/market-stability', asyncHandler(async (req, res) => {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'productIds array is required'
        });
    }

    try {
        const analysis = await mlService.analyzeMarketStability(productIds);

        res.json({
            success: true,
            data: analysis,
            message: 'Market stability analysis completed'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Market stability analysis failed',
            error: error.message
        });
    }
}));

/**
 * @route   POST /api/v1/ml/optimize/inventory
 * @desc    Optimize inventory levels using ML predictions
 * @access  Private
 */
router.post('/optimize/inventory', asyncHandler(async (req, res) => {
    const { 
        productIds, 
        optimizationGoal = 'minimize_cost' 
    } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'productIds array is required'
        });
    }

    try {
        // Get products data
        const products = await Product.find({ _id: { $in: productIds } });
        
        // Prepare data for ML service
        const productData = {};
        for (const product of products) {
            productData[product.name] = {
                current_stock: product.stock,
                avg_demand: 10, // This would come from historical analysis
                max_stock: 1000, // This would come from product settings
                reorder_point: product.lowStockThreshold || 5
            };
        }

        const optimization = await mlService.optimizeInventoryLevels(productData, optimizationGoal);

        res.json({
            success: true,
            data: optimization,
            message: 'Inventory optimization completed'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Inventory optimization failed',
            error: error.message
        });
    }
}));

/**
 * @route   GET /api/v1/ml/insights/knowledge-graph/:productId
 * @desc    Get knowledge graph insights for a product
 * @access  Private
 */
router.get('/insights/knowledge-graph/:productId', asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    try {
        const insights = await mlService.getKnowledgeGraphInsights(product.name);

        res.json({
            success: true,
            data: insights,
            product: {
                id: productId,
                name: product.name
            },
            message: 'Knowledge graph insights retrieved'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get knowledge graph insights',
            error: error.message
        });
    }
}));

/**
 * @route   POST /api/v1/ml/explain/prediction
 * @desc    Get explanation for a specific prediction
 * @access  Private
 */
router.post('/explain/prediction', asyncHandler(async (req, res) => {
    const { 
        productName, 
        predictionValue, 
        context = {} 
    } = req.body;

    if (!productName || predictionValue === undefined) {
        return res.status(400).json({
            success: false,
            message: 'productName and predictionValue are required'
        });
    }

    try {
        const explanation = await mlService.explainPrediction(productName, predictionValue, context);

        res.json({
            success: true,
            data: explanation,
            message: 'Prediction explanation generated'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to explain prediction',
            error: error.message
        });
    }
}));

/**
 * @route   GET /api/v1/ml/dashboard/summary
 * @desc    Get ML dashboard summary for all products
 * @access  Private
 */
router.get('/dashboard/summary', asyncHandler(async (req, res) => {
    try {
        const products = await Product.find({ isArchived: false }).limit(10);
        const productIds = products.map(p => p._id);

        // Get batch predictions for top products
        const predictions = await mlService.batchPredict(productIds, {
            forecastHorizon: 7,
            includeScenarios: false
        });

        // Analyze market stability
        const marketAnalysis = await mlService.analyzeMarketStability(productIds);

        // Calculate summary statistics
        const summary = {
            total_products_analyzed: products.length,
            ml_service_status: mlService.isConnected ? 'active' : 'inactive',
            predictions_generated: Object.keys(predictions.predictions).length,
            successful_predictions: Object.values(predictions.predictions)
                .filter(p => p.success).length,
            high_risk_products: 0,
            trending_products: [],
            recommendations: []
        };

        // Analyze predictions for insights
        for (const [productId, prediction] of Object.entries(predictions.predictions)) {
            if (prediction.success && prediction.predictions) {
                const trend = prediction.predictions[prediction.predictions.length - 1] > 
                             prediction.predictions[0] ? 'increasing' : 'decreasing';
                const product = products.find(p => p._id.toString() === productId);
                
                if (product) {
                    summary.trending_products.push({
                        id: productId,
                        name: product.name,
                        trend,
                        confidence: prediction.certainty_score
                    });
                }

                if (prediction.certainty_score < 0.5) {
                    summary.high_risk_products++;
                }
            }
        }

        // Generate recommendations
        if (summary.high_risk_products > 0) {
            summary.recommendations.push(`${summary.high_risk_products} products have low prediction confidence - consider reviewing data quality`);
        }

        if (summary.trending_products.length > 0) {
            const increasing = summary.trending_products.filter(p => p.trend === 'increasing').length;
            summary.recommendations.push(`${increasing} products showing increasing demand trend`);
        }

        res.json({
            success: true,
            data: {
                summary,
                recent_predictions: predictions,
                market_analysis: marketAnalysis,
                last_updated: new Date().toISOString()
            },
            message: 'ML dashboard summary generated'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate ML dashboard summary',
            error: error.message
        });
    }
}));

export default router;