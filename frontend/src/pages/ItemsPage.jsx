import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useItemsAPI from '../api/items';
import useDebounce from '../hooks/useDebounce';
import ConfirmationModal from '../components/ConfirmationModal';
import CreateItemModal from '../components/CreateItemModal';
import useAuth from '../hooks/useAuth';

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const itemsAPI = useItemsAPI();
  const { auth } = useAuth();

  // State for search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [refetchToggle, setRefetchToggle] = useState(false);

  // State for modals and notifications
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchItems = async () => {
      // Only fetch if user is authenticated
      if (!auth?.accessToken) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      
      try {
        const params = {
          page: currentPage.toString(),
          limit: '10',
        };
        if (debouncedSearchTerm) {
          params.search = debouncedSearchTerm;
        }

        const response = await itemsAPI.getItems(params);

        if (isMounted) {
          setItems(response.items);
          setTotalPages(response.totalPages);
          setCurrentPage(response.currentPage);
          setTotalItems(response.totalItems);
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && isMounted) {
          const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch items.';
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchItems();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [auth?.accessToken, debouncedSearchTerm, currentPage, refetchToggle]);

  const refetch = () => {
    setRefetchToggle(prev => !prev);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsConfirming(true);
    setNotification({ message: '', type: '' });

    try {
      await itemsAPI.deleteItem(itemToDelete.id);
      setNotification({ message: `Item "${itemToDelete.name}" has been deleted.`, type: 'success' });
      setItemToDelete(null);
      refetch();
    } catch (err) {
      setNotification({ message: err.response?.data?.message || 'Failed to delete item.', type: 'error' });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSuccess = (message) => {
    setIsCreateModalOpen(false);
    setEditingItemId(null);
    setNotification({ message, type: 'success' });
    refetch();
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // Check permissions for actions
  const canCreateItem = auth.user?.permissions?.includes('CREATE_ITEM');
  const canUpdateItem = auth.user?.permissions?.includes('UPDATE_ITEM');
  const canDeleteItem = auth.user?.permissions?.includes('DELETE_ITEM');

  if (loading && items.length === 0) {
    return <div className="text-center p-8">Loading items...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Item Management</h1>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          {canCreateItem && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Create Item
            </button>
          )}
        </div>

        {notification.message && (
          <div className={`mb-4 p-4 text-sm rounded-md ${notification.type === 'success' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
            {notification.message}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <Link 
                      to={`/items/${item.id}`}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="py-4 px-4">
                    <div className="max-w-xs truncate" title={item.description}>
                      {item.description}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.quantity > 10 ? 'bg-green-100 text-green-800' : 
                      item.quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link 
                        to={`/items/${item.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      {canUpdateItem && (
                        <button 
                          onClick={() => setEditingItemId(item.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      )}
                      {canDeleteItem && (
                        <button
                          onClick={() => setItemToDelete({ id: item.id, name: item.name })}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No items found. {canCreateItem && 'Create your first item to get started!'}
          </div>
        )}

        {items.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <button 
              onClick={handlePrevPage} 
              disabled={currentPage === 1 || loading} 
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {currentPage} of {totalPages} ({totalItems} total items)
            </span>
            <button 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages || loading} 
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <CreateItemModal
        isOpen={isCreateModalOpen || editingItemId !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingItemId(null);
        }}
        onSuccess={handleSuccess}
        itemId={editingItemId}
      />

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the item "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isConfirming={isConfirming}
      />
    </>
  );
};

export default ItemsPage; 