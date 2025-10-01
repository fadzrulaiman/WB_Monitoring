import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is required.');
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post('auth/forgot-password', { email });
      // Always display the backend's message for security
      setMessage(response.data.message);
    } catch (err) {
      // If the request fails (e.g., network error), show a generic error.
      // Otherwise, we rely on the backend's consistent success message.
      const backendMessage = err.response?.data?.message;
      if (backendMessage) {
        setMessage(backendMessage);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Forgot Your Password?</h2>
        <p className="text-center text-sm text-gray-600">
          No problem. Enter your email address below and we'll send you a link to reset it.
        </p>

        {message ? (
          <div className="p-4 text-center text-green-700 bg-green-100 border border-green-400 rounded-md">
            {message}
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <button type="submit" disabled={loading} className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        )}

        <div className="text-sm text-center">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Remembered your password? Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
