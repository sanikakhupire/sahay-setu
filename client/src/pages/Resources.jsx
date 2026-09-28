import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import socket from '../api/socket';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LocationPicker from '../components/LocationPicker';
import { RESOURCE_TYPES, typeLabel } from '../constants/resourceTypes';

const STATUS_STYLES = {
  available: 'bg-green-100 text-green-700',
  reserved: 'bg-yellow-100 text-yellow-700',
  in_use: 'bg-blue-100 text-blue-700',
  unavailable: 'bg-gray-200 text-gray-600',
};

function Resources() {
  const { user } = useAuth();

  const emptyForm = {
    type: 'boat',
    label: '',
    quantity: 1,
    address: '',
    contactPhone: user.phone,
  };

  const [form, setForm] = useState(emptyForm);
  const [location, setLocation] = useState(null);
  const [resources, setResources] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchResources = useCallback(async () => {
    try {
      const { data } = await api.get('/resources/mine');
      setResources(data.resources);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your resources');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Live updates: refresh the list when a match or dispatch event arrives for this ward
  useEffect(() => {
    socket.on('matchConfirmed', fetchResources);
    socket.on('dispatchUpdate', fetchResources);
    return () => {
      socket.off('matchConfirmed', fetchResources);
      socket.off('dispatchUpdate', fetchResources);
    };
  }, [fetchResources]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!location) {
      setError('Please click the map to mark where this resource is located.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/resources', {
        ...form,
        quantity: Number(form.quantity),
        ward: user.ward,
        lat: location.lat,
        lng: location.lng,
      });
      setSuccess('Resource registered.');
      setForm(emptyForm);
      setLocation(null);
      fetchResources();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not register the resource');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (resource) => {
    const next = resource.status === 'available' ? 'unavailable' : 'available';
    setError('');
    try {
      await api.put(`/resources/${resource._id}`, { status: next });
      fetchResources();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the resource');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    setError('');
    try {
      await api.delete(`/resources/${id}`);
      fetchResources();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the resource');
    }
  };

  const handlePhotoUpload = async (id, file) => {
    if (!file) return;
    setError('');
    setUploadingId(id);

    const formData = new FormData();
    formData.append('photo', file); // field name must match upload.single('photo') on the server

    try {
      await api.post(`/upload/resource/${id}`, formData);
      fetchResources();
    } catch (err) {
      setError(err.response?.data?.message || 'Photo upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-6">
        {/* Registration form */}
        <div className="bg-white rounded-xl shadow p-6 self-start">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Register a resource</h2>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short description</label>
              <input
                name="label"
                value={form.label}
                onChange={handleChange}
                maxLength={100}
                placeholder="e.g. 6-seater rescue boat"
                required
                className={inputClass}
              />
            </div>

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
                Location <span className="text-gray-400">(Ward: {user.ward})</span>
              </label>
              <LocationPicker value={location} onChange={setLocation} />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Register resource'}
            </button>
          </form>
        </div>

        {/* My resources list */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            My resources {!loadingList && `(${resources.length})`}
          </h2>

          {loadingList && <p className="text-gray-500 text-sm">Loading...</p>}

          {!loadingList && resources.length === 0 && (
            <div className="bg-white rounded-xl shadow p-6 text-gray-500 text-sm">
              You haven't registered any resources yet.
            </div>
          )}

          <div className="space-y-4">
            {resources.map((r) => (
              <div key={r._id} className="bg-white rounded-xl shadow p-4 flex gap-4">
                {r.verificationPhoto ? (
                  <img
                    src={r.verificationPhoto}
                    alt={r.label}
                    className="h-20 w-20 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-20 w-20 rounded bg-gray-100 text-gray-400 text-xs flex items-center justify-center text-center flex-shrink-0">
                    No photo
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{r.label}</p>
                      <p className="text-sm text-gray-500">
                        {typeLabel(r.type)} · Qty {r.quantity}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[r.status]}`}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>

                  {r.address && <p className="text-sm text-gray-500 mt-1 truncate">{r.address}</p>}

                  <div className="flex flex-wrap gap-2 mt-3">
                    <label className="text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 cursor-pointer">
                      {uploadingId === r._id ? 'Uploading...' : r.verificationPhoto ? 'Replace photo' : 'Add photo'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingId === r._id}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          e.target.value = ''; // lets the same file be picked again later
                          handlePhotoUpload(r._id, file);
                        }}
                      />
                    </label>

                    {(r.status === 'available' || r.status === 'unavailable') && (
                      <button
                        onClick={() => toggleAvailability(r)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1"
                      >
                        {r.status === 'available' ? 'Mark unavailable' : 'Mark available'}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(r._id)}
                      className="text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Resources;