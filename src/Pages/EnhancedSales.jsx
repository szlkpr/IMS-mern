import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api';
import axios from 'axios';
import BarcodeScanner from '../Components/BarcodeScanner';

const EnhancedSalesPage = ({ showAddForm = false }) => {
  const { t } = useTranslation();
  // State for products and sales history
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forceShowAddForm, setForceShowAddForm] = useState(showAddForm);

  // Cart state
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Customer information
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    contact: '',
    email: '',
    address: ''
  });

  // Discount state
  const [discount, setDiscount] = useState({
    type: 'none', // 'none', 'percentage', 'fixed'
    value: 0
  });

  // Payment information
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'cash',
    status: 'paid'
  });

  const [notes, setNotes] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm)
    );
  }, [products, searchTerm]);

  // Calculate cart totals
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    let discountAmount = 0;
    
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * discount.value) / 100;
    } else if (discount.type === 'fixed') {
      discountAmount = Math.min(discount.value, subtotal);
    }
    
    const total = subtotal - discountAmount;
    
    return {
      subtotal,
      discountAmount,
      total: Math.max(0, total),
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [cart, discount]);

  // Fetch data on component mount
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
        if (axios.isCancel(error)) {
          console.log('Data fetch aborted, this is expected in Strict Mode.');
        } else if (error.response?.status !== 401) {
          console.error('Error fetching data:', error);
          setMessage(t('sales.failedToLoadData'));
        }
      }
      setLoading(false);
    };

    fetchData();
    fetchNextInvoiceNumber();

    return () => {
      controller.abort();
    };
  }, []);

  // Fetch next invoice number
  const fetchNextInvoiceNumber = async () => {
    try {
      const response = await apiClient.get('/sales/next-invoice-number');
      setInvoiceNumber(response.data.data.invoiceNumber);
    } catch (error) {
      console.error('Error fetching invoice number:', error);
    }
  };

  // Add product to cart
  const addToCart = (product, quantity = 1, customPrice = null) => {
    const unitPrice = customPrice || (quantity >= (product.wholesaleThreshold || Infinity)
      ? product.wholesalePrice
      : product.retailPrice);

    const existingIndex = cart.findIndex(item => item.productId === product._id);
    
    if (existingIndex >= 0) {
      // Update existing item
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
      updatedCart[existingIndex].unitPrice = unitPrice;
      setCart(updatedCart);
    } else {
      // Add new item
      const newItem = {
        productId: product._id,
        product: product,
        quantity: quantity,
        unitPrice: unitPrice,
        name: product.name,
        brand: product.brand,
        stock: product.stock
      };
      setCart([...cart, newItem]);
    }
    
    setMessage(t('sales.addedToCart', { productName: product.name }));
    setTimeout(() => setMessage(''), 2000);
  };

  // Update cart item quantity
  const updateCartItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map(item => {
      if (item.productId === productId) {
        const product = products.find(p => p._id === productId);
        const unitPrice = newQuantity >= (product?.wholesaleThreshold || Infinity)
          ? product?.wholesalePrice || item.unitPrice
          : product?.retailPrice || item.unitPrice;
        
        return { ...item, quantity: newQuantity, unitPrice };
      }
      return item;
    });
    setCart(updatedCart);
  };

  // Update cart item price
  const updateCartItemPrice = (productId, newPrice) => {
    const updatedCart = cart.map(item => 
      item.productId === productId 
        ? { ...item, unitPrice: parseFloat(newPrice) || 0 }
        : item
    );
    setCart(updatedCart);
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
    setDiscount({ type: 'none', value: 0 });
    setCustomerInfo({ name: '', contact: '', email: '', address: '' });
    setNotes('');
    fetchNextInvoiceNumber();
  };

  // Handle barcode detection
  const handleBarcodeDetected = async (barcode) => {
    setShowScanner(false);
    setMessage(t('sales.searchingForProduct'));
    
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product, 1);
      setMessage(t('sales.addedToCartViaBarcode', { productName: product.name }));
    } else {
      try {
        const response = await apiClient.get('/products', {
          params: { search: barcode }
        });
        const foundProduct = response.data.data.docs?.find(p => p.barcode === barcode);
        if (foundProduct) {
          addToCart(foundProduct, 1);
          if (!products.find(p => p._id === foundProduct._id)) {
            setProducts(prev => [foundProduct, ...prev]);
          }
        } else {
          setMessage(t('sales.noProductFoundWithBarcode', { barcode }));
        }
      } catch (error) {
        console.error('Error searching for product:', error);
        setMessage(t('sales.errorSearchingProduct'));
      }
    }
    setTimeout(() => setMessage(''), 3000);
  };

  // Validate cart and stock
  const validateCartAndStock = () => {
    if (cart.length === 0) {
      setMessage(t('sales.pleaseAddOneItem'));
      return false;
    }

    for (const item of cart) {
      const product = products.find(p => p._id === item.productId);
      if (!product) {
        setMessage(t('sales.productNotFound', { productName: item.name }));
        return false;
      }
      if (product.stock < item.quantity) {
        setMessage(t('sales.insufficientStockDetailed', { productName: item.name, available: product.stock, required: item.quantity }));
        return false;
      }
    }

    if (discount.type === 'percentage' && (discount.value < 0 || discount.value > 100)) {
      setMessage(t('sales.discountPercentageRange'));
      return false;
    }

    if (discount.type === 'fixed' && discount.value < 0) {
      setMessage(t('sales.discountAmountNonNegative'));
      return false;
    }

    return true;
  };

  // Download invoice PDF
  const downloadInvoice = async (saleId, invoiceNumber) => {
    try {
      setMessage(t('sales.generatingInvoice'));
      
      const response = await apiClient.get(`/sales/${saleId}/invoice`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `invoice_${invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.setAttribute('download', filename);
      
      // Append to html link element page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setMessage(t('sales.invoiceDownloaded'));
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('Error downloading invoice:', error);
      setMessage(t('sales.failedToDownloadInvoice'));
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Submit sale
  const handleSubmitSale = async () => {
    if (!validateCartAndStock()) {
      return;
    }

    setIsSubmitting(true);
    setMessage(t('sales.processingSale'));

    try {
      const soldProducts = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));

      const saleData = {
        soldProducts,
        customerName: customerInfo.name.trim(),
        customerContact: customerInfo.contact.trim(),
        customerEmail: customerInfo.email.trim(),
        customerAddress: customerInfo.address.trim(),
        discountType: discount.type,
        discountValue: discount.value,
        paymentMethod: paymentInfo.method,
        paymentStatus: paymentInfo.status,
        notes: notes.trim(),
        invoiceNumber: invoiceNumber
      };

      const response = await apiClient.post('/sales', saleData);
      
      // Update local products state with new stock levels
      const updatedProducts = products.map(product => {
        const cartItem = cart.find(item => item.productId === product._id);
        if (cartItem) {
          const newStock = product.stock - cartItem.quantity;
          return {
            ...product,
            stock: newStock,
            status: newStock > 0 ? 'in-stock' : 'out-of-stock'
          };
        }
        return product;
      });
      setProducts(updatedProducts);

      // Add new sale to sales history
      setSales(prevSales => [response.data.data, ...prevSales]);

      setMessage(t('sales.saleRecordedSuccessfully'));
      
      // Clear cart and form
      clearCart();
      
      // Hide form if it was force-shown
      if (!showAddForm) {
        setForceShowAddForm(false);
      }

    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Error recording sale:', error);
        const errorMessage = error.response?.data?.message || t('sales.failedToRecordSale');
        setMessage(`❌ ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-lg text-gray-600">{t('sales.loadingSalesData')}</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Enhanced Sale Form with Cart */}
      {(forceShowAddForm || showAddForm) && (
        <div className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">{t('sales.createMultiItemInvoice')}</h2>
                <p className="text-green-100 mt-1">{t('sales.invoiceNumber', { number: invoiceNumber })}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-md hover:bg-opacity-30 transition-colors flex items-center gap-2"
                >
                  📷 {t('sales.scanBarcode')}
                </button>
                {!showAddForm && (
                  <button
                    onClick={() => setForceShowAddForm(false)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mx-6 mt-4 p-3 rounded-md ${
              message.includes('✅') || message.includes('successfully') || message.includes('Added')
                ? 'bg-green-100 text-green-700 border border-green-300'
                : message.includes('❌') || message.includes('Error') || message.includes('Failed')
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-blue-100 text-blue-700 border border-blue-300'
            }`}>
              <div className="flex items-center">
                <span className="mr-2">
                  {message.includes('✅') ? '[SUCCESS]' : message.includes('❌') ? '[ERROR]' : '[INFO]'}
                </span>
                {message}
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Product Selection */}
              <div className="lg:col-span-2 space-y-6">
                {/* Product Search and Add */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('sales.addProductsToCart')}</h3>
                  
                  {/* Product Search */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('sales.searchProducts')}
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('sales.searchPlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Product List */}
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {searchTerm ? t('sales.noProductsFoundSearch') : t('sales.noProductsAvailable')}
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <div
                          key={product._id}
                          className="p-3 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              {product.brand && `${product.brand} • `}
                              {t('sales.stock')}: {product.stock} • 
                              ₹{product.retailPrice}
                              {product.wholesalePrice !== product.retailPrice && ` (${t('sales.wholesale')}: ₹${product.wholesalePrice})`}
                            </div>
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              product.stock === 0
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {product.stock === 0 ? t('sales.outOfStock') : t('sales.addToCart')}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Shopping Cart */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {t('sales.shoppingCart', { count: cartTotals.itemCount })}
                    </h3>
                    {cart.length > 0 && (
                      <button
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        {t('sales.clearCart')}
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {cart.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <div className="text-6xl mb-4">🛒</div>
                        <p className="text-lg">{t('sales.cartEmpty')}</p>
                        <p className="text-sm">{t('sales.addProductsInstructions')}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {cart.map((item) => (
                          <div key={item.productId} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="font-medium text-gray-900">{item.name}</div>
                                {item.brand && (
                                  <div className="text-sm text-gray-500">{item.brand}</div>
                                )}
                                <div className="text-xs text-gray-400">{t('sales.stockAvailable')}: {item.stock}</div>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.productId)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                {t('common.remove')}
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                              {/* Quantity */}
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{t('sales.quantity')}</label>
                                <input
                                  type="number"
                                  min="1"
                                  max={item.stock}
                                  value={item.quantity}
                                  onChange={(e) => updateCartItemQuantity(item.productId, parseInt(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                              </div>
                              
                              {/* Unit Price */}
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{t('sales.unitPrice')} (₹)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => updateCartItemPrice(item.productId, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                              </div>
                              
                              {/* Total */}
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{t('sales.total')} (₹)</label>
                                <div className="px-2 py-1 text-sm bg-gray-100 rounded font-medium">
                                  {(item.quantity * item.unitPrice).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Customer Info, Discount, and Total */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('sales.customerInformation')}</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder={t('sales.customerName')}
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder={t('sales.phoneNumber')}
                      value={customerInfo.contact}
                      onChange={(e) => setCustomerInfo({...customerInfo, contact: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="email"
                      placeholder={t('sales.emailAddress')}
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <textarea
                      placeholder={t('sales.address')}
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>
                </div>

                {/* Discount */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('sales.discount')}</h3>
                  <div className="space-y-3">
                    <select
                      value={discount.type}
                      onChange={(e) => setDiscount({...discount, type: e.target.value, value: 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="none">{t('sales.noDiscount')}</option>
                      <option value="percentage">{t('sales.percentage')} (%)</option>
                      <option value="fixed">{t('sales.fixedAmount')} (₹)</option>
                    </select>
                    
                    {discount.type !== 'none' && (
                      <input
                        type="number"
                        min="0"
                        max={discount.type === 'percentage' ? 100 : undefined}
                        step={discount.type === 'percentage' ? 1 : 0.01}
                        value={discount.value}
                        onChange={(e) => setDiscount({...discount, value: parseFloat(e.target.value) || 0})}
                        placeholder={discount.type === 'percentage' ? t('sales.enterPercentage') : t('sales.enterAmount')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('sales.payment')}</h3>
                  <div className="space-y-3">
                    <select
                      value={paymentInfo.method}
                      onChange={(e) => setPaymentInfo({...paymentInfo, method: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="cash">{t('sales.paymentMethods.cash')}</option>
                      <option value="card">{t('sales.paymentMethods.card')}</option>
                      <option value="upi">{t('sales.paymentMethods.upi')}</option>
                      <option value="bank_transfer">{t('sales.paymentMethods.bankTransfer')}</option>
                      <option value="cheque">{t('sales.paymentMethods.cheque')}</option>
                      <option value="other">{t('sales.paymentMethods.other')}</option>
                    </select>
                    
                    <select
                      value={paymentInfo.status}
                      onChange={(e) => setPaymentInfo({...paymentInfo, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="paid">{t('sales.paymentStatus.paid')}</option>
                      <option value="pending">{t('sales.paymentStatus.pending')}</option>
                      <option value="partial">{t('sales.paymentStatus.partial')}</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('sales.notes')}</h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('sales.notesPlaceholder')}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>

                {/* Order Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('sales.orderSummary')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('sales.subtotal')}:</span>
                      <span>₹{cartTotals.subtotal.toFixed(2)}</span>
                    </div>
                    
                    {cartTotals.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          {t('sales.discount')} ({discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}):
                        </span>
                        <span>-₹{cartTotals.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-lg">
                      <span>{t('sales.total')}:</span>
                      <span>₹{cartTotals.total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-6 space-y-2">
                    <button
                      onClick={handleSubmitSale}
                      disabled={isSubmitting || cart.length === 0}
                      className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
                        isSubmitting || cart.length === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      } transition-colors`}
                    >
                      {isSubmitting ? t('sales.processing') : t('sales.completeSale', { amount: cartTotals.total.toFixed(2) })}
                    </button>
                    
                    {cart.length > 0 && (
                      <button
                        onClick={clearCart}
                        disabled={isSubmitting}
                        className="w-full py-2 px-4 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                      >
                        {t('sales.clearAll')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            {t('sales.createNewInvoice')}
          </button>
        </div>
      )}

      {/* Sales History */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">{t('sales.recentInvoices')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('sales.latestTransactions')}</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sales.invoice')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sales.customer')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sales.items')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sales.total')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sales.payment')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sales.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sales.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="text-4xl mb-4">📄</div>
                    <p className="text-lg">{t('sales.noSalesRecorded')}</p>
                    <p className="text-sm">{t('sales.createFirstInvoice')}</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sale.invoiceNumber || `#${sale._id.slice(-6)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {sale.customerName || t('sales.walkInCustomer')}
                      </div>
                      {sale.customerContact && (
                        <div className="text-sm text-gray-500">{sale.customerContact}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {t('sales.itemCount', { count: sale.soldProducts?.length || 0 })}
                      </div>
                      {sale.itemsCount && (
                        <div className="text-sm text-gray-500">{t('sales.unitsCount', { count: sale.itemsCount })}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{(sale.totalAmount || sale.saleCost || 0).toFixed(2)}
                      </div>
                      {sale.discountAmount > 0 && (
                        <div className="text-sm text-green-600">
                          -₹{sale.discountAmount.toFixed(2)} {t('sales.discount')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sale.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : sale.paymentStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {sale.paymentStatus || 'Paid'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {sale.paymentMethod || 'Cash'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => downloadInvoice(sale._id, sale.invoiceNumber || sale._id)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded text-xs font-medium transition-colors"
                      >
                        📄 {t('sales.downloadPDF')}
                      </button>
                    </td>
                  </tr>
                ))
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

export default EnhancedSalesPage;