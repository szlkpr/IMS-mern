import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Common chart options with professional styling
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          size: 12,
          weight: 500,
          family: "'Inter', 'system-ui', sans-serif"
        },
        color: '#475569', // Slate-600
        padding: 20,
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)', // Slate-900 with opacity
      titleColor: '#f8fafc', // Slate-50
      bodyColor: '#f1f5f9', // Slate-100
      borderColor: '#334155', // Slate-700
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 12
      },
      displayColors: true,
      boxPadding: 4
    }
  },
  layout: {
    padding: {
      top: 10,
      bottom: 10
    }
  },
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6,
      borderWidth: 2
    },
    line: {
      borderWidth: 3
    },
    bar: {
      borderRadius: 4,
      borderSkipped: false
    }
  }
};

// Professional color palette
export const professionalColors = {
  primary: {
    main: '#3b82f6',      // Blue-500
    light: '#60a5fa',     // Blue-400
    dark: '#1d4ed8',      // Blue-700
    bg: 'rgba(59, 130, 246, 0.1)'
  },
  success: {
    main: '#10b981',      // Emerald-500
    light: '#34d399',     // Emerald-400
    dark: '#047857',      // Emerald-700
    bg: 'rgba(16, 185, 129, 0.1)'
  },
  warning: {
    main: '#f59e0b',      // Amber-500
    light: '#fbbf24',     // Amber-400
    dark: '#d97706',      // Amber-600
    bg: 'rgba(245, 158, 11, 0.1)'
  },
  danger: {
    main: '#ef4444',      // Red-500
    light: '#f87171',     // Red-400
    dark: '#dc2626',      // Red-600
    bg: 'rgba(239, 68, 68, 0.1)'
  },
  purple: {
    main: '#8b5cf6',      // Violet-500
    light: '#a78bfa',     // Violet-400
    dark: '#7c3aed',      // Violet-600
    bg: 'rgba(139, 92, 246, 0.1)'
  },
  slate: {
    main: '#64748b',      // Slate-500
    light: '#94a3b8',     // Slate-400
    dark: '#475569',      // Slate-600
    bg: 'rgba(100, 116, 139, 0.1)'
  }
};

// Professional chart container component
export const ChartContainer = ({ title, children, height = "h-80", showBorder = true }) => (
  <div className={`${showBorder ? 'bg-white rounded-xl shadow-sm border border-slate-200' : ''} p-6 ${height}`}>
    {title && (
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          {title}
        </h3>
        <div className="h-px bg-gradient-to-r from-blue-500 to-purple-500 mt-2 mb-4"></div>
      </div>
    )}
    <div className="h-full">
      {children}
    </div>
  </div>
);

// Enhanced empty state component
export const ChartEmptyState = ({ icon, message, subtitle, height = "h-64" }) => (
  <div className={`flex items-center justify-center ${height}`}>
    <div className="text-center p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border-2 border-dashed border-slate-300">
      <div className="text-6xl mb-4 opacity-60 animate-pulse">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{message}</h3>
      <p className="text-sm text-slate-500 max-w-xs mx-auto">{subtitle}</p>
    </div>
  </div>
);

// Sales Trend Line Chart with enhanced styling
export const SalesTrendChart = ({ data, title, showContainer = true }) => {
  const { t } = useTranslation();
  const chartTitle = title || t('charts.salesTrend');
  
  if (!data || data.length === 0) {
    return (
      <ChartContainer title={showContainer ? chartTitle : null} showBorder={showContainer}>
        <ChartEmptyState 
          icon="TREND" 
          message={t('charts.noSalesDataAvailable')} 
          subtitle={t('charts.salesTrendsSubtitle')}
          height="h-60"
        />
      </ChartContainer>
    );
  }

  const chartData = {
    labels: data.map(item => {
      if (item._id && item._id.month) {
        const date = new Date(2024, item._id.month - 1);
        return date.toLocaleDateString('default', { month: 'short', year: '2-digit' });
      }
      return item.date || item._id || 'Unknown';
    }),
    datasets: [
      {
        label: t('charts.revenueCurrency'),
        data: data.map(item => item.revenue || item.totalRevenue || 0),
        borderColor: professionalColors.primary.main,
        backgroundColor: professionalColors.primary.bg,
        pointBackgroundColor: professionalColors.primary.main,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: professionalColors.primary.dark,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: chartTitle,
        font: {
          size: 18,
          weight: 'bold',
          family: "'Inter', 'system-ui', sans-serif"
        },
        color: '#1e293b', // Slate-800
        padding: 20
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)', // Slate-400 with opacity
          drawBorder: false
        },
        ticks: {
          color: '#64748b', // Slate-500
          font: {
            size: 11,
            weight: 500
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            weight: 500
          },
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  const ChartContent = () => (
    <div className="relative h-64">
      <Line data={chartData} options={options} />
    </div>
  );

  return showContainer ? (
    <ChartContainer title={chartTitle}>
      <ChartContent />
    </ChartContainer>
  ) : (
    <ChartContent />
  );
};

// Top Products Bar Chart
export const TopProductsChart = ({ data, title, showContainer = true }) => {
  const { t } = useTranslation();
  const chartTitle = title || t('charts.topSellingProducts');
  
  if (!data || data.length === 0) {
    return (
      <ChartContainer title={showContainer ? chartTitle : null} showBorder={showContainer}>
        <ChartEmptyState 
          icon="PROD" 
          message={t('charts.noProductDataAvailable')} 
          subtitle={t('charts.topProductsSubtitle')}
          height="h-60"
        />
      </ChartContainer>
    );
  }

  const chartData = {
    labels: data.slice(0, 5).map(item => 
      (item.productName || item.name || item._id?.productName || t('charts.unknownProduct')).length > 15
        ? (item.productName || item.name || item._id?.productName || t('charts.unknownProduct')).substring(0, 15) + '...' 
        : (item.productName || item.name || item._id?.productName || t('charts.unknownProduct'))
    ),
    datasets: [
      {
        label: t('charts.quantitySold'),
        data: data.slice(0, 5).map(item => item.totalQuantity || item.quantity || 0),
        backgroundColor: [
          professionalColors.primary.main + '99', // 60% opacity
          professionalColors.success.main + '99',
          professionalColors.danger.main + '99',
          professionalColors.warning.main + '99',
          professionalColors.purple.main + '99',
        ],
        borderColor: [
          professionalColors.primary.main,
          professionalColors.success.main,
          professionalColors.danger.main,
          professionalColors.warning.main,
          professionalColors.purple.main,
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !showContainer,
        text: chartTitle,
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', 'system-ui', sans-serif"
        },
        color: '#1e293b'
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: 500 }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          stepSize: 1,
          color: '#64748b',
          font: { size: 11, weight: 500 }
        }
      }
    }
  };

  const ChartContent = () => (
    <div className="relative h-60">
      <Bar data={chartData} options={options} />
    </div>
  );

  return showContainer ? (
    <ChartContainer title={chartTitle}>
      <ChartContent />
    </ChartContainer>
  ) : (
    <ChartContent />
  );
};

// Inventory Status Doughnut Chart
export const InventoryStatusChart = ({ data, title, showContainer = true }) => {
  const { t } = useTranslation();
  const chartTitle = title || t('charts.inventoryStatus');
  
  if (!data) {
    return (
      <ChartContainer title={showContainer ? chartTitle : null} showBorder={showContainer}>
        <ChartEmptyState 
          icon="INV" 
          message={t('charts.noInventoryDataAvailable')} 
          subtitle={t('charts.inventoryStatusSubtitle')}
          height="h-60"
        />
      </ChartContainer>
    );
  }

  const totalProducts = data.totalProducts || 0;
  const lowStockItems = data.lowStockItems || 0;
  const outOfStockItems = data.outOfStockItems || 0;
  const inStockItems = Math.max(0, totalProducts - lowStockItems - outOfStockItems);
  
  const chartData = {
    labels: [t('charts.inStock'), t('charts.lowStock'), t('charts.outOfStock')],
    datasets: [
      {
        data: [inStockItems, lowStockItems, outOfStockItems],
        backgroundColor: [
          professionalColors.success.main + '99', // Green for in stock
          professionalColors.warning.main + '99',  // Yellow for low stock
          professionalColors.danger.main + '99', // Red for out of stock
        ],
        borderColor: [
          professionalColors.success.main,
          professionalColors.warning.main,
          professionalColors.danger.main,
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !showContainer,
        text: chartTitle,
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', 'system-ui', sans-serif"
        },
        color: '#1e293b'
      },
    },
    cutout: '60%',
  };

  const ChartContent = () => (
    <div className="relative h-60 flex items-center justify-center">
      <div className="relative w-full h-full">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{inStockItems + lowStockItems + outOfStockItems}</div>
            <div className="text-xs text-slate-500">{t('charts.totalItems')}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return showContainer ? (
    <ChartContainer title={chartTitle}>
      <ChartContent />
    </ChartContainer>
  ) : (
    <ChartContent />
  );
};

// Revenue vs Profit Chart
export const RevenueChart = ({ salesData, title = "Monthly Revenue", showContainer = true }) => {
  if (!salesData || salesData.length === 0) {
    return (
      <ChartContainer title={showContainer ? title : null} showBorder={showContainer}>
        <ChartEmptyState 
          icon="REV" 
          message="No Revenue Data Available" 
          subtitle="Revenue analytics will appear here once sales are recorded"
          height="h-60"
        />
      </ChartContainer>
    );
  }

  const chartData = {
    labels: salesData.map(item => {
      if (item._id && item._id.month) {
        const date = new Date(2024, item._id.month - 1);
        return date.toLocaleDateString('default', { month: 'short' });
      }
      return item.date || item._id || 'Unknown';
    }),
    datasets: [
      {
        type: 'bar',
        label: 'Revenue ($)',
        data: salesData.map(item => item.revenue || item.totalRevenue || 0),
        backgroundColor: professionalColors.primary.main + '99',
        borderColor: professionalColors.primary.main,
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Sales Count',
        data: salesData.map(item => item.sales || item.totalSales || 0),
        borderColor: professionalColors.danger.main,
        backgroundColor: professionalColors.danger.bg,
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !showContainer,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', 'system-ui', sans-serif"
        },
        color: '#1e293b'
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: 500 }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: 500 },
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: 500 }
        }
      },
    },
  };

  const ChartContent = () => (
    <div className="relative h-60">
      <Bar data={chartData} options={options} />
    </div>
  );

  return showContainer ? (
    <ChartContainer title={title}>
      <ChartContent />
    </ChartContainer>
  ) : (
    <ChartContent />
  );
};

// Category Distribution Pie Chart
export const CategoryChart = ({ data, title = "Product Distribution by Category", showContainer = true }) => {
  if (!data || data.length === 0) {
    return (
      <ChartContainer title={showContainer ? title : null} showBorder={showContainer}>
        <ChartEmptyState 
          icon="CAT" 
          message="No Category Data Available" 
          subtitle="Product categories will appear here once products are added"
          height="h-60"
        />
      </ChartContainer>
    );
  }

  const colors = [
    professionalColors.primary.main + '99',
    professionalColors.success.main + '99',
    professionalColors.danger.main + '99',
    professionalColors.warning.main + '99',
    professionalColors.purple.main + '99',
    '#ec4899' + '99', // Pink
    '#22c55e' + '99', // Emerald
    '#f97316' + '99', // Orange
  ];

  const chartData = {
    labels: data.map(item => item.name || item._id?.categoryName || 'Uncategorized'),
    datasets: [
      {
        data: data.map(item => item.productCount || item.count || 1),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length).map(color => color.replace('0.8', '1')),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !showContainer,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', 'system-ui', sans-serif"
        },
        color: '#1e293b'
      },
    },
  };

  const ChartContent = () => (
    <div className="relative h-60">
      <Pie data={chartData} options={options} />
    </div>
  );

  return showContainer ? (
    <ChartContainer title={title}>
      <ChartContent />
    </ChartContainer>
  ) : (
    <ChartContent />
  );
};

// Stock Value Chart
export const StockValueChart = ({ data, title = "Inventory Value Analysis", showContainer = true }) => {
  if (!data || data.length === 0) {
    return (
      <ChartContainer title={showContainer ? title : null} showBorder={showContainer}>
        <ChartEmptyState 
          icon="VAL" 
          message="No Stock Data Available" 
          subtitle="Inventory values will appear here once products are added"
          height="h-60"
        />
      </ChartContainer>
    );
  }

  const chartData = {
    labels: data.map(item => 
      (item.name || 'Unknown Product').length > 20 ? (item.name || 'Unknown Product').substring(0, 20) + '...' : (item.name || 'Unknown Product')
    ),
    datasets: [
      {
        label: 'Inventory Value ($)',
        data: data.map(item => item.inventoryValue || (item.stock * item.retailPrice) || 0),
        backgroundColor: professionalColors.success.main + '99',
        borderColor: professionalColors.success.main,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    ...commonOptions,
    indexAxis: 'y', // Horizontal bar chart
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !showContainer,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', 'system-ui', sans-serif"
        },
        color: '#1e293b'
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: 500 },
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: 500 }
        }
      }
    }
  };

  const ChartContent = () => (
    <div className="relative h-60">
      <Bar data={chartData} options={options} />
    </div>
  );

  return showContainer ? (
    <ChartContainer title={title}>
      <ChartContent />
    </ChartContainer>
  ) : (
    <ChartContent />
  );
};

// Hourly Sales Chart for Real-time Dashboard
export const HourlySalesChart = ({ data, title = "Today's Hourly Sales", showContainer = true }) => {
  if (!data || data.length === 0) {
    return (
      <ChartContainer title={showContainer ? title : null} showBorder={showContainer}>
        <ChartEmptyState 
          icon="TIME" 
          message="No Sales Data Today" 
          subtitle="Hourly sales data will appear here throughout the day"
          height="h-60"
        />
      </ChartContainer>
    );
  }

  const chartData = {
    labels: data.map(item => `${item._id || item.hour}:00`),
    datasets: [
      {
        label: 'Sales Count',
        data: data.map(item => item.salesCount || item.count || 0),
        backgroundColor: professionalColors.success.main + '99',
        borderColor: professionalColors.success.main,
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Revenue ($)',
        data: data.map(item => item.revenue || 0),
        type: 'line',
        borderColor: professionalColors.primary.main,
        backgroundColor: professionalColors.primary.bg,
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !showContainer,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', 'system-ui', sans-serif"
        },
        color: '#1e293b'
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: 500 }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          stepSize: 1,
          color: '#64748b',
          font: { size: 11, weight: 500 }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: 500 },
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      },
    },
  };

  const ChartContent = () => (
    <div className="relative h-60">
      <Bar data={chartData} options={options} />
    </div>
  );

  return showContainer ? (
    <ChartContainer title={title}>
      <ChartContent />
    </ChartContainer>
  ) : (
    <ChartContent />
  );
};

// Profit Margin Chart
export const ProfitMarginChart = ({ data, title = "Profit Margins by Product", showContainer = true }) => {
  if (!data || data.length === 0) {
    return (
      <ChartContainer title={showContainer ? title : null} showBorder={showContainer}>
        <ChartEmptyState 
          icon="PROF" 
          message="No Profit Data Available" 
          subtitle="Profit margins will appear here once sales are recorded"
          height="h-60"
        />
      </ChartContainer>
    );
  }

  const chartData = {
    labels: data.map(item => 
      (item._id?.productName || item.productName || 'Unknown').length > 15 
        ? (item._id?.productName || item.productName || 'Unknown').substring(0, 15) + '...' 
        : (item._id?.productName || item.productName || 'Unknown')
    ),
    datasets: [
      {
        label: 'Profit Margin (%)',
        data: data.map(item => item.profitMargin || 0),
        backgroundColor: data.map(item => {
          const margin = item.profitMargin || 0;
          if (margin >= 25) return professionalColors.success.main + '99'; // Green for good margins
          if (margin >= 15) return professionalColors.warning.main + '99'; // Yellow for moderate margins
          return professionalColors.danger.main + '99'; // Red for low margins
        }),
        borderColor: data.map(item => {
          const margin = item.profitMargin || 0;
          if (margin >= 25) return professionalColors.success.main;
          if (margin >= 15) return professionalColors.warning.main;
          return professionalColors.danger.main;
        }),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: !showContainer,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', 'system-ui', sans-serif"
        },
        color: '#1e293b'
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: 500 }
        }
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: { size: 11, weight: 500 },
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  const ChartContent = () => (
    <div className="relative h-60">
      <Bar data={chartData} options={options} />
    </div>
  );

  return showContainer ? (
    <ChartContainer title={title}>
      <ChartContent />
    </ChartContainer>
  ) : (
    <ChartContent />
  );
};