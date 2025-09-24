import React from 'react';
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

// Common chart options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
};

// Sales Trend Line Chart
export const SalesTrendChart = ({ data, title = "Sales Trend" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No sales data available
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => {
      const date = new Date(2024, item._id.month - 1);
      return date.toLocaleDateString('default', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: data.map(item => item.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};

// Top Products Bar Chart
export const TopProductsChart = ({ data, title = "Top Selling Products" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No product data available
      </div>
    );
  }

  const chartData = {
    labels: data.slice(0, 5).map(item => 
      item.productName.length > 15 
        ? item.productName.substring(0, 15) + '...' 
        : item.productName
    ),
    datasets: [
      {
        label: 'Quantity Sold',
        data: data.slice(0, 5).map(item => item.totalQuantity),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 101, 101, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(139, 92, 246, 1)',
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
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Inventory Status Doughnut Chart
export const InventoryStatusChart = ({ data, title = "Inventory Status" }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No inventory data available
      </div>
    );
  }

  const inStockItems = Math.max(0, data.totalProducts - data.lowStockItems - data.outOfStockItems);
  
  const chartData = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
    datasets: [
      {
        data: [inStockItems, data.lowStockItems, data.outOfStockItems],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // Green for in stock
          'rgba(251, 191, 36, 0.8)',  // Yellow for low stock
          'rgba(245, 101, 101, 0.8)', // Red for out of stock
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(245, 101, 101, 1)',
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
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
  };

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

// Revenue vs Profit Chart
export const RevenueChart = ({ salesData, title = "Monthly Revenue" }) => {
  if (!salesData || salesData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No revenue data available
      </div>
    );
  }

  const chartData = {
    labels: salesData.map(item => {
      const date = new Date(2024, item._id.month - 1);
      return date.toLocaleDateString('default', { month: 'short' });
    }),
    datasets: [
      {
        type: 'bar',
        label: 'Revenue (₹)',
        data: salesData.map(item => item.revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        type: 'line',
        label: 'Sales Count',
        data: salesData.map(item => item.sales),
        borderColor: 'rgba(245, 101, 101, 1)',
        backgroundColor: 'rgba(245, 101, 101, 0.1)',
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
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        ticks: {
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
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Category Distribution Pie Chart
export const CategoryChart = ({ data, title = "Product Distribution by Category" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No category data available
      </div>
    );
  }

  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(245, 101, 101, 0.8)',  // Red
    'rgba(251, 191, 36, 0.8)',   // Yellow
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(34, 197, 94, 0.8)',    // Emerald
    'rgba(249, 115, 22, 0.8)',   // Orange
  ];

  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.productCount || 1),
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
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
  };

  return (
    <div className="h-64">
      <Pie data={chartData} options={options} />
    </div>
  );
};

// Stock Value Chart
export const StockValueChart = ({ data, title = "Inventory Value Analysis" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No stock data available
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => 
      item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name
    ),
    datasets: [
      {
        label: 'Inventory Value (₹)',
        data: data.map(item => item.inventoryValue || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
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
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};