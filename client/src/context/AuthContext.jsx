import { createContext, useContext, useState, useEffect } from 'react';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if token still exists to maintain login
    const token = localStorage.getItem('insta_agent_token');
    if (!token && user) {
      setUser(null);
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
  };

  const syncPlan = async () => {
    const token = localStorage.getItem('insta_agent_token');
    if (!token) return;

    try {
      const res = await fetch(`${window.location.origin.includes('localhost') ? 'http://localhost:5000' : 'https://dm-automation-lu44.onrender.com'}/api/auth/profile`, {
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

  return (
    <AuthContext.Provider value={{ user, login, logout, syncPlan, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
