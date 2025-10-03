import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import inventoryDataService from '../services/inventoryDataService';
import apiClient from '../api';

// Shared loading component
export const LoadingSpinner = ({ title, subtitle }) => (
  <div className="min-h-screen bg-slate-50 flex justify-center items-center">
    <div className="bg-white p-8 rounded-lg shadow-lg border text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
      <p className="text-xl font-semibold text-slate-700 mb-2">{title}</p>
      <p className="text-slate-500">{subtitle}</p>
    </div>
  </div>
);

// Shared error component
export const ErrorDisplay = ({ error, onRetry }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center">
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white p-8 rounded-lg shadow-lg border border-red-200 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-red-600 text-2xl font-bold">!</div>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">{t('common.dataLoadError')}</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={onRetry}
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            {t('common.retryLoading')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Shared message display component
export const MessageDisplay = ({ message, onClose }) => {
  if (!message) return null;
  
  const isSuccess = message.includes('successfully') || message.includes('Exporting');
  
  return (
    <div className="mb-6">
      <div className={`p-4 rounded-xl shadow-lg border ${
        isSuccess
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200'
          : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mr-3 text-sm font-bold ${
              isSuccess ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {isSuccess ? 'OK' : '!'}
            </div>
            <span className="font-medium">{message}</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-lg font-bold">
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Shared date range filter component
export const DateRangeFilter = ({ dateRange, onChange, onExportSales, onExportInventory }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/30">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-slate-700 mb-2">{t('common.startDate')}</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-slate-700 mb-2">{t('common.endDate')}</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => onChange('endDate', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        {onExportSales && onExportInventory && (
          <div className="flex gap-3">
            <button
              onClick={onExportSales}
              className="group flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-lg hover:from-emerald-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="font-medium">{t('common.exportSales')}</span>
            </button>
            <button
              onClick={onExportInventory}
              className="group flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="font-medium">{t('common.exportInventory')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Shared metric card component
export const MetricCard = ({ title, value, subtitle, gradient, icon, color }) => (
  <div className={`group relative ${gradient} p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-${color}-400/20`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
    <div className="relative flex items-center justify-between">
      <div className="space-y-2">
        <p className={`text-${color}-100 text-sm font-medium uppercase tracking-wide`}>{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        <p className={`text-${color}-200 text-sm flex items-center`}>
          <span className={`w-2 h-2 bg-${color}-300 rounded-full mr-2`}></span>
          {subtitle}
        </p>
      </div>
      <div className="text-5xl opacity-90 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
    </div>
    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${color}-400 to-${color}-300 rounded-b-2xl`}></div>
  </div>
);

// Shared CSV export functionality
export const useCSVExport = () => {
  const { t } = useTranslation();
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      return { success: false, message: t('common.noDataToExport') };
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

    return { success: true, message: t('common.dataExportedSuccessfully') };
  };

  const exportSalesData = async (dateRange) => {
    try {
      const response = await apiClient.get('/reports/export/sales', {
        params: dateRange
      });
      return exportToCSV(response.data.data, 'sales-report');
    } catch (error) {
      console.error('Error exporting sales data:', error);
      return { success: false, message: t('common.failedToExportSalesData') };
    }
  };

  const exportInventoryData = async () => {
    try {
      const response = await apiClient.get('/reports/export/inventory');
      return exportToCSV(response.data.data, 'inventory-report');
    } catch (error) {
      console.error('Error exporting inventory data:', error);
      return { success: false, message: t('common.failedToExportInventoryData') };
    }
  };

  return { exportSalesData, exportInventoryData };
};

// Shared data fetching hook
export const useReportsAnalyticsData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  // Fetch dashboard metrics using centralized service
  const fetchDashboardMetrics = async (dateRange) => {
    try {
      const metrics = await inventoryDataService.getDashboardMetrics(dateRange);
      setDashboardMetrics(metrics);
      console.log('Loaded consistent data:', {
        lowStockItems: metrics.inventory.lowStockItems,
        source: 'centralized-service'
      });
      return metrics;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw new Error('Failed to load dashboard metrics');
    }
  };

  // Fetch sales report
  const fetchSalesReport = async (dateRange, page = 1) => {
    try {
      const response = await apiClient.get('/reports/sales', {
        params: { ...dateRange, page, limit: 10 }
      });
      setSalesReport(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching sales report:', error);
      throw new Error('Failed to load sales report');
    }
  };

  // Fetch inventory report
  const fetchInventoryReport = async (page = 1, lowStock = false) => {
    try {
      const response = await apiClient.get('/reports/inventory', {
        params: { page, limit: 10, lowStock }
      });
      setInventoryReport(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      throw new Error('Failed to load inventory report');
    }
  };

  // Fetch low stock alerts using centralized service
  const fetchLowStockAlerts = async () => {
    try {
      const alerts = await inventoryDataService.getLowStockAlerts();
      setLowStockAlerts(alerts);
      console.log('Low stock alerts loaded:', {
        alertsCount: alerts.length,
        source: 'centralized-service'
      });
      return alerts;
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
      throw new Error('Failed to load low stock alerts');
    }
  };

  return {
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
  };
};

export default {
  LoadingSpinner,
  ErrorDisplay,
  MessageDisplay,
  DateRangeFilter,
  MetricCard,
  useCSVExport,
  useReportsAnalyticsData
};