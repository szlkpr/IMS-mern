import { useEffect, useState } from "react";
import AddProduct from "../Components/AddProduct";
import apiClient from "../api";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiClient.get("/products");
        setProducts(response.data?.data?.docs || []);
      } catch (err) {
        // The interceptor handles 401s by redirecting.
        // We should not show an error for 401s or aborted requests.
        if (err.response?.status !== 401 && err.code !== "ECONNABORTED" && err.code !== "ERR_CANCELED") {
          console.error("Error fetching products:", err);
          setError("Failed to fetch products.");
        }
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [refresh]);

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <AddProduct onAdd={() => setRefresh(r => !r)} />
      <h2>All Products</h2>
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <table style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Retail Price</th>
              <th>Wholesale Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{product.description}</td>
                <td>{product.category}</td>
                <td>{product.stock}</td>
                <td>₹{typeof product.retailPrice === 'number' ? product.retailPrice.toFixed(2) : product.retailPrice}</td>
                <td>₹{typeof product.wholesalePrice === 'number' ? product.wholesalePrice.toFixed(2) : product.wholesalePrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}