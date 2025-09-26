import React, { useState, useEffect } from 'react';
import inventoryDataService from '../services/inventoryDataService';
import { 
  SalesTrendChart, 
  TopProductsChart, 
  InventoryStatusChart,
  CategoryChart,
  StockValueChart,
  ProfitMarginChart,
  HourlySalesChart,
  RevenueChart
} from '../Components/Charts';
import {
  LoadingSpinner,
  ErrorDisplay
} from '../Components/ReportsAnalyticsCommon';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data state for different analytics
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [inventoryStatus, setInventoryStatus] = useState({});
  const [categoryData, setCategoryData] = useState([]);
  const [stockValue, setStockValue] = useState([]);
  const [profitMargins, setProfitMargins] = useState([]);
  const [hourlySales, setHourlySales] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [kpis, setKpis] = useState({});

  // Fetch all analytics data using centralized service
  const fetchAnalyticsData = async () => {
    try {
      setError(null);
      
      // Use centralized service for consistent data
      const analyticsData = await inventoryDataService.getAnalyticsData();
      
      // Set all data using centralized structure
      setKpis(analyticsData.kpis || {});
      setSalesTrend(analyticsData.salesTrend || []);
      setTopProducts(analyticsData.topProducts || []);
      
      // Use consistent inventory status from dashboard metrics
      setInventoryStatus(analyticsData.inventoryStatus || {
        totalProducts: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      });
      
      setCategoryData(analyticsData.categoryData || []);
      setStockValue(analyticsData.stockValue || []);
      setProfitMargins(analyticsData.profitMargins || []);
      setHourlySales(analyticsData.hourlySales || []);
      setRevenueData(analyticsData.revenueData || []);
      
      
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return <LoadingSpinner title="Loading Analytics..." subtitle="Processing business data" />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRefresh} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-slate-600">Business intelligence and data visualization</p>
              <div className="flex items-center mt-3 space-x-4">
                <div className="flex items-center text-sm text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Real-time Data
                </div>
                <div className="text-sm text-slate-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-blue-400/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Total Revenue</p>
                  <p className="text-3xl font-bold">₹{(kpis.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-blue-200 text-sm flex items-center">
                  <span className="w-2 h-2 bg-blue-300 rounded-full mr-2"></span>
                  All time
                </p>
              </div>
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg opacity-90 group-hover:scale-110 transition-transform duration-300">REV</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-300 rounded-b-2xl"></div>
          </div>

          <div className="group relative bg-gradient-to-br from-emerald-600 via-green-500 to-emerald-700 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-green-400/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-green-100 text-sm font-medium uppercase tracking-wide">Total Sales</p>
                <p className="text-3xl font-bold">{kpis.totalSales || 0}</p>
                <p className="text-green-200 text-sm flex items-center">
                  <span className="w-2 h-2 bg-green-300 rounded-full mr-2"></span>
                  Transactions
                </p>
              </div>
              <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-lg opacity-90 group-hover:scale-110 transition-transform duration-300">SALES</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-300 rounded-b-2xl"></div>
          </div>

          <div className="group relative bg-gradient-to-br from-purple-600 via-violet-500 to-purple-700 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-purple-400/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-purple-100 text-sm font-medium uppercase tracking-wide">Avg Order Value</p>
                <p className="text-3xl font-bold">₹{(kpis.averageOrderValue || 0).toFixed(2)}</p>
                <p className="text-purple-200 text-sm flex items-center">
                  <span className="w-2 h-2 bg-purple-300 rounded-full mr-2"></span>
                  Per transaction
                </p>
              </div>
              <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg opacity-90 group-hover:scale-110 transition-transform duration-300">AOV</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-violet-300 rounded-b-2xl"></div>
          </div>

          <div className="group relative bg-gradient-to-br from-orange-600 via-amber-500 to-orange-700 p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-orange-400/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-orange-100 text-sm font-medium uppercase tracking-wide">Total Products</p>
                <p className="text-3xl font-bold">{inventoryStatus.totalProducts || 0}</p>
                <p className="text-orange-200 text-sm flex items-center">
                  <span className="w-2 h-2 bg-orange-300 rounded-full mr-2"></span>
                  In inventory
                </p>
              </div>
              <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-lg opacity-90 group-hover:scale-110 transition-transform duration-300">PROD</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-amber-300 rounded-b-2xl"></div>
          </div>
        </div>

        {/* Enhanced Sales Analytics */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white mr-4 text-lg font-bold">
              SA
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Sales Analytics</h2>
              <p className="text-slate-600">Performance trends and revenue analysis</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <SalesTrendChart data={salesTrend} title="Sales Trend Over Time" />
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <RevenueChart salesData={revenueData} title="Revenue vs Sales Count" />
            </div>
          </div>
        </div>

        {/* Enhanced Product Performance */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl flex items-center justify-center text-white mr-4 text-lg font-bold">
              PP
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Product Performance</h2>
              <p className="text-slate-600">Top sellers and profit margin analysis</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <TopProductsChart data={topProducts} title="Top Selling Products" />
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <ProfitMarginChart data={profitMargins} title="Product Profit Margins" />
            </div>
          </div>
        </div>

        {/* Enhanced Inventory Management */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-amber-700 rounded-xl flex items-center justify-center text-white mr-4 text-lg font-bold">
              IM
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
              <p className="text-slate-600">Stock levels and inventory value tracking</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <InventoryStatusChart data={inventoryStatus} title="Current Stock Status" />
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <StockValueChart data={stockValue} title="Inventory Value by Product" />
            </div>
          </div>
        </div>

        {/* Enhanced Category & Real-time Analysis */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-700 rounded-xl flex items-center justify-center text-white mr-4 text-lg font-bold">
              CA
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Category & Real-time Analysis</h2>
              <p className="text-slate-600">Category breakdown and hourly sales tracking</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <CategoryChart data={categoryData} title="Sales by Category" />
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <HourlySalesChart data={hourlySales} title="Today's Hourly Sales" />
            </div>
          </div>
        </div>

        {/* Enhanced Summary Stats */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center text-white mr-4 text-lg font-bold">
              BI
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Business Intelligence Summary</h3>
              <p className="text-slate-600">Key performance indicators at a glance</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                  PM
                </div>
                <div>
                  <p className="text-slate-600 font-medium">Profit Margin</p>
                  <p className="text-3xl font-bold text-green-600">
                    {kpis.grossProfitMargin ? `${kpis.grossProfitMargin.toFixed(1)}%` : 'N/A'}
                  </p>
                  <p className="text-green-600 text-sm">Gross margin</p>
                </div>
              </div>
            </div>
            
            <div className="group p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                  LOW
                </div>
                <div>
                  <p className="text-slate-600 font-medium">Low Stock Items</p>
                  <p className="text-3xl font-bold text-amber-600">{inventoryStatus.lowStockItems || 0}</p>
                  <p className="text-amber-600 text-sm">Needs attention</p>
                </div>
              </div>
            </div>
            
            <div className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                  CUST
                </div>
                <div>
                  <p className="text-slate-600 font-medium">Total Customers</p>
                  <p className="text-3xl font-bold text-blue-600">{kpis.totalCustomers || 0}</p>
                  <p className="text-blue-600 text-sm">Active clients</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-slate-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">Real-time Analytics</span>
              </div>
              <div className="text-slate-500">
                Powered by Chart.js
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-slate-500">
              <div className="flex items-center">
                <span>Updated: {new Date().toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <span>Enterprise Analytics v2.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;