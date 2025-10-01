import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useLogout from '../hooks/useLogout';
import logoImage from '../assets/logo.svg'; // Import the logo

// Configuration for navigation items
const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/items', label: 'Items', requiredPermission: 'READ_ITEMS' },
  { path: '/admin', label: 'Users', requiredPermission: 'READ_USERS' },
  { path: '/settings', label: 'Settings', requiredRole: 'ADMIN' },
  { path: '/ffbreupload', label: 'FFB Reupload', requiredRole: 'ADMIN' },
  { path: '/splitso', label: 'Split SO', requiredRole: 'ADMIN' },
  { path: '/cpupdate', label: 'Car Plate Update', requiredRole: 'ADMIN' },
  { path: '/barge', label: 'Barge Update', requiredRole: 'ADMIN' },
];

const Sidebar = () => {
  const { auth } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();

  const navLinkClasses = ({ isActive }) =>
    `flex items-center p-2 text-gray-300 rounded-lg hover:bg-gray-700 group ${isActive ? 'bg-gray-700' : ''}`;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform" aria-label="Sidebar">
      <div className="flex flex-col h-full px-3 py-4 overflow-y-auto bg-gray-800">
        <div className="flex-grow">
          <Link to="/" className="flex items-center gap-2 ps-2.5 mb-5">
            <img src={logoImage} alt="Auth System Logo" className="h-8 w-8" />
            <span className="self-center text-xl font-semibold whitespace-nowrap text-white">Auth System</span>
          </Link>
          <ul className="space-y-2 font-medium">
            {navItems.map(item => {
              // Check if the user has the required role or permission
              const hasRole = item.requiredRole ? auth.user?.role === item.requiredRole : true;
              const hasPermission = item.requiredPermission ? auth.user?.permissions?.includes(item.requiredPermission) : true;

              // Render the nav item only if the user is authorized
              if (hasRole && hasPermission) {
                return (
                  <li key={item.path}>
                    <NavLink to={item.path} className={navLinkClasses}>
                      <span className="ms-3">{item.label}</span>
                    </NavLink>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </div>
        <div className="mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center p-2 text-gray-300 rounded-lg hover:bg-red-700 group text-left">
            <span className="ms-3 font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

