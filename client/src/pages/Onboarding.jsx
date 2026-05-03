import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle, Plus, Info, MessageSquare, Zap, Globe, Layout, RefreshCw, Instagram, Facebook } from 'lucide-react';
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
    gap: 16px;
    padding: 18px 28px;
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-sizing: border-box;
    width: 100%;
    max-width: 420px;
  }

  .channel-pill:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.06);
    border-color: #e2e8f0;
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

  useEffect(() => {
    if (user?.name) {
      setIgUsername(user.name.toLowerCase().replace(/\s+/g, '_'));
    } else if (user?.email) {
      setIgUsername(user.email.split('@')[0]);
    }
  }, [user]);

  // Auto-Redirect to Success if OAuth query params are present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_success')) {
      setMetaConnected(true);
      localStorage.setItem('insta_agent_connected', 'true');
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
          if (data.isAccountConnected || data.isFacebookConnected) {
            setMetaConnected(true);
            setConnectedName(data.connectedInstagramName || data.connectedFacebookName || 'Connected Meta Account');
            if (data.connectedInstagramName) {
              setIgUsername(data.connectedInstagramName);
            }
            localStorage.setItem('insta_agent_connected', 'true');
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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
          <div style={{ maxWidth: '480px', width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '28px', padding: '40px', boxShadow: '0 24px 64px rgba(0,0,0,0.06)', animation: 'onboardingFadeIn 0.5s ease-out both', textAlign: 'center' }}>
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
        <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff', fontFamily: "'Inter', sans-serif" }}>
          {/* Left Column */}
          <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px', boxSizing: 'border-box' }}>
            <div style={{ maxWidth: '520px', marginTop: 'auto', marginBottom: 'auto', animation: 'onboardingFadeIn 0.5s ease-out both' }}>
              <h1 style={{ fontSize: '3.4rem', fontWeight: '800', color: '#1e293b', marginBottom: '16px', lineHeight: '1.15', letterSpacing: '-1.5px' }}>
                Let's <span style={{ color: '#7c3aed' }}>Kick Things Off!</span>
              </h1>
              <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '40px', fontWeight: '500', lineHeight: '1.5' }}>
                Start with any channel you like — you can connect more later.
              </p>

              {/* Channel Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div onClick={() => setShowPermissionModal(true)} className="channel-pill">
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Instagram size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Instagram</h4>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>Click to connect Instagram Business account</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta Certification & Certification Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', fontSize: '0.88rem', borderTop: '1px solid #f1f5f9', paddingTop: '24px', marginTop: '32px' }}>
              <div style={{ background: '#f8fafc', padding: '8px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 6C14.71 6 13.1 6.84 12 8.12C10.9 6.84 9.29 6 7.5 6C4.46 6 2 8.46 2 11.5C2 17.5 12 21.5 12 21.5C12 21.5 22 17.5 22 11.5C22 8.46 19.54 6 16.5 6Z" fill="#0064e0"/>
                </svg>
                <div>
                  <p style={{ fontWeight: '700', color: '#1e293b', margin: 0, fontSize: '0.9rem' }}>Meta Tech Provider</p>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>ZenXchat has been certified by Meta as an AI partner</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div style={{ flex: '1 1 50%', background: 'linear-gradient(135deg, #fef2f2 0%, #fffbeb 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <img 
              src="/onboarding-happy-user.png" 
              alt="Onboarding" 
              style={{ maxWidth: '85%', maxHeight: '90%', objectFit: 'contain', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', boxShadow: '0 -24px 80px rgba(0,0,0,0.08)', animation: 'onboardingFadeIn 0.6s ease-out' }} 
            />
          </div>
        </div>
      )}

      {/* INSTAGRAM PERMISSION MODAL */}
      {showPermissionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '32px', maxWidth: '440px', width: '100%', padding: '28px', boxShadow: '0 32px 80px rgba(0,0,0,0.18)', border: '1px solid #f1f5f9', position: 'relative', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            
            {/* Top Ellipsis */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', color: '#64748b', cursor: 'pointer', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>•••</span>
            </div>

            {/* Instagram Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: '"Brush Script MT", cursive, "Grand Hotel", "Great Vibes", sans-serif', fontSize: '2.5rem', fontWeight: 'normal', margin: '0 0 16px 0', color: '#1e293b' }}>Instagram</h2>
              <p style={{ fontSize: '0.88rem', color: '#1e293b', lineHeight: '1.4', margin: '0 0 20px 0', textAlign: 'left' }}>
                <strong>ZenXchat-IG</strong> is requesting access to: <strong><input type="text" value={igUsername} onChange={(e) => setIgUsername(e.target.value)} style={{ display: 'inline', border: 'none', borderBottom: '1px dashed #3b82f6', background: 'transparent', width: '135px', padding: '0 2px', fontSize: '0.92rem', fontWeight: 'bold', color: '#1e293b', outline: 'none' }} /></strong>. If you select <strong>Allow</strong>, ZenXchat-IG will be able to:
              </p>
            </div>

            {/* Permission Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: '500' }}>View profile and access media (required)</span>
                <div style={{ width: '36px', height: '22px', background: '#cbd5e1', borderRadius: '11px', position: 'relative', cursor: 'not-allowed', opacity: 0.8 }}>
                  <div style={{ width: '18px', height: '18px', background: '#ffffff', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: '500' }}>Access and manage comments</span>
                <div onClick={() => setAllowComments(!allowComments)} style={{ width: '36px', height: '22px', background: allowComments ? '#000000' : '#cbd5e1', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ width: '18px', height: '18px', background: '#ffffff', borderRadius: '50%', position: 'absolute', top: '2px', left: allowComments ? 'auto' : '2px', right: allowComments ? '2px' : 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'all 0.2s' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: '500' }}>Access and manage messages</span>
                <div onClick={() => setAllowMessages(!allowMessages)} style={{ width: '36px', height: '22px', background: allowMessages ? '#000000' : '#cbd5e1', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ width: '18px', height: '18px', background: '#ffffff', borderRadius: '50%', position: 'absolute', top: '2px', left: allowMessages ? 'auto' : '2px', right: allowMessages ? '2px' : 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'all 0.2s' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: '500' }}>Access and publish content</span>
                <div onClick={() => setAllowContent(!allowContent)} style={{ width: '36px', height: '22px', background: allowContent ? '#000000' : '#cbd5e1', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ width: '18px', height: '18px', background: '#ffffff', borderRadius: '50%', position: 'absolute', top: '2px', left: allowContent ? 'auto' : '2px', right: allowContent ? '2px' : 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'all 0.2s' }} />
                </div>
              </div>
            </div>

            {/* Footer Disclaimer */}
            <p style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: '1.45', textAlign: 'center', marginBottom: '24px', padding: '0 8px' }}>
              By allowing, ZenXchat-IG will receive ongoing access to your information and Instagram will record when ZenXchat-IG accesses it. <span style={{ color: '#0066cc', cursor: 'pointer' }}>Learn More</span> about this sharing and the settings you have. ZenXchat-IG <span style={{ color: '#0066cc', cursor: 'pointer' }}>Privacy Policy</span> and <span style={{ color: '#0066cc', cursor: 'pointer' }}>Terms</span>.
            </p>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('insta_agent_token');
                    await fetch(`${API_BASE_URL}/api/settings`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        isAccountConnected: true,
                        connectedInstagramName: igUsername || 'instagram_user',
                        instagramAccessToken: 'fast_link_token',
                        instagramPageId: 'fast_page_id',
                        businessAccountId: 'fast_biz_id',
                        allowComments,
                        allowMessages,
                        allowContent
                      })
                    });
                    localStorage.setItem('insta_agent_connected', 'true');
                    navigate('/dashboard');
                  } catch (err) {
                    console.error('Fast Connect Error:', err);
                    navigate('/dashboard');
                  }
                }}
                style={{ width: '100%', padding: '14px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)', transition: 'all 0.2s' }}
              >
                Allow
              </button>
              <button 
                onClick={() => setShowPermissionModal(false)}
                style={{ width: '100%', padding: '14px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
