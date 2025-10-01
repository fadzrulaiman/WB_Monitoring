import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useItemsAPI from '../api/items';
import ConfirmationModal from '../components/ConfirmationModal';
import CreateItemModal from '../components/CreateItemModal';
import useAuth from '../hooks/useAuth';

const ItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const itemsAPI = useItemsAPI();
  const { auth } = useAuth();

  // State for modals and notifications
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchItem = async () => {
      setLoading(true);
      try {
        const response = await itemsAPI.getItemById(id);
        if (isMounted) {
          setItem(response);
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError(err.response?.data?.message || 'Failed to fetch item.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchItem();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id]);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsConfirming(true);
    setNotification({ message: '', type: '' });

    try {
      await itemsAPI.deleteItem(itemToDelete.id);
      setNotification({ message: `Item "${itemToDelete.name}" has been deleted.`, type: 'success' });
      setItemToDelete(null);
      // Navigate back to items list after successful deletion
      setTimeout(() => {
        navigate('/items');
      }, 1500);
    } catch (err) {
      setNotification({ message: err.response?.data?.message || 'Failed to delete item.', type: 'error' });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSuccess = (message) => {
    setIsEditModalOpen(false);
    setNotification({ message, type: 'success' });
    // Refetch the item data
    window.location.reload();
  };

  // Check permissions for actions
  const canUpdateItem = auth.user?.permissions?.includes('UPDATE_ITEM');
  const canDeleteItem = auth.user?.permissions?.includes('DELETE_ITEM');

  if (loading) {
    return <div className="text-center p-8">Loading item...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center p-8 text-red-500">{error}</div>
        <div className="text-center">
          <Link to="/items" className="text-indigo-600 hover:text-indigo-900">
            ← Back to Items
          </Link>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center p-8 text-gray-500">Item not found</div>
        <div className="text-center">
          <Link to="/items" className="text-indigo-600 hover:text-indigo-900">
            ← Back to Items
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link to="/items" className="text-indigo-600 hover:text-indigo-900 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Items
          </Link>
        </div>

        {notification.message && (
          <div className={`mb-4 p-4 text-sm rounded-md ${notification.type === 'success' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
            {notification.message}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">{item.name}</h1>
              <div className="flex space-x-2">
                {canUpdateItem && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Edit Item
                  </button>
                )}
                {canDeleteItem && (
                  <button
                    onClick={() => setItemToDelete({ id: item.id, name: item.name })}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Delete Item
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Item Details</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{item.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{item.description}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                    <dd className="mt-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.quantity > 10 ? 'bg-green-100 text-green-800' : 
                        item.quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.quantity}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Metadata</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Item ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{item.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(item.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(item.updatedAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleSuccess}
        itemId={id}
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

export default ItemDetailPage; 