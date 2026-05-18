import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Instagram, Facebook, MessageSquare, Key, MapPin, Save, Info, 
  CheckCircle, XCircle, Rocket, Trash2, AlertTriangle, Send, Twitter, 
  Youtube, Linkedin, ChevronDown, ChevronRight 
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
    whatsappToken: '',
    whatsappPhoneNumberId: '',
    telegramToken: '',
    twitterApiKey: '',
    youtubeApiKey: '',
    linkedinAccessToken: '',
    isAccountConnected: false,
    isFacebookConnected: false,
    isWhatsAppConnected: false,
    isTelegramConnected: false,
    isTwitterConnected: false,
    isYouTubeConnected: false,
    isLinkedInConnected: false,
    instagramAutomationEnabled: true,
    facebookAutomationEnabled: true,
    whatsappAutomationEnabled: true,
    telegramAutomationEnabled: true,
    twitterAutomationEnabled: true,
    youtubeAutomationEnabled: true,
    linkedinAutomationEnabled: true
  });
  
  const [activeTab, setActiveTab] = useState('instagram'); 
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [whatsappQrUrl, setWhatsappQrUrl] = useState('');
  const [redirectingInsta, setRedirectingInsta] = useState(false);
  const [redirectingFb, setRedirectingFb] = useState(false);

  const { notify } = useNotification();

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#ec4899', description: 'Automate DMs and Comments', connected: settings.isAccountConnected },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877f2', description: 'Messenger automation for Pages', connected: settings.isFacebookConnected },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: '#25D366', description: 'WhatsApp Business API', connected: settings.isWhatsAppConnected },
    { id: 'telegram', name: 'Telegram', icon: Send, color: '#0088cc', description: 'Telegram Bot automation', connected: settings.isTelegramConnected },
    { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: '#1da1f2', description: 'Tweet and DM automation', connected: settings.isTwitterConnected },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#ff0000', description: 'Comment guard for videos', connected: settings.isYouTubeConnected },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0077b5', description: 'Professional profile sync', connected: settings.isLinkedInConnected },
  ];

  useEffect(() => {
    if (activeTab === 'whatsapp' && !settings.isWhatsAppConnected) {
      const token = localStorage.getItem('insta_agent_token');
      fetch(`${API_BASE_URL}/api/config/api-base-url`).then(r => r.json()).catch(() => {}); // optional
      fetch(`${API_BASE_URL}/api/settings/whatsapp/qr`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.qrUrl) setWhatsappQrUrl(data.qrUrl);
      })
      .catch(err => console.error("Error loading QR:", err));
    }
  }, [activeTab, settings.isWhatsAppConnected]);

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
        // Ensure connection flags are derived correctly if missing
        const derivedData = {
          ...data,
          isAccountConnected: data.isAccountConnected || !!data.instagramAccessToken,
          isFacebookConnected: data.isFacebookConnected || !!data.facebookPageId
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
      // Re-load settings explicitly to get the new tokens from DB
      loadSettings();
      notify("🚀 Meta account connected! Taking you to automation setup...", "success");
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // AUTO-REDIRECT after a short delay for better UX
      setTimeout(() => {
        navigate('/campaigns?setup=true');
      }, 5000);
    } else if (params.get('oauth_error')) {
      const errorType = params.get('oauth_error');
      let msg = "Facebook/Meta connection failed.";
      if (errorType === 'declined') msg = "Meta connection was declined.";
      if (errorType === 'exchange_failed') msg = "Token exchange failed. Check server logs.";
      
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
        body: JSON.stringify({ ...payload, _platform: activeTab })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Connection failed.' });
        notify(data.error || 'Connection failed.', 'error');
      } else {
        setSettings(s => ({ ...s, ...data }));
        if (e) {
          setMessage({ type: 'success', text: '✅ Settings saved successfully!' });
          setTimeout(() => setMessage({ type: '', text: '' }), 5000);
          notify('Settings saved successfully!', 'success');
        } else {
          // Null event implies a disconnect or platform switch event triggered in settings
          notify('Account status updated successfully!', 'success');
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b', fontSize: '1.1rem', fontWeight: '600' }}>
      <div className="animate-pulse">Loading smart10X settings...</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '100px', animation: 'fadeIn 0.6s ease-out' }}>
      
      <div style={{ textAlign: 'left', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: '900', background: 'linear-gradient(135deg, #1e293b, #475569)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em', marginBottom: '8px' }}>
          Platform Connections
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.15rem', fontWeight: '500' }}>
          Connect your social accounts to enable AI-powered automation and smart replies.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {platforms.map((platform) => {
          const isOpen = activeTab === platform.id;
          return (
            <div 
              key={platform.id}
              style={{ 
                background: '#ffffff', 
                borderRadius: '24px', 
                border: '1px solid #e2e8f0',
                boxShadow: isOpen ? '0 20px 40px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.02)',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isOpen ? 'scale(1.02)' : 'scale(1)',
                position: 'relative'
              }}
            >
              {/* ACCORDION HEADER */}
              <div 
                onClick={() => setActiveTab(isOpen ? null : platform.id)}
                style={{ 
                  padding: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '24px', 
                  cursor: 'pointer',
                  userSelect: 'none',
                  background: isOpen ? `${platform.color}05` : 'transparent',
                  transition: 'background 0.3s'
                }}
              >
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '18px', 
                  background: `${platform.color}15`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: platform.color,
                  flexShrink: 0,
                  boxShadow: isOpen ? `0 8px 20px ${platform.color}20` : 'none',
                  transition: 'all 0.3s'
                }}>
                  <platform.icon size={30} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>{platform.name}</h3>
                    {platform.connected ? (
                      <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '20px', background: '#dcfce7', color: '#15803d', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={12} /> ACTIVE
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '20px', background: '#f1f5f9', color: '#64748b', fontWeight: '700' }}>
                        NOT CONNECTED
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0, fontWeight: '500' }}>{platform.description}</p>
                </div>

                <div style={{ 
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isOpen ? '#7c3aed' : '#f1f5f9',
                  color: isOpen ? 'white' : '#94a3b8', 
                  transition: 'all 0.3s ease',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ChevronDown size={22} />
                </div>
              </div>

              {/* ACCORDION CONTENT */}
              <div style={{ 
                maxHeight: isOpen ? '2500px' : '0', 
                overflow: 'hidden', 
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                background: '#ffffff'
              }}>
                <div style={{ padding: '0 32px 40px 32px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ paddingTop: '32px' }}>
                    
                    {/* INSTAGRAM CONFIG */}
                    {platform.id === 'instagram' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {settings.isAccountConnected ? (
                          <>
                            <div style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                              <div style={{ width: '56px', height: '56px', background: '#10b981', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <ShieldCheck size={28} />
                              </div>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#065f46' }}>Connected as {settings.connectedInstagramName || 'Instagram Business'}</h4>
                                <p style={{ margin: '4px 0 0 0', color: '#047857', fontSize: '0.9rem', fontWeight: '500' }}>Your AI agent is now monitoring comments and DMs.</p>
                              </div>
                            </div>

                            <div style={{ padding: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>Enable AI Responses</h4>
                                <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>Allow smart10X to automatically reply to customers on this platform.</p>
                              </div>
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

                            <button 
                              onClick={() => {
                                if(window.confirm("Are you sure you want to disconnect Instagram? Automation will stop immediately.")) {
                                  setSettings({...settings, instagramAccessToken: '', instagramPageId: '', businessAccountId: '', isAccountConnected: false});
                                  handleSaveSettings(null, { ...settings, instagramAccessToken: '', instagramPageId: '', businessAccountId: '', isAccountConnected: false });
                                }
                              }}
                              style={{ padding: '14px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', width: 'fit-content' }}
                            >
                              <Trash2 size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Disconnect Instagram Account
                            </button>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                            <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                              <Instagram size={40} color="#ec4899" />
                            </div>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>Link Your Instagram</h3>
                            <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
                              Connect your Facebook Page that is linked to your Instagram Business account to enable AI automation.
                            </p>
                            <button 
                              onClick={() => {
                                setRedirectingInsta(true);
                                window.location.href = `${API_BASE_URL}/api/oauth/facebook?connectType=instagram&token=${localStorage.getItem('insta_agent_token')}`;
                              }}
                              disabled={redirectingInsta}
                              style={{ 
                                background: '#1877F2', color: 'white', padding: '18px 36px', borderRadius: '16px', fontWeight: '800', 
                                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 auto',
                                boxShadow: '0 8px 20px rgba(24, 119, 242, 0.3)', transition: 'all 0.3s'
                              }}
                            >
                              <Facebook size={24} /> {redirectingInsta ? 'Connecting to Meta...' : 'Connect via Facebook'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* FACEBOOK CONFIG */}
                    {platform.id === 'facebook' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {settings.isFacebookConnected ? (
                          <>
                            <div style={{ padding: '24px', background: 'rgba(24, 119, 242, 0.05)', border: '1px solid rgba(24, 119, 242, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                              <div style={{ width: '56px', height: '56px', background: '#1877f2', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <Facebook size={28} />
                              </div>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1e3a8a' }}>Connected to {settings.connectedFacebookName || 'Business Page'}</h4>
                                <p style={{ margin: '4px 0 0 0', color: '#1e40af', fontSize: '0.9rem', fontWeight: '500' }}>Messenger automation is currently active.</p>
                              </div>
                            </div>

                            <div style={{ padding: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>Enable Messenger AI</h4>
                                <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>Allow smart10X to reply to Facebook Messenger inquiries.</p>
                              </div>
                              <label className="switch">
                                <input 
                                  type="checkbox" 
                                  checked={settings.facebookAutomationEnabled}
                                  onChange={(e) => {
                                    const newVal = e.target.checked;
                                    setSettings(s => ({ ...s, facebookAutomationEnabled: newVal }));
                                    handleSaveSettings(null, { ...settings, facebookAutomationEnabled: newVal });
                                  }}
                                />
                                <span className="slider round"></span>
                              </label>
                            </div>

                            <button 
                              onClick={() => {
                                if(window.confirm("Disconnect Facebook Page?")) {
                                  setSettings({...settings, facebookAccessToken: '', facebookPageId: '', isFacebookConnected: false});
                                  handleSaveSettings(null, { ...settings, facebookAccessToken: '', facebookPageId: '', isFacebookConnected: false });
                                }
                              }}
                              style={{ padding: '14px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', width: 'fit-content' }}
                            >
                              Disconnect Facebook Page
                            </button>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                            <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                              <Facebook size={40} color="#1877f2" />
                            </div>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>Sync Facebook Page</h3>
                            <button 
                              onClick={() => {
                                setRedirectingFb(true);
                                window.location.href = `${API_BASE_URL}/api/oauth/facebook?connectType=facebook&token=${localStorage.getItem('insta_agent_token')}`;
                              }}
                              disabled={redirectingFb}
                              style={{ 
                                background: '#1877f2', color: 'white', padding: '18px 36px', borderRadius: '16px', fontWeight: '800', 
                                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 auto',
                                boxShadow: '0 8px 20px rgba(24, 119, 242, 0.3)', transition: 'all 0.3s'
                              }}
                            >
                              <Facebook size={24} /> {redirectingFb ? 'Connecting...' : 'Connect Facebook Page'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* WHATSAPP CONFIG */}
                    {platform.id === 'whatsapp' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {settings.isWhatsAppConnected ? (
                          <>
                             <div style={{ padding: '24px', background: 'rgba(37, 211, 102, 0.05)', border: '1px solid rgba(37, 211, 102, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                               <div style={{ width: '56px', height: '56px', background: '#25D366', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                 <MessageSquare size={28} />
                               </div>
                               <div>
                                 <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#166534' }}>WhatsApp Active</h4>
                                 <p style={{ margin: '4px 0 0 0', color: '#15803d', fontSize: '0.9rem', fontWeight: '500' }}>Phone ID: {settings.whatsappPhoneNumberId}</p>
                               </div>
                             </div>
                             
                             <div style={{ padding: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>WhatsApp AI Automation</h4>
                                  <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>AI will handle customer queries on WhatsApp.</p>
                                </div>
                                <label className="switch">
                                  <input 
                                    type="checkbox" 
                                    checked={settings.whatsappAutomationEnabled}
                                    onChange={(e) => {
                                      const newVal = e.target.checked;
                                      setSettings(s => ({ ...s, whatsappAutomationEnabled: newVal }));
                                      handleSaveSettings(null, { ...settings, whatsappAutomationEnabled: newVal });
                                    }}
                                  />
                                  <span className="slider round"></span>
                                </label>
                             </div>

                             <button 
                               onClick={() => {
                                 if(window.confirm("Disconnect WhatsApp?")) {
                                   setSettings({...settings, whatsappToken: '', whatsappPhoneNumberId: '', isWhatsAppConnected: false});
                                   handleSaveSettings(null, { ...settings, whatsappToken: '', whatsappPhoneNumberId: '', isWhatsAppConnected: false });
                                 }
                               }}
                               style={{ padding: '14px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', width: 'fit-content' }}
                             >
                               Disconnect WhatsApp
                             </button>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                            <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                              <MessageSquare size={40} color="#25D366" />
                            </div>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>WhatsApp Business Setup</h3>
                            <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
                              Integrate with the official Meta WhatsApp Cloud API to automate customer conversations.
                            </p>
                            <button 
                              onClick={() => window.location.href = `${API_BASE_URL}/api/oauth/facebook?connectType=whatsapp&token=${localStorage.getItem('insta_agent_token')}`}
                              style={{ background: '#25D366', color: 'white', padding: '18px 36px', borderRadius: '16px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 auto', boxShadow: '0 8px 20px rgba(37, 211, 102, 0.3)' }}
                            >
                              <MessageSquare size={24} /> Connect WhatsApp Business
                            </button>
                            
                            <div style={{ marginTop: '32px', textAlign: 'left', background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', maxWidth: '600px', margin: '32px auto 0 auto' }}>
                              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px' }}>📋 Setup Checklist</h4>
                              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '0.95rem' }}>
                                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✓</div>
                                  Ensure WhatsApp Product is added in Meta Developer Portal.
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '0.95rem' }}>
                                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✓</div>
                                  Verify phone number in WhatsApp Manager.
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '0.95rem' }}>
                                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✓</div>
                                  Link Facebook Page to your WhatsApp Business Account.
                                </li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* OTHER PLATFORMS */}
                    {(['telegram', 'twitter', 'youtube', 'linkedin'].includes(platform.id)) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                         <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'block', fontSize: '1rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>
                              {platform.id === 'telegram' ? 'BotFather API Token' : 'API Access Key / Token'}
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input 
                                type="password" 
                                placeholder={`Enter your ${platform.name} API credentials...`}
                                value={settings[`${platform.id}Token`] || settings[`${platform.id}ApiKey`] || settings[`${platform.id}AccessToken`] || ''} 
                                onChange={(e) => {
                                  const key = platform.id === 'telegram' ? 'telegramToken' : platform.id === 'twitter' ? 'twitterApiKey' : platform.id === 'youtube' ? 'youtubeApiKey' : 'linkedinAccessToken';
                                  setSettings({...settings, [key]: e.target.value});
                                }} 
                                style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', transition: 'all 0.3s', boxSizing: 'border-box' }} 
                              />
                            </div>
                            <p style={{ marginTop: '12px', color: '#64748b', fontSize: '0.88rem', fontWeight: '500' }}>
                              {platform.id === 'telegram' && "Obtain this from @BotFather on Telegram."}
                              {platform.id === 'twitter' && "Requires X Developer Portal API v2 Access."}
                              {platform.id === 'youtube' && "Requires Google Cloud Console API Key."}
                            </p>
                         </div>
                         
                         <div style={{ padding: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>Enable {platform.name} Automation</h4>
                              <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>AI will handle interactions on this account.</p>
                            </div>
                            <label className="switch">
                              <input 
                                type="checkbox" 
                                checked={settings[`${platform.id}AutomationEnabled`]}
                                onChange={(e) => {
                                  const key = `${platform.id}AutomationEnabled`;
                                  const newVal = e.target.checked;
                                  setSettings(s => ({ ...s, [key]: newVal }));
                                  handleSaveSettings(null, { ...settings, [key]: newVal });
                                }}
                              />
                              <span className="slider round"></span>
                            </label>
                         </div>

                         <SaveButton savingSettings={savingSettings} message={message} onClick={handleSaveSettings} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '32px', padding: '40px', marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#be123c', marginBottom: '20px' }}>
          <AlertTriangle size={32} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>Danger Zone</h3>
        </div>
        
        <p style={{ color: '#9f1239', fontSize: '1rem', lineHeight: '1.7', marginBottom: '32px', fontWeight: '500' }}>
          Deleting your account is permanent and irreversible. All your campaigns, messages, and connected platform tokens will be wiped from our database forever.
        </p>

        {!showDeleteConfirm ? (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            style={{ padding: '16px 32px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(225, 29, 72, 0.2)', transition: 'all 0.2s' }}
          >
            Delete Account Permanently
          </button>
        ) : (
          <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '2px solid #e11d48', animation: 'shake 0.5s ease-in-out' }}>
            <h4 style={{ fontWeight: '900', color: '#1e293b', marginBottom: '12px', fontSize: '1.3rem' }}>Are you absolutely sure?</h4>
            <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '24px' }}>Once deleted, there is no way to recover your data.</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={handleDeleteAccount} disabled={deleting} style={{ flex: 1, background: '#e11d48', color: 'white', padding: '16px', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
                {deleting ? 'Wiping Data...' : 'Yes, Delete Everything'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, background: '#f1f5f9', padding: '16px', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        
        .switch { position: relative; display: inline-block; width: 56px; height: 30px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #e2e8f0; border-radius: 34px; transition: .4s; }
        .slider:before { position: absolute; content: ""; height: 22px; width: 22px; left: 4px; bottom: 4px; background-color: white; border-radius: 50%; transition: .4s; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        input:checked + .slider { background-color: #7c3aed; }
        input:checked + .slider:before { transform: translateX(26px); }
      `}</style>
    </div>
  );
}

function SaveButton({ savingSettings, message }) {
  return (
    <>
      {message.text && (
        <div style={{ 
          padding: '12px', borderRadius: '8px', 
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Info size={16} /> {message.text}
        </div>
      )}
      <button 
        type="submit" 
        disabled={savingSettings}
        style={{
          marginTop: '10px', background: 'var(--accent-color)', color: 'white', padding: '14px', borderRadius: '8px',
          fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          opacity: savingSettings ? 0.7 : 1, transition: 'all 0.2s', border: 'none', cursor: 'pointer'
        }}
      >
        <Save size={18} /> {savingSettings ? 'Saving...' : 'Save Configuration & Connect'}
      </button>
    </>
  );
}
