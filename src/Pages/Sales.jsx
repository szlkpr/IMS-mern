import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api';
import axios from 'axios';
import BarcodeScanner from '../Components/BarcodeScanner';

const SalesPage = ({ showAddForm = false }) => {
  // State for products, sales, and form inputs
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [forceShowAddForm, setForceShowAddForm] = useState(showAddForm);

  // When a product is selected, update the price field with its retail price
  useEffect(() => {
    if (selectedProduct && products.length > 0) {
      const product = products.find(p => p._id === selectedProduct);
      const numQuantity = parseInt(quantity, 10) || 1;
      if (product) {
        const currentPrice = numQuantity >= (product.wholesaleThreshold || Infinity)
          ? product.wholesalePrice
          : product.retailPrice;
        setPrice(currentPrice.toString());
      }
    } else {
      setPrice('');
    };
  }, [selectedProduct, quantity, products]);

  // Handle barcode detection
  const handleBarcodeDetected = async (barcode) => {
    setShowScanner(false);
    setMessage('Searching for product...');
    
    // Search for product by barcode
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      setSelectedProduct(product._id);
      setMessage(`Product found: ${product.name}`);
      setTimeout(() => setMessage(''), 3000);
    } else {
      // If not found in current products, try searching via API
      try {
        const response = await apiClient.get('/products', {
          params: { search: barcode }
        });
        const foundProduct = response.data.data.docs?.find(p => p.barcode === barcode);
        if (foundProduct) {
          setSelectedProduct(foundProduct._id);
          setMessage(`Product found: ${foundProduct.name}`);
          // Update local products state if needed
          if (!products.find(p => p._id === foundProduct._id)) {
            setProducts(prev => [foundProduct, ...prev]);
          }
        } else {
          setMessage(`No product found with barcode: ${barcode}`);
        }
      } catch (error) {
        console.error('Error searching for product:', error);
        setMessage('Error searching for product');
      }
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
    );
  }, [products, searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setMessage('');
      try {
        const [productsResponse, salesResponse] = await Promise.all([
          apiClient.get('/products', { signal: controller.signal }),
          apiClient.get('/sales', { signal: controller.signal }),
        ]);
        setProducts(productsResponse.data.data.docs || []);
        setSales(salesResponse.data.data.sales || []);
      } catch (error) {
        // Use axios.isCancel to check for cancellation errors
        if (axios.isCancel(error)) {
          console.log('Data fetch aborted, this is expected in Strict Mode.');
        } else if (error.response?.status !== 401) {
          // Only handle errors that are NOT 401 and NOT cancellations
          console.error('Error fetching data:', error);
          setMessage('Failed to load page data. Please try again later.');
        }
      }
      setLoading(false);
    };
    fetchData();

    return () => {
      controller.abort();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    const numQuantity = parseInt(quantity, 10);
    const numPrice = parseFloat(price);

    if (!selectedProduct || !quantity || !price) {
      setMessage('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    if (isNaN(numQuantity) || numQuantity <= 0 || isNaN(numPrice) || numPrice < 0) {
      setMessage('Please fill in all fields correctly.');
      setIsSubmitting(false);
      return;
    }

    const product = products.find(p => p._id === selectedProduct);
    if (product && numQuantity > product.stock) {
      setMessage(`Not enough stock. Only ${product.stock} available.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const saleData = {
        soldProducts: [{
          productId: selectedProduct,
          quantity: numQuantity,
        }],
      };
      const response = await apiClient.post('/sales', saleData);
      setMessage('Sale recorded successfully!');
      // Add the new sale to the list for a faster UI update
      // Also, update the stock of the product in the local state
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p._id === selectedProduct
            ? { ...p, stock: p.stock - numQuantity, status: (p.stock - numQuantity) > 0 ? 'in-stock' : 'out-of-stock' }
            : p
        ));
      setSales(prevSales => [response.data.data, ...prevSales]); // Assumes the full populated sale is returned

      // Reset form
      setSelectedProduct('');
      setQuantity('1');
      setPrice('');
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Error recording sale:', error);
        setMessage(error.response?.data?.message || 'Failed to record sale.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const productMap = useMemo(() => {
    if (!products.length) return new Map();
    return new Map(products.map((product) => [product._id, product]));
  }, [products]);

  if (loading) return <div>Loading sales data...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Add Sale Form (conditional) */}
      {(forceShowAddForm || showAddForm) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Record a New Sale</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                📷 Scan Barcode
              </button>
              {!showAddForm && (
                <button
                  onClick={() => setForceShowAddForm(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md ${
            message.includes('found') || message.includes('success')
              ? 'bg-green-100 text-green-700 border border-green-300'
              : message.includes('Error') || message.includes('Failed')
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-blue-100 text-blue-700 border border-blue-300'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Search and Selection */}
          <div>
            <label htmlFor="productSearch" className="block text-sm font-medium text-gray-700 mb-2">
              Search Products
            </label>
            <input
              type="text"
              id="productSearch"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, brand, or barcode..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            
            <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
              Select Product
            </label>
            <select
              id="product"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select a product</option>
              {filteredProducts.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} {product.brand ? `(${product.brand})` : ''} - Stock: {product.stock}
                  {product.barcode ? ` - ${product.barcode}` : ''}
                </option>
              ))}
            </select>
          </div>
          {/* Quantity Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Price Input */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Sale Price (per item)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Recording...' : 'Record Sale'}
            </button>
          </div>
        </form>
        </div>
      )}
      
      {/* Add New Sale Button (when form is hidden) */}
      {!forceShowAddForm && !showAddForm && (
        <div className="mb-6">
          <button
            onClick={() => setForceShowAddForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg"
          >
            <span className="mr-2">+</span>
            Record New Sale
          </button>
        </div>
      )}

      {/* Sales History */}
      <div className="mt-8 bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Recent Sales</h2>
          <p className="text-sm text-gray-600">Latest sales transactions</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No sales recorded yet
                  </td>
                </tr>
              ) : (
                sales.flatMap((sale) =>
                  sale.soldProducts.map((soldItem, index) => {
                    const product = soldItem.productId;
                    const pricePerItem = soldItem.price || (sale.saleCost / soldItem.quantity);
                    const totalPrice = pricePerItem * soldItem.quantity;
                    return (
                      <tr key={`${sale._id}-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product?.name ?? 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product?.brand || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {soldItem.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{pricePerItem.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{totalPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index === 0 ? new Date(sale.createdAt).toLocaleDateString() : ''}
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onDetected={handleBarcodeDetected}
      />
    </div>
  );
};

export default SalesPage;
