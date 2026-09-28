import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Sahay Setu</h1>
          <button
            onClick={handleLogout}
            className="text-sm bg-gray-200 hover:bg-gray-300 rounded px-3 py-1"
          >
            Log out
          </button>
        </div>

        <p className="text-gray-700">
          Welcome, <span className="font-semibold">{user.name}</span>
        </p>
        <p className="text-gray-500 text-sm mt-1">
          Role: {user.role} · Ward: {user.ward}
        </p>

        <p className="mt-8 text-gray-400 text-sm">
          Resource and need screens arrive in the next parts of Phase 11.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;