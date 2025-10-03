import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Alert, AlertDescription } from './ui/Alert';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Refresh,
  Eye,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useDashboardWebSocket } from '../services/websocketService';
// Charts can be added later when needed
import axios from 'axios';

const ExecutiveDashboard = () => {
  const { t } = useTranslation();
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('month');
  const [refreshing, setRefreshing] = useState(false);

  // WebSocket integration for real-time updates
  const { 
    metrics: realTimeMetrics, 
    alerts: realTimeAlerts, 
    isConnected, 
    dismissAlert, 
    clearAllAlerts 
  } = useDashboardWebSocket(true);

  // Fetch executive summary data
  const fetchExecutiveSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      const now = new Date();
      
      switch (dateRange) {
        case 'week':
          params.startDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'month':
          params.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          params.startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString();
          break;
        case 'year':
          params.startDate = new Date(now.getFullYear(), 0, 1).toISOString();
          break;
        default:
          params.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      }
      
      params.endDate = now.toISOString();
      
      const response = await axios.get('/api/analytics/executive-summary', { params });
      
      if (response.data.success) {
        setExecutiveSummary(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch executive summary');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching executive summary:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExecutiveSummary();
    setTimeout(() => setRefreshing(false), 1000);
  };

  useEffect(() => {
    fetchExecutiveSummary();
  }, [dateRange]);

  // Health score color and label
  const getHealthScoreColor = (score) => {
    if (score >= 80) return { color: 'text-green-600', bg: 'bg-green-100', label: t('executiveDashboard.healthScore.excellent') };
    if (score >= 60) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: t('executiveDashboard.healthScore.good') };
    if (score >= 40) return { color: 'text-orange-600', bg: 'bg-orange-100', label: t('executiveDashboard.healthScore.fair') };
    return { color: 'text-red-600', bg: 'bg-red-100', label: t('executiveDashboard.healthScore.poor') };
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{t('executiveDashboard.title')}</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>{t('executiveDashboard.loadingAnalytics')}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {t('executiveDashboard.failedToLoad')}: {error}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="mt-4">
          <Refresh className="w-4 h-4 mr-2" />
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const healthScore = getHealthScoreColor(executiveSummary?.healthScore || 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('executiveDashboard.title')}</h1>
          <p className="text-gray-600 mt-1">{t('executiveDashboard.subtitle')}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? t('executiveDashboard.live') : t('executiveDashboard.offline')}
            </span>
          </div>

          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">{t('executiveDashboard.dateRange.last7Days')}</option>
            <option value="month">{t('executiveDashboard.dateRange.thisMonth')}</option>
            <option value="quarter">{t('executiveDashboard.dateRange.thisQuarter')}</option>
            <option value="year">{t('executiveDashboard.dateRange.thisYear')}</option>
          </select>

          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <Refresh className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('executiveDashboard.buttons.refresh')}
          </Button>
        </div>
      </div>

      {/* Real-time Alerts */}
      {realTimeAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('executiveDashboard.liveAlerts')}</h3>
            <Button onClick={clearAllAlerts} variant="ghost" size="sm">
              {t('executiveDashboard.buttons.clearAll')}
            </Button>
          </div>
          
          {realTimeAlerts.slice(0, 3).map((alert) => (
            <Alert key={alert.id} className={`
              ${alert.type === 'error' ? 'border-red-200 bg-red-50' : ''}
              ${alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''}
              ${alert.type === 'success' ? 'border-green-200 bg-green-50' : ''}
            `}>
              <AlertTriangle className={`h-4 w-4 ${
                alert.type === 'error' ? 'text-red-600' : 
                alert.type === 'warning' ? 'text-yellow-600' : 
                'text-green-600'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <AlertDescription className="font-medium">
                    {alert.title}
                  </AlertDescription>
                  <Button
                    onClick={() => dismissAlert(alert.id)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                {alert.recommendation && (
                  <p className="text-xs text-blue-600 mt-1">💡 {alert.recommendation}</p>
                )}
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Business Health Score */}
      <Card className={`${healthScore.bg} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('executiveDashboard.businessHealthScore')}</h3>
              <p className="text-sm text-gray-600">{t('executiveDashboard.healthScoreDescription')}</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${healthScore.color}`}>
                {executiveSummary?.healthScore || 0}
              </div>
              <Badge className={`${healthScore.color} ${healthScore.bg} mt-2`}>
                {healthScore.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">{t('executiveDashboard.kpis.totalRevenue')}</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(executiveSummary?.kpis.totalRevenue || 0)}
                </p>
                <div className="flex items-center mt-1">
                  {executiveSummary?.trends.revenueGrowthRate >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm ${
                    executiveSummary?.trends.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(Math.abs(executiveSummary?.trends.revenueGrowthRate || 0))}
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Sales Count */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">{t('executiveDashboard.kpis.totalSales')}</p>
                <p className="text-2xl font-bold text-green-900">
                  {executiveSummary?.kpis.totalSales?.toLocaleString() || 0}
                </p>
                <div className="flex items-center mt-1">
                  {executiveSummary?.trends.salesGrowthRate >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm ${
                    executiveSummary?.trends.salesGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(Math.abs(executiveSummary?.trends.salesGrowthRate || 0))}
                  </span>
                </div>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">{t('executiveDashboard.kpis.avgOrderValue')}</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(executiveSummary?.kpis.averageOrderValue || 0)}
                </p>
                <p className="text-sm text-purple-600 mt-1">{t('executiveDashboard.kpis.perTransaction')}</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">{t('executiveDashboard.kpis.profitMargin')}</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {formatPercentage(executiveSummary?.kpis.grossProfitMargin || 0)}
                </p>
                <p className="text-sm text-yellow-600 mt-1">{t('executiveDashboard.kpis.grossMargin')}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        {/* Customer Metrics */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('executiveDashboard.kpis.totalCustomers')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {executiveSummary?.kpis.totalCustomers?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatPercentage(executiveSummary?.kpis.repeatCustomerRate || 0)} {t('executiveDashboard.kpis.repeatRate')}
                </p>
              </div>
              <Users className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Turnover */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('executiveDashboard.kpis.inventoryTurnover')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {executiveSummary?.kpis.inventoryTurnover?.toFixed(1) || 0}x
                </p>
                <p className="text-sm text-gray-600 mt-1">{t('executiveDashboard.kpis.annualRate')}</p>
              </div>
              <Package className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className={executiveSummary?.kpis.lowStockItems > 10 ? 'border-orange-200 bg-orange-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('executiveDashboard.kpis.lowStockItems')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {executiveSummary?.kpis.lowStockItems || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">{t('executiveDashboard.kpis.needAttention')}</p>
              </div>
              {executiveSummary?.kpis.lowStockItems > 10 ? (
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Metrics */}
        {realTimeMetrics && (
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Today's Sales</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {formatCurrency(realTimeMetrics.revenue || 0)}
                  </p>
                  <p className="text-sm text-indigo-600 mt-1">
                    {realTimeMetrics.salesCount || 0} transactions
                  </p>
                </div>
                <Activity className="w-8 h-8 text-indigo-600 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              Top Performing Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {executiveSummary?.topPerformers.products.slice(0, 5).map((product, index) => (
                <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.totalQuantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(product.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-green-500" />
              Top Performing Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {executiveSummary?.topPerformers.categories.slice(0, 5).map((category, index) => (
                <div key={category._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{category.name}</p>
                      <p className="text-sm text-gray-600">{category.totalQuantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(category.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Recommendations */}
      {executiveSummary?.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-500" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {executiveSummary.recommendations.map((rec, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'default' : 'secondary'}>
                      {rec.priority}
                    </Badge>
                    <span className="text-sm font-medium text-gray-600">{rec.category}</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">{rec.action}</h4>
                  <p className="text-sm text-gray-600">{rec.impact}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExecutiveDashboard;