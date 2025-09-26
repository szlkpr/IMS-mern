import { useState, useEffect } from 'react';
import apiClient from '../api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [isFormCollapsed, setIsFormCollapsed] = useState(true);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/categories');
      setCategories(response.data.data.docs || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Create new category
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    
    setIsSubmitting(true);
    setMessage('');
    
    try {
      const response = await apiClient.post('/categories', { name: newCategory.trim() });
      setCategories(prev => [response.data.data, ...prev]);
      setNewCategory('');
      setIsFormCollapsed(true); // Collapse form after successful submission
      setMessage('Category created successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error creating category:', error);
      setMessage(error.response?.data?.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update category
  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    
    setIsSubmitting(true);
    setMessage('');
    
    try {
      const response = await apiClient.put(`/categories/${id}`, { name: editName.trim() });
      setCategories(prev => prev.map(cat => 
        cat._id === id ? response.data.data : cat
      ));
      setEditingCategory(null);
      setEditName('');
      setMessage('Category updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating category:', error);
      setMessage(error.response?.data?.message || 'Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete category
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    setIsSubmitting(true);
    setMessage('');
    
    try {
      await apiClient.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(cat => cat._id !== id));
      setMessage('Category deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting category:', error);
      setMessage(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing
  const startEdit = (category) => {
    setEditingCategory(category._id);
    setEditName(category.name);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Category Management</h1>
        <p className="text-gray-600">Organize your products with categories</p>
      </div>

      {/* Add New Category Form */}
      <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden">
        {/* Collapsible Header */}
        <div 
          className="bg-gradient-to-r from-green-600 to-green-700 p-4 cursor-pointer hover:from-green-700 hover:to-green-800 transition-all"
          onClick={() => setIsFormCollapsed(!isFormCollapsed)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <span className="text-white text-xl">+</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add New Category</h2>
                <p className="text-green-100 text-sm">Click to expand the category form</p>
              </div>
            </div>
            <div className={`text-white text-2xl transform transition-transform ${isFormCollapsed ? '' : 'rotate-180'}`}>
              ▼
            </div>
          </div>
        </div>
        
        {/* Message Display */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-md ${
            message.includes('successfully') 
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
        <div className={`transition-all duration-300 ${isFormCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'} overflow-hidden`}>
          <form onSubmit={handleCreate} className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
              <button 
                type="button"
                onClick={() => setIsFormCollapsed(true)}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newCategory.trim()}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">All Categories</h2>
          <p className="text-sm text-gray-600 mt-1">{categories.length} categories total</p>
        </div>

        {error && (
          <div className="p-6 bg-red-100 border border-red-300 text-red-700">
            {error}
          </div>
        )}

        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-4xl mb-4 font-bold">NO CATEGORIES</div>
            <p className="text-gray-500 text-lg">No categories found</p>
            <p className="text-gray-400 text-sm">Add your first category using the form above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {categories.map((category) => (
              <div key={category._id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  {editingCategory === category._id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdate(category._id)}
                        disabled={isSubmitting || !editName.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                      {category.slug && (
                        <p className="text-xs text-gray-400">Slug: {category.slug}</p>
                      )}
                    </div>
                  )}
                </div>

                {editingCategory !== category._id && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEdit(category)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      disabled={isSubmitting}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}