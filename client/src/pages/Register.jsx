import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const { user, register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = signup form, 2 = OTP entry
  const [userId, setUserId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    ward: '',
    role: 'resident',
  });

  if (user) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Don't send an empty email string; the backend validates the format if present
      const payload = { ...form };
      if (!payload.email) delete payload.email;

      const data = await register(payload);
      setUserId(data.userId);
      setNotice(data.otpError ? 'Account created, but the SMS could not be sent.' : data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(userId, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Join Sahay Setu</h1>
        <p className="text-gray-500 mb-6">
          {step === 1 ? 'Create your account' : 'Verify your phone number'}
        </p>

        {error && (
          <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                pattern="[6-9][0-9]{9}"
                title="Enter a valid 10-digit Indian mobile number"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-gray-400">(optional)</span>
              </label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ward / area</label>
              <input
                name="ward"
                value={form.ward}
                onChange={handleChange}
                placeholder="e.g. Ward 5"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">I want to join as</label>
              <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
                <option value="resident">Resident</option>
                <option value="volunteer">Volunteer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                minLength={6}
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify} className="space-y-4">
            {notice && (
              <div className="rounded bg-blue-50 border border-blue-200 text-blue-700 text-sm px-3 py-2">
                {notice}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter the 6-digit code</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                inputMode="numeric"
                required
                className={`${inputClass} tracking-widest text-center text-lg`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify and continue'}
            </button>
          </form>
        )}

        <p className="text-sm text-gray-600 mt-6 text-center">
          Already registered?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;