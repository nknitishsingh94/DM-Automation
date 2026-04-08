import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('insta_agent_user');
    const token = localStorage.getItem('insta_agent_token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

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
