import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import socket from '../api/socket';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import WardMap from '../components/WardMap';

function WardMapPage() {
  const { user } = useAuth();
  const [needs, setNeeds] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [needsRes, resourcesRes] = await Promise.all([
        api.get('/needs', { params: { ward: user.ward, status: 'open' } }),
        api.get('/resources', { params: { ward: user.ward } }),
      ]);
      setNeeds(needsRes.data.needs);
      setResources(resourcesRes.data.resources);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the ward map');
    } finally {
      setLoading(false);
    }
  }, [user.ward]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    socket.on('matchConfirmed', fetchAll);
    socket.on('dispatchUpdate', fetchAll);
    return () => {
      socket.off('matchConfirmed', fetchAll);
      socket.off('dispatchUpdate', fetchAll);
    };
  }, [fetchAll]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-lg font-bold text-gray-800 mb-1">Ward map — {user.ward}</h1>
        <p className="text-sm text-gray-500 mb-4">
          Open needs and all registered resources. Updates live as matches are confirmed.
        </p>

        {error && (
          <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {loading ? <p className="text-gray-500 text-sm">Loading...</p> : <WardMap needs={needs} resources={resources} />}
      </div>
    </div>
  );
}

export default WardMapPage;