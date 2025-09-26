import apiClient from '../api';

/**
 * Inventory Data Service
 * 
 * This service provides a centralized way to fetch and manage inventory data
 * to ensure consistency across Dashboard, Analytics, and Reports pages.
 */
class InventoryDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cached data if available and not expired
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set data in cache with timestamp
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get comprehensive dashboard metrics
   * This is the single source of truth for inventory status
   */
  async getDashboardMetrics(dateRange = null) {
    const cacheKey = `dashboard-metrics-${JSON.stringify(dateRange)}`;
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = dateRange ? dateRange : {};
      const response = await apiClient.get('/reports/dashboard-metrics', { params });
      const data = response.data.data;

      // Ensure consistent data structure
      const normalizedData = {
        sales: {
          totalSales: data.sales?.totalSales || 0,
          totalRevenue: data.sales?.totalRevenue || 0,
          averageOrderValue: data.sales?.averageOrderValue || 0
        },
        inventory: {
          totalProducts: data.inventory?.totalProducts || 0,
          totalInventoryValue: data.inventory?.totalInventoryValue || 0,
          lowStockItems: data.inventory?.lowStockItems || 0,
          outOfStockItems: data.inventory?.outOfStockItems || 0
        },
        monthlyRevenue: data.monthlyRevenue || [],
        topProducts: data.topProducts || [],
        period: data.period || { start: new Date(), end: new Date() }
      };

      // Cache the normalized data
      this.setCachedData(cacheKey, normalizedData);
      
      return normalizedData;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get low stock alerts with consistent data structure
   */
  async getLowStockAlerts() {
    const cacheKey = 'low-stock-alerts';
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await apiClient.get('/reports/low-stock-alerts');
      const alerts = response.data.data || [];

      // Normalize alert data
      const normalizedAlerts = alerts.map(alert => ({
        _id: alert._id,
        name: alert.name,
        brand: alert.brand || '',
        stock: alert.stock || 0,
        lowStockThreshold: alert.lowStockThreshold || 5,
        category: alert.category || null,
        stockStatus: alert.stockStatus || (alert.stock === 0 ? 'Out of Stock' : 'Low Stock'),
        urgency: alert.urgency || (alert.stock === 0 ? 'critical' : 
                  alert.stock <= (alert.lowStockThreshold || 5) / 2 ? 'high' : 'medium')
      }));

      // Cache the normalized data
      this.setCachedData(cacheKey, normalizedAlerts);
      
      return normalizedAlerts;
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
      throw error;
    }
  }

  /**
   * Get inventory status summary for consistency across pages
   */
  async getInventoryStatus() {
    try {
      const metrics = await this.getDashboardMetrics();
      return {
        totalProducts: metrics.inventory.totalProducts,
        lowStockItems: metrics.inventory.lowStockItems,
        outOfStockItems: metrics.inventory.outOfStockItems,
        totalInventoryValue: metrics.inventory.totalInventoryValue
      };
    } catch (error) {
      console.error('Error fetching inventory status:', error);
      return {
        totalProducts: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalInventoryValue: 0
      };
    }
  }

  /**
   * Get analytics data with consistent inventory metrics
   */
  async getAnalyticsData() {
    const cacheKey = 'analytics-data';
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get dashboard metrics as the source of truth
      const dashboardMetrics = await this.getDashboardMetrics();

      // Try to get additional analytics data, but fall back to dashboard metrics
      let executiveData = null;
      let realTimeData = null;
      let profitData = null;

      try {
        const [execResponse, realTimeResponse, profitResponse] = await Promise.allSettled([
          apiClient.get('/analytics/executive-summary'),
          apiClient.get('/analytics/real-time'),
          apiClient.get('/analytics/profit-margins')
        ]);

        executiveData = execResponse.status === 'fulfilled' ? execResponse.value.data.data : null;
        realTimeData = realTimeResponse.status === 'fulfilled' ? realTimeResponse.value.data.data : null;
        profitData = profitResponse.status === 'fulfilled' ? profitResponse.value.data.data : null;
      } catch (analyticsError) {
        console.warn('Some analytics endpoints failed, using dashboard data as fallback:', analyticsError);
      }

      // Combine data with dashboard metrics as the primary source for inventory
      const combinedData = {
        kpis: {
          totalRevenue: dashboardMetrics.sales.totalRevenue,
          totalSales: dashboardMetrics.sales.totalSales,
          averageOrderValue: dashboardMetrics.sales.averageOrderValue,
          lowStockItems: dashboardMetrics.inventory.lowStockItems, // Consistent source
          ...executiveData?.kpis
        },
        inventoryStatus: dashboardMetrics.inventory, // Use dashboard as source of truth
        salesTrend: executiveData?.trends?.salesTrend || dashboardMetrics.monthlyRevenue,
        topProducts: executiveData?.topPerformers?.products || dashboardMetrics.topProducts,
        categoryData: executiveData?.topPerformers?.categories || [],
        stockValue: executiveData?.topPerformers?.products || dashboardMetrics.topProducts,
        profitMargins: profitData?.products?.slice(0, 10) || [],
        hourlySales: realTimeData?.hourlyTrend || [],
        revenueData: executiveData?.trends?.salesTrend || dashboardMetrics.monthlyRevenue
      };

      // Cache the combined data
      this.setCachedData(cacheKey, combinedData);
      
      return combinedData;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }

  /**
   * Refresh all cached data
   */
  async refreshAllData() {
    this.clearCache();
    
    // Fetch fresh data
    const [dashboardMetrics, lowStockAlerts, analyticsData] = await Promise.allSettled([
      this.getDashboardMetrics(),
      this.getLowStockAlerts(),
      this.getAnalyticsData()
    ]);

    return {
      dashboardMetrics: dashboardMetrics.status === 'fulfilled' ? dashboardMetrics.value : null,
      lowStockAlerts: lowStockAlerts.status === 'fulfilled' ? lowStockAlerts.value : [],
      analyticsData: analyticsData.status === 'fulfilled' ? analyticsData.value : null
    };
  }

  /**
   * Subscribe to data changes (for real-time updates)
   */
  subscribe(callback) {
    // Implementation for WebSocket or polling-based updates
    const interval = setInterval(async () => {
      try {
        const freshData = await this.refreshAllData();
        callback(freshData);
      } catch (error) {
        console.error('Error in data subscription:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Return unsubscribe function
    return () => clearInterval(interval);
  }
}

// Create and export a singleton instance
const inventoryDataService = new InventoryDataService();
export default inventoryDataService;