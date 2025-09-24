import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import axios from 'axios';

const PurchasesPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When a product is selected, update the price field with its wholesale price
  useEffect(() => {
    if (selectedProduct) {
      const product = products.find(p => p._id === selectedProduct);
      if (product) {
        setPrice(product.wholesalePrice?.toString() || '');
      }
    }
  }, [selectedProduct, products]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setMessage('');
      try {
        const [productsResponse, purchasesResponse] = await Promise.all([
          apiClient.get('/products', { signal: controller.signal }),
          apiClient.get('/purchases', { signal: controller.signal }),
        ]);
        setProducts(productsResponse.data.data.docs || []);
        setPurchases(purchasesResponse.data.data.purchases || []);
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

    if (!supplierName || !vendorContact || !selectedProduct || !quantity || !price || isNaN(numQuantity) || numQuantity <= 0 || isNaN(numPrice) || numPrice <= 0) {
      setMessage('Please fill in all fields correctly.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        supplierName,
        vendorContact,
        items: [{ productId: selectedProduct, quantity: numQuantity, price: numPrice }],
        totalCost: numQuantity * numPrice,
      };

      const response = await apiClient.post('/purchases', payload);
      setMessage('Purchase added successfully!');

      // Optimistically update the UI
      setPurchases(prevPurchases => [response.data.data, ...prevPurchases]);
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p._id === selectedProduct
            ? { ...p, stock: p.stock + numQuantity }
            : p
        )
      );

      // Reset form
      setSelectedProduct('');
      setSupplierName('');
      setVendorContact('');
      setQuantity('');
      setPrice('');
    } catch (error) {
      // The API client interceptor will handle 401 unauthorized errors.
      // We only need to handle other errors here.
      if (error.response?.status !== 401) {
        console.error('Error adding purchase:', error);
        const errorMessage = error.response?.data?.message || 'Failed to add purchase. Please check the console for details.';
        setMessage(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading purchases data...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Add Purchase Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Add New Purchase Order</h2>
          <p className="text-gray-600">Record new inventory purchases and restock products</p>
        </div>
        
        {message && (
          <div className={`mb-4 p-3 rounded-md ${
            message.includes('successfully')
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-1">
              Supplier Name *
            </label>
            <input
              type="text"
              id="supplierName"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Enter supplier name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="vendorContact" className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Contact *
            </label>
            <input
              type="text"
              id="vendorContact"
              value={vendorContact}
              onChange={(e) => setVendorContact(e.target.value)}
              placeholder="Phone number or email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
              Product *
            </label>
            <select
              id="product"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>Select a product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} {product.brand ? `(${product.brand})` : ''} - Current Stock: {product.stock}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Price (per item) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₹</span>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">Total Cost:</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{quantity && price ? (parseInt(quantity) * parseFloat(price)).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Recording Purchase...' : 'Record Purchase'}
            </button>
          </div>
        </form>
      </div>

      {/* Purchases History */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Purchase History</h2>
          <p className="text-sm text-gray-600 mt-1">{purchases.length} purchase orders total</p>
        </div>
        
        {purchases.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🛒</div>
            <p className="text-gray-500 text-lg">No purchases recorded yet</p>
            <p className="text-gray-400 text-sm">Add your first purchase order using the form above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.supplierName || purchase.vendorCompanyName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {purchase.items?.length || purchase.purchasedProducts?.length || 0} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{(purchase.totalCost || purchase.saleCost || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        purchase.status === 'completed' || purchase.status === 'received'
                          ? 'bg-green-100 text-green-800'
                          : purchase.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {purchase.status || 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {purchase.vendorContact || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesPage;