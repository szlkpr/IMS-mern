import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Alert, AlertDescription } from './ui/Alert';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  Save,
  Edit,
  BarChart3,
  PieChart,
  Activity,
  Trophy,
  AlertTriangle,
  CheckCircle,
  Refresh
} from 'lucide-react';
import { 
  ProgressBar,
  CircularProgress,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';
import axios from 'axios';

const PerformanceBenchmarks = () => {
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [targets, setTargets] = useState({
    monthlyRevenue: 100000,
    monthlySales: 100,
    inventoryTurnover: 6,
    profitMargin: 25,
    customerGrowth: 10
  });
  const [editingTargets, setEditingTargets] = useState(false);
  const [tempTargets, setTempTargets] = useState(targets);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('month');

  // Fetch benchmark data
  const fetchBenchmarkData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        ...targets,
        startDate: getStartDate(dateRange),
        endDate: new Date().toISOString()
      };
      
      const response = await axios.get('/api/analytics/performance-benchmarks', { params });
      
      if (response.data.success) {
        setBenchmarkData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch benchmark data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching benchmark data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get start date based on range
  const getStartDate = (range) => {
    const now = new Date();
    switch (range) {
      case 'week':
        return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1).toISOString();
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  };

  useEffect(() => {
    fetchBenchmarkData();
  }, [dateRange]);

  // Save targets
  const saveTargets = () => {
    setTargets(tempTargets);
    setEditingTargets(false);
    fetchBenchmarkData();
  };

  // Cancel editing
  const cancelEditing = () => {
    setTempTargets(targets);
    setEditingTargets(false);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value?.toFixed(1) || 0}%`;
  };

  // Get performance color
  const getPerformanceColor = (status) => {
    switch (status) {
      case 'Above Target':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'Below Target':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'Meeting Targets':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'Below Expectations':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  // Get variance icon
  const getVarianceIcon = (variance) => {
    if (variance > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (variance < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  // Progress bar component
  const ProgressIndicator = ({ current, target, label, format = 'number' }) => {
    const percentage = Math.min((current / target) * 100, 100);
    const variance = ((current - target) / target) * 100;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className="flex items-center space-x-2">
            {getVarianceIcon(variance)}
            <span className={`text-sm font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {format === 'currency' ? formatCurrency(current) : 
               format === 'percentage' ? formatPercentage(current) :
               current?.toLocaleString() || 0}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              percentage >= 100 ? 'bg-green-500' :
              percentage >= 75 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Target: {format === 'currency' ? formatCurrency(target) : 
                          format === 'percentage' ? formatPercentage(target) :
                          target?.toLocaleString()}</span>
          <span>{formatPercentage(variance)} variance</span>
        </div>
      </div>
    );
  };

  // Target editor component
  const TargetEditor = ({ label, value, onChange, format = 'number' }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        step={format === 'currency' ? '1000' : format === 'percentage' ? '0.1' : '1'}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Performance Benchmarks</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Target className="w-4 h-4 animate-pulse" />
            <span>Loading benchmarks...</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
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
            Failed to load performance benchmarks: {error}
          </AlertDescription>
        </Alert>
        <Button onClick={fetchBenchmarkData} className="mt-4">
          <Refresh className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const chartData = benchmarkData?.benchmarks ? Object.entries(benchmarkData.benchmarks).map(([key, value]) => ({
    name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
    target: value.target,
    actual: value.actual,
    variance: value.variance
  })) : [];

  const pieData = chartData.map((item, index) => ({
    name: item.name,
    value: Math.abs(item.variance),
    color: item.variance >= 0 ? '#10b981' : '#ef4444'
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Benchmarks</h1>
          <p className="text-gray-600 mt-1">Track your performance against targets and goals</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <Button 
            onClick={() => setEditingTargets(true)} 
            variant="outline"
            disabled={editingTargets}
          >
            <Settings className="w-4 h-4 mr-2" />
            Set Targets
          </Button>

          <Button onClick={fetchBenchmarkData} variant="outline">
            <Refresh className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status Card */}
      {benchmarkData && (
        <Card className={`${getPerformanceColor(benchmarkData.overallStatus)} border-2`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Overall Performance</h3>
                <p className="text-sm opacity-90">
                  {benchmarkData.overallStatus} • {benchmarkData.targetAchievementRate.toFixed(1)}% of targets met
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  {benchmarkData.overallStatus === 'Meeting Targets' ? (
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  ) : benchmarkData.overallStatus === 'Below Expectations' ? (
                    <AlertTriangle className="w-8 h-8" />
                  ) : (
                    <Target className="w-8 h-8" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Target Editor Modal/Panel */}
      {editingTargets && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2 text-blue-600" />
              Edit Performance Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <TargetEditor
                label="Monthly Revenue Target"
                value={tempTargets.monthlyRevenue}
                onChange={(e) => setTempTargets({...tempTargets, monthlyRevenue: parseFloat(e.target.value) || 0})}
                format="currency"
              />
              
              <TargetEditor
                label="Monthly Sales Target"
                value={tempTargets.monthlySales}
                onChange={(e) => setTempTargets({...tempTargets, monthlySales: parseInt(e.target.value) || 0})}
              />
              
              <TargetEditor
                label="Inventory Turnover Target"
                value={tempTargets.inventoryTurnover}
                onChange={(e) => setTempTargets({...tempTargets, inventoryTurnover: parseFloat(e.target.value) || 0})}
              />
              
              <TargetEditor
                label="Profit Margin Target (%)"
                value={tempTargets.profitMargin}
                onChange={(e) => setTempTargets({...tempTargets, profitMargin: parseFloat(e.target.value) || 0})}
                format="percentage"
              />
              
              <TargetEditor
                label="Customer Growth Target (%)"
                value={tempTargets.customerGrowth}
                onChange={(e) => setTempTargets({...tempTargets, customerGrowth: parseFloat(e.target.value) || 0})}
                format="percentage"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={saveTargets} className="flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Save Targets
              </Button>
              <Button onClick={cancelEditing} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics Cards */}
      {benchmarkData?.benchmarks && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Revenue Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressIndicator
                current={benchmarkData.benchmarks.revenue.actual}
                target={benchmarkData.benchmarks.revenue.target}
                label="Monthly Revenue"
                format="currency"
              />
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <Badge className={getPerformanceColor(benchmarkData.benchmarks.revenue.status)}>
                  {benchmarkData.benchmarks.revenue.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Sales Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sales Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressIndicator
                current={benchmarkData.benchmarks.sales.actual}
                target={benchmarkData.benchmarks.sales.target}
                label="Monthly Sales Count"
              />
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <Badge className={getPerformanceColor(benchmarkData.benchmarks.sales.status)}>
                  {benchmarkData.benchmarks.sales.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Average Order Value */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Value Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressIndicator
                current={benchmarkData.benchmarks.averageOrderValue.actual}
                target={benchmarkData.benchmarks.averageOrderValue.target}
                label="Average Order Value"
                format="currency"
              />
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <Badge className={getPerformanceColor(benchmarkData.benchmarks.averageOrderValue.status)}>
                  {benchmarkData.benchmarks.averageOrderValue.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Target vs Actual Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'target' || name === 'actual' ? 
                      (typeof value === 'number' && value > 1000 ? formatCurrency(value) : value) : 
                      formatPercentage(value),
                    name === 'target' ? 'Target' : 
                    name === 'actual' ? 'Actual' : 'Variance'
                  ]}
                />
                <Bar dataKey="target" fill="#94a3b8" name="target" />
                <Bar dataKey="actual" fill="#3b82f6" name="actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Variance Analysis Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-green-600" />
              Performance Variance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatPercentage(value)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Table */}
      {benchmarkData?.benchmarks && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-600" />
              Detailed Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Metric</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Target</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Actual</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Variance</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(benchmarkData.benchmarks).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        {key.includes('revenue') || key.includes('Value') ? 
                          formatCurrency(value.target) : 
                          key.includes('margin') || key.includes('Growth') ?
                          formatPercentage(value.target) :
                          value.target?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {key.includes('revenue') || key.includes('Value') ? 
                          formatCurrency(value.actual) : 
                          key.includes('margin') || key.includes('Growth') ?
                          formatPercentage(value.actual) :
                          value.actual?.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        value.variance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <div className="flex items-center justify-end space-x-1">
                          {getVarianceIcon(value.variance)}
                          <span>{formatPercentage(Math.abs(value.variance))}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getPerformanceColor(value.status)}>
                          {value.status === 'Above Target' ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 mr-1" />
                          )}
                          {value.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-orange-600" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {benchmarkData?.benchmarks && Object.entries(benchmarkData.benchmarks)
              .filter(([key, value]) => value.status === 'Below Target')
              .map(([key, value]) => (
                <Alert key={key} className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is below target</strong>
                    <br />
                    Current: {key.includes('revenue') || key.includes('Value') ? 
                      formatCurrency(value.actual) : 
                      key.includes('margin') || key.includes('Growth') ?
                      formatPercentage(value.actual) :
                      value.actual?.toLocaleString()} 
                    • Target: {key.includes('revenue') || key.includes('Value') ? 
                      formatCurrency(value.target) : 
                      key.includes('margin') || key.includes('Growth') ?
                      formatPercentage(value.target) :
                      value.target?.toLocaleString()}
                    <br />
                    <span className="text-sm text-yellow-700">
                      Consider reviewing your {key.toLowerCase()} strategy and implementation.
                    </span>
                  </AlertDescription>
                </Alert>
              ))}
            
            {benchmarkData?.benchmarks && Object.entries(benchmarkData.benchmarks)
              .every(([key, value]) => value.status === 'Above Target') && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong>Excellent performance!</strong> All metrics are meeting or exceeding targets. 
                  Consider setting more ambitious goals to drive continued growth.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceBenchmarks;