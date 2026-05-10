import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle, Plus, Info, MessageSquare, Zap, Globe, Layout, RefreshCw, Instagram, Facebook, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const styles = `
  @keyframes onboardingFadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .channel-pill {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-sizing: border-box;
    width: 100%;
    max-width: 420px;
  }

  .channel-pill:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    border-color: #e2e8f0;
  }

  @media (max-width: 640px) {
    .onboarding-title {
      font-size: 2.2rem !important;
      letter-spacing: -1px !important;
    }
    .onboarding-container {
      padding: 16px !important;
    }
    .onboarding-card {
      padding: 24px !important;
      border-radius: 20px !important;
    }
  }
`;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metaConnected, setMetaConnected] = useState(false);
  const [connectedName, setConnectedName] = useState('');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [igUsername, setIgUsername] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [allowContent, setAllowContent] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1);
  const [modalStep, setModalStep] = useState('login'); // login, business_check, permissions, loading
  const [igPassword, setIgPassword] = useState('');

  // Zorcha State Additions
  const [availablePages, setAvailablePages] = useState(null);
  const [isLinking, setIsLinking] = useState(false);
  const [linkingError, setLinkingError] = useState('');

  useEffect(() => {
    if (user?.name) {
      setIgUsername(user.name.toLowerCase().replace(/\s+/g, '_'));
    } else if (user?.email) {
      setIgUsername(user.email.split('@')[0]);
    }
  }, [user]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setLinkingError(''); // Clear previous errors
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/oauth/facebook/pages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const pagesData = await res.json();
        setAvailablePages(pagesData);
      } else {
        const errData = await res.json();
        setLinkingError(errData.error || 'Failed to fetch your Facebook pages. Please try reconnecting.');
      }
    } catch (err) {
      console.error('Fetch pages error:', err);
      setLinkingError('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-Redirect to Success if OAuth query params are present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_success')) {
      fetchPages();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('insta_agent_token');
        const res = await fetch(`${API_BASE_URL}/api/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // We removed the auto-redirect to /dashboard here
          // so users can always see the connection options if they manually go to /onboarding
          if (data.facebookAccessToken || data.instagramAccessToken) {
            // User linked Meta but hasn't completed page selection
            fetchPages();
          }
        }
      } catch (err) {
        console.error('Onboarding Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleConnectMeta = (connectType = '') => {
    const token = localStorage.getItem('insta_agent_token');
    let url = `${API_BASE_URL}/api/oauth/facebook?onboarding=true&token=${token}`;
    if (connectType) {
      url += `&connectType=${connectType}`;
    }
    window.location.href = url;
  };

  const handleCompleteSetup = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500' }}>Initializing setup wizard...</p>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      
      {metaConnected ? (
        <div className="onboarding-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
          <div className="onboarding-card" style={{ maxWidth: '480px', width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '28px', padding: '40px', boxShadow: '0 24px 64px rgba(0,0,0,0.06)', animation: 'onboardingFadeIn 0.5s ease-out both', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '24px', gap: '6px', alignItems: 'center' }}>
              <CheckCircle size={16} /> Connection Successful
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px' }}>
              You're all set!
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '32px' }}>
              Your workspaces and Meta connection are fully customized. You can immediately build AI DM automations or campaign broadcasts.
            </p>

            <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', marginBottom: '32px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={28} color="#10b981" />
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Workspace Setup Complete
                  </h4>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                    Account connected: <strong>{connectedName || 'Linked Profiles'}</strong>
                  </p>
                </div>
              </div>
            </div>

            <button onClick={handleCompleteSetup} style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)', color: 'white', boxShadow: '0 6px 20px rgba(124, 58, 237, 0.3)', transition: 'all 0.3s' }}>
              Explore Dashboard <ArrowRight size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="onboarding-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
          <div className="onboarding-card" style={{ maxWidth: '600px', width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '28px', padding: '40px', boxShadow: '0 24px 64px rgba(0,0,0,0.06)', animation: 'onboardingFadeIn 0.5s ease-out both' }}>
            
            {/* Error Message */}
            {linkingError && (
              <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '16px', marginBottom: '24px', color: '#dc2626', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={18} />
                <div style={{ flex: 1 }}>{linkingError}</div>
                <button onClick={fetchPages} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer' }}>Retry Sync</button>
              </div>
            )}

            {availablePages === null ? (
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <div style={{ display: 'inline-flex', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Step 1: Connect Channel
                </div>
                <h1 className="onboarding-title" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1e293b', marginBottom: '16px', lineHeight: '1.1', letterSpacing: '-1px' }}>
                  Let's <span style={{ color: '#7c3aed' }}>Get Started</span>
                </h1>
                <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '32px', fontWeight: '500', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto 32px' }}>
                  Connect your Instagram Business account to start automating your growth.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                  <div onClick={() => handleConnectMeta('instagram')} className="channel-pill" style={{ maxWidth: '380px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                      <Instagram size={22} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Connect Instagram</h4>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0' }}>Sync your professional profile</p>
                    </div>
                    <ArrowRight size={18} style={{ marginLeft: 'auto', color: '#cbd5e1' }} />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                  Choose Your Facebook Page
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '32px' }}>
                  Select the Facebook Page you want to link. Ensure your Instagram Professional account is linked to this page.
                </p>

                {availablePages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '16px', marginBottom: '32px' }}>
                    <h4 style={{ color: '#b45309', fontWeight: '700', fontSize: '1rem', margin: '0 0 8px 0' }}>No Facebook Pages Found</h4>
                    <p style={{ color: '#b45309', fontSize: '0.85rem', margin: 0 }}>
                      Please create a Facebook Page first or link your Instagram Professional account.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                    {availablePages.map((page) => (
                      <div key={page.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>{page.name}</h4>
                          {page.linkedInstagram ? (
                            <p style={{ fontSize: '0.85rem', color: '#10b981', margin: '6px 0 0 0', fontWeight: '600' }}>@{page.linkedInstagram.username} linked</p>
                          ) : (
                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '6px 0 0 0' }}>No Instagram linked</p>
                          )}
                        </div>
                        <button 
                          onClick={async () => {
                            if (!page.linkedInstagram) {
                              alert('Link Instagram to this page first!');
                              return;
                            }
                            try {
                              setIsLinking(true);
                              const token = localStorage.getItem('insta_agent_token');
                              const res = await fetch(`${API_BASE_URL}/api/oauth/facebook/select-page`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({
                                  pageId: page.id,
                                  pageAccessToken: page.accessToken,
                                  businessAccountId: page.linkedInstagram.id,
                                  instagramUsername: page.linkedInstagram.username
                                })
                              });
                              if (res.ok) {
                                localStorage.setItem('insta_agent_connected', 'true');
                                setMetaConnected(true);
                                setConnectedName(page.linkedInstagram.username);
                              }
                            } catch (err) { setLinkingError(err.message); } finally { setIsLinking(false); }
                          }}
                          style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          {isLinking ? 'Linking...' : 'Connect'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={fetchPages} style={{ width: '100%', padding: '16px', borderRadius: '14px', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontWeight: '700' }}>
                    <RefreshCw size={18} /> Refresh Account List
                  </button>
                  <button onClick={() => setAvailablePages(null)} style={{ width: '100%', padding: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}