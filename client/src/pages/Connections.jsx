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
import LoadingSpinner from '../components/LoadingSpinner';

export default function Connections() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    instagramAccessToken: '',
    instagramPageId: '',
    businessAccountId: '',
    facebookAccessToken: '',
    facebookPageId: '',
    isAccountConnected: false,
    isFacebookConnected: false,
    isYouTubeConnected: false,
    youtubeAccessToken: '',
    youtubeRefreshToken: '',
    youtubeChannelId: '',
    isLinkedInConnected: false,
    isGoogleBusinessConnected: false,
    isTwitterConnected: false,
    isWhatsAppConnected: false,
    isThreadsConnected: false,
    instagramAutomationEnabled: true,
    facebookAutomationEnabled: true,
    connectedInstagramName: '',
    connectedFacebookName: '',
    connectedYouTubeName: '',
    connectedLinkedInName: '',
    connectedGoogleBusinessName: '',
    connectedTwitterName: '',
    connectedInstagramId: '',
    connectedPageName: null,
    whatsappPhoneNumberId: '',
    whatsappToken: '',
    whatsappDisplayName: 'WhatsApp Business'
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
  const [selectedSettingsPlatform, setSelectedSettingsPlatform] = useState(null);

  const { notify } = useNotification();

  const platformsList = [
    { name: 'Instagram', icon: Instagram, color: '#ec4899', enabled: true },
    { name: 'Facebook', icon: Facebook, color: '#1877f2', enabled: true },
    { name: 'YouTube', icon: Youtube, color: '#ff0000', enabled: true },
    { name: 'LinkedIn', icon: Linkedin, color: '#0077b5', enabled: true },
    { name: 'Twitter/X', icon: Twitter, color: '#0f1419', enabled: true },
    { name: 'Threads', icon: Activity, color: '#000000', enabled: true },
    { name: 'Google Business', icon: MapPin, color: '#4285f4', enabled: true },
    { name: 'Telegram', icon: Send, color: '#0088cc', enabled: true },
    { name: 'WhatsApp', icon: MessageSquare, color: '#25d366', enabled: true }
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
        // Parse Threads info from the connectedPageName JSON blob
        let threadsInfo = {};
        if (data.connectedPageName) {
          try { threadsInfo = JSON.parse(data.connectedPageName); } catch (e) {}
        }
        // Derive connection flags from real data
        const mergedData = { ...data, ...threadsInfo };
        const derivedData = {
          ...mergedData,
          instagramAutomationEnabled: mergedData.instagramAutomationEnabled ?? false,
          facebookAutomationEnabled: mergedData.facebookAutomationEnabled ?? false,
          isAccountConnected: !!mergedData.instagramAccessToken && !!mergedData.businessAccountId,
          facebookPageId: mergedData.facebookPageId || data.facebookPageId || '',
          isFacebookConnected: !!mergedData.facebookAccessToken && !!mergedData.facebookPageId,
          connectedFacebookName: mergedData.connectedFacebookName || data.connectedFacebookName || (mergedData.connectedPageName && !mergedData.connectedPageName.startsWith('{') ? mergedData.connectedPageName : '') || (data.connectedPageName && !data.connectedPageName.startsWith('{') ? data.connectedPageName : '') || '',
          isYouTubeConnected: !!mergedData.isYouTubeConnected || !!mergedData.isYoutubeConnected,
          connectedYouTubeName: mergedData.connectedYouTubeName || mergedData.youtubeChannelName || '',
          isLinkedInConnected: !!mergedData.isLinkedInConnected,
          isGoogleBusinessConnected: !!mergedData.isGoogleBusinessConnected,
          isTwitterConnected: !!mergedData.isTwitterConnected,
          isWhatsAppConnected: !!mergedData.whatsappToken && !!mergedData.whatsappPhoneNumberId,
          isThreadsConnected: !!mergedData.isThreadsConnected,
          threadsAccessToken: mergedData.threadsAccessToken || null,
          threadsPageId: mergedData.threadsPageId || null,
          connectedThreadsName: mergedData.connectedThreadsName || null,
          whatsappDisplayName: mergedData.connectedInstagramId || mergedData.whatsappPhoneNumberId || 'WhatsApp Business'
        };
        setSettings(s => ({ ...s, ...derivedData }));
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // --- HANDLE OAUTH FEEDBACK ---
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_success')) {
      loadSettings();
      const platform = params.get('platform') || 'instagram';
      let platformLabel = 'Instagram profile';
      if (platform === 'facebook') platformLabel = 'Facebook page';
      else if (platform === 'whatsapp') platformLabel = 'WhatsApp Business account';
      else if (platform === 'threads') platformLabel = 'Threads profile';
      else if (platform === 'youtube') platformLabel = 'YouTube channel';
      else if (platform === 'linkedin') platformLabel = 'LinkedIn profile';
      else if (platform === 'google-business') platformLabel = 'Google Business Profile';
      else if (platform === 'twitter' || platform === 'twitter/x') platformLabel = 'Twitter profile';

      notify(`🚀 ${platformLabel} linked successfully!`, "success");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('oauth_error')) {
      const errorType = params.get('oauth_error');
      let msg = "Integration failed.";
      if (errorType === 'declined') msg = "OAuth permissions declined.";
      else if (errorType === 'exchange_failed') msg = "Failed to connect to the platform.";
      else if (errorType === 'whatsapp_not_configured') msg = "No WhatsApp Business number found. You must configure a WhatsApp Business Account in Meta Business Manager first.";
      else if (errorType === 'youtube_auth_failed') msg = "YouTube authorization failed. Please try again.";
      else if (errorType === 'linkedin_auth_failed') msg = "LinkedIn authorization failed. Please try again.";
      
      notify(msg, "error");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSaveSettings = async (e, overrideSettings = null, platform = 'instagram') => {
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
        body: JSON.stringify({ ...payload, _platform: platform })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Connection failed.' });
        notify(data.error || 'Connection failed.', 'error');
      } else {
        let threadsInfo = {};
        if (data.connectedPageName) {
          try { threadsInfo = JSON.parse(data.connectedPageName); } catch (e) {}
        }
        const derivedData = {
          ...data,
          instagramAutomationEnabled: data.instagramAutomationEnabled ?? false,
          facebookAutomationEnabled: data.facebookAutomationEnabled ?? false,
          isAccountConnected: !!data.instagramAccessToken && !!data.businessAccountId,
          isFacebookConnected: !!data.facebookAccessToken && !!data.facebookPageId,
          connectedFacebookName: data.connectedFacebookName || (data.connectedPageName && !data.connectedPageName.startsWith('{') ? data.connectedPageName : '') || '',
          isYouTubeConnected: !!data.isYouTubeConnected || !!data.isYoutubeConnected,
          connectedYouTubeName: data.connectedYouTubeName || data.youtubeChannelName || '',
          isLinkedInConnected: !!data.isLinkedInConnected,
          isGoogleBusinessConnected: !!data.isGoogleBusinessConnected,
          isTwitterConnected: !!data.isTwitterConnected,
          isWhatsAppConnected: !!data.whatsappToken && !!data.whatsappPhoneNumberId,
          isThreadsConnected: !!threadsInfo.isThreadsConnected,
          threadsAccessToken: threadsInfo.threadsAccessToken || null,
          threadsPageId: threadsInfo.threadsPageId || null,
          connectedThreadsName: threadsInfo.connectedThreadsName || null,
          whatsappDisplayName: data.connectedInstagramId || data.whatsappPhoneNumberId || 'WhatsApp Business'
        };
        setSettings(s => ({ ...s, ...derivedData }));
        if (e) {
          setMessage({ type: 'success', text: '✅ Settings updated successfully!' });
          setTimeout(() => setMessage({ type: '', text: '' }), 5000);
          notify('Settings updated successfully!', 'success');
        } else {
          const platName = platform.charAt(0).toUpperCase() + platform.slice(1);
          notify(`${platName} status updated successfully!`, 'success');
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

  
  const handleRemoveAccount = (platformId) => {
    if (!window.confirm(`Are you sure you want to remove ${platformId}?`)) return;
    
    let cleared = { ...settings };
    let pageData = {};
    try { pageData = JSON.parse(settings.connectedPageName || '{}'); } catch(e){}

    if (platformId === 'instagram') {
      cleared = { ...cleared, instagramAccessToken: null, instagramPageId: null, businessAccountId: null, connectedInstagramName: null, isAccountConnected: false };
    } else if (platformId === 'facebook') {
      cleared = { ...cleared, facebookAccessToken: null, facebookPageId: null, connectedFacebookName: null, isFacebookConnected: false };
    } else if (platformId === 'youtube') {
      delete pageData.isYouTubeConnected; delete pageData.isYoutubeConnected; delete pageData.connectedYouTubeName; delete pageData.youtubeChannelName; delete pageData.youtubeAccessToken; delete pageData.youtubeRefreshToken; delete pageData.youtubeChannelId;
      cleared = { ...cleared, youtubeAccessToken: null, youtubeRefreshToken: null, connectedYouTubeName: null, isYouTubeConnected: false, youtubeChannelId: null, isYoutubeConnected: false, youtubeChannelName: null };
    } else if (platformId === 'linkedin') {
      delete pageData.isLinkedInConnected; delete pageData.connectedLinkedInName; delete pageData.linkedinAccessToken;
      cleared = { ...cleared, linkedinAccessToken: null, connectedLinkedInName: null, isLinkedInConnected: false };
    } else if (platformId === 'twitter') {
      delete pageData.isTwitterConnected; delete pageData.connectedTwitterName; delete pageData.twitterAccessToken; delete pageData.twitterRefreshToken; delete pageData.connectedTwitterId;
      cleared = { ...cleared, twitterAccessToken: null, connectedTwitterName: null, isTwitterConnected: false, twitterRefreshToken: null, connectedTwitterId: null };
    } else if (platformId === 'google-business') {
      delete pageData.isGoogleBusinessConnected; delete pageData.connectedGoogleBusinessName; delete pageData.googleBusinessAccessToken; delete pageData.googleBusinessRefreshToken;
      cleared = { ...cleared, googleBusinessAccessToken: null, googleBusinessRefreshToken: null, connectedGoogleBusinessName: null, isGoogleBusinessConnected: false };
    } else if (platformId === 'threads') {
      delete pageData.isThreadsConnected; delete pageData.connectedThreadsName; delete pageData.threadsAccessToken; delete pageData.threadsPageId;
      cleared = { ...cleared, isThreadsConnected: false, threadsAccessToken: null, threadsPageId: null, connectedThreadsName: null };
    } else if (platformId === 'whatsapp') {
      cleared = { ...cleared, whatsappToken: null, whatsappPhoneNumberId: null, whatsappBusinessAccountId: null, isWhatsAppConnected: false };
    }
    
    cleared.connectedPageName = JSON.stringify(pageData);
    setSettings(cleared);
    handleSaveSettings(null, cleared, platformId);
    setSelectedSettingsPlatform(null);
  };

  const triggerConnect = (platformName = 'instagram') => {
    setRedirectingInsta(true);
    if (platformName.toLowerCase() === 'youtube') {
      window.location.href = `${API_BASE_URL}/api/youtube/auth?token=${localStorage.getItem('insta_agent_token')}`;
      return;
    }
    if (platformName.toLowerCase() === 'linkedin') {
      window.location.href = `${API_BASE_URL}/api/oauth/linkedin?token=${localStorage.getItem('insta_agent_token')}`;
      return;
    }
    if (platformName.toLowerCase() === 'google business' || platformName.toLowerCase() === 'google-business') {
      window.location.href = `${API_BASE_URL}/api/oauth/google-business?token=${localStorage.getItem('insta_agent_token')}`;
      return;
    }
    if (platformName.toLowerCase() === 'threads') {
      window.location.href = `${API_BASE_URL}/api/oauth/threads?token=${localStorage.getItem('insta_agent_token')}`;
      return;
    }
    if (platformName.toLowerCase() === 'twitter/x' || platformName.toLowerCase() === 'twitter') {
      window.location.href = `${API_BASE_URL}/api/oauth/twitter?token=${localStorage.getItem('insta_agent_token')}`;
      return;
    }
    if (platformName.toLowerCase() === 'telegram') {
      const token = prompt('Enter your Telegram Bot Token:');
      if (token) {
        handleSaveSettings(null, { ...settings, telegramToken: token, isTelegramConnected: true }, 'telegram');
        notify('Telegram Connected successfully!', 'success');
      }
      return;
    }
    const connectType = platformName.toLowerCase() === 'facebook' ? 'facebook'
      : platformName.toLowerCase() === 'whatsapp' ? 'whatsapp'
      : platformName.toLowerCase() === 'threads' ? 'threads'
      : 'instagram';
    window.location.href = `${API_BASE_URL}/api/oauth/facebook?connectType=${connectType}&token=${localStorage.getItem('insta_agent_token')}`;
  };

  const handleDisconnectFacebook = () => {
    if (!window.confirm('Facebook disconnect karna chahte hain? Facebook automation ruk jayega.')) return;
    const cleared = { ...settings, facebookAccessToken: null, facebookPageId: null, connectedFacebookName: null, isFacebookConnected: false };
    setSettings(cleared);
    handleSaveSettings(null, cleared, 'facebook');
  };

  const handleDisconnectWhatsApp = () => {
    if (!window.confirm('WhatsApp disconnect karna chahte hain? WhatsApp automation ruk jayega.')) return;
    const cleared = { ...settings, whatsappToken: null, whatsappPhoneNumberId: null, whatsappBusinessAccountId: null, isWhatsAppConnected: false };
    setSettings(cleared);
    handleSaveSettings(null, cleared, 'whatsapp');
  };

  const handleDisconnectThreads = () => {
    if (!window.confirm('Threads disconnect karna chahte hain?')) return;
    
    let pageData = {};
    try { pageData = JSON.parse(settings.connectedPageName || '{}'); } catch(e){}
    delete pageData.isThreadsConnected;
    delete pageData.connectedThreadsName;
    delete pageData.threadsAccessToken;
    delete pageData.threadsPageId;
    const newPageName = JSON.stringify(pageData);

    const cleared = { ...settings, connectedPageName: newPageName, isThreadsConnected: false, threadsAccessToken: null, threadsPageId: null, connectedThreadsName: null };
    setSettings(cleared);
    handleSaveSettings(null, cleared, 'threads');
  };

  const handleDisconnectYouTube = () => {
    if (!window.confirm('YouTube disconnect karna chahte hain? YouTube par automated uploads ruk jayenge.')) return;
    
    let pageData = {};
    try { pageData = JSON.parse(settings.connectedPageName || '{}'); } catch(e){}
    delete pageData.isYouTubeConnected;
    delete pageData.isYoutubeConnected;
    delete pageData.connectedYouTubeName;
    delete pageData.youtubeChannelName;
    delete pageData.youtubeAccessToken;
    delete pageData.youtubeRefreshToken;
    delete pageData.youtubeChannelId;
    const newPageName = JSON.stringify(pageData);

    const cleared = { ...settings, connectedPageName: newPageName, youtubeAccessToken: null, youtubeRefreshToken: null, connectedYouTubeName: null, isYouTubeConnected: false, youtubeChannelId: null, isYoutubeConnected: false, youtubeChannelName: null };
    setSettings(cleared);
    handleSaveSettings(null, cleared, 'youtube');
  };

  const handleDisconnectLinkedIn = () => {
    if (!window.confirm('LinkedIn disconnect karna chahte hain? Automated posts ruk jayenge.')) return;
    
    let pageData = {};
    try { pageData = JSON.parse(settings.connectedPageName || '{}'); } catch(e){}
    delete pageData.isLinkedInConnected;
    delete pageData.connectedLinkedInName;
    delete pageData.linkedinAccessToken;
    const newPageName = JSON.stringify(pageData);

    const cleared = { ...settings, connectedPageName: newPageName, linkedinAccessToken: null, connectedLinkedInName: null, isLinkedInConnected: false };
    setSettings(cleared);
    handleSaveSettings(null, cleared, 'linkedin');
  };

  const handleDisconnectGoogleBusiness = () => {
    if (!window.confirm('Google Business Profile disconnect karna chahte hain? Automated replies ruk jayenge.')) return;
    
    let pageData = {};
    try { pageData = JSON.parse(settings.connectedPageName || '{}'); } catch(e){}
    delete pageData.isGoogleBusinessConnected;
    delete pageData.connectedGoogleBusinessName;
    delete pageData.googleBusinessAccessToken;
    delete pageData.googleBusinessRefreshToken;
    const newPageName = JSON.stringify(pageData);

    const cleared = { ...settings, connectedPageName: newPageName, googleBusinessAccessToken: null, googleBusinessRefreshToken: null, connectedGoogleBusinessName: null, isGoogleBusinessConnected: false };
    setSettings(cleared);
    handleSaveSettings(null, cleared, 'google-business');
  };

  const handleDisconnectTwitter = () => {
    if (!window.confirm('Twitter/X disconnect karna chahte hain? Automated posts ruk jayenge.')) return;
    
    let pageData = {};
    try { pageData = JSON.parse(settings.connectedPageName || '{}'); } catch(e){}
    delete pageData.isTwitterConnected;
    delete pageData.connectedTwitterName;
    delete pageData.twitterAccessToken;
    delete pageData.twitterRefreshToken;
    delete pageData.connectedTwitterId;
    const newPageName = JSON.stringify(pageData);

    const cleared = { ...settings, connectedPageName: newPageName, twitterAccessToken: null, connectedTwitterName: null, isTwitterConnected: false, twitterRefreshToken: null, connectedTwitterId: null };
    setSettings(cleared);
    handleSaveSettings(null, cleared, 'twitter');
  };

  if (loading) return <LoadingSpinner minHeight="60vh" />;

  return (
    <div style={{ maxWidth: '1100px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', padding: '0 16px 100px 16px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', animation: 'fadeIn 0.5s ease-out' }}>
      


      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Top-right button for Connections tab */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
          <button 
            className="settings-header-btn"
            onClick={() => setShowConnectModal(true)}
            style={{ 
              background: '#7c3aed', 
              color: 'white', 
              padding: '12px 24px', 
              borderRadius: '10px', 
              fontWeight: '700', 
              fontSize: '1.05rem',
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
              transition: 'background 0.2s, transform 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#6d28d9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Plus size={18} /> New Connection
          </button>
        </div>

      {/* Filters Row */}
      <div className="settings-filters" style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px',
        padding: '8px 0',
        borderBottom: '1px solid #f3f4f6',
        position: 'relative'
      }}>

        {/* Right filters: All platforms & All statuses dropdowns */}
        <div className="settings-filters-group" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          
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
        
        {/* Check if ANY channel is connected based on active filters */}
        {(
          (settings.isAccountConnected && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (platformFilter === 'All platforms' || platformFilter === 'Instagram')) ||
          (settings.isFacebookConnected && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (platformFilter === 'All platforms' || platformFilter === 'Facebook')) ||
          (settings.isYouTubeConnected && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (platformFilter === 'All platforms' || platformFilter === 'YouTube')) ||
          (settings.isLinkedInConnected && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (platformFilter === 'All platforms' || platformFilter === 'LinkedIn')) ||
          (settings.isGoogleBusinessConnected && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (platformFilter === 'All platforms' || platformFilter === 'Google Business')) ||
          (settings.isTwitterConnected && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (platformFilter === 'All platforms' || platformFilter === 'Twitter/X')) ||
          (settings.isThreadsConnected && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (platformFilter === 'All platforms' || platformFilter === 'Threads'))
        ) ? (
          /* Active Integration Card Grid View */
          <div className="connection-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'stretch' }}>

            {/* ---- INSTAGRAM CARD ---- */}
            {settings.isAccountConnected && (platformFilter === 'All platforms' || platformFilter === 'Instagram') && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (
            <div className="connection-card" style={{ width: '100%', height: '100%', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fdf2f8', border: '1px solid #fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Instagram size={22} color="#ec4899" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>Instagram</h4>
                    <span style={{ display: 'inline-block', background: '#10b981', color: '#ffffff', fontSize: '0.65rem', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>connected</span>
                  </div>
                </div>
                <Info size={16} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => notify(`Instagram connected`, 'info')} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>@{settings.connectedInstagramName || 'unknown'}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{settings.lastTestedAt ? new Date(settings.lastTestedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(`https://instagram.com/${settings.connectedInstagramName || ''}`, '_blank'); }}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background='#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background='#f1f5f9'}
                >
                  Profile
                </button>
              
                            <button onClick={() => setSelectedSettingsPlatform({ id: 'instagram', name: 'Instagram', username: settings.connectedInstagramName, isAutomationEnabled: settings.instagramAutomationEnabled, color: '#ec4899' })}
                style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onMouseOver={(e) => { e.currentTarget.style.background='#f9fafb'; }}
                onMouseOut={(e) => { e.currentTarget.style.background='#fff'; }}
              ><Sliders size={14} /> Settings</button>
              </div>
            </div>
            )}

            {/* ---- FACEBOOK CARD ---- */}
            {settings.isFacebookConnected && (platformFilter === 'All platforms' || platformFilter === 'Facebook') && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (
            <div className="connection-card" style={{ width: '100%', height: '100%', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Facebook size={22} color="#1877f2" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>Facebook</h4>
                    <span style={{ display: 'inline-block', background: '#10b981', color: '#ffffff', fontSize: '0.65rem', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>connected</span>
                  </div>
                </div>
                <Info size={16} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => notify(`Facebook connected`, 'info')} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>@{settings.connectedFacebookName || 'unknown'}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{settings.lastTestedAt ? new Date(settings.lastTestedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(`https://facebook.com/${settings.connectedFacebookName || settings.facebookPageId || ''}`, '_blank'); }}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background='#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background='#f1f5f9'}
                >
                  Profile
                </button>
              
                            <button onClick={() => setSelectedSettingsPlatform({ id: 'facebook', name: 'Facebook', username: settings.connectedFacebookName, isAutomationEnabled: settings.facebookAutomationEnabled, color: '#1877f2' })}
                style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onMouseOver={(e) => { e.currentTarget.style.background='#f9fafb'; }}
                onMouseOut={(e) => { e.currentTarget.style.background='#fff'; }}
              ><Sliders size={14} /> Settings</button>
              </div>
            </div>
            )}

            {/* ---- YOUTUBE CARD ---- */}
            {settings.isYouTubeConnected && (platformFilter === 'All platforms' || platformFilter === 'YouTube') && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (
            <div className="connection-card" style={{ width: '100%', height: '100%', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Youtube size={22} color="#ff0000" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>YouTube</h4>
                    <span style={{ display: 'inline-block', background: '#10b981', color: '#ffffff', fontSize: '0.65rem', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>connected</span>
                  </div>
                </div>
                <Info size={16} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => notify(`YouTube: Channel ID ${settings.youtubeChannelId || 'N/A'}`, 'info')} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                  {(() => {
                    const name = settings.connectedYouTubeName || settings.youtubeChannelName || 'automation_web';
                    return name.startsWith('@') ? name : '@' + name;
                  })()}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{settings.lastTestedAt ? new Date(settings.lastTestedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%' }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const name = settings.connectedYouTubeName || settings.youtubeChannelName || '';
                    const cleanName = name.startsWith('@') ? name.substring(1) : name;
                    window.open(`https://youtube.com/@${cleanName}`, '_blank');
                  }}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background='#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background='#f1f5f9'}
                >
                  Profile
                </button>
              
                            <button onClick={() => setSelectedSettingsPlatform({ id: 'youtube', name: 'YouTube', username: settings.connectedYouTubeName || settings.youtubeChannelName, isAutomationEnabled: true, color: '#ff0000' })}
                style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onMouseOver={(e) => { e.currentTarget.style.background='#f9fafb'; }}
                onMouseOut={(e) => { e.currentTarget.style.background='#fff'; }}
              ><Sliders size={14} /> Settings</button>
              </div>
            </div>
            )}

            {/* ---- LINKEDIN CARD ---- */}
            {settings.isLinkedInConnected && (platformFilter === 'All platforms' || platformFilter === 'LinkedIn') && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (
            <div className="connection-card" style={{ width: '100%', height: '100%', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Linkedin size={22} color="#0077b5" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>LinkedIn</h4>
                    <span style={{ display: 'inline-block', background: '#10b981', color: '#ffffff', fontSize: '0.65rem', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>connected</span>
                  </div>
                </div>
                <Info size={16} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => notify(`LinkedIn connected`, 'info')} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>@{settings.connectedLinkedInName || 'unknown'}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{settings.lastTestedAt ? new Date(settings.lastTestedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(`https://linkedin.com/in/${settings.connectedLinkedInName || ''}`, '_blank'); }}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background='#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background='#f1f5f9'}
                >
                  Profile
                </button>
              
                            <button onClick={() => setSelectedSettingsPlatform({ id: 'linkedin', name: 'LinkedIn', username: settings.connectedLinkedInName, isAutomationEnabled: true, color: '#0077b5' })}
                style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onMouseOver={(e) => { e.currentTarget.style.background='#f9fafb'; }}
                onMouseOut={(e) => { e.currentTarget.style.background='#fff'; }}
              ><Sliders size={14} /> Settings</button>
              </div>
            </div>
            )}

            {/* ---- TWITTER/X CARD ---- */}
            {settings.isTwitterConnected && (platformFilter === 'All platforms' || platformFilter === 'Twitter/X') && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (
            <div className="connection-card" style={{ width: '100%', height: '100%', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Twitter size={22} color="#0f1419" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>Twitter / X</h4>
                    <span style={{ display: 'inline-block', background: '#10b981', color: '#ffffff', fontSize: '0.65rem', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>connected</span>
                  </div>
                </div>
                <Info size={16} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => notify(`Twitter connected`, 'info')} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>@{settings.connectedTwitterName || 'unknown'}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{settings.lastTestedAt ? new Date(settings.lastTestedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(`https://x.com/${settings.connectedTwitterName || ''}`, '_blank'); }}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background='#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background='#f1f5f9'}
                >
                  Profile
                </button>
              
                            <button onClick={() => setSelectedSettingsPlatform({ id: 'twitter', name: 'Twitter/X', username: settings.connectedTwitterName, isAutomationEnabled: true, color: '#0f1419' })}
                style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onMouseOver={(e) => { e.currentTarget.style.background='#f9fafb'; }}
                onMouseOut={(e) => { e.currentTarget.style.background='#fff'; }}
              ><Sliders size={14} /> Settings</button>
              </div>
            </div>
            )}

            {/* ---- GOOGLE BUSINESS CARD ---- */}
            {settings.isGoogleBusinessConnected && (platformFilter === 'All platforms' || platformFilter === 'Google Business') && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (
            <div className="connection-card" style={{ width: '100%', height: '100%', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={22} color="#3b82f6" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>Google Business</h4>
                    <span style={{ display: 'inline-block', background: '#10b981', color: '#ffffff', fontSize: '0.65rem', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>connected</span>
                  </div>
                </div>
                <Info size={16} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => notify(`Google Business connected`, 'info')} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>@{settings.connectedGoogleBusinessName || 'smart10X'}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{settings.lastTestedAt ? new Date(settings.lastTestedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open('https://business.google.com', '_blank'); }}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background='#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background='#f1f5f9'}
                >
                  Profile
                </button>
              
                            <button onClick={() => setSelectedSettingsPlatform({ id: 'google-business', name: 'Google Business', username: settings.connectedGoogleBusinessName, isAutomationEnabled: true, color: '#3b82f6' })}
                style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onMouseOver={(e) => { e.currentTarget.style.background='#f9fafb'; }}
                onMouseOut={(e) => { e.currentTarget.style.background='#fff'; }}
              ><Sliders size={14} /> Settings</button>
              </div>
            </div>
            )}



            {/* ---- THREADS CARD ---- */}
            {settings.isThreadsConnected && (platformFilter === 'All platforms' || platformFilter === 'Threads') && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (
            <div className="connection-card" style={{ width: '100%', height: '100%', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ThreadsIcon size={22} color="#000000" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>Threads</h4>
                    <span style={{ display: 'inline-block', background: '#10b981', color: '#ffffff', fontSize: '0.65rem', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>connected</span>
                  </div>
                </div>
                <Info size={16} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => notify(`Threads connected`, 'info')} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>@{settings.connectedThreadsName || 'unknown'}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{settings.lastTestedAt ? new Date(settings.lastTestedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(`https://threads.net/@${settings.connectedThreadsName || settings.connectedInstagramName || ''}`, '_blank'); }}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background='#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background='#f1f5f9'}
                >
                  Profile
                </button>
              
                            <button onClick={() => setSelectedSettingsPlatform({ id: 'threads', name: 'Threads', username: settings.connectedThreadsName, isAutomationEnabled: true, color: '#000000' })}
                style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onMouseOver={(e) => { e.currentTarget.style.background='#f9fafb'; }}
                onMouseOut={(e) => { e.currentTarget.style.background='#fff'; }}
              ><Sliders size={14} /> Settings</button>
              </div>
            </div>
            )}

            {/* ---- WHATSAPP CARD ---- */}
            {settings.isWhatsAppConnected && (platformFilter === 'All platforms' || platformFilter === 'WhatsApp') && (statusFilter === 'All statuses' || statusFilter === 'Connected') && (
            <div className="connection-card" style={{ width: '100%', height: '100%', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={22} color="#22c55e" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>WhatsApp</h4>
                    <span style={{ display: 'inline-block', background: '#10b981', color: '#ffffff', fontSize: '0.65rem', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>connected</span>
                  </div>
                </div>
                <Info size={16} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => notify(`WhatsApp connected`, 'info')} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>@{settings.whatsappDisplayName || 'WhatsApp Business'}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{settings.lastTestedAt ? new Date(settings.lastTestedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${settings.whatsappPhoneNumberId || ''}`, '_blank'); }}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background='#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background='#f1f5f9'}
                >
                  Profile
                </button>
              
                            <button onClick={() => setSelectedSettingsPlatform({ id: 'whatsapp', name: 'WhatsApp', username: settings.whatsappDisplayName, isAutomationEnabled: true, color: '#22c55e' })}
                style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onMouseOver={(e) => { e.currentTarget.style.background='#f9fafb'; }}
                onMouseOut={(e) => { e.currentTarget.style.background='#fff'; }}
              ><Sliders size={14} /> Settings</button>
              </div>
            </div>
            )}

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
              Choose a messaging channel to integrate. Instagram, Facebook, WhatsApp, and Threads are available.
            </p>

            {/* Grid of Platforms */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', maxHeight: '380px', overflowY: 'auto', padding: '4px' }}>
              {platformsList.map(platform => (
                <div 
                  key={platform.name}
                  onClick={() => {
                    if (platform.enabled) {
                      setShowConnectModal(false);
                      triggerConnect(platform.name);
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

            {/* PLATFORMSETTINGS MODAL */}
      {selectedSettingsPlatform && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ 
            background: '#f8fafc', borderRadius: '16px', width: '100%', maxWidth: '580px', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0', position: 'relative', margin: '20px',
            overflow: 'hidden', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '24px', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => setSelectedSettingsPlatform(null)}
                style={{ position: 'absolute', top: '24px', right: '24px', background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#e2e8f0'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = '#f1f5f9'; }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${selectedSettingsPlatform.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={20} color={selectedSettingsPlatform.color} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{selectedSettingsPlatform.name} settings</h2>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, paddingLeft: '52px' }}>Manage your {selectedSettingsPlatform.name} account connection and messaging preferences.</p>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Account Connection Section */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>Account connection</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 20px 0' }}>Your connected {selectedSettingsPlatform.name} account and connection status.</p>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '700' }}>
                      {selectedSettingsPlatform.username ? selectedSettingsPlatform.username.substring(0, 2).toUpperCase() : 'UI'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>Connected account</div>
                      {selectedSettingsPlatform.id === 'google-business' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <input 
                            type="text" 
                            value={selectedSettingsPlatform.username || ''}
                            onChange={(e) => setSelectedSettingsPlatform({ ...selectedSettingsPlatform, username: e.target.value })}
                            placeholder="e.g. smart10X"
                            style={{ 
                              padding: '6px 10px', 
                              borderRadius: '6px', 
                              border: '1px solid #cbd5e1',
                              fontSize: '0.9rem',
                              outline: 'none',
                              width: '160px'
                            }}
                          />
                          <button 
                            onClick={async () => {
                              const updated = { ...settings, connectedGoogleBusinessName: selectedSettingsPlatform.username };
                              setSettings(updated);
                              await handleSaveSettings(null, updated, 'google-business');
                              setSelectedSettingsPlatform(null);
                            }}
                            style={{ 
                              padding: '6px 12px', 
                              background: '#3b82f6', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                          {selectedSettingsPlatform.username && !selectedSettingsPlatform.username.startsWith('@') ? '@' : ''}{selectedSettingsPlatform.username || 'unknown'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      triggerConnect(selectedSettingsPlatform.id);
                      setSelectedSettingsPlatform(null);
                    }}
                    style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 16px', color: '#334155', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  >
                    <Activity size={16} /> Refresh permissions
                  </button>
                </div>
              </div>

              {/* Automation Channel Section */}
              {['instagram', 'facebook', 'whatsapp'].includes(selectedSettingsPlatform.id) && (
                <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>{selectedSettingsPlatform.name} channel</h3>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                      {selectedSettingsPlatform.isAutomationEnabled ? 'Channel is active and receiving messages' : 'Channel is currently paused'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      background: selectedSettingsPlatform.isAutomationEnabled ? '#dcfce7' : '#f1f5f9', 
                      color: selectedSettingsPlatform.isAutomationEnabled ? '#166534' : '#64748b', 
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' 
                    }}>
                      {selectedSettingsPlatform.isAutomationEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button 
                      onClick={() => {
                        const newVal = !selectedSettingsPlatform.isAutomationEnabled;
                        setSelectedSettingsPlatform({ ...selectedSettingsPlatform, isAutomationEnabled: newVal });
                        handleSaveSettings(null, { ...settings, [`${selectedSettingsPlatform.id}AutomationEnabled`]: newVal }, selectedSettingsPlatform.id);
                      }}
                      style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 16px', color: '#334155', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'white', e.currentTarget.style.borderColor = '#bd5e1'; }}
                    >
                      <Sliders size={16} /> {selectedSettingsPlatform.isAutomationEnabled ? 'Disable channel' : 'Enable channel'}
                    </button>
                  </div>
                </div>
              )}

              {/* Remove Account Section */}
              <div style={{ background: '#fff1f2', borderRadius: '12px', padding: '20px', border: '1px solid #fecdd3', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ paddingRight: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#9f1239', margin: '0 0 6px 0' }}>Remove {selectedSettingsPlatform.name} account</h3>
                  <p style={{ color: '#be123c', fontSize: '0.85rem', margin: 0, lineHeight: '1.4' }}>
                    This will disconnect your {selectedSettingsPlatform.name} account and remove all associated data. This action cannot be undone.
                  </p>
                </div>
                <button 
                  onClick={() => handleRemoveAccount(selectedSettingsPlatform.id)}
                  style={{ background: 'white', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 16px', color: '#e11d48', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'white', e.currentTarget.style.borderColor = '#fecaca'; }}
                >
                  <Trash2 size={16} /> Remove account
                </button>
              </div>

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

        /* Premium Mobile Responsiveness Queries */
        @media (max-width: 640px) {
          .settings-header {
            flex-direction: column;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .settings-header-btn {
            width: 100%;
            justify-content: center;
            padding: 12px 18px !important;
            font-size: 0.95rem !important;
          }
          .settings-filters {
            width: 100%;
            justify-content: space-between !important;
            gap: 12px !important;
            padding: 12px 0 !important;
          }
          .settings-filters-group {
            width: 100%;
            display: flex !important;
            flex-direction: row !important; /* side by side */
            gap: 10px !important;
            align-items: center !important;
          }
          .settings-filters-group > div {
            flex: 1;
            width: 100%;
          }
          .settings-filters-group button {
            width: 100%;
            justify-content: space-between;
            padding: 10px 14px !important;
            font-size: 0.85rem !important;
          }
          .connection-card-grid {
            justify-content: center !important;
          }
          .connection-card {
            width: 100% !important;
            max-width: 100% !important;
          }
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
