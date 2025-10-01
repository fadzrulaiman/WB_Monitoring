import { useCallback } from 'react';
import axios from '../api/axios'; // Assuming you have a central axios instance
import useAuth from './useAuth';

const useRefreshToken = () => {
  const { setAuth } = useAuth();

  const refresh = useCallback(async () => {
    const response = await axios.post('auth/refresh', null, {
      withCredentials: true, // THIS IS CRUCIAL
    });
    // Update the entire auth state, including the user object
    setAuth(prev => {
      return {
        ...prev,
        user: response.data.user, // Set the user from the response
        accessToken: response.data.accessToken,
      };
    });
    return response.data.accessToken;
  }, [setAuth]);
  
  return refresh;
};

export default useRefreshToken;
