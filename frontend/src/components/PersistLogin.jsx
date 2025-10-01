import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useRefreshToken from '../hooks/useRefreshToken';
import useAuth from '../hooks/useAuth';

const PersistLogin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const refresh = useRefreshToken(); // A custom hook that calls the /api/auth/refresh endpoint
  const { auth } = useAuth(); // A custom hook to access auth state (e.g., from a context)
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const verifyRefreshToken = async () => {
      try {
        // This is the API call to the backend
        await refresh();
      } catch (err) {
        console.error(err);
        // If refresh fails, redirect to login
        navigate('/login');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Avoid calling refresh if we already have an access token in memory
    !auth?.accessToken ? verifyRefreshToken() : setIsLoading(false);

    return () => {
      isMounted = false;
    };
  }, []);

  // Show a loading indicator while verifying the session, or render the nested routes
  return isLoading ? <p>Loading...</p> : <Outlet />;
};

export default PersistLogin;