import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = ({ onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navigationItems = [
    { path: '/', label: t('navigation.dashboard') },
    { path: '/inventory', label: t('navigation.inventory') },
    { path: '/purchases', label: t('navigation.purchases') },
    { path: '/sales', label: t('navigation.sales') },
    { path: '/categories', label: t('navigation.categories') },
    { path: '/reports', label: t('navigation.reports') },
    { path: '/analytics', label: t('navigation.analytics') },
    { path: '/profile', label: t('navigation.profile') }
  ];

  return (
    <nav className="bg-white shadow-md border-b border-corporate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-corporate-gradient flex items-center justify-center text-white font-bold text-lg shadow-sm">
                IMS
              </div>
                <div className="ml-3">
                <h1 className="text-xl font-bold text-corporate-700">
                  {t('app.title').split(' ')[0]}
                </h1>
                <p className="text-xs text-corporate-500 font-medium">{t('app.title').split(' ')[1]}</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 sharp-sm text-sm font-medium transition-all duration-200 relative group ${
                    isActive(item.path)
                      ? 'bg-corporate-gradient text-white shadow-sm'
                      : 'text-corporate-600 hover:text-corporate-700 hover:bg-corporate-50'
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  {isActive(item.path) && (
                    <div className="absolute inset-0 bg-corporate-gradient sharp-sm opacity-90"></div>
                  )}
                  <div className="absolute inset-0 bg-corporate-gradient sharp-sm opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu and Mobile Button */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-accent-gradient sharp-sm hover:opacity-90 transition-all duration-200 shadow-sm"
            >
              {t('navigation.logout')}
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-400 hover:text-white focus:outline-none focus:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-corporate-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 sharp-sm text-base font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-corporate-gradient text-white shadow-sm'
                    : 'text-corporate-600 hover:text-corporate-700 hover:bg-corporate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
