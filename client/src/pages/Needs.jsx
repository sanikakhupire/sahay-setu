import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import socket from '../api/socket';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LocationPicker from '../components/LocationPicker';
import MatchesPanel from '../components/MatchesPanel';
import { RESOURCE_TYPES, typeLabel } from '../constants/resourceTypes';
import { URGENCY_LEVELS, URGENCY_STYLES } from '../constants/urgency';

const STATUS_STYLES = {
  open: 'bg-red-100 text-red-700',
  matched: 'bg-yellow-100 text-yellow-700',
  dispatched: 'bg-blue-100 text-blue-700',
  fulfilled: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-200 text-gray-600',
};

const STATUS_HINTS = {
  open: 'Looking for a match',
  matched: 'A resource is reserved for you. Waiting for dispatch.',
  dispatched: 'Help is on the way',
  fulfilled: 'This need has been fulfilled',
  cancelled: 'This need was cancelled',
};

function Needs() {
  const { user } = useAuth();

  const emptyForm = {
    type: 'drinking_water',
    description: '',
    quantity: 1,
    urgency: 'medium',
    address: '',
    contactPhone: user.phone,
  };

  const [form, setForm] = useState(emptyForm);
  const [location, setLocation] = useState(null);
  const [needs, setNeeds] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matchesFor, setMatchesFor] = useState(null); // id of the need whose matches panel is open
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchNeeds = useCallback(async () => {
    try {
      const { data } = await api.get('/needs/mine');
      setNeeds(data.needs);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your needs');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchNeeds();
  }, [fetchNeeds]);

  // Live updates: refresh when a match or dispatch event arrives for this ward
  useEffect(() => {
    socket.on('matchConfirmed', fetchNeeds);
    socket.on('dispatchUpdate', fetchNeeds);
    return () => {
      socket.off('matchConfirmed', fetchNeeds);
      socket.off('dispatchUpdate', fetchNeeds);
    };
  }, [fetchNeeds]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!location) {
      setError('Please click the map to mark where help is needed.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/needs', {
        ...form,
        quantity: Number(form.quantity),
        ward: user.ward,
        lat: location.lat,
        lng: location.lng,
      });
      setSuccess('Need raised. You can now look for matches.');
      setForm(emptyForm);
      setLocation(null);
      fetchNeeds();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not raise the need');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this need?')) return;
    setError('');
    try {
      await api.put(`/needs/${id}`, { status: 'cancelled' });
      if (matchesFor === id) setMatchesFor(null);
      fetchNeeds();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel the need');
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-6">
        {/* Raise a need */}
        <div className="bg-white rounded-xl shadow p-6 self-start">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Raise a need</h2>

          {error && (
            <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What do you need?</label>
              <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Describe the situation</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength={200}
                rows={3}
                placeholder="e.g. Family of 5 stranded, need drinking water"
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                <select name="urgency" value={form.urgency} onChange={handleChange} className={inputClass}>
                  {URGENCY_LEVELS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address / landmark <span className="text-gray-400">(optional)</span>
              </label>
              <input name="address" value={form.address} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact phone</label>
              <input
                name="contactPhone"
                type="tel"
                value={form.contactPhone}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Where is help needed? <span className="text-gray-400">(Ward: {user.ward})</span>
              </label>
              <LocationPicker value={location} onChange={setLocation} />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-red-600 text-white rounded py-2 font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Raise need'}
            </button>
          </form>
        </div>

        {/* My needs */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            My needs {!loadingList && `(${needs.length})`}
          </h2>

          {loadingList && <p className="text-gray-500 text-sm">Loading...</p>}

          {!loadingList && needs.length === 0 && (
            <div className="bg-white rounded-xl shadow p-6 text-gray-500 text-sm">
              You haven't raised any needs yet.
            </div>
          )}

          <div className="space-y-4">
            {needs.map((n) => (
              <div key={n._id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800">{n.description}</p>
                    <p className="text-sm text-gray-500">
                      {typeLabel(n.type)} · Qty {n.quantity}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[n.status]}`}
                    >
                      {n.status}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${URGENCY_STYLES[n.urgency]}`}
                    >
                      {n.urgency}
                    </span>
                  </div>
                </div>

                {n.address && <p className="text-sm text-gray-500 mt-1">{n.address}</p>}
                <p className="text-xs text-gray-400 mt-1">{STATUS_HINTS[n.status]}</p>

                {n.status === 'open' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setMatchesFor(matchesFor === n._id ? null : n._id)}
                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded px-2 py-1"
                    >
                      {matchesFor === n._id ? 'Hide matches' : 'Find matches'}
                    </button>
                    <button
                      onClick={() => handleCancel(n._id)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1"
                    >
                      Cancel need
                    </button>
                  </div>
                )}

                {matchesFor === n._id && (
                  <MatchesPanel
                    needId={n._id}
                    onConfirmed={() => {
                      setMatchesFor(null);
                      fetchNeeds();
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Needs;