import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useLocation, Navigate } from 'react-router-dom';
import { Bot, Home, MessageSquare, Settings, Users, Zap, Crown, CreditCard, Sparkles, Menu as MenuIcon, X, ChevronDown, PlusSquare, FileText, Headphones, LogOut } from 'lucide-react';
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
import HelpCenter from './pages/HelpCenter';
import About from './pages/About';
import Resources from './pages/Resources';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import AIStudio from './pages/AIStudio';
import Forms from './pages/Forms';
import Referral from './pages/Referral';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
}

function Sidebar({ isMobileOpen, onClose }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (isMobileOpen) onClose();
  }, [location.pathname]);

  return (
    <>
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'visible' : ''}`} 
        onClick={onClose}
      />
      
      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ padding: '20px 24px', borderBottom: 'none', position: 'relative' }}>
          {user && (
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div 
                 onClick={() => setShowProfileMenu(!showProfileMenu)}
                 className="profile-hover"
                 style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 8px', margin: '-6px -8px', borderRadius: '8px', transition: 'background 0.2s' }}
               >
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '6px', 
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '14px',
                  fontWeight: '700',
                  color: 'white',
                  overflow: 'hidden'
                }}>
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Nk" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {user.username} <ChevronDown size={14} color="#94a3b8" />
                  </span>
                </div>
              </div>

              {showProfileMenu && (
                <div style={{
                  position: 'absolute', top: '70px', left: '24px', width: '240px',
                  background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  border: '1px solid #f1f5f9', zIndex: 100, padding: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', marginBottom: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white', overflow: 'hidden' }}>
                      {user.profilePhoto ? <img src={user.profilePhoto} alt="Nk" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.username.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{user.username}</span>
                  </div>
                  
                  <button className="dropdown-item">
                    <PlusSquare size={16} color="#64748b" /> Add New Workspace
                  </button>
                  
                  <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                  
                  <Link to="/help" onClick={() => setShowProfileMenu(false)} className="dropdown-item">
                    <FileText size={16} color="#64748b" /> Help Center
                  </Link>
                  <button className="dropdown-item">
                    <Headphones size={16} color="#64748b" /> Chat with Us
                  </button>

                  <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                  
                  <button onClick={() => { logout(); setShowProfileMenu(false); }} className="dropdown-item">
                    <LogOut size={16} color="#64748b" /> Sign out
                  </button>
                </div>
              )}
              <button onClick={onClose} className="mobile-show" style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="sidebar-middle-scroll">
          <nav className="nav-links">
            <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Home size={18} />
              <span>Home</span>
            </NavLink>
            <NavLink to="/ai-studio" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Sparkles size={18} />
              <span>AI Studio</span>
              <span className="sidebar-badge badge-new">NEW</span>
            </NavLink>
            <NavLink to="/campaigns" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Zap size={18} />
              <span>Automations</span>
            </NavLink>
            <NavLink to="/forms" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <MessageSquare size={18} />
              <span>Forms</span>
            </NavLink>
            <NavLink to="/audiences" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Contacts</span>
            </NavLink>
            <NavLink to="/upgrade" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <CreditCard size={18} />
              <span>Billing</span>
            </NavLink>
            <NavLink to="/refer" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Refer & Earn</span>
            </NavLink>
            <NavLink to="/settings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>

        {/* Fixed Upgrade Card at the bottom */}
        <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ 
            padding: '18px', 
            borderRadius: '16px', 
            background: '#0f172a',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <div>
              <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                Premium Access
              </h3>
              <p style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '600', lineHeight: '1.4' }}>
                Unlock all advanced features
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 0', borderTop: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '600' }}>
                 <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                     <Sparkles size={12} color="#3b82f6" />
                   </div>
                   AI Credits
                 </span>
                 <span style={{ color: '#f8fafc', fontWeight: '800' }}>1X</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '600' }}>
                 <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                     <Zap size={12} color="#3b82f6" />
                   </div>
                   Automations
                 </span>
                 <span style={{ color: '#f8fafc', fontWeight: '800' }}>Infinite</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '600' }}>
                 <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                     <FileText size={12} color="#3b82f6" />
                   </div>
                   Forms
                 </span>
                 <span style={{ color: '#f8fafc', fontWeight: '800' }}>Infinite</span>
              </div>
            </div>

            <NavLink to="/upgrade" className="upgrade-btn-zoom" style={{ 
              width: '100%', 
              padding: '12px', 
              fontSize: '13px', 
              borderRadius: '10px', 
              justifyContent: 'center', 
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: '800',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textAlign: 'center'
            }}>
              <Crown size={15} color="#3b82f6" /> Upgrade Now
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
}

function TopBar({ onMenuClick }) {
  const location = useLocation();
  const { user } = useAuth();
  
  const getTitle = () => {
    switch(location.pathname) {
      case '/dashboard': return 'Home';
      case '/campaigns': return 'Automations';
      case '/audiences': return 'Contacts';
      case '/settings': return 'Settings';
      case '/upgrade': return 'Billing';
      case '/ai-studio': return 'AI Studio';
      case '/forms': return 'Forms';
      case '/refer': return 'Refer & Earn';
      default: return 'Home';
    }
  };

  if (!user) return null;

  return (
    <header className="topbar" style={{ background: 'transparent', borderBottom: 'none', height: '80px', padding: '0 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onMenuClick} className="mobile-show" style={{ color: '#1e293b' }}>
          <MenuIcon size={24} />
        </button>
        <h1 className="page-title" style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{getTitle()}</h1>
      </div>
      <div className="topbar-actions">
        <NavLink to="/help" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: '700', textDecoration: 'none' }}>
          <Users size={20} />
          <span>Support</span>
        </NavLink>
      </div>
    </header>
  );
}

function MainLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isPublic = ['/', '/login', '/signup', '/help', '/about', '/resources', '/blog'].includes(location.pathname) || location.pathname.startsWith('/blog/');

  return (
    <div className="app-container" style={{ height: '100%', width: '100%', position: 'fixed', top: 0, left: 0 }}>
      {user && !isPublic && <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
      <main className="main-content">
        {!isPublic && <TopBar onMenuClick={() => setIsSidebarOpen(true)} />}
        <div className="page-container" style={{ 
          padding: (isPublic || location.pathname === '/inbox') ? '0' : undefined,
          overflow: (location.pathname === '/inbox') ? 'hidden' : 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
            <Route path="/audiences" element={<ProtectedRoute><Audiences /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/upgrade" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
            <Route path="/ai-studio" element={<ProtectedRoute><AIStudio /></ProtectedRoute>} />
            <Route path="/forms" element={<ProtectedRoute><Forms /></ProtectedRoute>} />
            <Route path="/refer" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/about" element={<About />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
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
