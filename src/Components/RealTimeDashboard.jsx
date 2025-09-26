import React, { useState, useEffect } from 'react';
import { HourlySalesChart } from './Charts';
import apiClient from '../api';

const RealTimeDashboard = () => {
  const [hourlyData, setHourlyData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [realTimeMetrics, setRealTimeMetrics] = useState({});
  const [realTimeAlerts, setRealTimeAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(null);

  // Fetch real-time analytics data
  const fetchRealTimeData = async () => {
    try {
      setError(null);
      
      // Fetch real-time metrics
      const [metricsResponse, trendResponse, productsResponse] = await Promise.all([
        apiClient.get('/analytics/real-time'),
        apiClient.get('/analytics/real-time'),
        apiClient.get('/reports/dashboard-metrics')
      ]);
      
      // Update real-time metrics
      if (metricsResponse.data.success) {
        const data = metricsResponse.data.data;
        setRealTimeMetrics({
          revenue: data.todayRevenue || 0,
          salesCount: data.todaySales || 0,
          averageOrderValue: data.averageOrderValue || 0,
          connectedUsers: Math.floor(Math.random() * 10) + 1, // Simulated
          recentSales: data.recentSales || []
        });
        
        // Format hourly data
        if (data.hourlyTrend) {
          const chartData = data.hourlyTrend.map(item => ({
            hour: `${item._id}:00`,
            sales: item.salesCount,
            revenue: item.revenue
          }));
          setHourlyData(chartData);
        }
      }
      
      // Update top products
      if (productsResponse.data.success && productsResponse.data.data.topProducts) {
        setTopProducts(productsResponse.data.data.topProducts.slice(0, 5));
      }
      
      setLastUpdated(new Date());
      setIsConnected(true);
      
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setError('Failed to fetch real-time data');
      setIsConnected(false);
    }
  };
  
  // Dismiss alert function
  const dismissAlert = (alertId) => {
    setRealTimeAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };
  
  // Clear all alerts function
  const clearAllAlerts = () => {
    setRealTimeAlerts([]);
  };
  
  // Reconnect function
  const reconnect = async () => {
    await fetchRealTimeData();
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchRealTimeData();
      setLoading(false);
    };

    initializeData();

    // Refresh data every 30 seconds for real-time effect
    const interval = setInterval(fetchRealTimeData, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center space-x-2">
      {isConnected ? (
        <>
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
            📶
          </div>
          <span className="text-sm text-green-600 font-medium">Live</span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </>
      ) : (
        <>
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
            📵
          </div>
          <span className="text-sm text-red-600 font-medium">Offline</span>
          <button 
            onClick={reconnect} 
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
          >
            Reconnect
          </button>
        </>
      )}
    </div>
  );

  // Alert notification component
  const AlertNotification = ({ alert, onDismiss }) => (
    <div className={`p-4 rounded-xl shadow-lg border mb-3 transition-all duration-300 ${
      alert.type === 'error' ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200' : 
      alert.type === 'warning' ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' : 
      'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
              alert.type === 'error' ? 'bg-red-500' : 
              alert.type === 'warning' ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}>
              {alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : '✅'}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{alert.title}</p>
              <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
              {alert.recommendation && (
                <p className="text-xs text-blue-600 mt-1">💡 {alert.recommendation}</p>
              )}
            </div>
            <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
        <button
          onClick={() => onDismiss(alert.id)}
          className="w-6 h-6 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center text-slate-600 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-slate-700 mb-2">Loading Real-time Dashboard...</p>
          <p className="text-slate-500">Connecting to live data feed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-3">
                Real-time Dashboard
              </h1>
              <p className="text-slate-600 text-lg">Live business metrics and instant alerts</p>
              <div className="flex items-center mt-3 space-x-4">
                <div className="flex items-center text-sm text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Auto-refresh: 30 seconds
                </div>
                <div className="text-sm text-slate-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <ConnectionStatus />
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="group relative flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg"
                >
                  <span className="text-lg mr-2 group-hover:scale-110 transition-transform">🔔</span>
                  <span className="font-medium">Alerts</span>
                  {realTimeAlerts.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {realTimeAlerts.length}
                    </span>
                  )}
                </button>
                
                <button 
                  onClick={clearAllAlerts}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Live Alerts Panel */}
        {showAlerts && realTimeAlerts.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                    🔔
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Live Alerts</h3>
                    <p className="text-blue-100">{realTimeAlerts.length} active notifications</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAlerts(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  👁️
                </button>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {realTimeAlerts.map((alert) => (
                <AlertNotification
                  key={alert.id}
                  alert={alert}
                  onDismiss={dismissAlert}
                />
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Real-time Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Revenue */}
          <div className="group relative bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-blue-400/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Today's Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(realTimeMetrics?.revenue)}</p>
                <p className="text-blue-200 text-sm flex items-center">
                  <span className="w-2 h-2 bg-blue-300 rounded-full mr-2 animate-pulse"></span>
                  Live updates
                </p>
              </div>
              <div className="text-5xl opacity-90 group-hover:scale-110 transition-transform duration-300">💰</div>
            </div>
            {isConnected && (
              <div className="absolute top-3 right-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-300 rounded-b-2xl"></div>
          </div>

          {/* Today's Sales Count */}
          <div className="group relative bg-gradient-to-br from-emerald-600 via-green-500 to-emerald-700 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-green-400/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-green-100 text-sm font-medium uppercase tracking-wide">Today's Sales</p>
                <p className="text-3xl font-bold">{realTimeMetrics?.salesCount?.toLocaleString() || 0}</p>
                <p className="text-green-200 text-sm flex items-center">
                  <span className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></span>
                  Transactions
                </p>
              </div>
              <div className="text-5xl opacity-90 group-hover:scale-110 transition-transform duration-300">🛒</div>
            </div>
            {isConnected && (
              <div className="absolute top-3 right-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-300 rounded-b-2xl"></div>
          </div>

          {/* Average Order Value */}
          <div className="group relative bg-gradient-to-br from-purple-600 via-violet-500 to-purple-700 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-purple-400/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-purple-100 text-sm font-medium uppercase tracking-wide">Avg Order Value</p>
                <p className="text-3xl font-bold">{formatCurrency(realTimeMetrics?.averageOrderValue)}</p>
                <p className="text-purple-200 text-sm flex items-center">
                  <span className="w-2 h-2 bg-purple-300 rounded-full mr-2 animate-pulse"></span>
                  Today
                </p>
              </div>
              <div className="text-5xl opacity-90 group-hover:scale-110 transition-transform duration-300">📈</div>
            </div>
            {isConnected && (
              <div className="absolute top-3 right-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-violet-300 rounded-b-2xl"></div>
          </div>

          {/* Active Users */}
          <div className="group relative bg-gradient-to-br from-indigo-600 via-blue-500 to-indigo-700 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-indigo-400/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-indigo-100 text-sm font-medium uppercase tracking-wide">Active Users</p>
                <p className="text-3xl font-bold">{realTimeMetrics?.connectedUsers || 0}</p>
                <p className="text-indigo-200 text-sm flex items-center">
                  <span className="w-2 h-2 bg-indigo-300 rounded-full mr-2 animate-pulse"></span>
                  Online now
                </p>
              </div>
              <div className="text-5xl opacity-90 group-hover:scale-110 transition-transform duration-300">👥</div>
            </div>
            {isConnected && (
              <div className="absolute top-3 right-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-blue-300 rounded-b-2xl"></div>
          </div>
        </div>

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hourly Sales Trend */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white mr-3">
                  📈
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Today's Hourly Sales</h3>
                  <p className="text-slate-600">Real-time sales performance</p>
                </div>
              </div>
              {isConnected && (
                <span className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                  Live
                </span>
              )}
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <HourlySalesChart 
                data={hourlyData} 
                title="Today's Hourly Sales Trend"
              />
            </div>
          </div>

          {/* Top Products Today */}
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl flex items-center justify-center text-white mr-3">
                🏆
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Top Products</h3>
                <p className="text-slate-600">Today's bestsellers</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product._id} className="group p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:from-blue-50 hover:to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                        index === 1 ? 'bg-gradient-to-br from-gray-500 to-slate-600' :
                        index === 2 ? 'bg-gradient-to-br from-orange-600 to-red-600' : 
                        'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{product.productName || product.name}</p>
                        <p className="text-sm text-slate-600">{product.totalQuantity} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">
                        {formatCurrency(product.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {topProducts.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-slate-400 text-5xl mb-4">📦</div>
                  <p className="text-slate-500 text-lg">No sales data available</p>
                  <p className="text-slate-400 text-sm">Sales will appear here in real-time</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Recent Sales Activity */}
        {realTimeMetrics?.recentSales && realTimeMetrics.recentSales.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center text-white mr-3">
                  ⚡
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Recent Sales Activity</h3>
                  <p className="text-slate-600">Latest transactions in real-time</p>
                </div>
              </div>
              <span className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                Live Updates
              </span>
            </div>
            
            <div className="space-y-4">
              {realTimeMetrics.recentSales.map((sale, index) => (
                <div key={sale._id} className="group p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:from-green-50 hover:to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {sale.customerName || 'Walk-in Customer'}
                        </p>
                        <p className="text-sm text-slate-600 flex items-center space-x-2">
                          <span>📦 {sale.soldProducts?.length || 0} items</span>
                          <span>•</span>
                          <span>🕰️ {new Date(sale.createdAt).toLocaleTimeString()}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-lg">
                        {formatCurrency(sale.saleCost)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Status Footer */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-slate-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">Real-time Dashboard</span>
              </div>
              <div className="text-slate-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              {error && (
                <div className="flex items-center text-red-600">
                  <span className="mr-2">⚠️</span>
                  <span>Error: {error}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <ConnectionStatus />
              <div className="flex items-center text-slate-500">
                <span className="mr-2">📈</span>
                <span>InventoryPro Live v2.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard;