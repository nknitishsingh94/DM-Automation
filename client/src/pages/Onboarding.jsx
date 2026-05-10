import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle, Plus, Info, MessageSquare, Zap, Globe, Layout, RefreshCw, Instagram, Facebook, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';

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
  const { notify } = useNotification();
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
        <div className="onboarding-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '20px', fontFamily: "'Outfit', sans-serif" }}>
          <div className="onboarding-card" style={{ maxWidth: '440px', width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '32px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', animation: 'onboardingFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800', marginBottom: '24px', gap: '6px', alignItems: 'center', textTransform: 'uppercase' }}>
              <CheckCircle size={16} /> Connection Successful
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '12px', letterSpacing: '-0.5px' }}>
              You're Ready!
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '32px' }}>
              Your Instagram is now connected. You can start creating automations immediately.
            </p>

            <div style={{ padding: '20px', background: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: '20px', marginBottom: '32px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={24} color="#10b981" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1b4b', margin: 0 }}>Account Linked</h4>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '2px 0 0 0', fontWeight: '600' }}>@{connectedName}</p>
                </div>
              </div>
            </div>

            <button onClick={handleCompleteSetup} style={{ width: '100%', padding: '18px', borderRadius: '18px', fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', color: 'white', boxShadow: '0 10px 25px rgba(124, 58, 237, 0.3)', transition: 'all 0.3s' }}>
              Go to Dashboard <ArrowRight size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="onboarding-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '20px', fontFamily: "'Outfit', sans-serif" }}>
          <div className="onboarding-card" style={{ maxWidth: '440px', width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '32px', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', animation: 'onboardingFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            
            {/* Error Message */}
            {linkingError && (
              <div style={{ padding: '16px', background: '#fef2f2', border: '1.5px solid #fee2e2', borderRadius: '16px', marginBottom: '24px', color: '#dc2626', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={18} />
                <div style={{ flex: 1, fontWeight: '600' }}>{linkingError}</div>
                <button onClick={fetchPages} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' }}>Retry</button>
              </div>
            )}

            {availablePages === null ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Quick Setup
                </div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '16px', lineHeight: '1.1', letterSpacing: '-1px' }}>
                  Let's <span style={{ color: '#7c3aed' }}>Grow!</span>
                </h1>
                <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '32px', fontWeight: '500', lineHeight: '1.6' }}>
                  Connect your Instagram Business account to activate your AI agents.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div 
                    onClick={() => handleConnectMeta('instagram')} 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', 
                      background: '#ffffff', border: '2px solid #f1f5f9', borderRadius: '24px',
                      cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = '#f5f3ff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.background = '#ffffff'; }}
                  >
                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, boxShadow: '0 8px 16px rgba(236, 72, 153, 0.25)' }}>
                      <Instagram size={28} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e1b4b', margin: 0 }}>Instagram</h4>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0 0', fontWeight: '500' }}>Tap to connect profile</p>
                    </div>
                    <ArrowRight size={20} style={{ marginLeft: 'auto', color: '#cbd5e1' }} />
                  </div>
                </div>
                
                <div style={{ marginTop: '32px', padding: '16px', background: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <Zap size={16} color="#7c3aed" />
                   <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Takes less than 30 seconds</span>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Facebook size={18} />
                   </div>
                   <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e1b4b', margin: 0, letterSpacing: '-0.5px' }}>
                    Select Page
                  </h2>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px', fontWeight: '500' }}>
                  Pick the Facebook Page linked to your Instagram Professional account.
                </p>

                {availablePages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', background: '#fffbeb', border: '1.5px solid #fef3c7', borderRadius: '20px', marginBottom: '24px' }}>
                    <Info size={32} color="#f59e0b" style={{ marginBottom: '12px' }} />
                    <h4 style={{ color: '#92400e', fontWeight: '800', fontSize: '1rem', margin: '0 0 4px 0' }}>No Pages Found</h4>
                    <p style={{ color: '#b45309', fontSize: '0.8rem', margin: 0, fontWeight: '500' }}>
                      Ensure your IG profile is a Professional account linked to a Page.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                    {availablePages.map((page) => (
                      <div key={page.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#ffffff', border: '1.5px solid #f1f5f9', borderRadius: '20px', transition: 'all 0.2s' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e1b4b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{page.name}</h4>
                          {page.linkedInstagram ? (
                            <p style={{ fontSize: '0.75rem', color: '#10b981', margin: '4px 0 0 0', fontWeight: '700' }}>@{page.linkedInstagram.username}</p>
                          ) : (
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0 0', fontWeight: '500' }}>Not linked</p>
                          )}
                        </div>
                        <button 
                          onClick={async () => {
                            if (!page.linkedInstagram) {
                              notify('Link Instagram to this page first!', 'error');
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
                                notify('🎉 Connected successfully!', 'success');
                              }
                            } catch (err) { notify(err.message, 'error'); } finally { setIsLinking(false); }
                          }}
                          disabled={!page.linkedInstagram || isLinking}
                          style={{ padding: '8px 16px', background: page.linkedInstagram ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#f1f5f9', color: page.linkedInstagram ? 'white' : '#cbd5e1', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '0.8rem', cursor: page.linkedInstagram ? 'pointer' : 'not-allowed', marginLeft: '12px', flexShrink: 0 }}
                        >
                          {isLinking ? '...' : 'Select'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={fetchPages} style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', cursor: 'pointer', fontWeight: '800', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem' }}>
                    <RefreshCw size={18} /> Sync Pages
                  </button>
                  <button onClick={() => setAvailablePages(null)} style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: '700', fontSize: '0.85rem' }}>
                    Go Back
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