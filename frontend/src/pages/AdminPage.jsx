import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import useDebounce from '../hooks/useDebounce';
import ConfirmationModal from '../components/ConfirmationModal';
import CreateUserModal from '../components/CreateUserModal';
import useAuth from '../hooks/useAuth';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth(); // Get auth info for permission checks

  // State for search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refetchToggle, setRefetchToggle] = useState(false); // To trigger refetch

  // State for modals and notifications
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
     // Reset to page 1 whenever the search term changes
     setCurrentPage(1);
    }, [debouncedSearchTerm]);
  
    useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchUsersAndRoles = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
        });
        if (debouncedSearchTerm) {
          params.append('search', debouncedSearchTerm);
        }

        // Fetch users and roles in parallel for efficiency
        const [usersResponse, rolesResponse] = await Promise.all([
          axiosPrivate.get(`/users?${params.toString()}`, { signal: controller.signal }),
          axiosPrivate.get('/users/roles', { signal: controller.signal }),
        ]);

        if (isMounted) {
          setUsers(usersResponse.data.users);
          setTotalPages(usersResponse.data.totalPages);
          setCurrentPage(usersResponse.data.currentPage);
          setRoles(rolesResponse.data);
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError(err.response?.data?.message || 'Failed to fetch users.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsersAndRoles();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [debouncedSearchTerm, currentPage, refetchToggle]);

  const refetch = () => {
    setRefetchToggle(prev => !prev);
  };

  const handleRoleChange = async (userId, newRoleId) => {
    setUpdatingUserId(userId);
    setNotification({ message: '', type: '' });
    try {
      await axiosPrivate.put(`/users/${userId}`, { roleId: newRoleId });
      setNotification({ message: 'User role updated successfully.', type: 'success' });
      refetch();
    } catch (err) {
      setNotification({
        message: err.response?.data?.message || 'Failed to update role.',
        type: 'error',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsConfirming(true);
    setNotification({ message: '', type: '' });

    try {
      await axiosPrivate.delete(`/users/${userToDelete.id}`);
      setNotification({ message: `User "${userToDelete.name}" has been deleted.`, type: 'success' });
      setUserToDelete(null); // Close modal on success
      refetch();
    } catch (err) {
      setNotification({ message: err.response?.data?.message || 'Failed to delete user.', type: 'error' });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSuccess = (message) => {
    setIsCreateModalOpen(false);
    setUpdatingUserId(null);
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
  const canCreateUser = auth.user?.permissions?.includes('CREATE_USER');
  const canUpdateUser = auth.user?.permissions?.includes('UPDATE_USER');
  const canDeleteUser = auth.user?.permissions?.includes('DELETE_USER');

  // Only show a full-page loader on the initial load
  if (loading && users.length === 0) {
    return <div className="text-center p-8">Loading users...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel - User Management</h1>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          {canCreateUser && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >Create User</button>
          )}
        </div>

        {notification.message && <div className={`mb-4 p-4 text-sm rounded-md ${notification.type === 'success' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>{notification.message}</div>}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-4 px-4 whitespace-nowrap">{user.name}</td>
                  <td className="py-4 px-4 whitespace-nowrap">{user.email}</td>
                  <td className="py-4 px-4 whitespace-nowrap">
                  {canUpdateUser && user.id !== auth.user?.id ? (
                    <select
                      value={user.roleId}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={updatingUserId === user.id}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:opacity-50 disabled:bg-gray-200"
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {user.role}
                    </span>
                  )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                    {canUpdateUser && <button onClick={() => setUpdatingUserId(user.id)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>}
                    {canDeleteUser && <button
                      onClick={() => setUserToDelete({ id: user.id, name: user.name })}
                      className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={user.id === auth.user?.id}
                    >
                      Delete
                    </button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <button onClick={handlePrevPage} disabled={currentPage === 1 || loading} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
            <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
            <button onClick={handleNextPage} disabled={currentPage === totalPages || loading} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
          </div>
        )}
      </div>

      <CreateUserModal
        isOpen={isCreateModalOpen || updatingUserId !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setUpdatingUserId(null);
        }}
        onSuccess={handleSuccess}
        userId={updatingUserId}
        roles={roles}
      />

      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the user "${userToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isConfirming={isConfirming}
      />
    </>
  );
};

export default AdminPage;