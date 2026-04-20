import { useEffect, useState } from 'react';
import { ShieldCheck, Instagram, Facebook, MessageSquare, Key, MapPin, Save, Info, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../App';
import { API_BASE_URL } from '../config';

export default function Settings() {
  const { user } = useAuth();
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
    isWhatsAppConnected: false
  });
  
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const { notify } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem('insta_agent_token');
    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setSettings(s => ({ ...s, ...data }));
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
      notify("✅ Meta account(s) connected successfully!", "success");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('oauth_error')) {
      const errorType = params.get('oauth_error');
      let msg = "Facebook/Meta connection failed.";
      if (errorType === 'declined') msg = "Meta connection was declined.";
      if (errorType === 'exchange_failed') msg = "Token exchange failed. Check server logs.";
      
      notify(msg, "error");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...settings, _platform: activeTab })
      });
      const data = await res.json();
      
      if (!res.ok) {
        // Backend returned an error (token validation failed)
        setMessage({ type: 'error', text: data.error || 'Connection failed. Please check your credentials.' });
        // Update connection status to disconnected
        if (activeTab === 'instagram') setSettings(s => ({ ...s, isAccountConnected: false }));
        if (activeTab === 'facebook') setSettings(s => ({ ...s, isFacebookConnected: false }));
        if (activeTab === 'whatsapp') setSettings(s => ({ ...s, isWhatsAppConnected: false }));
      } else {
        // Success — token is valid and connection is verified
        setSettings(s => ({ ...s, ...data }));
        setMessage({ type: 'success', text: '✅ Connection verified and saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Could not reach the server.' });
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading configuration...</div>;

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
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
                      const token = localStorage.getItem('insta_agent_token');
                      window.location.href = `${API_BASE_URL}/api/oauth/facebook?token=${token}`;
                    }}
                    style={{ 
                      width: '100%', maxWidth: '300px', background: '#1877F2', color: 'white', border: 'none', borderRadius: '8px', 
                      padding: '14px', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      cursor: 'pointer', margin: '0 auto', boxShadow: '0 4px 14px rgba(24, 119, 242, 0.3)'
                    }}>
                    <Facebook size={20} /> Continue with Facebook
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

                 <div style={{ position: 'relative', textAlign: 'center' }}>
                   <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: '#e2e8f0', zIndex: 0 }}></div>
                   <span style={{ position: 'relative', background: '#ffffff', padding: '0 16px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', zIndex: 1 }}>OR ENTER MANUALLY</span>
                 </div>

                {/* Manual Form Area */}
                {/* Complete Premium Custom Form */}
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: '#fafafa', padding: '36px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Key size={16} color="#8b5cf6" /> Instagram Access Token
                    </label>
                    <input 
                      type="password" placeholder="e.g. EAAQw..."
                      value={settings.instagramAccessToken || ''}
                      onChange={(e) => setSettings({...settings, instagramAccessToken: e.target.value})}
                      style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', padding: '16px 20px', borderRadius: '14px', color: '#1e293b', fontSize: '1rem', outline: 'none', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                      onFocus={(e) => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#ec4899" /> Page ID
                      </label>
                      <input 
                        type="text" placeholder="123456789..."
                        value={settings.instagramPageId || ''}
                        onChange={(e) => setSettings({...settings, instagramPageId: e.target.value})}
                        style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', padding: '16px 20px', borderRadius: '14px', color: '#1e293b', fontSize: '1rem', outline: 'none', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                        onFocus={(e) => { e.target.style.borderColor = '#ec4899'; e.target.style.boxShadow = '0 0 0 4px rgba(236, 72, 153, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={16} color="#f59e0b" /> Business Account ID
                      </label>
                      <input 
                        type="text" placeholder="Optional ID..."
                        value={settings.businessAccountId || ''}
                        onChange={(e) => setSettings({...settings, businessAccountId: e.target.value})}
                        style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', padding: '16px 20px', borderRadius: '14px', color: '#1e293b', fontSize: '1rem', outline: 'none', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                        onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <SaveButton savingSettings={savingSettings} message={message} />
                  </div>
                </form>
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
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>
                    <Key size={14} style={{ marginRight: '6px' }} /> Facebook Page Access Token
                  </label>
                  <input 
                    type="password" placeholder="EAA..."
                    value={settings.facebookAccessToken || ''}
                    onChange={(e) => setSettings({...settings, facebookAccessToken: e.target.value})}
                    style={{ width: '100%', background: 'white', border: '1px solid var(--border-subtle)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>
                    <MapPin size={14} style={{ marginRight: '6px' }} /> Facebook Page ID
                  </label>
                  <input 
                    type="text" placeholder="123456789..."
                    value={settings.facebookPageId || ''}
                    onChange={(e) => setSettings({...settings, facebookPageId: e.target.value})}
                    style={{ width: '100%', background: 'white', border: '1px solid var(--border-subtle)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <SaveButton savingSettings={savingSettings} message={message} />
              </form>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* 1-Click WhatsApp Connect */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', color: '#1e293b' }}>Fast Connection</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Securely connect your WhatsApp Cloud API in one click.</p>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      const token = localStorage.getItem('insta_agent_token');
                      window.location.href = `${API_BASE_URL}/api/oauth/facebook?token=${token}`;
                    }}
                    style={{ 
                      width: '100%', maxWidth: '300px', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', 
                      padding: '14px', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      cursor: 'pointer', margin: '0 auto', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
                    }}>
                    <MessageSquare size={20} /> Continue with Meta Login
                  </button>
                  <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Requires Developer App ID & WhatsApp Product enabled
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

                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem' }}>
                      <Key size={14} style={{ marginRight: '6px' }} /> WhatsApp Access Token
                    </label>
                    <input 
                      type="password" placeholder="EAA..."
                      value={settings.whatsappToken || ''}
                      onChange={(e) => setSettings({...settings, whatsappToken: e.target.value})}
                      style={{ width: '100%', background: 'white', border: '1px solid var(--border-subtle)', padding: '16px 16px', borderRadius: '14px', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem' }}>
                      <MapPin size={14} style={{ marginRight: '6px' }} /> Phone Number ID
                    </label>
                    <input 
                      type="text" placeholder="123456789..."
                      value={settings.whatsappPhoneNumberId || ''}
                      onChange={(e) => setSettings({...settings, whatsappPhoneNumberId: e.target.value})}
                      style={{ width: '100%', background: 'white', border: '1px solid var(--border-subtle)', padding: '16px 16px', borderRadius: '14px', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>
                  <SaveButton savingSettings={savingSettings} message={message} />
                </form>
              </div>
            )}
          </>
        )}

      </div>

      <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px dashed var(--accent-color)', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-color)' }}>
          <Info size={18} /> How to get your API keys?
        </h3>
        <ul style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>Go to <strong>developers.facebook.com</strong> and create a new App.</li>
          <li>For Facebook/Instagram: Add "Instagram Graph API" and "Messenger API".</li>
          <li>For WhatsApp: Add "WhatsApp Cloud API" to your product list.</li>
          <li>Ensure you generate the respective access tokens with correct permissions.</li>
        </ul>
      </div>
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
