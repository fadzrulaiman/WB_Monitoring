import { useLocation, Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const PrivateRoute = ({ allowedRoles, allowedPermissions }) => {
  const { auth } = useAuth();
  const location = useLocation();

  const userHasRequiredRole = allowedRoles ? allowedRoles.includes(auth?.user?.role) : true;
  const userHasRequiredPermissions = allowedPermissions
    ? allowedPermissions.every(p => auth?.user?.permissions?.includes(p))
    : true;

  if (auth?.user) {
    return userHasRequiredRole && userHasRequiredPermissions
      ? <Outlet />
      : <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // User is not logged in
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;