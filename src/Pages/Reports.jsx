import { useState, useEffect } from 'react';
import { 
  SalesTrendChart, 
  TopProductsChart, 
  InventoryStatusChart,
  CategoryChart,
  StockValueChart,
  ProfitMarginChart
} from '../Components/Charts';
import {
  LoadingSpinner,
  ErrorDisplay,
  MessageDisplay,
  DateRangeFilter,
  useCSVExport,
  useReportsAnalyticsData
} from '../Components/ReportsAnalyticsCommon';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Use shared data fetching hook
  const {
    loading,
    setLoading,
    error,
    setError,
    dashboardMetrics,
    salesReport,
    inventoryReport,
    lowStockAlerts,
    fetchDashboardMetrics,
    fetchSalesReport,
    fetchInventoryReport,
    fetchLowStockAlerts
  } = useReportsAnalyticsData();

  // Use shared CSV export hook
  const { exportSalesData, exportInventoryData } = useCSVExport();

  // Enhanced export functions using shared hook
  const handleExportSales = async () => {
    setMessage('Exporting sales data...');
    const result = await exportSalesData(dateRange);
    setMessage(result.message);
    if (result.success) {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleExportInventory = async () => {
    setMessage('Exporting inventory data...');
    const result = await exportInventoryData();
    setMessage(result.message);
    if (result.success) {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Initial data fetch with proper error handling
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.allSettled([
          fetchDashboardMetrics(dateRange),
          fetchSalesReport(dateRange),
          fetchInventoryReport(),
          fetchLowStockAlerts()
        ]);
      } catch (err) {
        setError(err.message || 'Failed to load reports data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [dateRange]);

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <LoadingSpinner title="Loading Reports..." subtitle="Generating comprehensive business reports" />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Business Reports
              </h1>
              <p className="text-slate-600">Comprehensive data insights and export capabilities</p>
            </div>
          </div>
        
        {/* Date Range Filter */}
        <DateRangeFilter 
          dateRange={dateRange} 
          onChange={handleDateRangeChange} 
          onExportSales={handleExportSales}
          onExportInventory={handleExportInventory}
        />
        </div>

        {/* Message Display */}
        <MessageDisplay message={message} onClose={() => setMessage('')} />

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="border-b border-slate-200">
            <nav className="flex">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'sales', label: 'Sales Report' },
                { id: 'inventory', label: 'Inventory Report' },
                { id: 'alerts', label: 'Stock Alerts' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 font-medium text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content Container */}
          <div className="p-8">

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          {dashboardMetrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Sales</h3>
                  <p className="text-3xl font-bold text-blue-600">{dashboardMetrics.sales.totalSales}</p>
                  <p className="text-sm text-gray-500">This period</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
                  <p className="text-3xl font-bold text-green-600">
                    ₹{dashboardMetrics.sales.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">This period</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Order Value</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    ₹{dashboardMetrics.sales.averageOrderValue.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">Per transaction</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Value</h3>
                  <p className="text-3xl font-bold text-orange-600">
                    ₹{dashboardMetrics.inventory.totalInventoryValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Current stock</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Sales Trend Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <SalesTrendChart 
                    data={dashboardMetrics.monthlyRevenue} 
                    title="Sales Trend Analysis"
                  />
                </div>
                
                {/* Inventory Status Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <InventoryStatusChart 
                    data={dashboardMetrics.inventory} 
                    title="Stock Status Distribution"
                  />
                </div>
              </div>
              
              {/* Second Row of Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <TopProductsChart 
                    data={dashboardMetrics.topProducts} 
                    title="Best Performing Products"
                  />
                </div>
                
                {/* Top Products List */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products Details</h3>
                  <div className="space-y-3">
                    {dashboardMetrics.topProducts.slice(0, 5).map((product, index) => (
                      <div key={product._id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <span className="text-gray-900 font-medium truncate">{product.productName}</span>
                            <p className="text-xs text-gray-500">₹{product.totalRevenue.toLocaleString()} revenue</p>
                          </div>
                        </div>
                        <span className="font-semibold text-blue-600">{product.totalQuantity} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Sales Report</h3>
            <p className="text-sm text-gray-500">
              {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesReport?.docs?.map((sale) => (
                  <tr key={sale._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sale.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{sale.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.soldBy?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.paymentMethod || 'Cash'}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No sales data found for this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Inventory Report</h3>
              <p className="text-sm text-gray-500">Current stock levels and valuations</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchInventoryReport(1, false)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                All Items
              </button>
              <button
                onClick={() => fetchInventoryReport(1, true)}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Low Stock Only
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryReport?.docs?.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.brand && <div className="text-gray-500">{product.brand}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stockStatus === 'Out of Stock' 
                          ? 'bg-red-100 text-red-800'
                          : product.stockStatus === 'Low Stock'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {product.stockStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{product.inventoryValue?.toLocaleString()}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No inventory data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
            <p className="text-sm text-gray-500">Products requiring attention</p>
          </div>
          <div className="p-6">
            {lowStockAlerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-green-600 text-2xl font-bold">OK</div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">All Good!</h3>
                <p className="text-gray-500">No stock alerts at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockAlerts.map((product) => (
                  <div key={product._id} className={`p-4 rounded-lg border-l-4 ${
                    product.urgency === 'critical' 
                      ? 'bg-red-50 border-red-400'
                      : product.urgency === 'high'
                      ? 'bg-orange-50 border-orange-400'
                      : 'bg-yellow-50 border-yellow-400'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        {product.brand && <p className="text-sm text-gray-600">Brand: {product.brand}</p>}
                        <p className="text-sm text-gray-600">Category: {product.category?.name || 'Uncategorized'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Stock: <span className={product.stock === 0 ? 'text-red-600' : 'text-orange-600'}>
                            {product.stock}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">Threshold: {product.lowStockThreshold}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.urgency === 'critical' 
                          ? 'bg-red-100 text-red-800'
                          : product.urgency === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.stockStatus} - {product.urgency.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}