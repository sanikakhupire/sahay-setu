import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import socket from '../api/socket';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  // Restore the session from localStorage so a page refresh doesn't log the user out
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // While logged in, keep a socket connection and join this user's ward room
  useEffect(() => {
    if (!user) {
      socket.disconnect();
      return;
    }

    const joinWardRoom = () => socket.emit('joinWard', user.ward);

    socket.on('connect', joinWardRoom);
    if (socket.connected) {
      joinWardRoom();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', joinWardRoom);
    };
  }, [user]);

  const saveSession = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (phone, password) => {
    const { data } = await api.post('/auth/login', { phone, password });
    saveSession(data.token, data.user);
  };

  // Step 1 of signup: creates the account and triggers the OTP
  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    return data; // contains userId for the OTP step
  };

  // Step 2 of signup: verifies the OTP, then logs the user in
  const verifyOtp = async (userId, otp) => {
    const { data } = await api.post('/auth/verify-otp', { userId, otp });
    saveSession(data.token, data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}