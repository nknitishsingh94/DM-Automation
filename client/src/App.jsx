import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Bot, Home, LayoutDashboard, MessageSquare, Settings, Users, Zap, Crown, CreditCard, Sparkles, Menu as MenuIcon, X, ChevronDown, PlusSquare, FileText, Headphones, LogOut, Megaphone, Calendar, Trash2, Globe, Link2, LayoutTemplate, Terminal, Lock, MessageCircle, Moon, Sun, Shield, Construction, ArrowLeft, Cpu, Activity } from 'lucide-react';
import { lazy, Suspense, createContext, useContext, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { API_BASE_URL } from './config';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CookieBanner from './components/CookieBanner';
import UniversalTriggers from './pages/UniversalTriggers';
import SuperAdminLayout from './pages/SuperAdmin/SuperAdminLayout';

import CommentToDM from './pages/features/CommentToDM';
import GrowFollowers from './pages/features/GrowFollowers';
import NeverMissComment from './pages/features/NeverMissComment';const lazyRetry = (componentImport) => {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload();
      }
      throw error;
    }
  });
};

import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Connections from './pages/Connections';
import Campaigns from './pages/Campaigns';

const SettingsPage = lazyRetry(() => import('./pages/Settings'));
const Profile = lazyRetry(() => import('./pages/Profile'));

const Audiences = lazyRetry(() => import('./pages/Audiences'));
const Subscription = lazyRetry(() => import('./pages/Subscription'));
const HelpCenter = lazyRetry(() => import('./pages/HelpCenter'));
const AIStudio = lazyRetry(() => import('./pages/AIStudio'));
const Forms = lazyRetry(() => import('./pages/Forms'));
const FormDetail = lazyRetry(() => import('./pages/FormDetail'));
const Referral = lazyRetry(() => import('./pages/Referral'));
const Broadcasts = lazyRetry(() => import('./pages/Broadcasts'));
const FlowBuilder = lazyRetry(() => import('./pages/FlowBuilder'));
const About = lazyRetry(() => import('./pages/About'));
const Resources = lazyRetry(() => import('./pages/Resources'));
const Blog = lazyRetry(() => import('./pages/Blog'));
const BlogPost = lazyRetry(() => import('./pages/BlogPost'));
const Workplace = lazyRetry(() => import('./pages/Workplace'));
const InstagramWorkbench = lazyRetry(() => import('./pages/Workplace').then(module => ({ default: module.InstagramWorkbench })));
const FacebookWorkbench = lazyRetry(() => import('./pages/Workplace').then(module => ({ default: module.FacebookWorkbench })));
const Privacy = lazyRetry(() => import('./pages/Privacy'));
const Terms = lazyRetry(() => import('./pages/Terms'));
const Cookies = lazyRetry(() => import('./pages/Cookies'));
const ChannelSelector = lazyRetry(() => import('./pages/ChannelSelector'));
const TemplateSelector = lazyRetry(() => import('./pages/TemplateSelector'));
const AutomationEditor = lazyRetry(() => import('./pages/AutomationEditor'));
const DmAutomationEditor = lazyRetry(() => import('./pages/DmAutomationEditor'));
const Setup = lazyRetry(() => import('./pages/Setup'));
const WriteReview = lazyRetry(() => import('./pages/WriteReview'));
const MessageOnlyHub = lazyRetry(() => import('./pages/MessageOnlyHub'));
const PlatformDashboard = lazyRetry(() => import('./pages/PlatformDashboard'));
const WhatsAppDashboard = lazyRetry(() => import('./pages/WhatsAppDashboard'));
const PlatformAutoOps = lazyRetry(() => import('./pages/PlatformAutoOps'));
const CommunicationHub = lazyRetry(() => import('./pages/CommunicationHub'));

const UniversalTriggersFeature = lazyRetry(() => import('./pages/UniversalTriggersFeature'));
const ScheduleFeature = lazyRetry(() => import('./pages/ScheduleFeature'));
const AllReviews = lazyRetry(() => import('./pages/AllReviews'));
const Scheduling = lazyRetry(() => import('./pages/Scheduling'));
const Contact = lazyRetry(() => import('./pages/Contact'));
const ApiKeys = lazyRetry(() => import('./pages/ApiKeys'));
import TemplatesModal from './components/TemplatesModal';

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose, message]);

  const getEmoji = () => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❌';
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      {getEmoji()} {message}
    </div>
  );
};

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem('insta_agent_token');

  if (!user && !token) return <Navigate to="/login" />;

  const isConnected = localStorage.getItem('insta_agent_connected') === 'true';
  const isBypassPage = ['/upgrade', '/settings', '/campaigns', '/dashboard'].includes(location.pathname);

  if (!isConnected && !isBypassPage) {
  }

  return children;
}

function Sidebar({ isMobileOpen, onClose }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
  const [showAutoOpsDropdown, setShowAutoOpsDropdown] = useState(false);
  const [showSuperAdminDropdown, setShowSuperAdminDropdown] = useState(location.pathname.startsWith('/super-admin'));
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/workspaces`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
        const storedWorkspaceId = localStorage.getItem('active_workspace_id');
        let current = data.find(w => w.id === storedWorkspaceId);
        if (!current && data.length > 0) {
          current = data[0];
          localStorage.setItem('active_workspace_id', current.id);
        }
        setActiveWorkspace(current);
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (isMobileOpen) onClose();
    if (!location.pathname.startsWith('/super-admin')) {
      setShowSuperAdminDropdown(false);
    }
    const params = new URLSearchParams(location.search);
    if (params.get('openTemplates') === 'true') {
      setShowTemplatesModal(true);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.pathname, location.search]);

  const handleSwitchWorkspace = (workspaceId) => {
    localStorage.setItem('active_workspace_id', workspaceId);
    window.location.reload();
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newWorkspaceName })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('active_workspace_id', data.id);
        setShowWorkspaceModal(false);
        setNewWorkspaceName('');
        window.location.reload();
      }
    } catch (err) {
      console.error('Error creating workspace:', err);
    }
  };

  const handleDeleteWorkspace = async (workspaceId, name) => {
    if (!window.confirm(`Are you sure you want to delete the workspace "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchWorkspaces();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete workspace');
      }
    } catch (err) {
      console.error('Error deleting workspace:', err);
      alert('Error deleting workspace');
    }
  };

  const handleToggleSelectWorkspace = (id) => {
    setSelectedWorkspaces(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDeleteSelectedWorkspaces = async () => {
    if (selectedWorkspaces.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete the ${selectedWorkspaces.length} selected workspaces? This action cannot be undone.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('insta_agent_token');
      const deletePromises = selectedWorkspaces.map(id =>
        fetch(`${API_BASE_URL}/api/workspaces/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );
      await Promise.all(deletePromises);
      setSelectedWorkspaces([]);
      fetchWorkspaces();
    } catch (err) {
      console.error('Error deleting selected workspaces:', err);
      alert('Error deleting selected workspaces');
    }
  };

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
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 8px', margin: '-6px -8px', borderRadius: '8px', transition: 'background 0.2s', width: '100%', maxWidth: 'calc(100% - 30px)' }}
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
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Nk" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/zenxchat-logo.png'; e.currentTarget.onerror = null; }} />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {user.username} <ChevronDown size={14} color="#94a3b8" />
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeWorkspace?.name || 'Loading...'}
                  </span>
                </div>
              </div>

              {showProfileMenu && (
                <div style={{
                  position: 'absolute', top: '70px', left: '24px', width: '240px',
                  background: 'var(--bg-card)', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  border: '1px solid var(--border-subtle)', zIndex: 100, padding: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 12px 8px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '700' }}>
                      Workspaces
                    </span>
                    {selectedWorkspaces.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSelectedWorkspaces();
                        }}
                        style={{
                          background: '#fee2e2',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '10px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#fca5a5'}
                        onMouseOut={e => e.currentTarget.style.background = '#fee2e2'}
                      >
                        <Trash2 size={10} /> Delete ({selectedWorkspaces.length})
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '8px' }}>
                    {workspaces.map(w => {
                      const parts = [];
                      if (w.isInstagramConnected && w.connectedInstagramName) parts.push(`IG: @${w.connectedInstagramName}`);
                      if (w.isFacebookConnected && w.connectedFacebookName) parts.push(`FB: ${w.connectedFacebookName}`);
                      const connectionLabel = parts.join(', ');

                      return (
                        <div
                          key={w.id}
                          className="dropdown-item"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: w.id === activeWorkspace?.id ? 'var(--bg-dark)' : 'transparent',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            gap: '8px'
                          }}
                          onClick={() => handleSwitchWorkspace(w.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, minWidth: 0 }}>
                            {w.name !== 'Default Workspace' && w.id !== activeWorkspace?.id && (
                              <input
                                type="checkbox"
                                checked={selectedWorkspaces.includes(w.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelectWorkspace(w.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  cursor: 'pointer',
                                  accentColor: '#ef4444',
                                  flexShrink: 0
                                }}
                              />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                              <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: w.id === activeWorkspace?.id ? '700' : '500',
                                color: 'var(--text-main)',
                                fontSize: '13px'
                              }}>
                                {w.name}
                              </span>
                              {connectionLabel && (
                                <span style={{
                                  fontSize: '10px',
                                  color: 'var(--text-muted)',
                                  fontWeight: 'normal',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  marginTop: '2px'
                                }}>
                                  {connectionLabel}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                            {w.id === activeWorkspace?.id && (
                              <span style={{ fontSize: '10px', background: '#8b5cf6', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={() => { setShowWorkspaceModal(true); setShowProfileMenu(false); }} className="dropdown-item">
                    <PlusSquare size={16} color="#64748b" /> Add New Workspace
                  </button>

                  <div style={{ height: '1px', background: 'var(--bg-dark)', margin: '4px 0' }}></div>

                  <Link to="/help" onClick={() => setShowProfileMenu(false)} className="dropdown-item">
                    <FileText size={16} color="#64748b" /> Help Center
                  </Link>

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
            {user?.email === 'nknitishsingh94@gmail.com' && (
              <div className="nav-group">
                <div
                  onClick={() => {
                    if (!location.pathname.startsWith('/super-admin')) {
                      navigate('/super-admin/dashboard');
                      setShowSuperAdminDropdown(true);
                    } else {
                      setShowSuperAdminDropdown(!showSuperAdminDropdown);
                    }
                  }}
                  className={`nav-item ${location.pathname.startsWith('/super-admin') ? 'active' : ''}`}
                  style={{ cursor: 'pointer', justifyContent: 'space-between', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Shield size={18} />
                    <span style={{ fontWeight: '700' }}>Super Admin</span>
                  </div>
                  <ChevronDown size={14} style={{ transform: showSuperAdminDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                {showSuperAdminDropdown && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '32px', marginTop: '4px' }}>
                    <NavLink to="/super-admin/dashboard" className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/super-admin/users" className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                      <Users size={16} />
                      <span>Users</span>
                    </NavLink>
                    <NavLink to="/super-admin/subscriptions" className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                      <CreditCard size={16} />
                      <span>Subscriptions</span>
                    </NavLink>
                    <NavLink to="/super-admin/workspaces" className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                      <Construction size={16} />
                      <span>Workspaces</span>
                    </NavLink>
                    <NavLink to="/super-admin/social-accounts" className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                      <Link2 size={16} />
                      <span>Social Accounts</span>
                    </NavLink>
                    <NavLink to="/super-admin/automations" className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                      <Zap size={16} />
                      <span>Automations</span>
                    </NavLink>
                    <NavLink to="/super-admin/scheduled-posts" className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                      <Calendar size={16} />
                      <span>Scheduled Posts</span>
                    </NavLink>
                    <NavLink to="/super-admin/support" className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                      <MessageCircle size={16} />
                      <span>Support & Reviews</span>
                    </NavLink>
                    <NavLink to="/super-admin/ai-usage" className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                      <Cpu size={16} />
                      <span>AI Token Usage</span>
                    </NavLink>
                    <NavLink to="/super-admin/payments" className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                      <CreditCard size={16} />
                      <span>Payments & Pricing</span>
                    </NavLink>
                    <NavLink to="/super-admin/platform-settings" className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                      <Settings size={16} />
                      <span>Platform Settings</span>
                    </NavLink>

                  </div>
                )}
                {location.pathname.startsWith('/super-admin') && (
                  <div style={{ marginTop: '16px' }}>
                    <NavLink 
                      to="/dashboard" 
                      className="nav-item"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                    >
                      <LogOut size={18} />
                      <span style={{ fontWeight: '600' }}>Exit Super Admin</span>
                    </NavLink>
                  </div>
                )}
              </div>
            )}
            {!location.pathname.startsWith('/super-admin') && (
              <>
                <NavLink to="/connections" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Link2 size={18} />
                  <span>Connections</span>
                </NavLink>
                <NavLink to="/scheduling" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Calendar size={18} />
                  <span>Post</span>
                  <span className="sidebar-badge badge-new">HOT</span>
                </NavLink>

                <div className="nav-group">
                  <div
                    onClick={() => setShowAutoOpsDropdown(!showAutoOpsDropdown)}
                    className={`nav-item ${location.pathname.startsWith('/hub') ? 'active' : ''}`}
                    style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Zap size={18} />
                      <span>AutoOps</span>
                    </div>
                    <ChevronDown size={14} style={{ transform: showAutoOpsDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </div>
                  {showAutoOpsDropdown && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '32px', marginTop: '4px' }}>
                      <div onClick={() => { navigate(location.pathname + '?openTemplates=true'); setShowTemplatesModal(true); }} className="nav-item sub-item" style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-dark)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <LayoutTemplate size={16} />
                        <span>All Template</span>
                      </div>
                      <div onClick={() => notify("Communication integration is coming soon!", "info")} className="nav-item sub-item" style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-dark)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <MessageSquare size={16} />
                        <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Communication</span>
                        <span style={{ fontSize: '0.62rem', background: 'var(--bg-card)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto', textTransform: 'uppercase', fontWeight: '700' }}>Soon</span>
                      </div>
                      {activeWorkspace?.isTelegramConnected && (
                        <NavLink to="/autoops/telegram" className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MessageSquare size={16} color="#3b82f6" />
                          <span style={{ fontWeight: '600' }}>Telegram</span>
                        </NavLink>
                      )}
                      {activeWorkspace?.isDiscordConnected && (
                        <NavLink to="/autoops/discord" className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} style={{ padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MessageSquare size={16} color="#8b5cf6" />
                          <span style={{ fontWeight: '600' }}>Discord</span>
                        </NavLink>
                      )}
                    </div>
                  )}
                </div>

                <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <LayoutDashboard size={18} />
                  <span>OneView</span>
                </NavLink>
                <NavLink to="/developer" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Lock size={18} />
                  <span>API keys</span>
                </NavLink>
                <NavLink
                  to="/universal-triggers"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Globe size={18} />
                  <span>Universal Triggers</span>
                </NavLink>
                <NavLink to="/ai-studio" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Sparkles size={18} />
                  <span>AI Studio</span>
                  <span className="sidebar-badge badge-new">NEW</span>
                </NavLink>

                <NavLink to="/audiences" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Users size={18} />
                  <span>Contacts</span>
                </NavLink>

                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Settings size={18} />
                  <span>Settings</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Fixed Upgrade Card at the bottom */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{
            padding: '18px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div>
              <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 6px 0' }}>
                Premium Access
              </h3>
              <p style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '600', lineHeight: '1.4', margin: 0 }}>
                Unlock all advanced features
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 0', borderTop: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '600' }}>
                <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <Sparkles size={12} color="#60a5fa" />
                  </div>
                  AI Credits
                </span>
                <span style={{ color: '#f8fafc', fontWeight: '800' }}>1X</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '600' }}>
                <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <Zap size={12} color="#60a5fa" />
                  </div>
                  Automations
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
              background: '#3b82f6',
              color: '#ffffff',
              fontWeight: '800',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textAlign: 'center',
              transition: 'background 0.2s',
              border: 'none'
            }}>
              <Crown size={15} color="#ffffff" /> Upgrade Now
            </NavLink>
          </div>
        </div>

        {showWorkspaceModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Create Workspace</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>Organize your settings, campaigns, messages, and contacts under a new workspace.</p>

              <form onSubmit={handleCreateWorkspace}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Workspace Name</label>
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="e.g. Acme Marketing"
                    required
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)',
                      fontSize: '14px', outline: 'none', transition: 'border-color 0.2s'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => { setShowWorkspaceModal(false); setNewWorkspaceName(''); }}
                    style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'transparent', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', fontSize: '14px', fontWeight: '600', color: 'white', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)' }}
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <TemplatesModal isOpen={showTemplatesModal} onClose={() => setShowTemplatesModal(false)} />
      </aside>
    </>
  );
}

function TopBar({ onMenuClick }) {
  const location = useLocation();
  const { user } = useAuth();

  const getTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'OneView';
      case '/campaigns': return 'Automations';
      case '/campaign-builder/new': return 'Campaign Builder';
      case '/audiences': return 'Contacts';
      case '/connections': return 'Connections';
      case '/settings': return 'Settings';
      case '/upgrade': return 'Billing';
      case '/ai-studio': return 'AI Studio';
      case '/forms': return 'Forms';
      case '/broadcasts': return 'Broadcasts';
      case '/scheduling': return '';
      case '/hub': return 'Hub';
      case '/developer': return 'API Keys';
      default:
        if (location.pathname.startsWith('/flow-builder/')) return 'Editing Flow';
        if (location.pathname.startsWith('/automation-editor/')) return 'Automation';
        if (location.pathname.startsWith('/platform/')) return 'Hub';
        return 'OneView';
    }
  };

  if (!user) return null;

  return (
    <header className="topbar" style={{ background: 'transparent', borderBottom: 'none', height: '60px', padding: window.innerWidth < 640 ? '0 16px' : '0 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onMenuClick} className="mobile-show" style={{ color: 'var(--text-main)' }}>
          <MenuIcon size={24} />
        </button>
        <h1 className="page-title" style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>{getTitle()}</h1>
      </div>
      <div className="topbar-actions" id="topbar-actions-portal">
        {/* Support button removed */}
      </div>
    </header>
  );
}

function MainLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isPublic = ['/', '/public-home', '/login', '/signup', '/help', '/about', '/resources', '/blog', '/reviews', '/setup'].includes(location.pathname) || location.pathname.startsWith('/blog/');
  const isEditor = location.pathname.startsWith('/dm-automation-editor') ||
    location.pathname.startsWith('/automation-editor') ||
    location.pathname.startsWith('/flow-builder');
  const isMessageOnlyHub = location.pathname === '/hub/message-only';
  const hideSidebar = isPublic; // Sidebar should remain visible on editor pages
  const hideTopBar = hideSidebar || isEditor || isMessageOnlyHub || !['/dashboard', '/connections'].includes(location.pathname);

  return (
    <div className="app-container" style={{ height: '100%', width: '100%', position: 'fixed', top: 0, left: 0 }}>
      {user && !hideSidebar && <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
      <main className="main-content" style={{ paddingTop: hideTopBar ? '0' : undefined }}>
        {!hideTopBar && <TopBar onMenuClick={() => setIsSidebarOpen(true)} />}
        <div className="page-container" style={{
          padding: hideTopBar ? '0' : undefined,
          overflow: (isEditor || ['/inbox', '/universal-triggers', '/scheduling', '/hub/message-only'].includes(location.pathname)) ? 'hidden' : 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
              <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={user ? <Navigate to="/connections" /> : <Landing />} />
              <Route path="/public-home" element={<Landing />} />
              <Route path="/feature/comment-to-dm" element={<CommentToDM />} />
              <Route path="/feature/grow-followers" element={<GrowFollowers />} />
              <Route path="/feature/never-miss-comment" element={<NeverMissComment />} />
              {/* PlatformHub route removed */}
              <Route path="/hub/message-only" element={<ProtectedRoute><MessageOnlyHub /></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
              <Route path="/communication" element={<ProtectedRoute><CommunicationHub /></ProtectedRoute>} />
              <Route path="/platform/whatsapp" element={<ProtectedRoute><WhatsAppDashboard /></ProtectedRoute>} />
              <Route path="/autoops/:platform" element={<ProtectedRoute><PlatformAutoOps /></ProtectedRoute>} />
              <Route path="/platform/:platformId" element={<ProtectedRoute><PlatformDashboard /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/onboarding" element={<Navigate to="/connections" replace />} />
              <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
              <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
              <Route path="/super-admin/:tab" element={<ProtectedRoute><SuperAdminLayout /></ProtectedRoute>} />
              <Route path="/universal-triggers" element={<ProtectedRoute><UniversalTriggers /></ProtectedRoute>} />
              <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />

              <Route path="/automation-editor/:id?" element={<ProtectedRoute><AutomationEditor /></ProtectedRoute>} />
              <Route path="/dm-automation-editor/:id?" element={<ProtectedRoute><DmAutomationEditor /></ProtectedRoute>} />
              <Route path="/write-review" element={<ProtectedRoute><WriteReview /></ProtectedRoute>} />
              <Route path="/audiences" element={<ProtectedRoute><Audiences /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/workplace" element={<ProtectedRoute><Workplace /></ProtectedRoute>} />
              <Route path="/workplace/instagram" element={<ProtectedRoute><InstagramWorkbench /></ProtectedRoute>} />
              <Route path="/workplace/facebook" element={<ProtectedRoute><FacebookWorkbench /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/upgrade" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/ai-studio" element={<ProtectedRoute><AIStudio /></ProtectedRoute>} />
              <Route path="/developer" element={<ProtectedRoute><ApiKeys /></ProtectedRoute>} />
              <Route path="/forms" element={<ProtectedRoute><Forms /></ProtectedRoute>} />
              <Route path="/forms/:id" element={<ProtectedRoute><FormDetail /></ProtectedRoute>} />
              <Route path="/broadcasts" element={<ProtectedRoute><Broadcasts /></ProtectedRoute>} />
              <Route path="/flow-builder/:id" element={<ProtectedRoute><FlowBuilder /></ProtectedRoute>} />
              <Route path="/refer" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
              <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
              <Route path="/login" element={user ? <Navigate to="/connections" /> : <Login />} />
              <Route path="/signup" element={user ? <Navigate to="/connections" /> : <Signup />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/about" element={<About />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/reviews" element={<AllReviews />} />
              <Route path="/features/universal-triggers" element={<UniversalTriggersFeature />} />
              <Route path="/features/scheduling" element={<ScheduleFeature />} />
              <Route path="/scheduling" element={<ProtectedRoute><Scheduling /></ProtectedRoute>} />
              <Route path="/developer" element={<ProtectedRoute><ApiKeys /></ProtectedRoute>} />
              <Route path="/contact" element={<Contact />} />

              <Route path="*" element={<div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-muted)' }}>Page Under Construction</div>} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <MainLayout />
          <div className="toast-container">
            {toasts.map(t => (
              <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
            ))}
          </div>
          <CookieBanner />
        </Router>
      </AuthProvider>
    </NotificationContext.Provider>
  );
}

export default App;




