import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Bot, Home, MessageSquare, Settings, Users, Bell, Zap, LogOut, Crown, CreditCard, Sparkles, Menu as MenuIcon, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import SettingsPage from './pages/Settings';
import Profile from './pages/Profile';
import Campaigns from './pages/Campaigns';
import Audiences from './pages/Audiences';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Subscription from './pages/Subscription';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
}

function Sidebar({ isMobileOpen, onClose }) {
  const { logout, user } = useAuth();
  const location = useLocation();

  // Close sidebar on navigation (on mobile)
  useEffect(() => {
    if (isMobileOpen) onClose();
  }, [location.pathname]);

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'visible' : ''}`} 
        onClick={onClose}
      />
      
      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bot size={28} className="logo-icon" />
            <span className="logo-text">DM Automate</span>
          </div>
          <button onClick={onClose} className="mobile-show" style={{ color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>
      <nav className="nav-links">
        <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/inbox" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageSquare size={20} />
          <span>Live Inbox</span>
        </NavLink>
        <NavLink to="/campaigns" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Zap size={20} />
          <span>Campaigns</span>
        </NavLink>
        <NavLink to="/audiences" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Audiences</span>
        </NavLink>
        <NavLink to="/settings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <NavLink to="/upgrade" style={{ 
          background: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)',
          padding: '20px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          textDecoration: 'none',
          color: 'white',
          boxShadow: '0 10px 20px rgba(168, 85, 247, 0.3)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s'
        }} className="upgrade-card-hover">
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.2 }}>
            <Crown size={60} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Pro Plan</span>
          </div>
          <div style={{ fontWeight: '700', fontSize: '1rem' }}>Upgrade to Pro</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Get Unlimited AI DMs & Multi-Platform Support.</div>
        </NavLink>
      </div>

      {user && (
        <div style={{ padding: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '8px', borderRadius: '8px', transition: 'var(--transition-fast)' }} className="nav-item">
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '14px',
              fontWeight: '600',
              overflow: 'hidden',
              border: '2px solid var(--border-subtle)',
              flexShrink: 0
            }}>
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.username}
            </div>
          </NavLink>
          <button 
            onClick={logout} 
            className="nav-item" 
            style={{ width: '100%', justifyContent: 'flex-start', color: '#f87171' }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
    </>
  );
}

function TopBar({ onMenuClick }) {
  const location = useLocation();
  const { user } = useAuth();
  const getTitle = () => {
    // ... Switch logic stays same ...
    switch(location.pathname) {
      case '/dashboard': return 'Dashboard Overview';
      case '/inbox': return 'Live Inbox';
      case '/campaigns': return 'Auto-Reply Campaigns';
      case '/audiences': return 'Audience Manager';
      case '/settings': return 'Instagram Integration';
      case '/profile': return 'User Profile';
      case '/upgrade': return 'Upgrade to Pro';
      default: return 'Admin Console';
    }
  };

  if (!user) return null;

  return (
    <header className={`topbar ${location.pathname === '/' ? 'topbar-dashboard' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onMenuClick} className="mobile-show" style={{ color: 'var(--accent-color)' }}>
          <MenuIcon size={24} />
        </button>
        <h1 className="page-title">{getTitle()}</h1>
      </div>
      <div className="topbar-actions">
        <button className="action-btn">
          <Bell size={20} />
        </button>
        <NavLink to="/profile" style={{ 
          width: '36px', 
          height: '36px', 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: '600',
          border: '2px solid var(--border-subtle)',
          cursor: 'pointer',
          transition: 'var(--transition-fast)',
          textDecoration: 'none',
          color: 'inherit'
        }} className="avatar-hover">
          {user.profilePhoto ? (
            <img src={user.profilePhoto} alt="Profile icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </NavLink>
      </div>
    </header>
  );
}

function MainLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isPublic = ['/', '/login', '/signup'].includes(location.pathname);

  return (
    <div className="app-container">
      {user && !isPublic && <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
      <main className="main-content">
        {!isPublic && <TopBar onMenuClick={() => setIsSidebarOpen(true)} />}
        <div className="page-container" style={{ padding: isPublic ? '0' : '32px' }}>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
            <Route path="/audiences" element={<ProtectedRoute><Audiences /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
             <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/upgrade" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
            <Route path="*" element={<div style={{textAlign:'center', marginTop:'50px', color:'var(--text-muted)'}}>Page Under Construction</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
