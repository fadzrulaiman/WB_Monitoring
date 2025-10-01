import useAuth from '../hooks/useAuth';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-4 text-gray-700">
        Welcome to your dashboard, <span className="font-semibold">{user?.name}</span>!
      </p>
      <p className="mt-2 text-gray-600">This is a protected area.</p>
    </div>
  );
};

export default DashboardPage;