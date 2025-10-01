import useAuth from './useAuth';
import axios from '../api/axios';

const useLogout = () => {
    const { setAuth } = useAuth();

    const logout = async () => {
        // Clear auth state on the client immediately
        setAuth({});
        try {
            // Ask the server to clear the httpOnly cookie
            await axios.post('auth/logout', {}, { withCredentials: true });
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return logout;
};

export default useLogout;
