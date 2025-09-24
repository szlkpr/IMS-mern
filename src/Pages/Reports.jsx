import { useState, useEffect } from 'react';
import apiClient from '../api';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // State for different report data
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [message, setMessage] = useState('');

  // Fetch dashboard metrics
  const fetchDashboardMetrics = async () => {
    try {
      const response = await apiClient.get('/reports/dashboard-metrics', {
        params: dateRange
      });
      setDashboardMetrics(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      setMessage('Failed to load dashboard metrics');
    }
  };

  // Fetch sales report
  const fetchSalesReport = async (page = 1) => {
    try {
      const response = await apiClient.get('/reports/sales', {
        params: { ...dateRange, page, limit: 10 }
      });
      setSalesReport(response.data.data);
    } catch (error) {
      console.error('Error fetching sales report:', error);
      setMessage('Failed to load sales report');
    }
  };

  // Fetch inventory report
  const fetchInventoryReport = async (page = 1, lowStock = false) => {
    try {
      const response = await apiClient.get('/reports/inventory', {
        params: { page, limit: 10, lowStock }
      });
      setInventoryReport(response.data.data);
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      setMessage('Failed to load inventory report');
    }
  };

  // Fetch low stock alerts
  const fetchLowStockAlerts = async () => {
    try {
      const response = await apiClient.get('/reports/low-stock-alerts');
      setLowStockAlerts(response.data.data);
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
    }
  };

  // CSV Export functions
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      setMessage('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSalesData = async () => {
    try {
      setMessage('Exporting sales data...');
      const response = await apiClient.get('/reports/export/sales', {
        params: dateRange
      });
      exportToCSV(response.data.data, 'sales-report');
      setMessage('Sales data exported successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting sales data:', error);
      setMessage('Failed to export sales data');
    }
  };

  const exportInventoryData = async () => {
    try {
      setMessage('Exporting inventory data...');
      const response = await apiClient.get('/reports/export/inventory');
      exportToCSV(response.data.data, 'inventory-report');
      setMessage('Inventory data exported successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting inventory data:', error);
      setMessage('Failed to export inventory data');
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardMetrics(),
        fetchSalesReport(),
        fetchInventoryReport(),
        fetchLowStockAlerts()
      ]);
      setLoading(false);
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
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Business Reports & Analytics</h1>
        
        {/* Date Range Filter */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={exportSalesData}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Export Sales CSV
              </button>
              <button
                onClick={exportInventoryData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Export Inventory CSV
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md ${
            message.includes('successfully') || message.includes('Exporting')
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'sales', label: 'Sales Report' },
              { id: 'inventory', label: 'Inventory Report' },
              { id: 'alerts', label: 'Stock Alerts' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          {dashboardMetrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inventory Status */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Products</span>
                      <span className="font-semibold">{dashboardMetrics.inventory.totalProducts}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-600">Low Stock Items</span>
                      <span className="font-semibold text-yellow-600">{dashboardMetrics.inventory.lowStockItems}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-600">Out of Stock</span>
                      <span className="font-semibold text-red-600">{dashboardMetrics.inventory.outOfStockItems}</span>
                    </div>
                  </div>
                </div>

                {/* Top Products */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
                  <div className="space-y-3">
                    {dashboardMetrics.topProducts.slice(0, 5).map((product, index) => (
                      <div key={product._id} className="flex justify-between items-center">
                        <span className="text-gray-600 truncate">{product.productName}</span>
                        <span className="font-semibold">{product.totalQuantity} sold</span>
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
                <div className="text-green-500 text-4xl mb-4">✓</div>
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
  );
}