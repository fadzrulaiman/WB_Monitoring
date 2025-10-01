import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  const [user, setUser] = useState({ name: '', email: '', roleId: '' });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        // Fetch user data and roles in parallel
        const [userResponse, rolesResponse] = await Promise.all([
          axiosPrivate.get(`/users/${id}`, { signal: controller.signal }),
          axiosPrivate.get('/users/roles', { signal: controller.signal }),
        ]);

        if (isMounted) {
          setUser(userResponse.data);
          setRoles(rolesResponse.data);
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError('Failed to load user data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axiosPrivate.put(`/users/${id}`, {
        name: user.name,
        email: user.email,
        roleId: user.roleId,
      });
      setSuccess(response.data.message);
    } catch (err) {
      if (err.response?.data) {
        const { data } = err.response;
        // Handle Zod validation errors from the backend
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(' ');
          setError(errorMessages);
        } else {
          setError(data.message || 'Update failed. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user.name) { // Show initial loading state
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Edit User</h2>
        
        {error && <div className="p-4 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">{error}</div>}
        {success && <div className="p-4 text-sm text-green-700 bg-green-100 border border-green-400 rounded-md">{success}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input id="name" name="name" type="text" required value={user.name} onChange={handleChange} className="w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
            <input id="email" name="email" type="email" required value={user.email} onChange={handleChange} className="w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="roleId" className="block text-sm font-medium text-gray-700">Role</label>
            <select id="roleId" name="roleId" value={user.roleId} onChange={handleChange} className="w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm">
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Link to="/admin" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              &larr; Back to Admin Panel
            </Link>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserPage;