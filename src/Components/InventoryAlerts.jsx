import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Alert, AlertDescription } from './ui/Alert';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { 
  AlertTriangle, 
  Package, 
  Bell, 
  BellRing,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  Filter,
  Download,
  Refresh
} from 'lucide-react';
import { useWebSocket } from '../services/websocketService';
import axios from 'axios';

const InventoryAlerts = () => {
  const { t } = useTranslation();
  const [lowStockData, setLowStockData] = useState(null);
  const [deadStockData, setDeadStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, critical, warning, info
  const [category, setCategory] = useState('all');
  const [realTimeAlerts, setRealTimeAlerts] = useState([]);
  
  // WebSocket integration
  const { 
    isConnected, 
    addEventListener, 
    removeEventListener,
    subscribeToInventoryAlerts 
  } = useWebSocket();

  // Fetch inventory data
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [lowStockResponse, deadStockResponse] = await Promise.all([
        axios.get('/api/analytics/inventory-advanced'),
        axios.get('/api/analytics/dead-stock', { params: { days: 90 } })
      ]);

      if (lowStockResponse.data.success) {
        setLowStockData(lowStockResponse.data.data);
      }

      if (deadStockResponse.data.success) {
        setDeadStockData(deadStockResponse.data.data);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time listeners
  useEffect(() => {
    if (isConnected) {
      subscribeToInventoryAlerts();
      
      const unsubscribers = [
        addEventListener('low-stock-alert', (data) => {
          setRealTimeAlerts(prev => [...prev, {
            id: Date.now(),
            type: 'warning',
            category: 'low-stock',
            title: t('inventoryAlerts.lowStockAlert'),
            message: t('inventoryAlerts.productsRunningLow', { count: data.products.length }),
            products: data.products,
            timestamp: data.timestamp,
            isNew: true
          }]);
        }),
        
        addEventListener('out-of-stock-alert', (data) => {
          setRealTimeAlerts(prev => [...prev, {
            id: Date.now(),
            type: 'critical',
            category: 'out-of-stock',
            title: t('inventoryAlerts.outOfStockAlert'),
            message: t('inventoryAlerts.productsOutOfStock', { count: data.products.length }),
            products: data.products,
            timestamp: data.timestamp,
            isNew: true
          }]);
        }),
        
        addEventListener('new-purchase', (data) => {
          setRealTimeAlerts(prev => [...prev, {
            id: Date.now(),
            type: 'info',
            category: 'purchase',
            title: t('inventoryAlerts.newPurchase'),
            message: t('inventoryAlerts.inventoryLevelsUpdated'),
            purchase: data.purchase,
            timestamp: data.timestamp,
            isNew: true
          }]);
          
          // Refresh inventory data after new purchase
          setTimeout(fetchInventoryData, 2000);
        })
      ];

      return () => {
        unsubscribers.forEach(unsub => unsub());
      };
    }
  }, [isConnected]);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Mark alert as read
  const markAlertAsRead = (alertId) => {
    setRealTimeAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, isNew: false } : alert
      )
    );
  };

  // Dismiss alert
  const dismissAlert = (alertId) => {
    setRealTimeAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Clear all alerts
  const clearAllAlerts = () => {
    setRealTimeAlerts([]);
  };

  // Get alert severity
  const getAlertSeverity = (product) => {
    if (product.stock === 0) return 'critical';
    if (product.stock <= product.lowStockThreshold * 0.5) return 'critical';
    if (product.stock <= product.lowStockThreshold) return 'warning';
    return 'info';
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  // Filter alerts
  const getFilteredAlerts = () => {
    return realTimeAlerts.filter(alert => {
      if (filter !== 'all' && alert.type !== filter) return false;
      return true;
    });
  };

  // Get inventory issues summary
  const getInventorySummary = () => {
    if (!lowStockData) return null;

    const lowStockProducts = lowStockData.turnover?.products?.filter(p => 
      p.stock <= p.lowStockThreshold && p.stock > 0
    ) || [];
    
    const outOfStockProducts = lowStockData.turnover?.products?.filter(p => 
      p.stock === 0
    ) || [];
    
    const deadStockProducts = deadStockData?.products || [];

    return {
      lowStock: lowStockProducts.length,
      outOfStock: outOfStockProducts.length,
      deadStock: deadStockProducts.length,
      total: lowStockProducts.length + outOfStockProducts.length + deadStockProducts.length
    };
  };

  const summary = getInventorySummary();
  const filteredAlerts = getFilteredAlerts();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{t('inventoryAlerts.title')}</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Package className="w-4 h-4 animate-pulse" />
            <span>{t('inventoryAlerts.loadingAlerts')}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
            {t('inventoryAlerts.failedToLoadAlerts')}: {error}
          </AlertDescription>
        </Alert>
        <Button onClick={fetchInventoryData} className="mt-4">
          <Refresh className="w-4 h-4 mr-2" />
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('inventoryAlerts.title')}</h1>
          <p className="text-gray-600 mt-1">{t('inventoryAlerts.subtitle')}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? t('inventoryAlerts.liveMonitoring') : t('inventoryAlerts.offline')}
            </span>
          </div>

          {/* Filter Controls */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('inventoryAlerts.filter.allAlerts')}</option>
            <option value="critical">{t('inventoryAlerts.filter.critical')}</option>
            <option value="warning">{t('inventoryAlerts.filter.warning')}</option>
            <option value="info">{t('inventoryAlerts.filter.info')}</option>
          </select>

          <Button onClick={fetchInventoryData} variant="outline" size="sm">
            <Refresh className="w-4 h-4 mr-2" />
            {t('inventoryAlerts.buttons.refresh')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Issues */}
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('inventoryAlerts.summary.totalIssues')}</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('inventoryAlerts.summary.itemsNeedAttention')}</p>
                </div>
                <Package className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          {/* Out of Stock */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">{t('inventoryAlerts.summary.outOfStock')}</p>
                  <p className="text-2xl font-bold text-red-900">{summary.outOfStock}</p>
                  <p className="text-sm text-red-600 mt-1">{t('inventoryAlerts.summary.immediateAction')}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          {/* Low Stock */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">{t('inventoryAlerts.summary.lowStock')}</p>
                  <p className="text-2xl font-bold text-yellow-900">{summary.lowStock}</p>
                  <p className="text-sm text-yellow-600 mt-1">{t('inventoryAlerts.summary.needReorder')}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          {/* Dead Stock */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">{t('inventoryAlerts.summary.deadStock')}</p>
                  <p className="text-2xl font-bold text-orange-900">{summary.deadStock}</p>
                  <p className="text-sm text-orange-600 mt-1">{t('inventoryAlerts.summary.notMoving')}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Alerts */}
      {realTimeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <BellRing className="w-5 h-5 mr-2 text-blue-600" />
                {t('inventoryAlerts.liveAlerts.title')} ({filteredAlerts.length})
              </span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {isConnected ? t('inventoryAlerts.liveAlerts.live') : t('inventoryAlerts.liveAlerts.offline')}
                </Badge>
                <Button onClick={clearAllAlerts} variant="ghost" size="sm">
                  {t('inventoryAlerts.buttons.clearAll')}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Alert 
                  key={alert.id} 
                  className={`${
                    alert.type === 'critical' ? 'border-red-200 bg-red-50' :
                    alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  } ${alert.isNew ? 'ring-2 ring-opacity-50 ring-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <BellRing className={`h-5 w-5 mt-0.5 ${
                        alert.type === 'critical' ? 'text-red-600' :
                        alert.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <AlertDescription className="font-semibold">
                            {alert.title}
                          </AlertDescription>
                          <Badge 
                            variant="outline" 
                            className={alert.type === 'critical' ? 'border-red-300 text-red-700' :
                                      alert.type === 'warning' ? 'border-yellow-300 text-yellow-700' :
                                      'border-blue-300 text-blue-700'}
                          >
                            {alert.type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                        
                        {/* Product Details */}
                        {alert.products && alert.products.length > 0 && (
                          <div className="bg-white bg-opacity-50 rounded-md p-3 mt-2">
                            <p className="text-xs font-medium text-gray-600 mb-2">{t('inventoryAlerts.alerts.affectedProducts')}:</p>
                            <div className="space-y-1">
                              {alert.products.slice(0, 5).map((product, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-800">{product.name}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-600">{t('inventoryAlerts.alerts.stock')}: {product.stock}</span>
                                    {product.lowStockThreshold && (
                                      <span className="text-gray-500">
                                        ({t('inventoryAlerts.alerts.min')}: {product.lowStockThreshold})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {alert.products.length > 5 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  +{alert.products.length - 5} {t('inventoryAlerts.alerts.moreProducts')}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      {alert.isNew && (
                        <Button
                          onClick={() => markAlertAsRead(alert.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-600"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => dismissAlert(alert.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Issues List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Out of Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <XCircle className="w-5 h-5 mr-2 text-red-600" />
              {t('inventoryAlerts.criticalIssues.outOfStockProducts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockData?.turnover?.products ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {lowStockData.turnover.products
                  .filter(product => product.stock === 0)
                  .slice(0, 10)
                  .map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          {t('inventoryAlerts.criticalIssues.outOfStockBadge')}
                        </Badge>
                      </div>
                    </div>
                ))}
                {lowStockData.turnover.products.filter(p => p.stock === 0).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm">{t('inventoryAlerts.criticalIssues.noOutOfStock')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('inventoryAlerts.criticalIssues.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
              {t('inventoryAlerts.criticalIssues.lowStockProducts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockData?.turnover?.products ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {lowStockData.turnover.products
                  .filter(product => product.stock > 0 && product.stock <= product.lowStockThreshold)
                  .slice(0, 10)
                  .map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-yellow-700">
                          {product.stock} {t('inventoryAlerts.criticalIssues.left')}
                        </p>
                        <p className="text-xs text-gray-600">
                          {t('inventoryAlerts.criticalIssues.min')}: {product.lowStockThreshold}
                        </p>
                      </div>
                    </div>
                ))}
                {lowStockData.turnover.products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm">{t('inventoryAlerts.criticalIssues.sufficientStock')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('inventoryAlerts.criticalIssues.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-600" />
            {t('inventoryAlerts.settings.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{t('inventoryAlerts.settings.lowStockThreshold')}</h4>
              <p className="text-sm text-gray-600 mb-3">
                {t('inventoryAlerts.settings.lowStockDescription')}
              </p>
              <Badge variant="outline" className="text-green-600 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                {t('inventoryAlerts.settings.enabled')}
              </Badge>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{t('inventoryAlerts.settings.outOfStock')}</h4>
              <p className="text-sm text-gray-600 mb-3">
                {t('inventoryAlerts.settings.outOfStockDescription')}
              </p>
              <Badge variant="outline" className="text-green-600 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                {t('inventoryAlerts.settings.enabled')}
              </Badge>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{t('inventoryAlerts.settings.realTimeUpdates')}</h4>
              <p className="text-sm text-gray-600 mb-3">
                {t('inventoryAlerts.settings.realTimeDescription')}
              </p>
              <Badge variant="outline" className={isConnected ? "text-green-600 border-green-300" : "text-red-600 border-red-300"}>
                {isConnected ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t('inventoryAlerts.settings.connected')}
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    {t('inventoryAlerts.settings.disconnected')}
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryAlerts;