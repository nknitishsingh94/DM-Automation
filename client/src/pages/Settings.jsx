import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Instagram, Facebook, MessageSquare, Key, MapPin, Save, Info, CheckCircle, XCircle, Rocket, Trash2, AlertTriangle, Send, Twitter, Youtube, Linkedin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../App';
import { API_BASE_URL } from '../config';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('instagram');
  const [settings, setSettings] = useState({
    instagramAccessToken: '',
    instagramPageId: '',
    businessAccountId: '',
    isAccountConnected: false,
    
    facebookAccessToken: '',
    facebookPageId: '',
    isFacebookConnected: false,
    
    whatsappToken: '',
    whatsappPhoneNumberId: '',
    isWhatsAppConnected: false,

    telegramToken: '',
    isTelegramConnected: false,
    
    twitterApiKey: '',
    isTwitterConnected: false,
    
    youtubeApiKey: '',
    isYouTubeConnected: false,
    
    linkedinAccessToken: '',
    isLinkedInConnected: false,

    // Automation Toggle States
    instagramAutomationEnabled: true,
    facebookAutomationEnabled: true,
    whatsappAutomationEnabled: true,
    telegramAutomationEnabled: true,
    twitterAutomationEnabled: true,
    youtubeAutomationEnabled: true,
    linkedinAutomationEnabled: true
  });
  
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [whatsappQrUrl, setWhatsappQrUrl] = useState('');
  const [redirectingInsta, setRedirectingInsta] = useState(false);
  const [redirectingFb, setRedirectingFb] = useState(false);

  const { notify } = useNotification();

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
      }, 2500);
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
      } else {
        setSettings(s => ({ ...s, ...data }));
        if (e) {
          setMessage({ type: 'success', text: '✅ Settings saved successfully!' });
          setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error.' });
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
        // Clear all auth state and redirect to landing page
        logout();
        navigate('/');
      } else {
        notify(data.message || "Failed to delete account. Check your password.", "error");
      }
    } catch (err) {
      notify("Network error occurred.", "error");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading configuration...</div>;

  return (
    <div style={{ maxWidth: '1100px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Premium Platform Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '8px', borderRadius: '20px', gap: '8px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
          <button 
            onClick={() => { setActiveTab('instagram'); setMessage({type:'',text:''}); }}
            style={{ 
               display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 28px', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem',
               background: activeTab === 'instagram' ? '#ffffff' : 'transparent',
               color: activeTab === 'instagram' ? '#ec4899' : '#64748b',
               border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
               boxShadow: activeTab === 'instagram' ? '0 4px 12px rgba(236, 72, 153, 0.15)' : 'none'
            }}
          >
            <Instagram size={20} /> Instagram
          </button>
          <button 
            onClick={() => { setActiveTab('facebook'); setMessage({type:'',text:''}); }}
            style={{ 
               display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 28px', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem',
               background: activeTab === 'facebook' ? '#ffffff' : 'transparent',
               color: activeTab === 'facebook' ? '#3b82f6' : '#64748b',
               border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
               boxShadow: activeTab === 'facebook' ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none'
            }}
          >
            <Facebook size={20} /> Facebook
          </button>
          <button 
            onClick={() => { setActiveTab('whatsapp'); setMessage({type:'',text:''}); }}
            style={{ 
               display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 28px', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem',
               background: activeTab === 'whatsapp' ? '#ffffff' : 'transparent',
               color: activeTab === 'whatsapp' ? '#10b981' : '#64748b',
               border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
               boxShadow: activeTab === 'whatsapp' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
            }}
          >
            <MessageSquare size={20} /> WhatsApp
          </button>
          <button 
            onClick={() => { setActiveTab('telegram'); setMessage({type:'',text:''}); }}
            style={{ 
               display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 28px', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem',
               background: activeTab === 'telegram' ? '#ffffff' : 'transparent',
               color: activeTab === 'telegram' ? '#0088cc' : '#64748b',
               border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
               boxShadow: activeTab === 'telegram' ? '0 4px 12px rgba(0, 136, 204, 0.15)' : 'none'
            }}
          >
            <Send size={20} /> Telegram
          </button>
          <button 
            onClick={() => { setActiveTab('twitter'); setMessage({type:'',text:''}); }}
            style={{ 
               display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 28px', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem',
               background: activeTab === 'twitter' ? '#ffffff' : 'transparent',
               color: activeTab === 'twitter' ? '#1da1f2' : '#64748b',
               border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
               boxShadow: activeTab === 'twitter' ? '0 4px 12px rgba(29, 161, 242, 0.15)' : 'none'
            }}
          >
            <Twitter size={20} /> X (Twitter)
          </button>
          <button 
            onClick={() => { setActiveTab('youtube'); setMessage({type:'',text:''}); }}
            style={{ 
               display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 28px', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem',
               background: activeTab === 'youtube' ? '#ffffff' : 'transparent',
               color: activeTab === 'youtube' ? '#ff0000' : '#64748b',
               border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
               boxShadow: activeTab === 'youtube' ? '0 4px 12px rgba(255, 0, 0, 0.15)' : 'none'
            }}
          >
            <Youtube size={20} /> YouTube
          </button>
          <button 
            onClick={() => { setActiveTab('linkedin'); setMessage({type:'',text:''}); }}
            style={{ 
               display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 28px', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem',
               background: activeTab === 'linkedin' ? '#ffffff' : 'transparent',
               color: activeTab === 'linkedin' ? '#0077b5' : '#64748b',
               border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
               boxShadow: activeTab === 'linkedin' ? '0 4px 12px rgba(0, 119, 181, 0.15)' : 'none'
            }}
          >
            <Linkedin size={20} /> LinkedIn
          </button>
        </div>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 12px 40px rgba(0,0,0,0.04)', padding: 'var(--page-padding)', animation: 'fadeIn 0.4s ease-out', overflowX: 'hidden' }}>
        
        {/* INSTAGRAM CONFIG */}
        {activeTab === 'instagram' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)', borderRadius: '12px', color: 'white' }}>
                <Instagram size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Instagram Account Link</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Connect your business account to start AI DM automation.</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                {settings.isAccountConnected ? (
                  <span className="status-badge status-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} /> Connected</span>
                ) : (
                  <span className="status-badge status-pending" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={14} /> Disconnected</span>
                )}
              </div>
            </div>

            {/* Connected State */}
            {settings.isAccountConnected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <CheckCircle size={24} color="#10b981" />
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '1.1rem', color: '#10b981' }}>Successfully Connected</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Account: <strong>{settings.connectedInstagramName || 'Instagram Business'}</strong>
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    ✅ Your Instagram account is linked. Auto-replies and DM campaigns will now work with real messages.
                  </p>
                </div>

                {/* Instagram Automation Toggle */}
                <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>Enable AI Automation</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>If turned off, AI will not respond to Instagram DMs or comments.</p>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings.instagramAutomationEnabled}
                      onChange={(e) => {
                        const newVal = e.target.checked;
                        setSettings(s => ({ ...s, instagramAutomationEnabled: newVal }));
                        // Auto-save on toggle
                        handleSaveSettings(null, { ...settings, instagramAutomationEnabled: newVal });
                      }}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    setSettings({...settings, instagramAccessToken: '', instagramPageId: '', businessAccountId: '', isAccountConnected: false, connectedInstagramName: ''});
                    setMessage({ type: '', text: '' });
                  }}
                  style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <XCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Disconnect Account
                </button>
              </div>
            ) : (
              /* Disconnected State — Show Auth Flow */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* 1-Click Connect Box */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', color: '#1e293b' }}>Fast Connection</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Securely connect your Meta accounts in one click.</p>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      setRedirectingInsta(true);
                      setTimeout(() => {
                        const token = localStorage.getItem('insta_agent_token');
                        window.location.href = `${API_BASE_URL}/api/oauth/facebook?connectType=instagram&token=${token}`;
                      }, 2500);
                    }}
                    disabled={redirectingInsta}
                    style={{ 
                      width: '100%', maxWidth: '300px', background: '#1877F2', color: 'white', border: 'none', borderRadius: '8px', 
                      padding: '14px', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      cursor: 'pointer', margin: '0 auto', boxShadow: '0 4px 14px rgba(24, 119, 242, 0.3)', opacity: redirectingInsta ? 0.7 : 1
                    }}>
                    <Facebook size={20} /> {redirectingInsta ? 'Redirecting to Meta login...' : 'Connect Instagram via Meta'}
                  </button>
                  <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Requires Developer App ID & Secret inside .env
                  </div>
                </div>

                 {/* Meta Diagnostic Box - If FB is connected but IG is not */}
                 {settings.isFacebookConnected && !settings.isAccountConnected && (
                   <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b45309', marginBottom: '12px' }}>
                       <Info size={20} />
                       <h4 style={{ fontWeight: '700', fontSize: '1rem', margin: 0 }}>Almost there! Action required.</h4>
                     </div>
                     <p style={{ color: '#92400e', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '12px' }}>
                       We connected to your Facebook successfully, but we couldn't find an **Instagram Business Account** linked to your pages.
                     </p>
                     <ul style={{ color: '#92400e', fontSize: '0.85rem', lineHeight: '1.8' }}>
                       <li>• Ensure your IG account is set as a <strong>Business Account</strong>.</li>
                       <li>• Link it to your <strong>Facebook Page</strong> in Meta Business Suite.</li>
                       <li>• When connecting, select <strong>"All Pages"</strong> in the Meta popup.</li>
                     </ul>
                   </div>
                 )}
              </div>
            )}
          </>
        )}

        {/* FACEBOOK CONFIG */}
        {activeTab === 'facebook' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', background: '#1877f2', borderRadius: '12px', color: 'white' }}>
                <Facebook size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Facebook Page Link</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Automate Messenger replies for your Facebook Page.</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                {settings.isFacebookConnected ? (
                  <span className="status-badge status-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} /> Connected</span>
                ) : (
                  <span className="status-badge status-pending" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={14} /> Disconnected</span>
                )}
              </div>
            </div>

            {settings.isFacebookConnected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <CheckCircle size={24} color="#3b82f6" />
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '1.1rem', color: '#3b82f6' }}>Successfully Connected</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Page: <strong>{settings.connectedFacebookName || 'Facebook Page'}</strong>
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    ✅ Your Facebook Page is linked. Messenger auto-replies are now active.
                  </p>
                </div>

                {/* Facebook Automation Toggle */}
                <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>Enable AI Automation</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>If turned off, AI will not respond to Facebook Messenger messages.</p>
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
                  type="button"
                  onClick={() => {
                    setSettings({...settings, facebookAccessToken: '', facebookPageId: '', isFacebookConnected: false, connectedFacebookName: ''});
                    setMessage({ type: '', text: '' });
                  }}
                  style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <XCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Disconnect Page
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* 1-Click Connect Box */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', color: '#1e293b' }}>Fast Connection</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Securely connect your Meta accounts in one click.</p>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      setRedirectingFb(true);
                      setTimeout(() => {
                        const token = localStorage.getItem('insta_agent_token');
                        window.location.href = `${API_BASE_URL}/api/oauth/facebook?connectType=facebook&token=${token}`;
                      }, 2500);
                    }}
                    disabled={redirectingFb}
                    style={{ 
                      width: '100%', maxWidth: '300px', background: '#1877F2', color: 'white', border: 'none', borderRadius: '8px', 
                      padding: '14px', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      cursor: 'pointer', margin: '0 auto', boxShadow: '0 4px 14px rgba(24, 119, 242, 0.3)', opacity: redirectingFb ? 0.7 : 1
                    }}>
                    <Facebook size={20} /> {redirectingFb ? 'Redirecting to Meta login...' : 'Connect Facebook via Meta'}
                  </button>
                  <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Requires Developer App ID & Secret inside .env
                  </div>
                </div>

              </div>
            )}
          </>
        )}

        {/* WHATSAPP CONFIG */}
        {activeTab === 'whatsapp' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', background: '#25D366', borderRadius: '12px', color: 'white' }}>
                <MessageSquare size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>WhatsApp Business Link</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Connect WhatsApp Cloud API to automate messages.</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                {settings.isWhatsAppConnected ? (
                  <span className="status-badge status-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} /> Connected</span>
                ) : (
                  <span className="status-badge status-pending" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={14} /> Disconnected</span>
                )}
              </div>
            </div>

            {settings.isWhatsAppConnected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '20px', background: 'rgba(37, 211, 102, 0.08)', border: '1px solid rgba(37, 211, 102, 0.2)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <MessageSquare size={24} color="#25D366" />
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '1.1rem', color: '#25D366' }}>Successfully Connected</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Connected: <strong>{settings.connectedWhatsAppName || 'WhatsApp Business'}</strong>
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    ✅ Your WhatsApp Business account is linked and ready for automation.
                  </p>
                </div>

                {/* WhatsApp Automation Toggle */}
                <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>Enable AI Automation</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>If turned off, AI will not respond to WhatsApp messages.</p>
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
                  type="button"
                  onClick={() => {
                    setSettings({...settings, whatsappToken: '', whatsappPhoneNumberId: '', isWhatsAppConnected: false, connectedWhatsAppName: ''});
                    setMessage({ type: '', text: '' });
                  }}
                  style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <XCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Disconnect WhatsApp
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', gap: '32px', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
                  {/* Left Section: Instructions & Real Fields */}
                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Connect WhatsApp Account</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                      Choose either the fast simulation mode or enter your real <strong>Meta WhatsApp Cloud API</strong> credentials below.
                    </p>

                    {/* Manual Settings Entry */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', color: '#1e293b' }}>Connect via Real Cloud API Credentials</p>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>WhatsApp Access Token</label>
                        <input 
                          type="text" 
                          placeholder="E.g. EAAB..." 
                          value={settings.whatsappToken || ''} 
                          onChange={(e) => setSettings({ ...settings, whatsappToken: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>WhatsApp Phone Number ID</label>
                        <input 
                          type="text" 
                          placeholder="E.g. 10452391238410" 
                          value={settings.whatsappPhoneNumberId || ''} 
                          onChange={(e) => setSettings({ ...settings, whatsappPhoneNumberId: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={handleSaveSettings}
                        style={{ marginTop: '4px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 18px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Save size={16} /> Save Real Credentials
                      </button>
                    </div>
                    
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                      <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Or Link instantly via Simulation Mode</p>
                      <button 
                        type="button"
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('insta_agent_token');
                            const res = await fetch(`${API_BASE_URL}/api/settings/whatsapp/connect-qr`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setSettings(s => ({ ...s, ...data }));
                              setMessage({ type: 'success', text: 'WhatsApp device scanned and linked successfully via simulation!' });
                            }
                          } catch (e) {
                            setMessage({ type: 'error', text: 'Connection failed.' });
                          }
                        }}
                        style={{ 
                          background: '#25D366', color: 'white', border: 'none', borderRadius: '12px', 
                          padding: '14px 24px', fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                          cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)', transition: 'all 0.2s', width: '100%'
                        }}>
                        <MessageSquare size={18} /> Instant Connect (Simulation)
                      </button>
                    </div>
                  </div>

                  {/* Right Section: Visual QR Code Simulation */}
                  <div style={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '24px', boxSizing: 'border-box' }}>
                    <div style={{ padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'inline-flex', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', minHeight: '172px', minWidth: '172px', alignItems: 'center', justifyContent: 'center' }}>
                      {whatsappQrUrl ? (
                        <img src={whatsappQrUrl} alt="WhatsApp QR Code" style={{ width: '140px', height: '140px', display: 'block' }} />
                      ) : (
                        <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="140" height="140" rx="8" fill="white" />
                          <rect x="10" y="10" width="30" height="30" rx="2" fill="#1e293b" />
                          <rect x="15" y="15" width="20" height="20" fill="white" />
                          <rect x="18" y="18" width="14" height="14" fill="#25D366" />

                          <rect x="100" y="10" width="30" height="30" rx="2" fill="#1e293b" />
                          <rect x="105" y="15" width="20" height="20" fill="white" />
                          <rect x="108" y="18" width="14" height="14" fill="#25D366" />

                          <rect x="10" y="100" width="30" height="30" rx="2" fill="#1e293b" />
                          <rect x="15" y="105" width="20" height="20" fill="white" />
                          <rect x="18" y="18" width="14" height="14" fill="#25D366" />

                          <rect x="50" y="50" width="40" height="40" rx="4" fill="#1e293b" />
                          <rect x="55" y="55" width="30" height="30" rx="2" fill="white" />
                          <path d="M70 60C64.48 60 60 64.48 60 70C60 72.11 60.65 74.07 61.76 75.71L60 81L65.41 79.2C66.82 79.97 68.42 80.4 70.08 80.4C75.6 80.4 80.08 75.92 80.08 70.4C80.08 64.66 75.52 60 70 60Z" fill="#25D366" />
                        </svg>
                      )}
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '12px', fontWeight: '600', letterSpacing: '0.2px' }}>Waiting for scan...</p>
                  </div>
                </div>

                {/* WhatsApp Diagnostic Box - If FB is connected but WA is not */}
                {settings.isFacebookConnected && !settings.isWhatsAppConnected && (
                   <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', marginBottom: '16px' }}>
                       <Info size={24} className="text-secondary" />
                       <h4 style={{ fontWeight: '800', fontSize: '1.2rem', margin: 0 }}>WhatsApp Connection Check</h4>
                     </div>
                     
                     {settings.whatsappError && settings.whatsappError.includes('ACTION REQUIRED') ? (
                       <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid #ef4444', borderRadius: '12px', marginBottom: '16px' }}>
                          <p style={{ color: '#ef4444', fontWeight: '800', fontSize: '1rem', marginBottom: '8px' }}>🚨 Action Needed on Meta Portal</p>
                          <p style={{ color: '#b91c1c', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '12px' }}>{settings.whatsappError}</p>
                          <a 
                            href="https://developers.facebook.com/apps/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ display: 'inline-block', background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none' }}
                          >
                            Go to Meta Developer Portal
                          </a>
                       </div>
                     ) : settings.whatsappError ? (
                       <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', marginBottom: '16px' }}>
                          <p style={{ color: '#ef4444', fontWeight: '700', fontSize: '0.95rem', marginBottom: '4px' }}>Scan Result:</p>
                          <p style={{ color: '#ef4444', fontSize: '0.9rem', lineHeight: '1.5' }}>{settings.whatsappError}</p>
                       </div>
                     ) : (
                       <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '16px' }}>
                         Facebook is connected, but we couldn't automatically find a verified WhatsApp Business Number.
                       </p>
                     )}

                     <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                       <p style={{ color: '#1e293b', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Setup Checklist:</p>
                       <ul style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: '1.8', paddingLeft: '20px' }}>
                         <li>✅ **WhatsApp Product**: Ensure it is added in Meta Developer Portal (left menu).</li>
                         <li>✅ **Phone Number**: Number must be verified in Meta Business Suite &gt; WhatsApp Manager.</li>
                         <li>✅ **Business Sync**: Ensure your Facebook Page is linked to your WhatsApp Business Account.</li>
                       </ul>
                     </div>
                   </div>
                )}
              </>
            )}
          </>
        )}

      </div>

        {/* TELEGRAM CONFIG */}
        {activeTab === 'telegram' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', background: '#0088cc', borderRadius: '12px', color: 'white' }}>
                <Send size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Telegram Bot Link</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Connect your Telegram Bot for AI auto-replies.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Bot Token</label>
                <input 
                  type="text" 
                  placeholder="Enter your BotFather token..." 
                  value={settings.telegramToken || ''}
                  onChange={(e) => setSettings({...settings, telegramToken: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
                />
              </div>

              <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Enable Telegram AI</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>Allow AI to respond to bot messages.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={settings.telegramAutomationEnabled}
                    onChange={(e) => {
                      const newVal = e.target.checked;
                      setSettings(s => ({ ...s, telegramAutomationEnabled: newVal }));
                      handleSaveSettings(null, { ...settings, telegramAutomationEnabled: newVal });
                    }}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              
              <SaveButton savingSettings={savingSettings} message={message} onClick={handleSaveSettings} />
            </div>
          </>
        )}

        {/* TWITTER CONFIG */}
        {activeTab === 'twitter' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', background: '#1da1f2', borderRadius: '12px', color: 'white' }}>
                <Twitter size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>X (Twitter) Automation</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage your X account automation using API v2.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>API Key / Access Token</label>
                <input 
                  type="password" 
                  placeholder="Enter your X API token..." 
                  value={settings.twitterApiKey || ''}
                  onChange={(e) => setSettings({...settings, twitterApiKey: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
                />
              </div>

              <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Enable X Automation</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>Automate tweets or DM replies.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={settings.twitterAutomationEnabled}
                    onChange={(e) => {
                      const newVal = e.target.checked;
                      setSettings(s => ({ ...s, twitterAutomationEnabled: newVal }));
                      handleSaveSettings(null, { ...settings, twitterAutomationEnabled: newVal });
                    }}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              
              <SaveButton savingSettings={savingSettings} message={message} onClick={handleSaveSettings} />
            </div>
          </>
        )}

        {/* YOUTUBE CONFIG */}
        {activeTab === 'youtube' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', background: '#ff0000', borderRadius: '12px', color: 'white' }}>
                <Youtube size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>YouTube Comment Guard</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Auto-reply to comments on your YouTube videos.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Google/YouTube API Key</label>
                <input 
                  type="password" 
                  placeholder="Enter your Google Cloud Console Key..." 
                  value={settings.youtubeApiKey || ''}
                  onChange={(e) => setSettings({...settings, youtubeApiKey: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
                />
              </div>

              <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Enable Comment Guard</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>AI will reply to new comments automatically.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={settings.youtubeAutomationEnabled}
                    onChange={(e) => {
                      const newVal = e.target.checked;
                      setSettings(s => ({ ...s, youtubeAutomationEnabled: newVal }));
                      handleSaveSettings(null, { ...settings, youtubeAutomationEnabled: newVal });
                    }}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              
              <SaveButton savingSettings={savingSettings} message={message} onClick={handleSaveSettings} />
            </div>
          </>
        )}

        {/* LINKEDIN CONFIG */}
        {activeTab === 'linkedin' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', background: '#0077b5', borderRadius: '12px', color: 'white' }}>
                <Linkedin size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>LinkedIn Profile Sync</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Automate engagement and messages on LinkedIn.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>LinkedIn Access Token</label>
                <input 
                  type="password" 
                  placeholder="Enter your LinkedIn Developer Token..." 
                  value={settings.linkedinAccessToken || ''}
                  onChange={(e) => setSettings({...settings, linkedinAccessToken: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} 
                />
              </div>

              <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Enable LinkedIn AI</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>Automate responses on LinkedIn posts.</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={settings.linkedinAutomationEnabled}
                    onChange={(e) => {
                      const newVal = e.target.checked;
                      setSettings(s => ({ ...s, linkedinAutomationEnabled: newVal }));
                      handleSaveSettings(null, { ...settings, linkedinAutomationEnabled: newVal });
                    }}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              
              <SaveButton savingSettings={savingSettings} message={message} onClick={handleSaveSettings} />
            </div>
          </>
        )}

      {/* DANGER ZONE - Permanent Account Deletion */}
      <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '24px', padding: '32px', marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#be123c', marginBottom: '16px' }}>
          <AlertTriangle size={24} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Danger Zone</h3>
        </div>
        
        <p style={{ color: '#9f1239', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px', maxWidth: '700px' }}>
          Once you delete your account, there is no going back. All your campaigns, messages, contacts, and connected Meta tokens will be removed from our database permanently.
        </p>

        {!showDeleteConfirm ? (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: '#e11d48', color: 'white', 
              border: 'none', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.2)'
            }}>
            <Trash2 size={18} /> Delete Account Permanently
          </button>
        ) : (
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '2px solid #e11d48', animation: 'shake 0.4s ease-in-out' }}>
            <p style={{ fontWeight: '800', color: '#1e293b', marginBottom: '8px', fontSize: '1.1rem' }}>Are you absolutely sure?</p>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>This action is irreversible. All your data will be wiped.</p>
            


            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{ 
                  flex: 1, padding: '14px', borderRadius: '10px', background: '#e11d48', color: 'white', border: 'none', 
                  fontWeight: '800', cursor: 'pointer', opacity: deleting ? 0.7 : 1
                }}>
                {deleting ? 'Deleting Everything...' : 'Yes, Delete My Data'}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{ 
                  flex: 1, padding: '14px', borderRadius: '10px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', 
                  fontWeight: '700', cursor: 'pointer'
                }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #e2e8f0;
          transition: .4s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px; width: 18px;
          left: 4px; bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider { background-color: #7c3aed; }
        input:checked + .slider:before { transform: translateX(24px); }
      `}</style>
    </div>
  );
}

// Extracted Save Button for Code Reuse
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
