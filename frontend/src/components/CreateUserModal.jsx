import { useState, useEffect } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const CreateUserModal = ({ isOpen, onClose, onSuccess, userId, roles = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const axiosPrivate = useAxiosPrivate();

  const isEditMode = !!userId;

  useEffect(() => {
    const controller = new AbortController();

    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await axiosPrivate.get(`/users/${userId}`, { signal: controller.signal });
        const { name, email, roleId } = response.data;
        setFormData({ name, email, roleId, password: '' });
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError('Failed to fetch user data.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      // Reset form state when modal opens
      setError('');
      const defaultRoleId = roles.length > 0 ? roles.find(r => r.name === 'USER')?.id || roles[0].id : '';
      setFormData({ name: '', email: '', password: '', roleId: defaultRoleId });

      if (isEditMode) {
        fetchUser();
      }
    }

    return () => {
      controller.abort();
    };
  }, [isOpen, userId, isEditMode, roles]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        const { name, email, roleId } = formData;
        await axiosPrivate.put(`/users/${userId}`, { name, email, roleId });
        onSuccess('User updated successfully.');
      } else {
        await axiosPrivate.post('/users', formData);
        onSuccess('User created successfully.');
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
        <h2 className="text-2xl font-bold mb-4">{isEditMode ? 'Edit User' : 'Create User'}</h2>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          {!isEditMode && (
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          )}
          <div className="mb-6">
            <label htmlFor="roleId" className="block text-sm font-medium text-gray-700">Role</label>
            <select name="roleId" id="roleId" value={formData.roleId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end space-x-4">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;