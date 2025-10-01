import useAuth from '../hooks/useAuth';

const HomePage = () => {
  const { auth } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Welcome, {auth.user?.name}!</h1>
      <p className="mt-2 text-gray-600">You have successfully logged in.</p>
      <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-inner">
        <h2 className="text-xl font-semibold">Your Details</h2>
        <p className="mt-2"><strong>Email:</strong> {auth.user?.email}</p>
        <p><strong>Role:</strong> {auth.user?.role}</p>
        <h3 className="text-lg font-semibold mt-4">Permissions:</h3>
        <ul className="list-disc list-inside mt-2 space-y-1">
          {auth.user?.permissions?.map(permission => (
            <li key={permission}>{permission}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HomePage;