import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import inventoryDataService from '../services/inventoryDataService';
import apiClient from '../api';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsDashboard = () => {
  const { t } = useTranslation();
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

  // ML Analytics state
  const [mlDashboardData, setMlDashboardData] = useState(null);
  const [mlServiceStatus, setMlServiceStatus] = useState('unknown');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [predictionsData, setPredictionsData] = useState(null);

  // Fetch ML Analytics data
  const fetchMLData = async () => {
    try {
      // Check ML service health
      const healthResponse = await apiClient.get('/ml/health');
      setMlServiceStatus(healthResponse.data.ml_service_connected ? 'active' : 'inactive');

      // Fetch ML dashboard summary
      const dashboardResponse = await apiClient.get('/ml/dashboard/summary');
      setMlDashboardData(dashboardResponse.data.data);
    } catch (err) {
      console.error('Error fetching ML data:', err);
      setMlServiceStatus('error');
    }
  };

  // Fetch product prediction
  const fetchProductPrediction = async (productId) => {
    try {
      const response = await apiClient.post(`/ml/predict/demand/${productId}`, {
        forecastHorizon: 30,
        includeScenarios: true
      });
      setPredictionsData(response.data.data);
    } catch (err) {
      console.error('Prediction error:', err);
    }
  };

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
      
      // Fetch ML data
      await fetchMLData();
      
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(t('analytics.failedToLoadData'));
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
    return <LoadingSpinner title={t('analytics.loadingAnalytics')} subtitle={t('analytics.processingData')} />;
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
                {t('analytics.title')}
              </h1>
              <p className="text-slate-600">{t('analytics.subtitle')}</p>
              <div className="flex items-center mt-3 space-x-4">
                <div className="flex items-center text-sm text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  {t('analytics.realTimeData')}
                </div>
                <div className="text-sm text-slate-500">
                  {t('analytics.lastUpdated')}: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{refreshing ? t('analytics.refreshing') : t('analytics.refresh')}</span>
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
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">{t('analytics.kpis.totalRevenue')}</p>
                  <p className="text-3xl font-bold">₹{(kpis.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-blue-200 text-sm flex items-center">
                  <span className="w-2 h-2 bg-blue-300 rounded-full mr-2"></span>
                  {t('analytics.kpis.allTime')}
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
                <p className="text-green-100 text-sm font-medium uppercase tracking-wide">{t('analytics.kpis.totalSales')}</p>
                <p className="text-3xl font-bold">{kpis.totalSales || 0}</p>
                <p className="text-green-200 text-sm flex items-center">
                  <span className="w-2 h-2 bg-green-300 rounded-full mr-2"></span>
                  {t('analytics.kpis.transactions')}
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
                <p className="text-purple-100 text-sm font-medium uppercase tracking-wide">{t('analytics.kpis.avgOrderValue')}</p>
                <p className="text-3xl font-bold">₹{(kpis.averageOrderValue || 0).toFixed(2)}</p>
                <p className="text-purple-200 text-sm flex items-center">
                  <span className="w-2 h-2 bg-purple-300 rounded-full mr-2"></span>
                  {t('analytics.kpis.perTransaction')}
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
                <p className="text-orange-100 text-sm font-medium uppercase tracking-wide">{t('analytics.kpis.totalProducts')}</p>
                <p className="text-3xl font-bold">{inventoryStatus.totalProducts || 0}</p>
                <p className="text-orange-200 text-sm flex items-center">
                  <span className="w-2 h-2 bg-orange-300 rounded-full mr-2"></span>
                  {t('analytics.kpis.inInventory')}
                </p>
              </div>
              <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-lg opacity-90 group-hover:scale-110 transition-transform duration-300">PROD</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-amber-300 rounded-b-2xl"></div>
          </div>
        </div>

        {/* ML Analytics Section */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center text-white mr-4 text-lg font-bold">
                ML
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">AI-Powered Analytics</h2>
                <p className="text-slate-600">Machine Learning Insights & Predictions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                mlServiceStatus === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : mlServiceStatus === 'inactive'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                ML Service: {mlServiceStatus}
              </span>
            </div>
          </div>

          {/* ML Summary Cards */}
          {mlDashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Products Analyzed</p>
                    <p className="text-2xl font-semibold text-gray-900">{mlDashboardData.summary?.total_products_analyzed || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-md">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Successful Predictions</p>
                    <p className="text-2xl font-semibold text-gray-900">{mlDashboardData.summary?.successful_predictions || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-md">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.5 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">High Risk Products</p>
                    <p className="text-2xl font-semibold text-gray-900">{mlDashboardData.summary?.high_risk_products || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-md">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Trending Products</p>
                    <p className="text-2xl font-semibold text-gray-900">{mlDashboardData.summary?.trending_products?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ML Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Trends Chart */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Trends & Confidence</h3>
              {mlDashboardData?.summary?.trending_products && mlDashboardData.summary.trending_products.length > 0 ? (
                <Bar 
                  data={{
                    labels: mlDashboardData.summary.trending_products.map(p => p.name),
                    datasets: [{
                      label: 'Confidence Score',
                      data: mlDashboardData.summary.trending_products.map(p => (p.confidence * 100).toFixed(1)),
                      backgroundColor: mlDashboardData.summary.trending_products.map(p => 
                        p.trend === 'increasing' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
                      ),
                      borderColor: mlDashboardData.summary.trending_products.map(p => 
                        p.trend === 'increasing' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
                      ),
                      borderWidth: 1,
                    }],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: 'Prediction Confidence' }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No trending products data available
                </div>
              )}
            </div>

            {/* Demand Forecast Chart */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Demand Forecast</h3>
                <select
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    if (e.target.value) {
                      fetchProductPrediction(e.target.value);
                    }
                  }}
                  value={selectedProduct || ''}
                >
                  <option value="">Select Product</option>
                  {mlDashboardData?.summary?.trending_products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              {predictionsData ? (
                <Line 
                  data={{
                    labels: Array.from({length: predictionsData.forecast_horizon}, (_, i) => `Day ${i + 1}`),
                    datasets: [
                      {
                        label: 'Predicted Demand',
                        data: predictionsData.predictions,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                      },
                      {
                        label: 'Lower Bound',
                        data: predictionsData.confidence_intervals?.lower || [],
                        borderColor: 'rgba(239, 68, 68, 0.5)',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.4,
                        pointRadius: 0,
                      },
                      {
                        label: 'Upper Bound',
                        data: predictionsData.confidence_intervals?.upper || [],
                        borderColor: 'rgba(34, 197, 94, 0.5)',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.4,
                        pointRadius: 0,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: 'Demand Forecast' }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Demand Units' }
                      },
                      x: {
                        title: { display: true, text: 'Days' }
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Select a product to view demand forecast
                </div>
              )}
            </div>
          </div>

          {/* ML Recommendations */}
          {mlDashboardData?.summary?.recommendations && mlDashboardData.summary.recommendations.length > 0 && (
            <div className="mt-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
              <div className="space-y-2">
                {mlDashboardData.summary.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start">
                    <div className="p-1 bg-blue-100 rounded-full mr-3 mt-1">
                      <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prediction Details */}
          {predictionsData && (
            <div className="mt-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Certainty Score</h4>
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(predictionsData.certainty_score * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {(predictionsData.certainty_score * 100).toFixed(1)}% confidence
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Method</h4>
                  <p className="mt-2 text-sm font-medium text-gray-900 capitalize">
                    {predictionsData.method?.replace(/_/g, ' ') || 'Unknown'}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Generated At</h4>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {new Date(predictionsData.generated_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {predictionsData.narrative && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Analysis</h4>
                  <p className="mt-2 text-gray-700">{predictionsData.narrative}</p>
                </div>
              )}

              {predictionsData.recommendations && predictionsData.recommendations.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Recommendations</h4>
                  <ul className="mt-2 space-y-1">
                    {predictionsData.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Sales Analytics */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white mr-4 text-lg font-bold">
              SA
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{t('analytics.sections.salesAnalytics')}</h2>
              <p className="text-slate-600">{t('analytics.sections.performanceTrends')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <SalesTrendChart data={salesTrend} title={t('analytics.charts.salesTrendOverTime')} />
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <RevenueChart salesData={revenueData} title={t('analytics.charts.revenueVsSalesCount')} />
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
              <h2 className="text-2xl font-bold text-slate-800">{t('analytics.sections.productPerformance')}</h2>
              <p className="text-slate-600">{t('analytics.sections.topSellersAnalysis')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <TopProductsChart data={topProducts} title={t('analytics.charts.topSellingProducts')} />
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <ProfitMarginChart data={profitMargins} title={t('analytics.charts.productProfitMargins')} />
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
              <h2 className="text-2xl font-bold text-slate-800">{t('analytics.sections.inventoryManagement')}</h2>
              <p className="text-slate-600">{t('analytics.sections.stockLevelsTracking')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <InventoryStatusChart data={inventoryStatus} title={t('analytics.charts.currentStockStatus')} />
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <StockValueChart data={stockValue} title={t('analytics.charts.inventoryValueByProduct')} />
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
              <h2 className="text-2xl font-bold text-slate-800">{t('analytics.sections.categoryRealTimeAnalysis')}</h2>
              <p className="text-slate-600">{t('analytics.sections.categoryBreakdownTracking')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <CategoryChart data={categoryData} title={t('analytics.charts.salesByCategory')} />
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <HourlySalesChart data={hourlySales} title={t('analytics.charts.todaysHourlySales')} />
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
              <h3 className="text-2xl font-bold text-slate-800">{t('analytics.sections.businessIntelligenceSummary')}</h3>
              <p className="text-slate-600">{t('analytics.sections.keyPerformanceIndicators')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                  PM
                </div>
                <div>
                  <p className="text-slate-600 font-medium">{t('analytics.summary.profitMargin')}</p>
                  <p className="text-3xl font-bold text-green-600">
                    {kpis.grossProfitMargin ? `${kpis.grossProfitMargin.toFixed(1)}%` : t('analytics.na')}
                  </p>
                  <p className="text-green-600 text-sm">{t('analytics.summary.grossMargin')}</p>
                </div>
              </div>
            </div>
            
            <div className="group p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                  LOW
                </div>
                <div>
                  <p className="text-slate-600 font-medium">{t('analytics.summary.lowStockItems')}</p>
                  <p className="text-3xl font-bold text-amber-600">{inventoryStatus.lowStockItems || 0}</p>
                  <p className="text-amber-600 text-sm">{t('analytics.summary.needsAttention')}</p>
                </div>
              </div>
            </div>
            
            <div className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                  CUST
                </div>
                <div>
                  <p className="text-slate-600 font-medium">{t('analytics.summary.totalCustomers')}</p>
                  <p className="text-3xl font-bold text-blue-600">{kpis.totalCustomers || 0}</p>
                  <p className="text-blue-600 text-sm">{t('analytics.summary.activeClients')}</p>
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
                <span className="font-medium">{t('analytics.footer.realTimeAnalytics')}</span>
              </div>
              <div className="text-slate-500">
                {t('analytics.footer.poweredBy')}
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-slate-500">
              <div className="flex items-center">
                <span>{t('analytics.footer.updated')}: {new Date().toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <span>{t('analytics.footer.enterpriseAnalytics')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;