import { useEffect, useState } from 'react';
import { ShieldCheck, Instagram, Facebook, MessageSquare, Key, MapPin, Save, Info, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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

  useEffect(() => {
    const token = localStorage.getItem('insta_agent_token');
    fetch(`${API_BASE_URL}/api/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        // Merge fetched data to ensure defaults if missing
        setSettings(s => ({ ...s, ...data }));
        setLoading(false);
      })
      .catch(err => console.error("Error loading settings:", err));
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
      
      {/* Platform Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <button 
          onClick={() => { setActiveTab('instagram'); setMessage({type:'',text:''}); }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: '600',
            background: activeTab === 'instagram' ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
            color: activeTab === 'instagram' ? '#ec4899' : 'var(--text-muted)',
            border: activeTab === 'instagram' ? '1px solid rgba(236, 72, 153, 0.2)' : '1px solid transparent',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <Instagram size={18} /> Instagram
        </button>
        <button 
          onClick={() => { setActiveTab('facebook'); setMessage({type:'',text:''}); }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: '600',
            background: activeTab === 'facebook' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            color: activeTab === 'facebook' ? '#3b82f6' : 'var(--text-muted)',
            border: activeTab === 'facebook' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <Facebook size={18} /> Facebook
        </button>
        <button 
          onClick={() => { setActiveTab('whatsapp'); setMessage({type:'',text:''}); }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: '600',
            background: activeTab === 'whatsapp' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            color: activeTab === 'whatsapp' ? '#10b981' : 'var(--text-muted)',
            border: activeTab === 'whatsapp' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <MessageSquare size={18} /> WhatsApp
        </button>
      </div>

      <div className="table-card" style={{ padding: '32px', animation: 'fadeIn 0.3s ease-out' }}>
        
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
                    onClick={() => alert('Meta OAuth Login Flow will initiate here. Requires App ID.')}
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

                <div style={{ position: 'relative', textAlign: 'center' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: '#e2e8f0', zIndex: 0 }}></div>
                  <span style={{ position: 'relative', background: '#ffffff', padding: '0 16px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', zIndex: 1 }}>OR ENTER MANUALLY</span>
                </div>

                {/* Manual Form Area */}
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>
                    <Key size={14} style={{ marginRight: '6px' }} /> Instagram Access Token
                  </label>
                  <input 
                    type="password" placeholder="EAA..."
                    value={settings.instagramAccessToken || ''}
                    onChange={(e) => setSettings({...settings, instagramAccessToken: e.target.value})}
                    style={{ width: '100%', background: 'white', border: '1px solid var(--border-subtle)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>
                      <MapPin size={14} style={{ marginRight: '6px' }} /> Page ID
                    </label>
                    <input 
                      type="text" placeholder="123456789..."
                      value={settings.instagramPageId || ''}
                      onChange={(e) => setSettings({...settings, instagramPageId: e.target.value})}
                      style={{ width: '100%', background: 'white', border: '1px solid var(--border-subtle)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>
                      <ShieldCheck size={14} style={{ marginRight: '6px' }} /> Business Account ID
                    </label>
                    <input 
                      type="text" placeholder="Optional ID..."
                      value={settings.businessAccountId || ''}
                      onChange={(e) => setSettings({...settings, businessAccountId: e.target.value})}
                      style={{ width: '100%', background: 'white', border: '1px solid var(--border-subtle)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </div>
                </div>
                <SaveButton savingSettings={savingSettings} message={message} />
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
                    <CheckCircle size={24} color="#25D366" />
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '1.1rem', color: '#25D366' }}>Successfully Connected</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Phone: <strong>{settings.connectedWhatsAppName || 'WhatsApp Business'}</strong>
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    ✅ Your WhatsApp Business is linked. Automated messages are now active.
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
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>
                    <Key size={14} style={{ marginRight: '6px' }} /> WhatsApp Access Token
                  </label>
                  <input 
                    type="password" placeholder="EAA..."
                    value={settings.whatsappToken || ''}
                    onChange={(e) => setSettings({...settings, whatsappToken: e.target.value})}
                    style={{ width: '100%', background: 'white', border: '1px solid var(--border-subtle)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>
                    <MapPin size={14} style={{ marginRight: '6px' }} /> Phone Number ID
                  </label>
                  <input 
                    type="text" placeholder="123456789..."
                    value={settings.whatsappPhoneNumberId || ''}
                    onChange={(e) => setSettings({...settings, whatsappPhoneNumberId: e.target.value})}
                    style={{ width: '100%', background: 'white', border: '1px solid var(--border-subtle)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <SaveButton savingSettings={savingSettings} message={message} />
              </form>
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
