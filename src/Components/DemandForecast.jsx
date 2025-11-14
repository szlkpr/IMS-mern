import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from '../api'; // Assuming you have an api service
import { Button } from './ui/Button'; // Assuming you have a Button component
import { ChartContainer, ChartEmptyState, professionalColors } from './Charts';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DemandForecastChart = ({ productId }) => {
  const { t } = useTranslation();
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/ml/predict/demand/${productId}`, {
        forecastHorizon: 30,
        includeScenarios: true,
      });
      if (response.data.success) {
        setForecastData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch forecast');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    }
    setLoading(false);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: t('charts.demandForecast'),
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: t('charts.days'),
        },
      },
      y: {
        title: {
          display: true,
          text: t('charts.predictedDemand'),
        },
        beginAtZero: true,
      },
    },
  };

  const generateChartData = () => {
    if (!forecastData) return null;

    const labels = Array.from({ length: forecastData.predictions.length }, (_, i) => `Day ${i + 1}`);

    return {
      labels,
      datasets: [
        {
          label: t('charts.predictedDemand'),
          data: forecastData.predictions,
          borderColor: professionalColors.primary.main,
          backgroundColor: professionalColors.primary.bg,
          fill: false,
          tension: 0.4,
        },
        {
          label: t('charts.confidenceIntervalUpper'),
          data: forecastData.confidence_intervals.upper,
          borderColor: professionalColors.success.light,
          backgroundColor: professionalColors.success.bg,
          fill: '+1',
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: t('charts.confidenceIntervalLower'),
          data: forecastData.confidence_intervals.lower,
          borderColor: professionalColors.success.light,
          backgroundColor: professionalColors.success.bg,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  };

  return (
    <ChartContainer title={t('charts.demandForecast')} height="h-96">
      {!forecastData && (
        <div className="flex flex-col items-center justify-center h-full">
          <Button onClick={fetchForecast} disabled={loading}>
            {loading ? t('charts.generatingForecast') : t('charts.generateDemandForecast')}
          </Button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          {!loading && !error && (
            <p className="mt-4 text-slate-500">{t('charts.clickToGenerateForecast')}</p>
          )}
        </div>
      )}
      {forecastData && (
        <div className="h-full">
          <Line options={chartOptions} data={generateChartData()} />
        </div>
      )}
    </ChartContainer>
  );
};

export default DemandForecastChart;
