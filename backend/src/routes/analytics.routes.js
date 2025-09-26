import express from 'express';
import AnalyticsService from '../services/analytics.service.js';
import WebSocketService from '../services/websocket.service.js';

const router = express.Router();

/**
 * Executive Summary Dashboard
 * GET /api/analytics/executive-summary
 */
router.get('/executive-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = {};
    
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    
    const summary = await AnalyticsService.getExecutiveSummary(dateRange);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Profit Margin Analysis
 * GET /api/analytics/profit-margins
 */
router.get('/profit-margins', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = {};
    
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    
    const analysis = await AnalyticsService.getProfitMarginAnalysis(dateRange);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Inventory Turnover Analysis
 * GET /api/analytics/inventory-turnover
 */
router.get('/inventory-turnover', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = {};
    
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    
    const analysis = await AnalyticsService.getInventoryTurnoverAnalysis(dateRange);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Dead Stock Analysis
 * GET /api/analytics/dead-stock
 */
router.get('/dead-stock', async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const analysis = await AnalyticsService.getDeadStockAnalysis(parseInt(days));
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Customer Segmentation Analysis
 * GET /api/analytics/customer-segmentation
 */
router.get('/customer-segmentation', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = {};
    
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    
    const analysis = await AnalyticsService.getCustomerSegmentation(dateRange);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Market Basket Analysis
 * GET /api/analytics/market-basket
 */
router.get('/market-basket', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = {};
    
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    
    const analysis = await AnalyticsService.getMarketBasketAnalysis(dateRange);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Performance Benchmarks
 * GET /api/analytics/performance-benchmarks
 */
router.get('/performance-benchmarks', async (req, res) => {
  try {
    const { startDate, endDate, ...targets } = req.query;
    const dateRange = {};
    
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    
    // Convert string targets to numbers
    const benchmarkTargets = {};
    Object.keys(targets).forEach(key => {
      if (targets[key] && !isNaN(targets[key])) {
        benchmarkTargets[key] = parseFloat(targets[key]);
      }
    });
    
    const benchmarks = await AnalyticsService.getPerformanceBenchmarks(benchmarkTargets, dateRange);
    
    res.json({
      success: true,
      data: benchmarks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Real-time Metrics
 * GET /api/analytics/real-time
 */
router.get('/real-time', async (req, res) => {
  try {
    const metrics = await AnalyticsService.getRealTimeMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Sales Metrics
 * GET /api/analytics/sales-metrics
 */
router.get('/sales-metrics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = {};
    
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    
    const metrics = await AnalyticsService.getSalesMetrics(dateRange);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Top Performers
 * GET /api/analytics/top-performers
 */
router.get('/top-performers', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = {};
    
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    
    const performers = await AnalyticsService.getTopPerformers(dateRange);
    
    res.json({
      success: true,
      data: performers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Trend Analysis
 * GET /api/analytics/trends
 */
router.get('/trends', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = {};
    
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    
    const trends = await AnalyticsService.getTrendAnalysis(dateRange);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * WebSocket Status
 * GET /api/analytics/websocket-status
 */
router.get('/websocket-status', (req, res) => {
  try {
    const status = {
      connected: WebSocketService.getConnectedUsersCount(),
      dashboardSubscribers: WebSocketService.getDashboardSubscribersCount(),
      timestamp: new Date()
    };
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Trigger Manual Updates
 * POST /api/analytics/trigger-update
 */
router.post('/trigger-update', (req, res) => {
  try {
    const { type } = req.body;
    
    switch (type) {
      case 'dashboard':
        WebSocketService.triggerDashboardUpdate();
        break;
      case 'inventory':
        WebSocketService.triggerInventoryCheck();
        break;
      default:
        WebSocketService.triggerDashboardUpdate();
        WebSocketService.triggerInventoryCheck();
    }
    
    res.json({
      success: true,
      message: `${type || 'all'} updates triggered successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Business Health Score
 * GET /api/analytics/health-score
 */
router.get('/health-score', async (req, res) => {
  try {
    const summary = await AnalyticsService.getExecutiveSummary();
    
    res.json({
      success: true,
      data: {
        score: summary.healthScore,
        kpis: summary.kpis,
        alerts: summary.alerts,
        recommendations: summary.recommendations,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Advanced Inventory Analytics
 * GET /api/analytics/inventory-advanced
 */
router.get('/inventory-advanced', async (req, res) => {
  try {
    const { startDate, endDate, category, riskLevel } = req.query;
    const dateRange = {};
    
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    
    const [turnoverAnalysis, deadStockAnalysis] = await Promise.all([
      AnalyticsService.getInventoryTurnoverAnalysis(dateRange),
      AnalyticsService.getDeadStockAnalysis(90)
    ]);
    
    // Filter results if category or riskLevel specified
    let filteredResults = {
      turnover: turnoverAnalysis,
      deadStock: deadStockAnalysis
    };
    
    if (category || riskLevel) {
      if (category) {
        filteredResults.turnover.products = filteredResults.turnover.products
          .filter(p => p.category && p.category.toLowerCase().includes(category.toLowerCase()));
        filteredResults.deadStock.products = filteredResults.deadStock.products
          .filter(p => p.category && p.category.toLowerCase().includes(category.toLowerCase()));
      }
      
      if (riskLevel) {
        filteredResults.deadStock.products = filteredResults.deadStock.products
          .filter(p => p.riskLevel === riskLevel);
      }
    }
    
    res.json({
      success: true,
      data: filteredResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Customer Lifetime Value Analysis
 * GET /api/analytics/customer-lifetime-value
 */
router.get('/customer-lifetime-value', async (req, res) => {
  try {
    const { startDate, endDate, segment } = req.query;
    const dateRange = {};
    
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    
    const segmentation = await AnalyticsService.getCustomerSegmentation(dateRange);
    
    let results = segmentation;
    
    // Filter by segment if specified
    if (segment) {
      results.customers = results.customers.filter(customer => 
        customer.segment.toLowerCase() === segment.toLowerCase()
      );
    }
    
    // Calculate additional CLV metrics
    const clvMetrics = {
      averageLifetimeValue: results.customers.reduce((sum, c) => sum + c.totalSpent, 0) / results.customers.length || 0,
      highValueCustomers: results.customers.filter(c => c.totalSpent > 10000).length,
      loyaltyDistribution: results.segmentSummary
    };
    
    res.json({
      success: true,
      data: {
        ...results,
        clvMetrics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;