import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <Sidebar />
      <main className="min-h-screen min-w-0 pl-64 lg:pl-72">
        <div className="overflow-x-hidden p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
