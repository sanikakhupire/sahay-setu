import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow p-8">
          <p className="text-gray-700">
            Welcome, <span className="font-semibold">{user.name}</span>
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Role: {user.role} · Ward: {user.ward}
          </p>
          <p className="mt-8 text-gray-400 text-sm">
            Register what you can offer under <b>My Resources</b>. Needs and the live map come next.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;