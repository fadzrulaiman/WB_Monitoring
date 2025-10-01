import { useState, useEffect } from 'react';
import useItemsAPI from '../api/items';

const CreateItemModal = ({ isOpen, onClose, onSuccess, itemId }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const itemsAPI = useItemsAPI();

  const isEditMode = !!itemId;

  useEffect(() => {
    if (isOpen) {
      // Reset form state when modal opens
      setError('');
      setFormData({ name: '', description: '', quantity: 0 });

      if (isEditMode && itemId) {
        const fetchItem = async () => {
          setLoading(true);
          try {
            const response = await itemsAPI.getItemById(itemId);
            const { name, description, quantity } = response;
            setFormData({ name, description, quantity });
          } catch (err) {
            if (err.name !== 'CanceledError') {
              setError('Failed to fetch item data.');
            }
          } finally {
            setLoading(false);
          }
        };

        fetchItem();
      }
    }
  }, [isOpen, itemId, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === 'quantity' ? parseInt(value) || 0 : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        await itemsAPI.updateItem(itemId, formData);
        onSuccess('Item updated successfully.');
      } else {
        await itemsAPI.createItem(formData);
        onSuccess('Item created successfully.');
      }
    } catch (err) {
      const apiError = err.response?.data;
      if (apiError?.errors) {
        const firstErrorKey = Object.keys(apiError.errors)[0];
        setError(apiError.errors[firstErrorKey][0]);
      } else {
        setError(apiError?.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{isEditMode ? 'Edit Item' : 'Create Item'}</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input 
              type="text" 
              name="name" 
              id="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea 
              name="description" 
              id="description" 
              value={formData.description} 
              onChange={handleChange} 
              required 
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
            />
          </div>
          <div className="mb-6">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input 
              type="number" 
              name="quantity" 
              id="quantity" 
              value={formData.quantity} 
              onChange={handleChange} 
              required 
              min="0"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
            />
          </div>
          <div className="flex items-center justify-end space-x-4">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading} 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Item' : 'Create Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateItemModal; 