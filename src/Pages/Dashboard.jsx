import { useState, useEffect } from 'react';
import apiClient from '../api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [metricsResponse, alertsResponse] = await Promise.all([
          apiClient.get('/reports/dashboard-metrics'),
          apiClient.get('/reports/low-stock-alerts')
        ]);
        
        setMetrics(metricsResponse.data.data);
        setLowStockAlerts(alertsResponse.data.data.slice(0, 5)); // Show top 5 alerts
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your inventory management system</p>
      </div>

      {/* Key Metrics Cards */}
      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Sales</p>
                  <p className="text-3xl font-bold">{metrics.sales.totalSales}</p>
                  <p className="text-blue-100 text-sm">This month</p>
                </div>
                <div className="text-4xl opacity-80">📊</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Revenue</p>
                  <p className="text-3xl font-bold">₹{metrics.sales.totalRevenue.toLocaleString()}</p>
                  <p className="text-green-100 text-sm">This month</p>
                </div>
                <div className="text-4xl opacity-80">💰</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Avg Order Value</p>
                  <p className="text-3xl font-bold">₹{metrics.sales.averageOrderValue.toFixed(0)}</p>
                  <p className="text-purple-100 text-sm">Per transaction</p>
                </div>
                <div className="text-4xl opacity-80">📈</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Inventory Value</p>
                  <p className="text-3xl font-bold">₹{(metrics.inventory.totalInventoryValue / 1000).toFixed(0)}K</p>
                  <p className="text-orange-100 text-sm">Current stock</p>
                </div>
                <div className="text-4xl opacity-80">📦</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Inventory Overview */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">Total Products</span>
                  </div>
                  <span className="font-semibold text-xl">{metrics.inventory.totalProducts}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">Low Stock Items</span>
                  </div>
                  <span className="font-semibold text-xl text-yellow-600">{metrics.inventory.lowStockItems}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">Out of Stock</span>
                  </div>
                  <span className="font-semibold text-xl text-red-600">{metrics.inventory.outOfStockItems}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <a
                  href="/sales"
                  className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors"
                >
                  📱 New Sale
                </a>
                <a
                  href="/inventory"
                  className="block w-full px-4 py-3 bg-green-600 text-white text-center rounded-md hover:bg-green-700 transition-colors"
                >
                  📦 Add Product
                </a>
                <a
                  href="/reports"
                  className="block w-full px-4 py-3 bg-purple-600 text-white text-center rounded-md hover:bg-purple-700 transition-colors"
                >
                  📊 View Reports
                </a>
                <a
                  href="/purchases"
                  className="block w-full px-4 py-3 bg-orange-600 text-white text-center rounded-md hover:bg-orange-700 transition-colors"
                >
                  🛒 Record Purchase
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Products */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
              {metrics.topProducts && metrics.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {metrics.topProducts.slice(0, 5).map((product, index) => (
                    <div key={product._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 truncate">{product.productName}</p>
                          <p className="text-sm text-gray-500">₹{product.totalRevenue.toLocaleString()} revenue</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{product.totalQuantity}</p>
                        <p className="text-sm text-gray-500">sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No sales data available</p>
              )}
            </div>

            {/* Stock Alerts */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
                <a href="/reports" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All
                </a>
              </div>
              
              {lowStockAlerts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockAlerts.map((product) => (
                    <div key={product._id} className={`p-3 rounded-lg border-l-4 ${
                      product.urgency === 'critical' 
                        ? 'bg-red-50 border-red-400'
                        : product.urgency === 'high'
                        ? 'bg-orange-50 border-orange-400'
                        : 'bg-yellow-50 border-yellow-400'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                          {product.brand && <p className="text-xs text-gray-600">{product.brand}</p>}
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            product.stock === 0 ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {product.stock} left
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            product.urgency === 'critical' 
                              ? 'bg-red-100 text-red-800'
                              : product.urgency === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {product.urgency.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-500 text-3xl mb-2">✅</div>
                  <p className="text-gray-500">All products well stocked!</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Auto-refresh indicator */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          🔄 Dashboard auto-refreshes every 5 minutes | Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
