import { createContext, useContext, useEffect, useState } from 'react';
import { fetchMe, loginUser, registerUser, updateProfile } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('moodsync_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('moodsync_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then((data) => {
        setUser(data.user);
        localStorage.setItem('moodsync_user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('moodsync_token');
        localStorage.removeItem('moodsync_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    localStorage.setItem('moodsync_token', data.token);
    localStorage.setItem('moodsync_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await registerUser({ name, email, password });
    localStorage.setItem('moodsync_token', data.token);
    localStorage.setItem('moodsync_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('moodsync_token');
    localStorage.removeItem('moodsync_user');
    setUser(null);
  };

  const refreshProfile = async (payload) => {
    const data = await updateProfile(payload);
    setUser(data.user);
    localStorage.setItem('moodsync_user', JSON.stringify(data.user));
    return data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
