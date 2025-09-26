import React, { useState, useEffect } from 'react';
import inventoryDataService from '../services/inventoryDataService';

const DataConsistencyTest = () => {
  const [testResults, setTestResults] = useState({
    dashboard: null,
    analytics: null,
    alerts: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const runConsistencyTest = async () => {
      try {
        console.log('Running data consistency test...');

        // Fetch data from all sources
        const [dashboardData, analyticsData, alertsData] = await Promise.all([
          inventoryDataService.getDashboardMetrics(),
          inventoryDataService.getAnalyticsData(),
          inventoryDataService.getLowStockAlerts()
        ]);

        console.log('Data fetched successfully:', {
          dashboard: {
            lowStockItems: dashboardData.inventory.lowStockItems,
            outOfStockItems: dashboardData.inventory.outOfStockItems,
            totalProducts: dashboardData.inventory.totalProducts
          },
          analytics: {
            lowStockItems: analyticsData.inventoryStatus.lowStockItems,
            outOfStockItems: analyticsData.inventoryStatus.outOfStockItems,
            totalProducts: analyticsData.inventoryStatus.totalProducts
          },
          alerts: {
            alertsCount: alertsData.length,
            criticalAlerts: alertsData.filter(a => a.urgency === 'critical').length,
            highAlerts: alertsData.filter(a => a.urgency === 'high').length
          }
        });

        setTestResults({
          dashboard: dashboardData.inventory,
          analytics: analyticsData.inventoryStatus,
          alerts: alertsData,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Data consistency test failed:', error);
        setTestResults({
          dashboard: null,
          analytics: null,
          alerts: null,
          loading: false,
          error: error.message
        });
      }
    };

    runConsistencyTest();
  }, []);

  if (testResults.loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mr-3"></div>
          <span className="text-blue-700 font-medium">Running data consistency test...</span>
        </div>
      </div>
    );
  }

  if (testResults.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div>
            <h3 className="text-red-800 font-medium">Data Test Failed</h3>
            <p className="text-red-600 text-sm mt-1">{testResults.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { dashboard, analytics, alerts } = testResults;
  const isConsistent = dashboard && analytics && 
    dashboard.lowStockItems === analytics.lowStockItems &&
    dashboard.outOfStockItems === analytics.outOfStockItems &&
    dashboard.totalProducts === analytics.totalProducts;

  return (
    <div className={`border rounded-lg p-4 m-4 ${isConsistent ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-center mb-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${isConsistent ? 'bg-green-500' : 'bg-yellow-500'}`}>
          <span className="text-white font-bold text-sm">{isConsistent ? 'OK' : '!'}</span>
        </div>
        <h3 className={`font-bold text-lg ${isConsistent ? 'text-green-800' : 'text-yellow-800'}`}>
          Data Consistency Test {isConsistent ? 'PASSED' : 'ISSUES DETECTED'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-white rounded-md p-3 border">
          <h4 className="font-semibold text-slate-700 mb-2">Dashboard Data</h4>
          <ul className="space-y-1 text-slate-600">
            <li>Total Products: <span className="font-medium">{dashboard?.totalProducts || 0}</span></li>
            <li>Low Stock: <span className="font-medium text-yellow-600">{dashboard?.lowStockItems || 0}</span></li>
            <li>Out of Stock: <span className="font-medium text-red-600">{dashboard?.outOfStockItems || 0}</span></li>
          </ul>
        </div>

        <div className="bg-white rounded-md p-3 border">
          <h4 className="font-semibold text-slate-700 mb-2">Analytics Data</h4>
          <ul className="space-y-1 text-slate-600">
            <li>Total Products: <span className="font-medium">{analytics?.totalProducts || 0}</span></li>
            <li>Low Stock: <span className="font-medium text-yellow-600">{analytics?.lowStockItems || 0}</span></li>
            <li>Out of Stock: <span className="font-medium text-red-600">{analytics?.outOfStockItems || 0}</span></li>
          </ul>
        </div>

        <div className="bg-white rounded-md p-3 border">
          <h4 className="font-semibold text-slate-700 mb-2">Alerts Data</h4>
          <ul className="space-y-1 text-slate-600">
            <li>Total Alerts: <span className="font-medium">{alerts?.length || 0}</span></li>
            <li>Critical: <span className="font-medium text-red-600">{alerts?.filter(a => a.urgency === 'critical').length || 0}</span></li>
            <li>High Priority: <span className="font-medium text-orange-600">{alerts?.filter(a => a.urgency === 'high').length || 0}</span></li>
          </ul>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        <p>Cache Status: Data is cached for 5 minutes to ensure consistency across pages.</p>
        <p>Last Update: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default DataConsistencyTest;