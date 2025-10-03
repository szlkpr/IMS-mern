import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api';

const BusinessCalendar = () => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarData, setCalendarData] = useState({});

  // Get calendar information
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();

  // Month names
  const monthNames = [
    t('calendar.months.january'), t('calendar.months.february'), t('calendar.months.march'), 
    t('calendar.months.april'), t('calendar.months.may'), t('calendar.months.june'),
    t('calendar.months.july'), t('calendar.months.august'), t('calendar.months.september'), 
    t('calendar.months.october'), t('calendar.months.november'), t('calendar.months.december')
  ];

  // Day names
  const dayNames = [
    t('calendar.days.sun'), t('calendar.days.mon'), t('calendar.days.tue'), 
    t('calendar.days.wed'), t('calendar.days.thu'), t('calendar.days.fri'), t('calendar.days.sat')
  ];

  // Fetch sales data for the current month
  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        // Get start and end of current month
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

        // Format dates for API
        const startDate = startOfMonth.toISOString().split('T')[0];
        const endDate = endOfMonth.toISOString().split('T')[0];

        // Fetch sales data for the month
        const salesResponse = await apiClient.get('/sales', {
          params: {
            startDate,
            endDate,
            limit: 1000 // Get all sales for the month
          }
        });

        const sales = salesResponse.data.data?.sales || [];
        setSalesData(sales);

        // Process sales data by date
        const dailyData = {};
        sales.forEach(sale => {
          const saleDate = new Date(sale.createdAt).toDateString();
          if (!dailyData[saleDate]) {
            dailyData[saleDate] = {
              sales: 0,
              revenue: 0,
              transactions: 0,
              items: 0
            };
          }
          dailyData[saleDate].transactions += 1;
          dailyData[saleDate].revenue += sale.totalAmount || sale.saleCost || 0;
          dailyData[saleDate].items += sale.soldProducts?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        });

        setCalendarData(dailyData);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [currentMonth, currentYear]);

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // Get data for a specific date
  const getDateData = (day) => {
    if (!day) return null;
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toDateString();
    return calendarData[dateString] || null;
  };

  // Get color intensity based on revenue
  const getDateColor = (day) => {
    if (!day) return '';
    
    const data = getDateData(day);
    if (!data) return '';

    const revenue = data.revenue;
    if (revenue === 0) return '';
    if (revenue < 1000) return 'bg-green-100 border-green-200';
    if (revenue < 5000) return 'bg-green-200 border-green-300';
    if (revenue < 10000) return 'bg-green-300 border-green-400';
    if (revenue < 20000) return 'bg-green-400 border-green-500';
    return 'bg-green-500 border-green-600 text-white';
  };

  // Check if date is today
  const isToday = (day) => {
    if (!day) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === today.toDateString();
  };

  // Handle date selection
  const handleDateClick = (day) => {
    if (!day) return;
    const date = new Date(currentYear, currentMonth, day);
    setSelectedDate(date);
  };

  // Get selected date details
  const getSelectedDateDetails = () => {
    if (!selectedDate) return null;
    const data = getDateData(selectedDate.getDate());
    return {
      date: selectedDate,
      data: data || { transactions: 0, revenue: 0, items: 0 }
    };
  };

  const selectedDetails = getSelectedDateDetails();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <span className="ml-2 text-gray-600">{t('calendar.loadingCalendar')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden h-full flex flex-col">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('calendar.businessCalendar')}</h3>
          <button
            onClick={goToToday}
            className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 transition-colors"
          >
            {t('calendar.today')}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1">
          <button
            onClick={goToPreviousMonth}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-sm font-bold">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          
          <button
            onClick={goToNextMonth}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="text-blue-100 text-sm mt-1">{t('calendar.dailySalesOverview')}</p>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-1 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dateData = getDateData(day);
            const colorClass = getDateColor(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={index}
                className={`
                  relative h-8 border rounded cursor-pointer transition-all duration-200 hover:shadow-sm
                  ${day ? 'hover:bg-gray-50' : ''}
                  ${colorClass}
                  ${isCurrentDay ? 'ring-1 ring-blue-500' : 'border-gray-200'}
                  ${selectedDate && selectedDate.getDate() === day ? 'ring-1 ring-purple-500' : ''}
                `}
                onClick={() => handleDateClick(day)}
              >
                {day && (
                  <div className="p-1 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-medium ${
                        colorClass.includes('text-white') ? 'text-white' : 
                        isCurrentDay ? 'text-blue-600 font-bold' : 'text-gray-900'
                      }`}>
                        {day}
                      </span>
                      {isCurrentDay && (
                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    
                    {dateData && (
                      <div className="text-xs">
                        <div className={`font-medium text-xs ${colorClass.includes('text-white') ? 'text-white' : 'text-gray-700'}`}>
                          ₹{dateData.revenue > 999 ? `${(dateData.revenue/1000).toFixed(0)}k` : dateData.revenue.toFixed(0)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Info */}
      <div className="border-t bg-gray-50 p-3">
        <div className="text-center">
          <div className="text-sm font-medium text-gray-700">
            ₹{salesData.reduce((sum, sale) => sum + (sale.totalAmount || sale.saleCost || 0), 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-500">{t('calendar.transactionsThisMonth', { count: salesData.length })}</div>
        </div>
        
        {selectedDetails && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs font-medium text-gray-900 mb-1">
              {selectedDetails.date.toLocaleDateString('en-IN', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="font-bold text-blue-600">
                  {selectedDetails.data.transactions}
                </div>
                <div className="text-gray-500">{t('calendar.sales')}</div>
              </div>
              
              <div className="text-center">
                <div className="font-bold text-green-600">
                  ₹{selectedDetails.data.revenue > 999 ? 
                    `${(selectedDetails.data.revenue/1000).toFixed(0)}K` : 
                    selectedDetails.data.revenue.toFixed(0)}
                </div>
                <div className="text-gray-500">{t('calendar.revenue')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessCalendar;