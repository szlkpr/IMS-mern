import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import inventoryDataService from '../services/inventoryDataService';
import { 
  SalesTrendChart, 
  TopProductsChart, 
  InventoryStatusChart, 
  RevenueChart 
} from '../Components/Charts';
import BusinessCalendar from '../Components/BusinessCalendar';
import QuickStats from '../Components/QuickStats';

export default function Dashboard() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  // Fetch dashboard data using centralized service
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Use centralized service for consistent data
        const [dashboardMetrics, alerts] = await Promise.all([
          inventoryDataService.getDashboardMetrics(),
          inventoryDataService.getLowStockAlerts()
        ]);
        
        setMetrics(dashboardMetrics);
        setLowStockAlerts(alerts.slice(0, 5)); // Show top 5 alerts
        
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up auto-refresh using the data service subscription
    const unsubscribe = inventoryDataService.subscribe((freshData) => {
      if (freshData.dashboardMetrics) {
        setMetrics(freshData.dashboardMetrics);
      }
      if (freshData.lowStockAlerts) {
        setLowStockAlerts(freshData.lowStockAlerts.slice(0, 5));
      }
    });
    
    return unsubscribe;
  }, []);

  const { healthScore, healthStatus, healthColor, healthEmoji } = useMemo(() => {
    if (!metrics?.inventory?.totalProducts) {
      return { healthScore: 100, healthStatus: t('dashboard.statusHealthy'), healthColor: 'bg-green-500', healthEmoji: '😊' };
    }
    const { totalProducts, lowStockItems, outOfStockItems } = metrics.inventory;
    const healthyItems = totalProducts - lowStockItems - outOfStockItems;
    const score = (healthyItems / totalProducts);
    const scorePercentage = score * 100;

    let color = 'bg-red-500';
    let emoji = '😟';
    if (score > 0.8) {
      color = 'bg-green-500';
      emoji = '😊';
    } else if (score > 0.6) {
      color = 'bg-yellow-500';
      emoji = '😐';
    }

    return { healthScore: scorePercentage, healthStatus: `${scorePercentage.toFixed(0)}% ${t('dashboard.healthyInventory')}`, healthColor: color, healthEmoji: emoji };
  }, [metrics, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-lg border text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-slate-700 mb-2">{t('dashboard.loadingDashboard')}</p>
          <p className="text-slate-500">{t('dashboard.fetchingData')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="max-w-md mx-auto p-6">
          <div className="bg-white p-8 rounded-lg shadow-lg border border-red-200 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-red-600 text-2xl font-bold">!</div>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">{t('dashboard.dashboardError')}</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              {t('dashboard.retryLoading')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="bg-white p-6 shadow-sm border border-corporate-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-corporate-700 mb-2">
                {t('dashboard.title')}
              </h1>
              <p className="text-corporate-500 text-base">{t('dashboard.subtitle')}</p>
              <div className="flex items-center mt-4 space-x-4">
                <div className="flex items-center text-sm text-success bg-green-50 px-3 py-1 sharp-sm">
                  <div className="w-2 h-2 bg-success mr-2"></div>
                  {t('dashboard.systemOnline')}
                </div>
                <div className="text-sm text-corporate-500 bg-corporate-50 px-3 py-1 sharp-sm">
                  {t('dashboard.lastUpdated')}: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
        

        {/* Main Dashboard Content */}
        {metrics && (
          <>
            {/* Top Row - KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group bg-white p-6 shadow-sm border border-corporate-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-corporate-600 mb-2">{t('dashboard.totalSales')}</p>
                    <p className="text-3xl font-bold text-corporate-700">{metrics.sales.totalSales}</p>
                    <p className="text-xs text-corporate-500 mt-1">{t('dashboard.thisMonth')}</p>
                  </div>
                  <div className="w-12 h-12 bg-corporate-gradient flex items-center justify-center shadow-sm">
                    <div className="text-white text-lg">💰</div>
                  </div>
                </div>
              </div>

              <div className="group bg-white p-6 shadow-sm border border-corporate-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-success mb-2">{t('dashboard.revenue')}</p>
                    <p className="text-3xl font-bold text-corporate-700">₹{(metrics.sales.totalRevenue / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-corporate-500 mt-1">{t('dashboard.thisMonth')}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-600 flex items-center justify-center shadow-sm">
                    <div className="text-white text-lg">📈</div>
                  </div>
                </div>
              </div>

              <div className="group bg-white p-6 shadow-sm border border-corporate-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-warning mb-2">{t('dashboard.products')}</p>
                    <p className="text-3xl font-bold text-corporate-700">{metrics.inventory.totalProducts}</p>
                    <p className="text-xs text-corporate-500 mt-1">{t('dashboard.inInventory')}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-600 flex items-center justify-center shadow-sm">
                    <div className="text-white text-lg">📦</div>
                  </div>
                </div>
              </div>

              <div className="group bg-white p-6 shadow-sm border border-corporate-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-danger mb-2">{t('dashboard.lowStock')}</p>
                    <p className="text-3xl font-bold text-corporate-700">{metrics.inventory.lowStockItems}</p>
                    <p className="text-xs text-corporate-500 mt-1">{t('dashboard.needAttention')}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-600 flex items-center justify-center shadow-sm">
                    <div className="text-white text-lg">⚠️</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Grid - Optimized Layout */}
            <div className="space-y-6">
              {/* Top Section - Calendar and Quick Actions Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar - Equal Width */}
                <div>
                  <BusinessCalendar />
                </div>
                
                {/* Quick Actions - Equal Width */}
                <div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
                    <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-3">
                      <h3 className="text-lg font-semibold">{t('dashboard.quickActions')}</h3>
                      <p className="text-slate-300 text-sm mt-1">{t('dashboard.commonTasks')}</p>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href="/sales/add"
                          className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                        >
                          <div className="text-2xl mb-2">💰</div>
                          <p className="font-semibold text-sm">{t('dashboard.newSale')}</p>
                          <p className="text-blue-100 text-xs mt-1">{t('dashboard.createInvoice')}</p>
                        </a>
                        
                        <a
                          href="/inventory/add"
                          className="flex flex-col items-center p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                        >
                          <div className="text-2xl mb-2">📦</div>
                          <p className="font-semibold text-sm">{t('dashboard.addProduct')}</p>
                          <p className="text-green-100 text-xs mt-1">{t('dashboard.updateStock')}</p>
                        </a>
                        
                        <a
                          href="/reports"
                          className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                        >
                          <div className="text-2xl mb-2">📊</div>
                          <p className="font-semibold text-sm">{t('navigation.reports')}</p>
                          <p className="text-purple-100 text-xs mt-1">{t('dashboard.analytics')}</p>
                        </a>
                        
                        <a
                          href="/purchases"
                          className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                        >
                          <div className="text-2xl mb-2">🛒</div>
                          <p className="font-semibold text-sm">{t('dashboard.purchase')}</p>
                          <p className="text-orange-100 text-xs mt-1">{t('dashboard.buyStock')}</p>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Middle Section - Stats and Health Monitor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left - Quick Stats */}
                <div>
                  <QuickStats />
                </div>
                
                {/* Right - Inventory Health Monitor */}
                <div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{t('dashboard.inventoryHealth')}</h3>
                          <p className="text-cyan-100 text-sm mt-1">{t('dashboard.realtimeStatus')}</p>
                        </div>
                        <div className="text-2xl">💊</div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        {/* In Stock */}
                        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <div className="text-white text-sm">✅</div>
                          </div>
                          <p className="text-lg font-bold text-green-600">
                            {metrics.inventory ? (metrics.inventory.totalProducts - metrics.inventory.lowStockItems - metrics.inventory.outOfStockItems) : 0}
                          </p>
                          <p className="text-xs text-green-700 font-medium">{t('dashboard.inStock')}</p>
                          <div className="w-full bg-green-100 rounded-full h-1 mt-2">
                            <div className="bg-green-500 h-1 rounded-full" style={{width: `${metrics.inventory.totalProducts > 0 ? ((metrics.inventory.totalProducts - metrics.inventory.lowStockItems - metrics.inventory.outOfStockItems) / metrics.inventory.totalProducts * 100) : 0}%`}}></div>
                          </div>
                        </div>
                        
                        {/* Low Stock */}
                        <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-100">
                          <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <div className="text-white text-sm">⚠️</div>
                          </div>
                          <p className="text-lg font-bold text-yellow-600">
                            {metrics.inventory?.lowStockItems || 0}
                          </p>
                          <p className="text-xs text-yellow-700 font-medium">{t('dashboard.lowStock')}</p>
                          <div className="w-full bg-yellow-100 rounded-full h-1 mt-2">
                            <div className="bg-yellow-500 h-1 rounded-full" style={{width: `${metrics.inventory.totalProducts > 0 ? (metrics.inventory.lowStockItems / metrics.inventory.totalProducts * 100) : 0}%`}}></div>
                          </div>
                        </div>
                        
                        {/* Out of Stock */}
                        <div className="text-center p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-100">
                          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <div className="text-white text-sm">❌</div>
                          </div>
                          <p className="text-lg font-bold text-red-600">
                            {metrics.inventory?.outOfStockItems || 0}
                          </p>
                          <p className="text-xs text-red-700 font-medium">{t('dashboard.outOfStock')}</p>
                          <div className="w-full bg-red-100 rounded-full h-1 mt-2">
                            <div className="bg-red-500 h-1 rounded-full" style={{width: `${metrics.inventory.totalProducts > 0 ? (metrics.inventory.outOfStockItems / metrics.inventory.totalProducts * 100) : 0}%`}}></div>
                          </div>
                        </div>
                        
                        {/* Total Value */}
                        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-100">
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <div className="text-white text-sm">💎</div>
                          </div>
                          <p className="text-lg font-bold text-purple-600">
                            ₹{metrics.inventory ? (metrics.inventory.totalInventoryValue / 1000).toFixed(0) : 0}K
                          </p>
                          <p className="text-xs text-purple-700 font-medium">{t('dashboard.totalValue')}</p>
                          <div className="w-full bg-purple-100 rounded-full h-1 mt-2">
                            <div className="bg-purple-500 h-1 rounded-full" style={{width: '100%'}}></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Health Score */}
                      <div className="mt-4 p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-slate-900 text-sm">{t('dashboard.overallHealthScore')}</p>
                          <span className="text-xl">{healthEmoji}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${healthColor}`} 
                            style={{width: `${healthScore}%`}}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-600 mt-2">
                          {healthStatus}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{t('dashboard.businessAnalytics')}</h3>
                    <p className="text-indigo-100 mt-1">{t('dashboard.performanceInsights')}</p>
                  </div>
                  <div className="text-2xl">📊</div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Sales Trend Chart */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <div className="text-white text-lg">📈</div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{t('dashboard.salesPerformance')}</h4>
                        <p className="text-sm text-slate-600">{t('dashboard.monthlyTrends')}</p>
                      </div>
                    </div>
                    <SalesTrendChart 
                      data={metrics.monthlyRevenue} 
                      title={t('dashboard.monthlySalesTrend')}
                      showContainer={false}
                    />
                  </div>
                  
                  {/* Inventory Status Chart */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <div className="text-white text-lg">📦</div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{t('dashboard.stockStatus')}</h4>
                        <p className="text-sm text-slate-600">{t('dashboard.inventoryHealthSmall')}</p>
                      </div>
                    </div>
                    <InventoryStatusChart 
                      data={metrics.inventory} 
                      title={t('dashboard.inventoryStatusOverview')}
                      showContainer={false}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Top Products & Recent Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products Performance */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 to-purple-700 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{t('dashboard.topProducts')}</h3>
                      <p className="text-violet-100 text-sm mt-1">{t('dashboard.bestPerformers')}</p>
                    </div>
                    <div className="text-2xl">🏆</div>
                  </div>
                </div>
                
                <div className="p-4">
                  {metrics.topProducts && metrics.topProducts.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {metrics.topProducts.slice(0, 5).map((product, index) => (
                        <div key={product._id || index} className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-100 hover:shadow-sm transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              index === 2 ? 'bg-amber-600' : 'bg-violet-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{product.productName || product.name || t('dashboard.unknownProduct')}</p>
                              <p className="text-slate-600 text-xs">₹{(product.totalRevenue || 0).toLocaleString()} {t('dashboard.revenue')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-violet-600 text-sm">{product.totalQuantity || 0}</p>
                            <p className="text-slate-500 text-xs">{t('dashboard.sold')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="text-violet-500 text-2xl">📊</div>
                      </div>
                      <p className="text-slate-600 font-medium">{t('dashboard.noSalesData')}</p>
                      <p className="text-slate-500 text-sm">{t('dashboard.startMaking')}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Recent Activity Feed */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{t('dashboard.recentActivity')}</h3>
                      <p className="text-teal-100 text-sm mt-1">{t('dashboard.latestEvents')}</p>
                    </div>
                    <div className="text-2xl">🔄</div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {/* Today's activity */}
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{t('dashboard.systemStarted')}</p>
                        <p className="text-slate-600 text-xs">{t('dashboard.dashboardLoaded')}</p>
                      </div>
                      <p className="text-slate-500 text-xs">{t('dashboard.now')}</p>
                    </div>
                    
                    {metrics.sales?.totalSales > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm">{t('dashboard.salesRecorded')}</p>
                          <p className="text-slate-600 text-xs">{metrics.sales.totalSales} {t('dashboard.transactionsMonth')}</p>
                        </div>
                        <p className="text-slate-500 text-xs">{t('dashboard.today')}</p>
                      </div>
                    )}
                    
                    {metrics.inventory?.totalProducts > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm">{t('dashboard.inventoryUpdated')}</p>
                          <p className="text-slate-600 text-xs">{metrics.inventory.totalProducts} {t('dashboard.productsInSystem')}</p>
                        </div>
                        <p className="text-slate-500 text-xs">{t('dashboard.recent')}</p>
                      </div>
                    )}
                    
                    {metrics.inventory?.lowStockItems > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-100">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm">{t('dashboard.stockAlert')}</p>
                          <p className="text-slate-600 text-xs">{metrics.inventory.lowStockItems} {t('dashboard.itemsAttention')}</p>
                        </div>
                        <p className="text-slate-500 text-xs">{t('dashboard.alert')}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-100">
                      <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{t('dashboard.dataSynchronized')}</p>
                        <p className="text-slate-600 text-xs">{t('dashboard.systemsOperational')}</p>
                      </div>
                      <p className="text-slate-500 text-xs">{t('dashboard.agoMinutes')}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <a href="/reports" className="text-sm text-teal-600 hover:text-teal-800 font-medium">
                      {t('dashboard.viewFullLog')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Financial Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{t('dashboard.financialSummary')}</h3>
                    <p className="text-emerald-100 text-sm mt-1">{t('dashboard.revenueInsights')}</p>
                  </div>
                  <div className="text-2xl">💹</div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Monthly Revenue */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <div className="text-emerald-600 text-xl">💰</div>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                      ₹{metrics.sales ? (metrics.sales.totalRevenue / 1000).toFixed(0) : 0}K
                    </p>
                    <p className="text-sm text-slate-600 mt-1">{t('dashboard.monthlyRevenue')}</p>
                    <div className="w-full bg-emerald-100 rounded-full h-2 mt-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">75% {t('dashboard.ofTarget')}</p>
                  </div>
                  
                  {/* Profit Margin */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <div className="text-blue-600 text-xl">📈</div>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">32%</p>
                    <p className="text-sm text-slate-600 mt-1">{t('dashboard.profitMargin')}</p>
                    <div className="w-full bg-blue-100 rounded-full h-2 mt-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{t('dashboard.aboveAverage')}</p>
                  </div>
                  
                  {/* Inventory Value */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <div className="text-purple-600 text-xl">📦</div>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      ₹{metrics.inventory ? (metrics.inventory.totalInventoryValue / 1000).toFixed(0) : 0}K
                    </p>
                    <p className="text-sm text-slate-600 mt-1">{t('dashboard.stockValue')}</p>
                    <div className="w-full bg-purple-100 rounded-full h-2 mt-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{width: '60%'}}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{t('dashboard.optimalLevel')}</p>
                  </div>
                  
                  {/* Monthly Growth */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <div className="text-orange-600 text-xl">🚀</div>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">+12%</p>
                    <p className="text-sm text-slate-600 mt-1">{t('dashboard.growthRate')}</p>
                    <div className="w-full bg-orange-100 rounded-full h-2 mt-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '90%'}}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{t('dashboard.excellentTrend')}</p>
                  </div>
                </div>
                
                {/* Financial Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="font-medium text-slate-900 text-sm">{t('dashboard.bestDay')}</p>
                    </div>
                    <p className="text-xl font-bold text-green-600">{t('dashboard.today')}</p>
                    <p className="text-xs text-slate-600">{t('dashboard.highestSales')}</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="font-medium text-slate-900 text-sm">{t('dashboard.avgOrder')}</p>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      ₹{metrics.sales ? metrics.sales.averageOrderValue.toFixed(0) : 0}
                    </p>
                    <p className="text-xs text-slate-600">{t('dashboard.perTransaction')}</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <p className="font-medium text-slate-900 text-sm">{t('dashboard.targetProgress')}</p>
                    </div>
                    <p className="text-xl font-bold text-purple-600">75%</p>
                    <p className="text-xs text-slate-600">{t('dashboard.monthlyGoal')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stock Alerts - Compact */}
            {lowStockAlerts.length > 0 && (
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-sm border border-red-200 overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{t('dashboard.stockAlerts')}</h3>
                      <p className="text-red-100 text-sm">{t('dashboard.itemsRequiring')}</p>
                    </div>
                    <div className="text-2xl">⚠️</div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {lowStockAlerts.slice(0, 3).map((product) => (
                      <div key={product._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200 hover:shadow-sm transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{product.name}</p>
                            {product.brand && <p className="text-slate-600 text-xs">{product.brand}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600 text-sm">{product.stock} {t('dashboard.left')}</p>
                          <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 font-medium">
                            {t('dashboard.urgent')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {lowStockAlerts.length > 3 && (
                    <div className="mt-3 text-center">
                      <a href="/reports" className="text-sm text-red-600 hover:text-red-800 font-medium">
                        {t('dashboard.viewMoreAlerts', { count: lowStockAlerts.length - 3 })} →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Footer */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="font-medium">{t('dashboard.systemOnline')}</span>
                  </div>
                  <div className="text-slate-500">
                    🔄 {t('dashboard.autoRefresh')}
                  </div>
                  <div className="text-slate-500">
                    📅 {t('dashboard.lastUpdated')}: {new Date().toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-slate-500">
                  <span className="bg-slate-200 px-2 py-1 rounded text-xs font-medium">{t('dashboard.version')}</span>
                </div>
              </div>
            </div>
        </>
      )}
      </div>
    </div>
  );
}
