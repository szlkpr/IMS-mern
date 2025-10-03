import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import apiClient from "../api";

export default function AddProduct({ onAdd }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    description: "",
    retailPrice: "",
    wholesalePrice: "",
    stock: "",
    category: "",
    barcode: "",
    brand: "",
    variant: "",
    compatibility: [""], // Changed to array for multiple inputs
    lowStockThreshold: "5"
  });
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(true);

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

  // Handle compatibility array changes
  const handleCompatibilityChange = (index, value) => {
    const newCompatibility = [...form.compatibility];
    newCompatibility[index] = value;
    setForm({ ...form, compatibility: newCompatibility });
  };

  // Add new compatibility input
  const addCompatibilityField = () => {
    setForm({ ...form, compatibility: [...form.compatibility, ""] });
  };

  // Remove compatibility input
  const removeCompatibilityField = (index) => {
    if (form.compatibility.length > 1) {
      const newCompatibility = form.compatibility.filter((_, i) => i !== index);
      setForm({ ...form, compatibility: newCompatibility });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage(t('inventory.adding'));
    
    // Basic validation
    if (!form.name.trim()) {
      setMessage(t('inventory.validation.nameRequired'));
      return;
    }
    
    if (!form.description.trim()) {
      setMessage(t('inventory.validation.descriptionRequired'));
      return;
    }
    
    if (!form.category) {
      setMessage(t('inventory.validation.categoryRequired'));
      return;
    }
    
    if (!form.retailPrice || parseFloat(form.retailPrice) <= 0) {
      setMessage(t('inventory.validation.validRetailPriceRequired'));
      return;
    }
    
    if (!form.wholesalePrice || parseFloat(form.wholesalePrice) <= 0) {
      setMessage(t('inventory.validation.validWholesalePriceRequired'));
      return;
    }
    
    if (!form.stock || parseInt(form.stock) < 0) {
      setMessage(t('inventory.validation.validStockQuantityRequired'));
      return;
    }
    
    try {
      // Clean and prepare form data - backend expects these required fields
      const submitData = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        retailPrice: parseFloat(form.retailPrice),
        wholesalePrice: parseFloat(form.wholesalePrice),
        wholesaleThreshold: 1, // Backend still expects this, set default
        stock: parseInt(form.stock),
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5
      };
      
      // Add optional fields only if they have values
      // Don't send barcode field at all if empty to avoid MongoDB duplicate null key error
      const trimmedBarcode = form.barcode.trim();
      if (trimmedBarcode) {
        submitData.barcode = trimmedBarcode;
      }
      // Note: Not including barcode field when empty should prevent duplicate null key error
      
      if (form.brand.trim()) submitData.brand = form.brand.trim();
      if (form.variant.trim()) submitData.variant = form.variant.trim();
      
      const compatibilityStr = form.compatibility.filter(c => c.trim()).join(', ');
      if (compatibilityStr) submitData.compatibility = compatibilityStr;
      
      console.log('Submitting product data:', submitData);
      
      await apiClient.post("/products", submitData);
      setMessage(t('inventory.messages.productAddedSuccessfully'));
      setForm({
        name: "",
        description: "",
        retailPrice: "",
        wholesalePrice: "",
        stock: "",
        category: "",
        barcode: "",
        brand: "",
        variant: "",
        compatibility: [""],
        lowStockThreshold: "5"
      });
      setIsCollapsed(true); // Collapse form after successful submission
      if (onAdd) onAdd();
    } catch (error) {
      console.error("Error adding product:", error);
      console.log('Error response:', error.response?.data);
      
      // Extract error message from different response formats
      let errorMessage = t('inventory.errors.failedToAddProduct');
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Handle JSON response
        if (typeof data === 'object' && data.message) {
          errorMessage = data.message;
        }
        // Handle HTML response (extract from HTML error page)
        else if (typeof data === 'string') {
          // Try to extract error message from HTML
          const match = data.match(/Error: (.+?)</);
          if (match && match[1]) {
            errorMessage = match[1];
          }
          // Handle specific MongoDB duplicate key errors
          else if (data.includes('E11000 duplicate key error')) {
            if (data.includes('barcode')) {
              errorMessage = t('inventory.errors.barcodeExists');
            } else if (data.includes('name')) {
              errorMessage = t('inventory.errors.nameExists');
            } else {
              errorMessage = t('inventory.errors.duplicateProduct');
            }
          }
        }
      }
      
      setMessage(errorMessage);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden">
      {/* Collapsible Header */}
      <div 
        className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <span className="text-white text-xl">+</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{t('inventory.addNewProduct')}</h3>
              <p className="text-blue-100 text-sm">{t('inventory.clickToExpandForm')}</p>
            </div>
          </div>
          <div className={`text-white text-2xl transform transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
            ▼
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mx-6 mt-4 p-3 rounded-md ${
          message.includes('successfully') || message.includes('added')
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {message.includes('successfully') ? '[SUCCESS]' : '[ERROR]'}
            </span>
            {message}
          </div>
        </div>
      )}
      
      {/* Collapsible Form */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'} overflow-hidden`}>
        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Information Section */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3 text-sm font-bold">INFO</span>
              <span>{t('inventory.sections.basicInformation')}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.productName')} *</label>
                <input 
                  name="name" 
                  placeholder={t('inventory.enterProductName')}
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.brand')}</label>
                <input 
                  name="brand" 
                  placeholder={t('inventory.enterBrandName')}
                  value={form.brand} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.category')}</label>
                <select
                  name="category" 
                  value={form.category} 
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">{t('inventory.selectCategoryOptional')}</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.description')}</label>
                <textarea 
                  name="description" 
                  placeholder={t('inventory.enterProductDescription')}
                  value={form.description} 
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-green-100 text-green-600 p-2 rounded-lg mr-3 text-sm font-bold">PRICE</span>
              <span>{t('inventory.sections.pricingInformation')}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.retailPrice')} *</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  name="retailPrice" 
                  placeholder="0.00" 
                  value={form.retailPrice} 
                  onChange={handleChange} 
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.wholesalePrice')} *</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  name="wholesalePrice" 
                  placeholder="0.00" 
                  value={form.wholesalePrice} 
                  onChange={handleChange} 
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Stock Management Section */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-orange-100 text-orange-600 p-2 rounded-lg mr-3 text-sm font-bold">STOCK</span>
              <span>{t('inventory.sections.stockManagement')}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.stock')} *</label>
                <input 
                  type="number" 
                  min="0" 
                  name="stock" 
                  placeholder="0" 
                  value={form.stock} 
                  onChange={handleChange} 
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.lowStockThreshold')}</label>
                <input 
                  type="number" 
                  min="0" 
                  name="lowStockThreshold" 
                  placeholder={t('inventory.alertThresholdPlaceholder')}
                  value={form.lowStockThreshold} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-3 text-sm font-bold">DETAILS</span>
              <span>{t('inventory.sections.productDetails')}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.variant')}</label>
                <input 
                  name="variant" 
                  placeholder={t('inventory.variantPlaceholder')}
                  value={form.variant} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.barcode')}</label>
                <input 
                  name="barcode" 
                  placeholder={t('inventory.barcodePlaceholder')}
                  value={form.barcode} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Multiple Compatibility Inputs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('inventory.compatibility')}</label>
              <div className="space-y-3">
                {form.compatibility.map((comp, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input 
                      placeholder={t('inventory.compatibilityPlaceholder')}
                      value={comp} 
                      onChange={(e) => handleCompatibilityChange(index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    {form.compatibility.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeCompatibilityField(index)}
                        className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title={t('inventory.removeCompatibility')}
                      >
                        {t('inventory.remove')}
                      </button>
                    )}
                    {index === form.compatibility.length - 1 && (
                      <button 
                        type="button"
                        onClick={addCompatibilityField}
                        className="p-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        title={t('inventory.addCompatibility')}
                      >
                        {t('inventory.add')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{t('inventory.compatibilityHelpText')}</p>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button 
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
            >
              {t('inventory.addProduct')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}