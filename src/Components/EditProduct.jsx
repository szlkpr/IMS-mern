import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import apiClient from "../api";

export default function EditProduct({ product, categories, onEdit, onCancel }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
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
    compatibility: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        retailPrice: product.retailPrice || "",
        wholesalePrice: product.wholesalePrice || "",
        wholesaleThreshold: product.wholesaleThreshold || "",
        stock: product.stock || "",
        category: product.category?._id || "",
        barcode: product.barcode || "",
        brand: product.brand || "",
        variant: product.variant || "",
        compatibility: product.compatibility || ""
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = t('inventory.validation.nameRequired');
    if (!formData.description.trim()) newErrors.description = t('inventory.validation.descriptionRequired');
    if (!formData.category) newErrors.category = t('inventory.validation.categoryRequired');
    
    const retailPrice = parseFloat(formData.retailPrice);
    const wholesalePrice = parseFloat(formData.wholesalePrice);
    const wholesaleThreshold = parseInt(formData.wholesaleThreshold);
    const stock = parseInt(formData.stock);

    if (isNaN(retailPrice) || retailPrice <= 0) {
      newErrors.retailPrice = t('inventory.validation.validRetailPriceRequired');
    }
    if (isNaN(wholesalePrice) || wholesalePrice <= 0) {
      newErrors.wholesalePrice = t('inventory.validation.validWholesalePriceRequired');
    }
    if (isNaN(wholesaleThreshold) || wholesaleThreshold <= 0) {
      newErrors.wholesaleThreshold = t('inventory.validation.validWholesaleThresholdRequired');
    }
    if (isNaN(stock) || stock < 0) {
      newErrors.stock = t('inventory.validation.validStockQuantityRequired');
    }

    if (retailPrice && wholesalePrice && wholesalePrice >= retailPrice) {
      newErrors.wholesalePrice = t('inventory.validation.wholesaleLessThanRetail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        retailPrice: parseFloat(formData.retailPrice),
        wholesalePrice: parseFloat(formData.wholesalePrice),
        wholesaleThreshold: parseInt(formData.wholesaleThreshold),
        stock: parseInt(formData.stock)
      };

      await apiClient.patch(`/products/${product._id}`, updateData);
      onEdit(); // Callback to refresh products list
    } catch (error) {
      console.error("Error updating product:", error);
      
      // Extract error message from different response formats
      let errorMessage = t('inventory.errors.failedToUpdateProduct');
      
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
        }
      }
      
      // Handle barcode duplicate errors specifically
      if (errorMessage.includes("barcode") && errorMessage.includes("already exists")) {
        setErrors({ submit: errorMessage });
      } else {
        setErrors({ submit: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">{t('inventory.editProduct')}</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              disabled={loading}
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inventory.productName')} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('inventory.enterProductName')}
                disabled={loading}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inventory.category')} *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">{t('inventory.selectCategory')}</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inventory.brand')}
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('inventory.enterBrandName')}
                disabled={loading}
              />
            </div>

            {/* Retail Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inventory.retailPrice')} *
              </label>
              <input
                type="number"
                step="0.01"
                name="retailPrice"
                value={formData.retailPrice}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.retailPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                disabled={loading}
              />
              {errors.retailPrice && <p className="text-red-500 text-sm mt-1">{errors.retailPrice}</p>}
            </div>

            {/* Wholesale Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inventory.wholesalePrice')} *
              </label>
              <input
                type="number"
                step="0.01"
                name="wholesalePrice"
                value={formData.wholesalePrice}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.wholesalePrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                disabled={loading}
              />
              {errors.wholesalePrice && <p className="text-red-500 text-sm mt-1">{errors.wholesalePrice}</p>}
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inventory.stock')} *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.stock ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                disabled={loading}
              />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
            </div>

            {/* Wholesale Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inventory.lowStockThreshold')} *
              </label>
              <input
                type="number"
                name="wholesaleThreshold"
                value={formData.wholesaleThreshold}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.wholesaleThreshold ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('inventory.minimumQuantityPlaceholder')}
                disabled={loading}
              />
              {errors.wholesaleThreshold && <p className="text-red-500 text-sm mt-1">{errors.wholesaleThreshold}</p>}
            </div>

            {/* Variant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inventory.variant')}
              </label>
              <input
                type="text"
                name="variant"
                value={formData.variant}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('inventory.variantPlaceholder')}
                disabled={loading}
              />
            </div>

            {/* Barcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inventory.barcode')}
              </label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('inventory.barcodePlaceholder')}
                disabled={loading}
              />
            </div>

            {/* Compatibility */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inventory.compatibility')}
              </label>
              <input
                type="text"
                name="compatibility"
                value={formData.compatibility}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('inventory.compatibilityPlaceholder')}
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inventory.description')} *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('inventory.enterProductDescription')}
                disabled={loading}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('inventory.updating')}
                </>
              ) : (
                t('inventory.updateProduct')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}