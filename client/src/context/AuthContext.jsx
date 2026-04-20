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

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
