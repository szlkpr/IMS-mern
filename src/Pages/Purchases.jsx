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
    <div>
      <h2>Add New Purchase</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="supplierName">Supplier Name:</label>
          <input
            type="text"
            id="supplierName"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="vendorContact">Vendor Contact:</label>
          <input
            type="text"
            id="vendorContact"
            value={vendorContact}
            onChange={(e) => setVendorContact(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="product">Product:</label>
          <select
            id="product"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            required
          >
            <option value="" disabled>Select a product</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name} (In Stock: {product.stock})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="quantity">Quantity:</label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            required
          />
        </div>
        <div>
          <label htmlFor="price">Purchase Price (per item): ₹</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0.01"
            step="0.01"
            required
          />
        </div>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Purchase'}</button>
      </form>

      <hr style={{ margin: '2rem 0' }} />

      <h2>All Purchases</h2>
      <table style={{ width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Items</th>
            <th>Total Cost</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
              <tr key={purchase._id}>
                <td>{purchase.supplierName || purchase.vendorCompanyName || 'N/A'}</td>
                <td>{purchase.items?.length || purchase.purchasedProducts?.length || 0}</td>
                <td>₹{(purchase.totalCost || purchase.saleCost || 0).toFixed(2)}</td>
                <td>{new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString()}</td>
                <td>{purchase.status}</td>
              </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PurchasesPage;