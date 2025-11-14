import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AddProduct from "../Components/AddProduct";
import EditProduct from "../Components/EditProduct";
import apiClient from "../api";
import Modal from "../Components/ui/Modal";
import DemandForecastChart from "../Components/DemandForecast";

export default function ProductsPage({ showAddForm = false }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [forceShowAddForm, setForceShowAddForm] = useState(showAddForm);
  
  // Advanced Search State
  const [searchFilters, setSearchFilters] = useState({
    searchTerm: "",
    category: "",
    brand: "",
    stockStatus: "", // all, in-stock, low-stock, out-of-stock
    priceRange: { min: "", max: "" },
    variant: "",
    barcode: ""
  });
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc"
  });
  const [viewMode, setViewMode] = useState("table"); // table, grid
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [forecastingProduct, setForecastingProduct] = useState(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.target.closest('input, textarea, select')) {
        e.preventDefault();
        handleSelectAll();
      }
      // Escape to clear selection
      if (e.key === 'Escape') {
        setSelectedProducts([]);
        setShowFilters(false);
      }
      // Ctrl/Cmd + E to export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportToCSV();
      }
      // Delete key to delete selected
      if (e.key === 'Delete' && selectedProducts.length > 0) {
        handleDeleteSelected();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedProducts, showFilters]);

  // Get unique brands and variants for filter options
  const filterOptions = useMemo(() => {
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const variants = [...new Set(products.map(p => p.variant).filter(Boolean))];
    return { brands, variants };
  }, [products]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          apiClient.get("/products"),
          apiClient.get("/categories")
        ]);
        setProducts(productsResponse.data?.data?.docs || []);
        setCategories(categoriesResponse.data?.data?.docs || []);
      } catch (err) {
        if (err.response?.status !== 401 && err.code !== "ECONNABORTED" && err.code !== "ERR_CANCELED") {
          console.error("Error fetching data:", err);
          setError(t('common.error'));
        }
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refresh]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Apply search filters
    if (searchFilters.searchTerm) {
      const term = searchFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.brand?.toLowerCase().includes(term) ||
        product.variant?.toLowerCase().includes(term) ||
        product.compatibility?.toLowerCase().includes(term)
      );
    }

    if (searchFilters.category) {
      filtered = filtered.filter(product => product.category?._id === searchFilters.category);
    }

    if (searchFilters.brand) {
      filtered = filtered.filter(product => product.brand === searchFilters.brand);
    }

    if (searchFilters.variant) {
      filtered = filtered.filter(product => product.variant === searchFilters.variant);
    }

    if (searchFilters.barcode) {
      filtered = filtered.filter(product => product.barcode?.includes(searchFilters.barcode));
    }

    if (searchFilters.stockStatus) {
      filtered = filtered.filter(product => {
        const isOutOfStock = product.stock === 0;
        const isLowStock = product.stock <= (product.lowStockThreshold || 5) && product.stock > 0;
        const isInStock = product.stock > (product.lowStockThreshold || 5);
        
        switch (searchFilters.stockStatus) {
          case 'out-of-stock': return isOutOfStock;
          case 'low-stock': return isLowStock;
          case 'in-stock': return isInStock;
          default: return true;
        }
      });
    }

    if (searchFilters.priceRange.min || searchFilters.priceRange.max) {
      filtered = filtered.filter(product => {
        const price = product.retailPrice;
        const min = parseFloat(searchFilters.priceRange.min) || 0;
        const max = parseFloat(searchFilters.priceRange.max) || Infinity;
        return price >= min && price <= max;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      // Handle nested properties
      if (sortConfig.key === 'category') {
        aVal = a.category?.name || t('inventory.uncategorized');
        bVal = b.category?.name || t('inventory.uncategorized');
      }
      
      // Handle different data types
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchFilters, sortConfig]);

  // Helper functions
  const handleFilterChange = (key, value) => {
    if (key === 'priceRange') {
      setSearchFilters(prev => ({
        ...prev,
        priceRange: { ...prev.priceRange, ...value }
      }));
    } else {
      setSearchFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setSearchFilters({
      searchTerm: "",
      category: "",
      brand: "",
      stockStatus: "",
      priceRange: { min: "", max: "" },
      variant: "",
      barcode: ""
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProducts(prev => 
      prev.length === filteredAndSortedProducts.length 
        ? [] 
        : filteredAndSortedProducts.map(p => p._id)
    );
  };

  const exportToCSV = () => {
    const headers = [t('inventory.name'), t('inventory.brand'), t('inventory.category'), t('inventory.stock'), t('inventory.retailPrice'), t('inventory.wholesalePrice'), t('common.status'), t('inventory.barcode'), t('inventory.createdAt')];
    const selectedData = selectedProducts.length > 0 
      ? products.filter(p => selectedProducts.includes(p._id))
      : filteredAndSortedProducts;
    
    const csvContent = [
      headers.join(','),
      ...selectedData.map(product => {
        const isOutOfStock = product.stock === 0;
        const isLowStock = product.stock <= (product.lowStockThreshold || 5) && product.stock > 0;
        const status = isOutOfStock ? t('inventory.outOfStock') : isLowStock ? t('inventory.lowStock') : t('inventory.inStock');
        
        return [
          `"${product.name}"`,
          `"${product.brand || ''}"`,
          `"${product.category?.name || t('inventory.uncategorized')}"`,
          product.stock,
          product.retailPrice,
          product.wholesalePrice,
          `"${status}"`,
          `"${product.barcode || ''}"`,
          `"${new Date(product.createdAt).toLocaleDateString()}"`
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteSelected = async () => {
    if (!selectedProducts.length || actionLoading) return;
    
    const confirmDelete = window.confirm(
      `${t('inventory.confirmDelete')} ${selectedProducts.length} ${t('inventory.products').toLowerCase()}? ${t('inventory.confirmDelete')}`
    );
    
    if (confirmDelete) {
      setActionLoading(true);
      try {
        await Promise.all(
          selectedProducts.map(id => apiClient.delete(`/products/${id}`))
        );
        setSelectedProducts([]);
        setRefresh(r => !r);
        console.log(t('inventory.productDeleted'));
      } catch (error) {
        console.error('Error deleting products:', error);
        alert(t('inventory.failedToDelete'));
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
  };

  const handleDeleteProduct = async (product) => {
    if (actionLoading) return;
    
    const confirmDelete = window.confirm(
      `${t('inventory.confirmDelete')} "${product.name}"?`
    );
    
    if (confirmDelete) {
      setActionLoading(true);
      try {
        await apiClient.delete(`/products/${product._id}`);
        setRefresh(r => !r);
        console.log(t('inventory.productDeleted'));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(t('inventory.failedToDelete'));
      } finally {
        setActionLoading(false);
      }
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="text-lg text-gray-600">{t('common.loading')}</div></div>;
  if (error) return <div className="flex justify-center items-center h-64"><div className="text-lg text-red-600">{error}</div></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {(forceShowAddForm || showAddForm) && (
        <AddProduct onAdd={() => {
          setRefresh(r => !r);
          // Auto-collapse after adding if we came from a direct route
          if (showAddForm) {
            setForceShowAddForm(false);
          }
        }} />
      )}
      
      {!forceShowAddForm && !showAddForm && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-corporate-700">
                {t('inventory.title')}
              </h1>
              <p className="text-corporate-500 mt-2">Manage your product inventory</p>
            </div>
            <button
              onClick={() => setForceShowAddForm(true)}
              className="px-6 py-3 bg-corporate-gradient text-white font-medium sharp-sm hover:opacity-90 transition-all duration-200 shadow-sm"
            >
              <span className="mr-2">+</span>
              {t('inventory.addNewProduct')}
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow-sm border border-corporate-200">
        {/* Header with controls */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {t('inventory.products')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredAndSortedProducts.length} {t('common.of')} {products.length} {t('inventory.products').toLowerCase()}
                {selectedProducts.length > 0 && ` • ${selectedProducts.length} ${t('inventory.selectedItems')}`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'table' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('inventory.tableView')}
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('inventory.gridView')}
                </button>
              </div>
              
              {/* Export Button */}
              <button 
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center gap-2"
                title="Export all filtered products"
              >
                {t('inventory.exportCSV')}
              </button>
              
              {/* Filter Toggle */}
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  showFilters 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('inventory.showFilters')} {Object.values(searchFilters).some(v => v && (typeof v === 'object' ? v.min || v.max : true)) && '•'}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Search Filters */}
        <div className={`transition-all duration-300 ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden border-b`}>
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Term */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.searchProducts')}</label>
                <input 
                  type="text"
                  placeholder={t('inventory.searchProducts')}
                  value={searchFilters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.category')}</label>
                <select 
                  value={searchFilters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('inventory.allCategories')}</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Stock Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.status')}</label>
                <select 
                  value={searchFilters.stockStatus}
                  onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('inventory.allStock')}</option>
                  <option value="in-stock">{t('inventory.inStock')}</option>
                  <option value="low-stock">{t('inventory.lowStock')}</option>
                  <option value="out-of-stock">{t('inventory.outOfStock')}</option>
                </select>
              </div>
              
              {/* Brand Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.brand')}</label>
                <select 
                  value={searchFilters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('inventory.allBrands')}</option>
                  {filterOptions.brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
              
              {/* Variant Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.variant')}</label>
                <select 
                  value={searchFilters.variant}
                  onChange={(e) => handleFilterChange('variant', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('inventory.allVariants')}</option>
                  {filterOptions.variants.map(variant => (
                    <option key={variant} value={variant}>{variant}</option>
                  ))}
                </select>
              </div>
              
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.minPrice')}</label>
                <input 
                  type="number"
                  placeholder="₹0"
                  value={searchFilters.priceRange.min}
                  onChange={(e) => handleFilterChange('priceRange', { min: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.maxPrice')}</label>
                <input 
                  type="number"
                  placeholder="₹∞"
                  value={searchFilters.priceRange.max}
                  onChange={(e) => handleFilterChange('priceRange', { max: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                {t('inventory.productsFound', { count: filteredAndSortedProducts.length })}
              </div>
              <button 
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                {t('inventory.clearFilters')}
              </button>
            </div>
          </div>
        </div>
        
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-4xl mb-4 font-bold">{t('inventory.noProducts')}</div>
            <p className="text-gray-500 text-lg">{t('inventory.noProductsFound')}</p>
            <p className="text-gray-400 text-sm">{t('inventory.addNewProduct')}</p>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-4xl mb-4 font-bold">{t('inventory.noMatches')}</div>
            <p className="text-gray-500 text-lg">{t('inventory.noProductsFound')}</p>
            <button 
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('inventory.clearFilters')}
            </button>
          </div>
        ) : (
          <div className={viewMode === 'table' ? 'overflow-x-auto' : 'p-6'}>
            {viewMode === 'table' ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input 
                        type="checkbox"
                        checked={selectedProducts.length === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {t('inventory.productName')} {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('category')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {t('inventory.category')} {getSortIcon('category')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('stock')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {t('inventory.stock')} {getSortIcon('stock')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('retailPrice')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {t('inventory.price')} {getSortIcon('retailPrice')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                    <th 
                      onClick={() => handleSort('createdAt')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {t('common.details')} {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedProducts.map(product => {
                    const isLowStock = product.stock <= (product.lowStockThreshold || 5) && product.stock > 0;
                    const isOutOfStock = product.stock === 0;
                    const isSelected = selectedProducts.includes(product._id);
                    
                    return (
                      <tr key={product._id} className={`hover:bg-gray-50 ${
                        isSelected ? 'bg-blue-50 border-blue-200' : ''
                      }`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectProduct(product._id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            {product.brand && <div className="text-sm text-gray-500">{t('inventory.brand')}: {product.brand}</div>}
                            {product.variant && <div className="text-sm text-gray-500">{t('inventory.variant')}: {product.variant}</div>}
                            {product.description && <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>}
                            <div className="text-xs text-gray-400 mt-1">
                              {product.barcode ? `${t('inventory.barcode')}: ${product.barcode}` : `ID: ${product._id.slice(-8)}`}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.category?.name || t('inventory.uncategorized')}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{product.stock}</div>
                          <div className="text-xs text-gray-500">{t('inventory.alert')}: {product.lowStockThreshold || 5}</div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>{t('inventory.retail')}: ₹{typeof product.retailPrice === 'number' ? product.retailPrice.toFixed(2) : product.retailPrice}</div>
                            <div>{t('inventory.wholesale')}: ₹{typeof product.wholesalePrice === 'number' ? product.wholesalePrice.toFixed(2) : product.wholesalePrice}</div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            isOutOfStock 
                              ? 'bg-red-100 text-red-800'
                              : isLowStock
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isOutOfStock ? t('inventory.outOfStock') : isLowStock ? t('inventory.lowStock') : t('inventory.inStock')}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {product.variant && <div>{t('inventory.qualityVariant')}: {product.variant}</div>}
                          {product.compatibility && <div className="truncate max-w-xs">{t('inventory.compatibleWith')}: {product.compatibility}</div>}
                          <div className="text-xs text-gray-400 mt-1">
                            {t('inventory.added')}: {new Date(product.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title={t('inventory.editProduct')}
                            >
                              {t('common.edit')}
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title={t('inventory.deleteProduct')}
                            >
                              {t('common.delete')}
                            </button>
                            <button 
                              onClick={() => setForecastingProduct(product)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title={t('inventory.forecastDemand')}
                            >
                              {t('common.forecast')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedProducts.map(product => {
                  const isLowStock = product.stock <= (product.lowStockThreshold || 5) && product.stock > 0;
                  const isOutOfStock = product.stock === 0;
                  const isSelected = selectedProducts.includes(product._id);
                  
                  return (
                    <div key={product._id} className={`bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all ${
                      isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectProduct(product._id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                          />
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-900 text-sm p-1 rounded hover:bg-blue-50"
                              title={t('inventory.editProduct')}
                            >
                              {t('common.edit')}
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product)}
                              className="text-red-600 hover:text-red-900 text-sm p-1 rounded hover:bg-red-50"
                              title={t('inventory.deleteProduct')}
                            >
                              {t('common.delete')}
                            </button>
                            <button 
                              onClick={() => setForecastingProduct(product)}
                              className="text-green-600 hover:text-green-900 text-sm p-1 rounded hover:bg-green-50"
                              title={t('inventory.forecastDemand')}
                            >
                              {t('common.forecast')}
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          {product.brand && <div><span className="font-medium">{t('inventory.brand')}:</span> {product.brand}</div>}
                          {product.variant && <div><span className="font-medium">{t('inventory.variant')}:</span> {product.variant}</div>}
                          <div><span className="font-medium">{t('inventory.category')}:</span> {product.category?.name || t('inventory.uncategorized')}</div>
                          <div><span className="font-medium">{t('inventory.stock')}:</span> {product.stock} {t('inventory.units')}</div>
                          <div className="text-xs text-gray-400">
                            {product.barcode ? `${t('inventory.barcode')}: ${product.barcode}` : `ID: ${product._id.slice(-8)}`}
                          </div>
                          
                          <div className="border-t pt-2">
                            <div><span className="font-medium">{t('inventory.retail')}:</span> ₹{typeof product.retailPrice === 'number' ? product.retailPrice.toFixed(2) : product.retailPrice}</div>
                            <div><span className="font-medium">{t('inventory.wholesale')}:</span> ₹{typeof product.wholesalePrice === 'number' ? product.wholesalePrice.toFixed(2) : product.wholesalePrice}</div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              isOutOfStock 
                                ? 'bg-red-100 text-red-800'
                                : isLowStock
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {isOutOfStock ? t('inventory.outOfStock') : isLowStock ? t('inventory.lowStock') : t('inventory.inStock')}
                            </span>
                          </div>
                          
                          {product.description && (
                            <div className="text-xs text-gray-500 line-clamp-2 mt-2">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4">
          <div className="text-sm">
            <span className="font-medium">{selectedProducts.length} products selected</span>
            <div className="text-xs text-gray-300 mt-1">
              Ctrl+E: Export • Delete: Remove • Esc: Clear
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportToCSV}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('inventory.exportSelectedProducts')}
            >
              {t('common.export')}
            </button>
            <button 
              onClick={handleDeleteSelected}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title={t('inventory.deleteSelectedProducts')}
            >
              {actionLoading ? t('common.loading') : t('common.delete')}
            </button>
            <button 
              onClick={() => setSelectedProducts([])}
              disabled={actionLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('inventory.clearSelection')}
            >
              {t('common.clear')}
            </button>
          </div>
        </div>
      )}
      
      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProduct
          product={editingProduct}
          categories={categories}
          onEdit={() => {
            setRefresh(r => !r);
            setEditingProduct(null);
          }}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      {/* Forecast Modal */}
      {forecastingProduct && (
        <Modal onClose={() => setForecastingProduct(null)}>
          <DemandForecastChart productId={forecastingProduct._id} />
        </Modal>
      )}
    </div>
  );
}
