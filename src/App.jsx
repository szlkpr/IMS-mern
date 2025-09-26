import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './Pages/LoginPage';
import DashboardPage from './Pages/Dashboard';
import InventoryPage from './Pages/ProductsPage';
import SalesPage from './Pages/Sales';
import PurchasesPage from './Pages/Purchases';
import ProfilePage from './Pages/Profile';
import ReportsPage from './Pages/Reports';
import CategoriesPage from './Pages/Categories';
import AnalyticsDashboard from './Pages/AnalyticsDashboard';
import MainLayout from './Components/MainLayout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLogin} />} />

        {/* Protected Routes */}
        <Route
          element={isAuthenticated ? <MainLayout onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/add" element={<InventoryPage showAddForm={true} />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/add" element={<SalesPage showAddForm={true} />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/purchases/add" element={<PurchasesPage showAddForm={true} />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/categories" element={<CategoriesPage />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
