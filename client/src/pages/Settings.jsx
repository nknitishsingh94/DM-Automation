import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Instagram, Facebook, MessageSquare, Key, MapPin, Save, Info, 
  CheckCircle, XCircle, Rocket, Trash2, AlertTriangle, Send, Twitter, 
  Youtube, Linkedin, ChevronDown, ChevronRight, Plus, X, Globe, Sliders, Activity, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../App';
import { API_BASE_URL } from '../config';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    instagramAccessToken: '',
    instagramPageId: '',
    businessAccountId: '',
    facebookAccessToken: '',
    facebookPageId: '',
    isAccountConnected: false,
    isFacebookConnected: false,
    instagramAutomationEnabled: true
  });
  
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [redirectingInsta, setRedirectingInsta] = useState(false);
  
  // Interactive UI Dropdowns & Modals
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  const [platformFilter, setPlatformFilter] = useState('All platforms');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [profileFilter, setProfileFilter] = useState('All profiles');
  const [showDangerZone, setShowDangerZone] = useState(false);

  const { notify } = useNotification();

  const platformsList = [
    { name: 'TikTok', icon: MusicIcon, color: '#000000', enabled: false },
    { name: 'Instagram', icon: Instagram, color: '#ec4899', enabled: true },
    { name: 'Facebook', icon: Facebook, color: '#1877f2', enabled: false },
    { name: 'YouTube', icon: Youtube, color: '#ff0000', enabled: false },
    { name: 'LinkedIn', icon: Linkedin, color: '#0077b5', enabled: false },
    { name: 'Twitter/X', icon: Twitter, color: '#0f1419', enabled: false },
    { name: 'Threads', icon: ThreadsIcon, color: '#000000', enabled: false },
    { name: 'Bluesky', icon: Globe, color: '#0a7aff', enabled: false },
    { name: 'Pinterest', icon: Save, color: '#bd081c', enabled: false },
    { name: 'Reddit', icon: Globe, color: '#ff4500', enabled: false },
    { name: 'Google Business', icon: MapPin, color: '#4285f4', enabled: false },
    { name: 'Telegram', icon: Send, color: '#0088cc', enabled: false },
    { name: 'Discord', icon: MessageSquare, color: '#5865f2', enabled: false },
    { name: 'WhatsApp', icon: MessageSquare, color: '#25d366', enabled: false }
  ];

  useEffect(() => {
    const token = localStorage.getItem('insta_agent_token');
    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401) {
          logout();
          navigate('/login');
          return;
        }

        const data = await res.json();
        // Ensure connection flags are cleanly isolated
        const derivedData = {
          ...data,
          isAccountConnected: !!data.instagramAccessToken && !!data.businessAccountId,
          isFacebookConnected: false // Keep Facebook inactive per request
        };
        setSettings(s => ({ ...s, ...derivedData }));
        setLoading(false);
      } catch (err) {
        console.error("Error loading settings:", err);
      }
    };

    loadSettings();

    // --- HANDLE OAUTH FEEDBACK ---
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_success')) {
      loadSettings();
      notify("🚀 Instagram profile linked successfully! Opening dashboard...", "success");
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        navigate('/campaigns?setup=true');
      }, 3500);
    } else if (params.get('oauth_error')) {
      const errorType = params.get('oauth_error');
      let msg = "Meta integration failed.";
      if (errorType === 'declined') msg = "Meta oauth permissions declined.";
      if (errorType === 'exchange_failed') msg = "Token exchange failed. Reconnect Facebook Page.";
      notify(msg, "error");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSaveSettings = async (e, overrideSettings = null) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('insta_agent_token');
      const payload = overrideSettings || settings;
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...payload, _platform: 'instagram' })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Connection failed.' });
        notify(data.error || 'Connection failed.', 'error');
      } else {
        setSettings(s => ({ ...s, ...data }));
        if (e) {
          setMessage({ type: 'success', text: '✅ Settings updated successfully!' });
          setTimeout(() => setMessage({ type: '', text: '' }), 5000);
          notify('Settings updated successfully!', 'success');
        } else {
          notify('Instagram status updated successfully!', 'success');
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error.' });
      notify('A network error occurred. Please check your connection.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/auth/account`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const data = await res.json();
      
      if (res.ok) {
        logout();
        navigate('/');
        notify("Account deleted successfully.", "success");
      } else {
        if (res.status === 401) {
          notify("Session expired. Please log in again.", "error");
          logout();
          navigate('/login');
        } else {
          notify(data.message || "Failed to delete account.", "error");
        }
      }
    } catch (err) {
      console.error("Deletion error:", err);
      notify("A network error occurred. Please try again.", "error");
    } finally { 
      setDeleting(false); 
      setShowDeleteConfirm(false); 
    }
  };

  const triggerConnect = () => {
    setRedirectingInsta(true);
    window.location.href = `${API_BASE_URL}/api/oauth/facebook?connectType=instagram&token=${localStorage.getItem('insta_agent_token')}`;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b', fontSize: '1.1rem', fontWeight: '600' }}>
      <div className="animate-pulse">Loading connections panel...</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1100px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '100px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Header Block with top-right buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Connections
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: '400', margin: 0 }}>
            Manage profiles and platform integrations
          </p>
        </div>

        {/* Buttons matching screenshot */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => setShowConnectModal(true)}
            style={{ 
              background: '#ea580c', 
              color: 'white', 
              padding: '10px 18px', 
              borderRadius: '8px', 
              fontWeight: '600', 
              fontSize: '0.88rem',
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#c2410c'}
            onMouseOut={(e) => e.currentTarget.style.background = '#ea580c'}
          >
            <Plus size={16} /> New Connection
          </button>
        </div>
      </div>

      {/* Filters Row matching screenshot */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px',
        padding: '8px 0',
        borderBottom: '1px solid #f3f4f6',
        position: 'relative'
      }}>
        {/* Platforms dropdown filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>Platforms</span>
          
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              style={{ 
                background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 16px', 
                fontSize: '0.88rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '130px', justifyContent: 'space-between'
              }}
            >
              <span>{profileFilter}</span>
              <ChevronDown size={15} color="#9ca3af" />
            </button>
            {showProfileDropdown && (
              <div className="filter-dropdown">
                <div onClick={() => { setProfileFilter('All profiles'); setShowProfileDropdown(false); }} className="filter-item">All profiles</div>
                <div onClick={() => { setProfileFilter('Business profiles'); setShowProfileDropdown(false); }} className="filter-item">Business profiles</div>
                <div onClick={() => { setProfileFilter('Personal profiles'); setShowProfileDropdown(false); }} className="filter-item">Personal profiles</div>
              </div>
            )}
          </div>
        </div>

        {/* Right filters: All platforms & All statuses dropdowns */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          
          {/* All platforms dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
              style={{ 
                background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 16px', 
                fontSize: '0.88rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '150px', justifyContent: 'space-between'
              }}
            >
              <span>{platformFilter}</span>
              <ChevronDown size={15} color="#9ca3af" />
            </button>
            
            {showPlatformDropdown && (
              <div className="filter-dropdown" style={{ right: 0, left: 'auto', maxHeight: '320px', overflowY: 'auto', width: '200px' }}>
                <div onClick={() => { setPlatformFilter('All platforms'); setShowPlatformDropdown(false); }} className="filter-item" style={{ fontWeight: 'bold' }}>All platforms</div>
                {platformsList.map(plat => (
                  <div 
                    key={plat.name} 
                    onClick={() => { setPlatformFilter(plat.name); setShowPlatformDropdown(false); }} 
                    className="filter-item"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', color: plat.enabled ? '#111827' : '#9ca3af' }}
                  >
                    <plat.icon size={15} color={plat.enabled ? plat.color : '#9ca3af'} />
                    <span>{plat.name}</span>
                    {!plat.enabled && <span style={{ fontSize: '0.65rem', marginLeft: 'auto', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>locked</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All statuses dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              style={{ 
                background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 16px', 
                fontSize: '0.88rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '130px', justifyContent: 'space-between'
              }}
            >
              <span>{statusFilter}</span>
              <ChevronDown size={15} color="#9ca3af" />
            </button>
            {showStatusDropdown && (
              <div className="filter-dropdown" style={{ right: 0, left: 'auto' }}>
                <div onClick={() => { setStatusFilter('All statuses'); setShowStatusDropdown(false); }} className="filter-item">All statuses</div>
                <div onClick={() => { setStatusFilter('Connected'); setShowStatusDropdown(false); }} className="filter-item">Connected</div>
                <div onClick={() => { setStatusFilter('Inactive'); setShowStatusDropdown(false); }} className="filter-item">Inactive</div>
              </div>
            )}
          </div>

          {/* Reset Filters button matching screenshot */}
          {(platformFilter !== 'All platforms' || statusFilter !== 'All statuses' || profileFilter !== 'All profiles') && (
            <button 
              onClick={() => {
                setPlatformFilter('All platforms');
                setStatusFilter('All statuses');
                setProfileFilter('All profiles');
                notify("Filters reset successfully", "info");
              }}
              style={{ 
                background: 'transparent', border: 'none', color: '#6b7280', fontSize: '0.85rem', 
                display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '600',
                padding: '8px 10px', transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#111827'}
              onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              <X size={15} style={{ verticalAlign: 'middle', marginTop: '-2px' }} /> Reset
            </button>
          )}

        </div>
      </div>

      {/* Main Connection Table Card (matches screenshot empty slots or renders connected card) */}
      <div style={{ 
        background: '#ffffff', 
        borderRadius: '12px', 
        border: '1px solid #e5e7eb', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        overflow: 'hidden',
        minHeight: '240px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '24px'
      }}>
        
        {settings.isAccountConnected && 
         (statusFilter === 'All statuses' || statusFilter === 'Connected') && 
         (platformFilter === 'All platforms' || platformFilter === 'Instagram') ? (
          /* Active Integration Card Grid View - Replicates user screenshot perfectly */
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'flex-start' }}>
            
            <div style={{ 
              width: '240px',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '16px',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative'
            }}>
              {/* Header Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Rounded image avatar with tiny pink instagram overlay icon */}
                  <div style={{ position: 'relative', width: '42px', height: '42px' }}>
                    <img 
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60" 
                      alt="Instagram Avatar" 
                      style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <div style={{ 
                      position: 'absolute', bottom: '-2px', right: '-2px', 
                      width: '16px', height: '16px', borderRadius: '50%', 
                      background: '#ec4899', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', border: '1.5px solid white' 
                    }}>
                      <Instagram size={10} color="white" />
                    </div>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#1f2937' }}>Instagram</h4>
                    <span style={{ 
                      display: 'inline-block', background: '#ccfbf1', color: '#0f766e', 
                      fontSize: '0.68rem', fontWeight: '700', padding: '1px 6px', 
                      borderRadius: '4px', marginTop: '2px' 
                    }}>
                      connected
                    </span>
                  </div>
                </div>
                
                {/* Details Circle button */}
                <Info 
                  size={16} 
                  color="#9ca3af" 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => notify(`Instagram Integration: Page ID ${settings.instagramPageId || 'N/A'}`, "info")}
                />
              </div>

              {/* Username with Copy Icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#374151' }}>
                  @{settings.connectedInstagramName || 'monster__pk_8795'}
                </span>
                <span 
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                  onClick={() => {
                    navigator.clipboard.writeText(settings.connectedInstagramName || 'monster__pk_8795');
                    notify("Username copied to clipboard!", "success");
                  }}
                  title="Copy Username"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </span>
              </div>

              {/* Date */}
              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                {settings.lastTestedAt ? new Date(settings.lastTestedAt).toLocaleDateString() : '5/18/2026'}
              </div>

              {/* Default Badge */}
              <div>
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '4px', 
                  background: '#f3f4f6', color: '#4b5563', fontSize: '0.72rem', 
                  fontWeight: '600', padding: '3px 8px', borderRadius: '4px' 
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316' }}></span>
                  Default
                </span>
              </div>

              {/* AI Auto-Replies Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: '600' }}>AI auto-replies</span>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={settings.instagramAutomationEnabled}
                    onChange={(e) => {
                      const newVal = e.target.checked;
                      setSettings(s => ({ ...s, instagramAutomationEnabled: newVal }));
                      handleSaveSettings(null, { ...settings, instagramAutomationEnabled: newVal });
                    }}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {/* Disconnect Button */}
              <button 
                onClick={() => {
                  if(window.confirm("Are you sure you want to disconnect Instagram? Automation will stop immediately.")) {
                    setSettings({...settings, instagramAccessToken: '', instagramPageId: '', businessAccountId: '', isAccountConnected: false});
                    handleSaveSettings(null, { ...settings, instagramAccessToken: '', instagramPageId: '', businessAccountId: '', isAccountConnected: false });
                  }
                }}
                style={{ 
                  marginTop: '8px',
                  width: '100%',
                  padding: '8px',
                  background: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  color: '#374151',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                  e.currentTarget.style.borderColor = '#fca5a5';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.color = '#374151';
                }}
              >
                Disconnect
              </button>
            </div>

          </div>
        ) : (
          /* Empty Connections slot matching screenshot exactly */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 24px', textAlign: 'center' }}>
            <span style={{ color: '#4b5563', fontSize: '0.95rem', fontWeight: '500', marginBottom: '16px' }}>
              No accounts connected yet.
            </span>
            
            <button 
              onClick={() => setShowConnectModal(true)}
              style={{ 
                background: 'white', 
                color: '#374151', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                fontWeight: '600', 
                fontSize: '0.88rem',
                border: '1px solid #d1d5db', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'border 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#9ca3af'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
            >
              <Plus size={16} /> Connect an account
            </button>
          </div>
        )}

      </div>

      {/* Advanced Settings Drawer (Danger Zone trigger) */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', overflow: 'hidden' }}>
        <div 
          onClick={() => setShowDangerZone(!showDangerZone)}
          style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#f9fafb' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569' }}>
            <Sliders size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Advanced Account Preferences</span>
          </div>
          <ChevronDown size={18} style={{ transform: showDangerZone ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
        </div>

        {showDangerZone && (
          <div style={{ padding: '24px', borderTop: '1px solid #e5e7eb', background: '#fff1f2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#be123c', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Permanently Delete Account</h3>
            </div>
            
            <p style={{ color: '#9f1239', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '20px', fontWeight: '500' }}>
              Deleting your account is permanent. All your automated DM configurations, rules, active message counters, and connected platform credentials will be wiped from our database forever.
            </p>

            {!showDeleteConfirm ? (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                style={{ 
                  padding: '10px 20px', background: '#e11d48', color: 'white', border: 'none', 
                  borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' 
                }}
              >
                Delete Account
              </button>
            ) : (
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1.5px solid #e11d48' }}>
                <h4 style={{ fontWeight: '800', color: '#1e293b', marginBottom: '4px', fontSize: '0.95rem' }}>Are you absolutely sure?</h4>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '16px' }}>This cannot be undone. You will have to sign up again to restore access.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={handleDeleteAccount} 
                    disabled={deleting} 
                    style={{ flex: 1, background: '#e11d48', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem' }}
                  >
                    {deleting ? 'Wiping Data...' : 'Yes, Delete Everything'}
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)} 
                    style={{ flex: 1, background: '#f1f5f9', color: '#475569', padding: '10px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STYLISH PLATFORM CONNECT MODAL */}
      {showConnectModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ 
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '640px', 
            padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e5e7eb', position: 'relative', margin: '20px',
            animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setShowConnectModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#111827'}
              onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>Connect Account</h3>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', margin: '0 0 28px 0', lineHeight: '1.5' }}>
              Choose a messaging channel to integrate. Only Instagram is fully active per settings configuration.
            </p>

            {/* Grid of Platforms */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', maxHeight: '380px', overflowY: 'auto', padding: '4px' }}>
              {platformsList.map(platform => (
                <div 
                  key={platform.name}
                  onClick={() => {
                    if (platform.enabled) {
                      setShowConnectModal(false);
                      triggerConnect();
                    } else {
                      notify(`${platform.name} integration is coming soon!`, "info");
                    }
                  }}
                  style={{ 
                    border: platform.enabled ? '2px solid #ec4899' : '1px solid #e5e7eb',
                    borderRadius: '16px',
                    padding: '20px 14px',
                    textAlign: 'center',
                    cursor: platform.enabled ? 'pointer' : 'not-allowed',
                    background: platform.enabled ? 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)' : '#fafafa',
                    transition: 'all 0.2s',
                    position: 'relative',
                    opacity: platform.enabled ? 1 : 0.65
                  }}
                  onMouseOver={(e) => {
                    if (platform.enabled) {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(236, 72, 153, 0.12)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (platform.enabled) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ 
                    width: '42px', height: '42px', borderRadius: '12px', 
                    background: platform.enabled ? 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)' : '#e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px auto', color: platform.enabled ? 'white' : '#9ca3af'
                  }}>
                    <platform.icon size={22} />
                  </div>
                  
                  <span style={{ fontSize: '0.82rem', fontWeight: '600', color: platform.enabled ? '#111827' : '#6b7280' }}>
                    {platform.name}
                  </span>

                  {platform.enabled ? (
                    <span style={{ 
                      position: 'absolute', top: '-8px', right: '10px', 
                      background: '#ec4899', color: 'white', fontSize: '0.62rem', 
                      padding: '2px 8px', borderRadius: '10px', fontWeight: '800',
                      boxShadow: '0 2px 4px rgba(236,72,153,0.2)'
                    }}>
                      ACTIVE
                    </span>
                  ) : (
                    <span style={{ 
                      display: 'block', fontSize: '0.62rem', color: '#9ca3af', 
                      fontWeight: '700', marginTop: '4px', textTransform: 'uppercase'
                    }}>
                      locked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global CSS Style Rules */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }

        .filter-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 100;
          margin-top: 6px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          width: 170px;
          padding: 6px 0;
          animation: scaleIn 0.15s ease-out;
        }

        .filter-item {
          padding: 8px 16px;
          font-size: 0.85rem;
          color: #374151;
          cursor: pointer;
          transition: background 0.15s;
        }

        .filter-item:hover {
          background: #f3f4f6;
        }

        .switch { 
          position: relative; 
          display: inline-block; 
          width: 44px; 
          height: 24px; 
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { 
          position: absolute; 
          cursor: pointer; 
          top: 0; left: 0; right: 0; bottom: 0; 
          background-color: #e5e7eb; 
          border-radius: 34px; 
          transition: .3s; 
        }
        .slider:before { 
          position: absolute; 
          content: ""; 
          height: 18px; 
          width: 18px; 
          left: 3px; 
          bottom: 3px; 
          background-color: white; 
          border-radius: 50%; 
          transition: .3s; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        input:checked + .slider { background-color: #ea580c; }
        input:checked + .slider:before { transform: translateX(20px); }

        .trash-btn {
          border-radius: 6px;
          transition: all 0.2s;
        }
        .trash-btn:hover {
          background: #fef2f2;
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}

// Stubs for Custom Icons not in standard lucide
function MusicIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function ThreadsIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10H12Z" />
      <path d="M12 12a4 4 0 1 0 4 4h-4Z" />
    </svg>
  );
}
