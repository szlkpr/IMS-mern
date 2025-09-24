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
    <div className="max-w-7xl mx-auto p-6">
      <AddProduct onAdd={() => setRefresh(r => !r)} />
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">All Products</h2>
          <p className="text-sm text-gray-600 mt-1">{products.length} products total</p>
        </div>
        
        {products.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg">No products found.</p>
            <p className="text-gray-400 text-sm">Add your first product using the form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prices</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map(product => {
                  const isLowStock = product.stock <= (product.lowStockThreshold || 5);
                  const isOutOfStock = product.stock === 0;
                  
                  return (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.brand && <div className="text-sm text-gray-500">Brand: {product.brand}</div>}
                          {product.description && <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>}
                          {product.barcode && <div className="text-xs text-gray-400">Barcode: {product.barcode}</div>}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.category?.name || 'Uncategorized'}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{product.stock}</div>
                        <div className="text-xs text-gray-500">Alert: {product.lowStockThreshold || 5}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Retail: ₹{typeof product.retailPrice === 'number' ? product.retailPrice.toFixed(2) : product.retailPrice}</div>
                          <div>Wholesale: ₹{typeof product.wholesalePrice === 'number' ? product.wholesalePrice.toFixed(2) : product.wholesalePrice}</div>
                          {product.buyingPrice > 0 && (
                            <div className="text-xs text-gray-500">Cost: ₹{product.buyingPrice.toFixed(2)}</div>
                          )}
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
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.variant && <div>Variant: {product.variant}</div>}
                        {product.compatibility && <div>Compatibility: {product.compatibility}</div>}
                        <div className="text-xs text-gray-400 mt-1">
                          Added: {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}