import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api';
import axios from 'axios';

const SalesPage = () => {
  // State for products, sales, and form inputs
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

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
    }
  }, [selectedProduct, quantity, products]);

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
    <div>
      <h2>Record a New Sale</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
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
          <label htmlFor="price">Sale Price (per item): ₹</label>
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
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Recording...' : 'Record Sale'}</button>
      </form>

      <hr style={{ margin: '2rem 0' }} />

      <h2>All Sales</h2>
      <table style={{ width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {sales.flatMap((sale) =>
            sale.soldProducts.map((soldItem, index) => {
              const product = soldItem.productId;
              const pricePerItem = soldItem.price || (sale.saleCost / soldItem.quantity);
              return (
                <tr key={`${sale._id}-${index}`}>
                  <td>{product?.name ?? 'N/A'}</td>
                  <td>{soldItem.quantity}</td>
                  <td>₹{pricePerItem.toFixed(2)}</td>
                  {/* Show date only for the first item in a multi-item sale */}
                  <td>{index === 0 ? new Date(sale.createdAt).toLocaleDateString() : ''}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SalesPage;
