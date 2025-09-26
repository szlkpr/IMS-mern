import { useState, useEffect } from 'react';
import inventoryDataService from '../services/inventoryDataService';
import DataConsistencyTest from '../Components/DataConsistencyTest';
import { 
  SalesTrendChart, 
  TopProductsChart, 
  InventoryStatusChart, 
  RevenueChart 
} from '../Components/Charts';

export default function Dashboard() {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-lg border text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-slate-700 mb-2">Loading Dashboard...</p>
          <p className="text-slate-500">Fetching your inventory data</p>
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
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Dashboard Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Dashboard
              </h1>
              <p className="text-slate-600">Overview of your inventory management system</p>
              <div className="flex items-center mt-3 space-x-4">
                <div className="flex items-center text-sm text-emerald-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                  System Online
                </div>
                <div className="text-sm text-slate-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Data Consistency Test */}
        <DataConsistencyTest />

        {/* Enhanced KPI Metrics Cards */}
        {metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">Total Sales</p>
                    <p className="text-2xl font-bold text-slate-900">{metrics.sales.totalSales}</p>
                    <p className="text-xs text-slate-500 mt-1">This month</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <div className="text-blue-600 text-lg font-bold">SALES</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">₹{metrics.sales.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">This month</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <div className="text-green-600 text-lg font-bold">REV</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">Avg Order Value</p>
                    <p className="text-2xl font-bold text-slate-900">₹{metrics.sales.averageOrderValue.toFixed(0)}</p>
                    <p className="text-xs text-slate-500 mt-1">Per transaction</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <div className="text-purple-600 text-lg font-bold">AOV</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">Inventory Value</p>
                    <p className="text-2xl font-bold text-slate-900">₹{(metrics.inventory.totalInventoryValue / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-slate-500 mt-1">Current stock</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <div className="text-orange-600 text-lg font-bold">INV</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Overview and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Inventory Overview */}
              <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center mb-6">
                  <h3 className="text-xl font-semibold text-slate-900">Inventory Overview</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-blue-800">Total Products</span>
                        <p className="text-sm text-blue-600 mt-1">Active inventory items</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-2xl text-blue-900">{metrics.inventory.totalProducts}</span>
                        <p className="text-sm text-blue-600">items</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-yellow-800">Low Stock Items</span>
                        <p className="text-sm text-yellow-600 mt-1">Requires attention</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-2xl text-yellow-900">{metrics.inventory.lowStockItems}</span>
                        <p className="text-sm text-yellow-600">items</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-red-800">Out of Stock</span>
                        <p className="text-sm text-red-600 mt-1">Immediate restock needed</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-2xl text-red-900">{metrics.inventory.outOfStockItems}</span>
                        <p className="text-sm text-red-600">items</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-slate-900">Quick Actions</h3>
                </div>
                
                <div className="space-y-3">
                  <a
                    href="/sales"
                    className="block w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <div>
                      <p className="font-medium">New Sale</p>
                      <p className="text-blue-100 text-sm">Process customer transaction</p>
                    </div>
                  </a>
                  
                  <a
                    href="/inventory"
                    className="block w-full p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <div>
                      <p className="font-medium">Add Product</p>
                      <p className="text-green-100 text-sm">Update inventory stock</p>
                    </div>
                  </a>
                  
                  <a
                    href="/reports"
                    className="block w-full p-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <div>
                      <p className="font-medium">View Reports</p>
                      <p className="text-slate-100 text-sm">Analyze business data</p>
                    </div>
                  </a>
                  
                  <a
                    href="/purchases"
                    className="block w-full p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <div>
                      <p className="font-medium">Record Purchase</p>
                      <p className="text-orange-100 text-sm">Add supplier transaction</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Trend Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Sales Performance</h3>
                </div>
                <SalesTrendChart 
                  data={metrics.monthlyRevenue} 
                  title="Monthly Sales Trend"
                  showContainer={false}
                />
              </div>
              
              {/* Inventory Status Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Stock Status</h3>
                </div>
                <InventoryStatusChart 
                  data={metrics.inventory} 
                  title="Inventory Status Overview"
                  showContainer={false}
                />
              </div>
            </div>
            
            {/* Revenue and Products Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Revenue Analysis</h3>
                </div>
                <RevenueChart 
                  salesData={metrics.monthlyRevenue} 
                  title="Revenue vs Sales Count"
                  showContainer={false}
                />
              </div>
              
              {/* Top Selling Products Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Top Products</h3>
                </div>
                <TopProductsChart 
                  data={metrics.topProducts} 
                  title="Best Selling Products"
                  showContainer={false}
                />
              </div>
            </div>
            
            {/* Product Performance Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Product Performance Details</h3>
                <div className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-md">
                  Top 5 performers this month
                </div>
              </div>
              
              {metrics.topProducts && metrics.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {metrics.topProducts.slice(0, 5).map((product, index) => (
                    <div key={product._id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 truncate">{product.productName}</p>
                            <p className="text-sm text-slate-600">
                              ₹{product.totalRevenue.toLocaleString()} revenue
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl text-slate-900">{product.totalQuantity}</p>
                          <p className="text-sm text-slate-500">units sold</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-slate-400 text-2xl">-</div>
                  </div>
                  <p className="text-slate-500">No sales data available</p>
                  <p className="text-slate-400 text-sm">Start making sales to see performance metrics</p>
                </div>
              )}
            </div>

            {/* Stock Alerts */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Stock Alerts</h3>
                <a 
                  href="/reports" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-md transition-colors"
                >
                  View All Reports
                </a>
              </div>
              
              {lowStockAlerts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockAlerts.map((product) => (
                    <div key={product._id} className={`p-4 rounded-lg border-l-4 ${
                      product.urgency === 'critical' 
                        ? 'bg-red-50 border-red-500'
                        : product.urgency === 'high'
                        ? 'bg-orange-50 border-orange-500'
                        : 'bg-yellow-50 border-yellow-500'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-900">{product.name}</p>
                          {product.brand && <p className="text-slate-600 text-sm">{product.brand}</p>}
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            product.stock === 0 ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {product.stock} left
                          </p>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
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
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-green-600 text-2xl font-bold">OK</div>
                  </div>
                  <p className="text-slate-700 font-medium mb-1">All Stock Levels Optimal</p>
                  <p className="text-slate-500 text-sm">No critical alerts at this time</p>
                </div>
              )}
            </div>
        </>
      )}

        {/* Footer */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-slate-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Live Data</span>
              </div>
              <div className="text-slate-500">
                Auto-refresh: 5 minutes
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-slate-500">
              <span>Updated: {new Date().toLocaleTimeString()}</span>
              <span>IMS v1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
