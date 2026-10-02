import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const StatCard = ({ label, value, tone = 'text-gray-800' }) => (
  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`text-2xl font-bold ${tone}`}>{value}</p>
  </div>
);

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/dashboard', { params: { ward: user.ward } });
      setStats(data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, [user.ward]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-lg font-bold text-gray-800 mb-1">Admin dashboard — {user.ward}</h1>
        <p className="text-sm text-gray-500 mb-4">Ward-level overview, refreshed on load.</p>

        {error && (
          <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {loading && <p className="text-gray-500 text-sm">Loading...</p>}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total users" value={stats.totalUsers} />
              <StatCard label="Total resources" value={stats.totalResources} />
              <StatCard label="Available resources" value={stats.availableResources} tone="text-green-600" />
              <StatCard label="Total needs" value={stats.totalNeeds} />
              <StatCard label="Open needs" value={stats.openNeeds} tone="text-red-600" />
              <StatCard label="Critical open needs" value={stats.criticalNeeds} tone="text-red-700" />
              <StatCard label="Fulfilled needs" value={stats.fulfilledNeeds} tone="text-green-600" />
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">Resources by type</h2>
              {stats.resourcesByType.length === 0 && (
                <p className="text-sm text-gray-500">No resources registered yet.</p>
              )}
              <div className="space-y-2">
                {stats.resourcesByType.map((row) => (
                  <div key={row._id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{row._id}</span>
                    <span className="font-medium text-gray-800">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;