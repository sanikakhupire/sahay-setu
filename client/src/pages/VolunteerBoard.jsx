import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import socket from '../api/socket';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import MatchesPanel from '../components/MatchesPanel';
import { typeLabel } from '../constants/resourceTypes';
import { URGENCY_STYLES } from '../constants/urgency';

const STATUS_STYLES = {
  open: 'bg-red-100 text-red-700',
  matched: 'bg-yellow-100 text-yellow-700',
  dispatched: 'bg-blue-100 text-blue-700',
};

function VolunteerBoard() {
  const { user } = useAuth();
  const [openNeeds, setOpenNeeds] = useState([]);
  const [activeNeeds, setActiveNeeds] = useState([]); // matched or dispatched
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchesFor, setMatchesFor] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBoard = useCallback(async () => {
    try {
      const [openRes, matchedRes, dispatchedRes] = await Promise.all([
        api.get('/needs', { params: { ward: user.ward, status: 'open' } }),
        api.get('/needs', { params: { ward: user.ward, status: 'matched' } }),
        api.get('/needs', { params: { ward: user.ward, status: 'dispatched' } }),
      ]);
      setOpenNeeds(openRes.data.needs);
      setActiveNeeds([...matchedRes.data.needs, ...dispatchedRes.data.needs]);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the board');
    } finally {
      setLoading(false);
    }
  }, [user.ward]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  useEffect(() => {
    socket.on('matchConfirmed', fetchBoard);
    socket.on('dispatchUpdate', fetchBoard);
    return () => {
      socket.off('matchConfirmed', fetchBoard);
      socket.off('dispatchUpdate', fetchBoard);
    };
  }, [fetchBoard]);

  const advanceStatus = async (needId, nextStatus) => {
    setError('');
    setUpdatingId(needId);
    try {
      await api.put(`/matches/${needId}/status`, { status: nextStatus });
      fetchBoard();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this need');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-lg font-bold text-gray-800 mb-1">Volunteer board — {user.ward}</h1>
        <p className="text-sm text-gray-500 mb-4">
          Confirm matches for open needs, then move them along as help reaches them.
        </p>

        {error && (
          <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {loading && <p className="text-gray-500 text-sm">Loading...</p>}

        {!loading && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Open needs, waiting for a match */}
            <div>
              <h2 className="font-semibold text-gray-700 mb-3">Open needs ({openNeeds.length})</h2>

              {openNeeds.length === 0 && (
                <div className="bg-white rounded-xl shadow p-4 text-sm text-gray-500">
                  No open needs right now.
                </div>
              )}

              <div className="space-y-4">
                {openNeeds.map((n) => (
                  <div key={n._id} className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800">{n.description}</p>
                        <p className="text-sm text-gray-500">
                          {typeLabel(n.type)} · Qty {n.quantity}
                        </p>
                        {n.requester?.name && (
                          <p className="text-xs text-gray-400 mt-1">
                            {n.requester.name} · {n.requester.phone}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${URGENCY_STYLES[n.urgency]}`}>
                        {n.urgency}
                      </span>
                    </div>

                    {n.address && <p className="text-sm text-gray-500 mt-1">{n.address}</p>}

                    <button
                      onClick={() => setMatchesFor(matchesFor === n._id ? null : n._id)}
                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded px-2 py-1 mt-3"
                    >
                      {matchesFor === n._id ? 'Hide matches' : 'Find matches'}
                    </button>

                    {matchesFor === n._id && (
                      <MatchesPanel
                        needId={n._id}
                        onConfirmed={() => {
                          setMatchesFor(null);
                          fetchBoard();
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Matched / dispatched, in progress */}
            <div>
              <h2 className="font-semibold text-gray-700 mb-3">In progress ({activeNeeds.length})</h2>

              {activeNeeds.length === 0 && (
                <div className="bg-white rounded-xl shadow p-4 text-sm text-gray-500">
                  Nothing matched or on the way right now.
                </div>
              )}

              <div className="space-y-4">
                {activeNeeds.map((n) => (
                  <div key={n._id} className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800">{n.description}</p>
                        <p className="text-sm text-gray-500">
                          {typeLabel(n.type)} · Qty {n.quantity}
                        </p>
                        {n.requester?.name && (
                          <p className="text-xs text-gray-400 mt-1">
                            {n.requester.name} · {n.requester.phone}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[n.status]}`}>
                        {n.status}
                      </span>
                    </div>

                    {n.status === 'matched' && (
                      <button
                        onClick={() => advanceStatus(n._id, 'dispatched')}
                        disabled={updatingId === n._id}
                        className="text-xs bg-blue-600 text-white hover:bg-blue-700 rounded px-2 py-1 mt-3 disabled:opacity-50"
                      >
                        {updatingId === n._id ? 'Updating...' : 'Mark dispatched'}
                      </button>
                    )}

                    {n.status === 'dispatched' && (
                      <button
                        onClick={() => advanceStatus(n._id, 'fulfilled')}
                        disabled={updatingId === n._id}
                        className="text-xs bg-green-600 text-white hover:bg-green-700 rounded px-2 py-1 mt-3 disabled:opacity-50"
                      >
                        {updatingId === n._id ? 'Updating...' : 'Mark fulfilled'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VolunteerBoard;