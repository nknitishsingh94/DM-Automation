import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('insta_agent_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      localStorage.removeItem('insta_agent_user');
      return null;
    }
  });
  const [globalPlatforms, setGlobalPlatforms] = useState({
    instagram: true, facebook: true, youtube: true, linkedin: true,
    twitter: true, googleBusiness: true, pinterest: true, threads: true,
    whatsapp: true, telegram: true
  });

  useEffect(() => {
    const token = localStorage.getItem('insta_agent_token');
    if (!token && user) {
      setUser(null);
    }
    
    // Fetch global platforms (no token required, but pass if available)
    fetch(`${API_BASE_URL}/api/admin/global-platforms`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data) setGlobalPlatforms(data);
      })
      .catch(err => console.error("Global platforms load failed:", err));

    if (token) {
      fetch(`${API_BASE_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && (data.isAccountConnected || data.isFacebookConnected)) {
          localStorage.setItem('insta_agent_connected', 'true');
        } else {
          localStorage.removeItem('insta_agent_connected');
        }
      })
      .catch(err => console.error("Settings load failed:", err));
    }
  }, [user]);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('insta_agent_user', JSON.stringify(userData));
    localStorage.setItem('insta_agent_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('insta_agent_user');
    localStorage.removeItem('insta_agent_token');
    localStorage.removeItem('insta_agent_connected');
  };

  const syncPlan = async () => {
    const token = localStorage.getItem('insta_agent_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('insta_agent_user', JSON.stringify(userData));
        return userData;
      }
    } catch (err) {
      console.error("Plan sync failed:", err);
    }
  };

  const [loading, setLoading] = useState(false);

  return (
    <AuthContext.Provider value={{ user, login, logout, syncPlan, loading, globalPlatforms, setGlobalPlatforms }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
