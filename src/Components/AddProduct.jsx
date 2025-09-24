import { useState, useEffect } from "react";
import apiClient from "../api";

export default function AddProduct({ onAdd }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    retailPrice: "",
    wholesalePrice: "",
    wholesaleThreshold: "",
    stock: "",
    category: "",
    barcode: "",
    brand: "",
    variant: "",
    compatibility: "",
    lowStockThreshold: "5",
    buyingPrice: ""
  });
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/categories');
        setCategories(response.data.data.docs || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
  e.preventDefault();
  setMessage("Adding...");
  try {
    await apiClient.post("/products", form);
    setMessage("Product added!");
    setForm({
        name: "",
        description: "",
        retailPrice: "",
        wholesalePrice: "",
        wholesaleThreshold: "",
        stock: "",
        category: "",
        barcode: "",
        brand: "",
        variant: "",
        compatibility: "",
        lowStockThreshold: "5",
        buyingPrice: ""
      });
    if (onAdd) onAdd();
  } catch (error) {
    console.error("Error adding product:", error);
    setMessage(error.response?.data?.message || "Error adding product");
  }
};

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Product</h3>
      
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.includes('added') || message.includes('success')
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Basic Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input 
            name="name" 
            placeholder="Enter product name" 
            value={form.name} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input 
            name="description" 
            placeholder="Product description" 
            value={form.description} 
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <input 
            name="brand" 
            placeholder="Brand name" 
            value={form.brand} 
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Pricing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Buying Price</label>
          <input 
            type="number" 
            min="0" 
            step="0.01" 
            name="buyingPrice" 
            placeholder="0.00" 
            value={form.buyingPrice} 
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price *</label>
          <input 
            type="number" 
            min="0" 
            step="0.01" 
            name="retailPrice" 
            placeholder="0.00" 
            value={form.retailPrice} 
            onChange={handleChange} 
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price *</label>
          <input 
            type="number" 
            min="0" 
            step="0.01" 
            name="wholesalePrice" 
            placeholder="0.00" 
            value={form.wholesalePrice} 
            onChange={handleChange} 
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Stock Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
          <input 
            type="number" 
            min="0" 
            name="stock" 
            placeholder="0" 
            value={form.stock} 
            onChange={handleChange} 
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Threshold *</label>
          <input 
            type="number" 
            min="0" 
            name="wholesaleThreshold" 
            placeholder="Minimum qty for wholesale" 
            value={form.wholesaleThreshold} 
            onChange={handleChange} 
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
          <input 
            type="number" 
            min="0" 
            name="lowStockThreshold" 
            placeholder="Alert threshold" 
            value={form.lowStockThreshold} 
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Car Accessory Specific */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Variant</label>
          <input 
            name="variant" 
            placeholder="e.g., Honda City, Toyota Corolla" 
            value={form.variant} 
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Compatibility</label>
          <input 
            name="compatibility" 
            placeholder="e.g., Universal, Perfect Fit" 
            value={form.compatibility} 
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
          <input 
            name="barcode" 
            placeholder="Product barcode" 
            value={form.barcode} 
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category" 
            value={form.category} 
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category (optional)</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Submit Button */}
        <div className="md:col-span-2 lg:col-span-3">
          <button 
            type="submit" 
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Product
          </button>
        </div>
      </form>
    </div>
  );
}