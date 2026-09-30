import { useState, useEffect } from 'react';
import api from '../api/axios';

const formatDistance = (meters) =>
  meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;

function MatchesPanel({ needId, onConfirmed }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadMatches = async () => {
      try {
        const { data } = await api.get(`/matches/${needId}`);
        if (!cancelled) setMatches(data.matches);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load matches');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMatches();
    return () => {
      cancelled = true;
    };
  }, [needId]);

  const handleConfirm = async (resourceId) => {
    setError('');
    setConfirmingId(resourceId);
    try {
      await api.post(`/matches/${needId}/confirm`, { resourceId });
      onConfirmed();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not confirm this match');
      setConfirmingId(null);
    }
  };

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <p className="text-sm font-medium text-gray-700 mb-2">Best matches, ranked</p>

      {error && (
        <div className="mb-2 rounded bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Searching nearby resources...</p>}

      {!loading && matches.length === 0 && !error && (
        <p className="text-sm text-gray-500">
          No available resources of this type were found nearby right now.
        </p>
      )}

      <div className="space-y-2">
        {matches.map((m) => (
          <div
            key={m.resource._id}
            className="flex items-center gap-3 border border-gray-200 rounded p-2"
          >
            {m.resource.verificationPhoto ? (
              <img
                src={m.resource.verificationPhoto}
                alt={m.resource.label}
                className="h-12 w-12 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded bg-gray-100 text-gray-400 text-[10px] flex items-center justify-center flex-shrink-0">
                No photo
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{m.resource.label}</p>
              <p className="text-xs text-gray-500">
                Qty {m.resource.quantity} · {formatDistance(m.distance)} away · score {m.score}
              </p>
              <p className="text-xs text-gray-500">Contact: {m.resource.contactPhone}</p>
            </div>

            <button
              onClick={() => handleConfirm(m.resource._id)}
              disabled={confirmingId !== null}
              className="text-xs bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 disabled:opacity-50"
            >
              {confirmingId === m.resource._id ? 'Confirming...' : 'Confirm'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MatchesPanel;
