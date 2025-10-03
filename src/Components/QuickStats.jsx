import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api';

const QuickStats = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    weekSales: 0,
    weekRevenue: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuickStats = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Format dates for API
        const todayStr = today.toISOString().split('T')[0];
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        // Fetch today's sales
        const todayResponse = await apiClient.get('/sales', {
          params: {
            startDate: todayStr,
            endDate: todayStr,
            limit: 100
          }
        });

        // Fetch week's sales
        const weekResponse = await apiClient.get('/sales', {
          params: {
            startDate: weekAgoStr,
            endDate: todayStr,
            limit: 500
          }
        });

        const todaySales = todayResponse.data.data?.sales || [];
        const weekSales = weekResponse.data.data?.sales || [];

        // Calculate stats
        const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.totalAmount || sale.saleCost || 0), 0);
        const weekRevenue = weekSales.reduce((sum, sale) => sum + (sale.totalAmount || sale.saleCost || 0), 0);

        // Get recent activity (last 5 sales)
        const recentActivity = weekSales.slice(0, 5).map(sale => ({
          id: sale._id,
          type: 'sale',
          amount: sale.totalAmount || sale.saleCost || 0,
          time: sale.createdAt,
          customer: sale.customerName || 'Walk-in Customer',
          items: sale.soldProducts?.length || 0
        }));

        setStats({
          todaySales: todaySales.length,
          todayRevenue,
          weekSales: weekSales.length,
          weekRevenue,
          recentActivity
        });

      } catch (error) {
        console.error('Error fetching quick stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuickStats();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchQuickStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('quickStats.justNow');
    if (diffInMinutes < 60) return t('quickStats.minutesAgo', { count: diffInMinutes });
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('quickStats.hoursAgo', { count: diffInHours });
    
    const diffInDays = Math.floor(diffInHours / 24);
    return t('quickStats.daysAgo', { count: diffInDays });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{t('quickStats.quickStats')}</h3>
          <div className="text-xs opacity-75">{t('quickStats.refreshInterval')}</div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Performance Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-600">
              {stats.todaySales}
            </div>
            <div className="text-xs text-blue-500">{t('quickStats.todaySales')}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-600">
              ₹{stats.todayRevenue > 999 ? `${(stats.todayRevenue/1000).toFixed(1)}k` : stats.todayRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-green-500">{t('quickStats.todayRevenue')}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-purple-600">
              {stats.weekSales}
            </div>
            <div className="text-xs text-purple-500">{t('quickStats.weekSales')}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-orange-600">
              ₹{stats.weekRevenue > 999 ? `${(stats.weekRevenue/1000).toFixed(1)}k` : stats.weekRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-orange-500">{t('quickStats.weekRevenue')}</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">{t('quickStats.recentActivity')}</h4>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {stats.recentActivity.slice(0, 3).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs font-medium text-gray-900 truncate">
                        {activity.customer}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 ml-3.5">
                      {t('quickStats.itemsCount', { count: activity.items })} • {formatTimeAgo(activity.time)}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xs font-medium text-green-600">
                      ₹{activity.amount > 999 ? `${(activity.amount/1000).toFixed(1)}k` : activity.amount.toFixed(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="text-gray-400 text-xs">{t('quickStats.noRecentActivity')}</div>
            </div>
          )}
        </div>

        {/* Performance Indicators */}
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">{t('quickStats.keyMetrics')}</h4>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">{t('quickStats.avgOrderToday')}</span>
              <span className="text-xs font-medium">
                ₹{stats.todaySales > 0 ? Math.round(stats.todayRevenue / stats.todaySales) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">{t('quickStats.dailyAvgWeek')}</span>
              <span className="text-xs font-medium">
                ₹{Math.round(stats.weekRevenue / 7).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">{t('quickStats.salesPerDay')}</span>
              <span className="text-xs font-medium">
                {(stats.weekSales / 7).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;