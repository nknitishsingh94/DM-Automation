import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle, Plus, Info, MessageSquare, Zap, Globe, Layout, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const styles = `
  @keyframes onboardingFadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes onboardingPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
    50% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
  }

  .onboarding-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #fafbfd 0%, #f1f5f9 100%);
    font-family: 'Inter', sans-serif;
    padding: 24px;
    box-sizing: border-box;
    width: 100%;
  }

  .onboarding-card {
    max-width: 600px;
    width: 100%;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 28px;
    padding: 40px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.06);
    animation: onboardingFadeIn 0.5s ease-out both;
    position: relative;
    overflow: hidden;
  }

  .step-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f1f5f9;
    color: #64748b;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 24px;
  }

  .step-pill.active {
    background: rgba(139, 92, 246, 0.1);
    color: #7c3aed;
  }

  .onboarding-btn {
    width: 100%;
    padding: 16px;
    border-radius: 14px;
    font-size: 1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
    color: white;
    box-shadow: 0 6px 20px rgba(124, 58, 237, 0.3);
  }

  .onboarding-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(124, 58, 237, 0.45);
  }

  .onboarding-btn.meta {
    background: #1877F2;
    box-shadow: 0 6px 20px rgba(24, 119, 242, 0.3);
  }

  .onboarding-btn.meta:hover {
    box-shadow: 0 10px 24px rgba(24, 119, 242, 0.45);
  }

  .progress-stepper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    position: relative;
  }

  .progress-stepper::before {
    content: '';
    position: absolute;
    top: 16px;
    left: 0; right: 0;
    height: 3px;
    background: #e2e8f0;
    z-index: 0;
  }

  .stepper-progress-fill {
    position: absolute;
    top: 16px;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #7c3aed, #3b82f6);
    z-index: 0;
    transition: width 0.4s ease-out;
  }

  .step-indicator {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #ffffff;
    border: 3px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    color: #64748b;
    position: relative;
    z-index: 1;
    transition: all 0.3s ease-out;
  }

  .step-indicator.active {
    border-color: #7c3aed;
    background: #ffffff;
    color: #7c3aed;
    box-shadow: 0 0 0 6px rgba(124, 58, 237, 0.15);
  }

  .step-indicator.completed {
    background: linear-gradient(135deg, #10b981, #059669);
    border-color: transparent;
    color: #ffffff;
  }
`;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metaConnected, setMetaConnected] = useState(false);
  const [connectedName, setConnectedName] = useState('');

  // Auto-Redirect to Step 3 if OAuth query params are present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_success')) {
      setStep(3);
      setMetaConnected(true);
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
            setStep(3);
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

  const handleNextStep = () => {
    if (step === 1 && !workspaceName.trim()) {
      setWorkspaceName(`${user?.username || 'My'}'s AI workspace`);
    }
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handleConnectMeta = () => {
    const token = localStorage.getItem('insta_agent_token');
    window.location.href = `${API_BASE_URL}/api/oauth/facebook?onboarding=true&token=${token}`;
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
      <div className="onboarding-container">
        <div className="onboarding-card">
          
          {/* Progress Stepper */}
          <div className="progress-stepper">
            <div className="stepper-progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }} />
            <div className={`step-indicator ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <div className={`step-indicator ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              {step > 2 ? '✓' : '2'}
            </div>
            <div className={`step-indicator ${step === 3 ? 'active' : ''}`}>
              3
            </div>
          </div>

          {/* STEP 1: WORKSPACE SETUP */}
          {step === 1 && (
            <div style={{ animation: 'onboardingFadeIn 0.4s ease-out both' }}>
              <span className="step-pill active"><Layout size={14} /> Step 1: Initialize Workspace</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                Let's customize your workspace
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '32px' }}>
                This is where you'll create and view your AI automation workflows. Give it a name that represents your business profile.
              </p>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Workspace Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Agency Automation"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    fontSize: '1.05rem',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 4px rgba(124, 58, 237, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <button className="onboarding-btn" onClick={handleNextStep}>
                Continue Setup <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 2: META CONNECTION */}
          {step === 2 && (
            <div style={{ animation: 'onboardingFadeIn 0.4s ease-out both' }}>
              <span className="step-pill active"><Globe size={14} /> Step 2: Instant Connection</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                Connect your Meta profiles
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '32px' }}>
                Securely link your Instagram Business Account, Facebook Page, or WhatsApp Business without copying any long access tokens manually.
              </p>

              <div style={{ padding: '16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '16px', marginBottom: '28px' }}>
                <ul style={{ color: '#475569', fontSize: '0.88rem', paddingLeft: '18px', margin: 0, lineHeight: '1.8' }}>
                  <li>🔗 Instant automated multi-platform sync</li>
                  <li>✅ Secure 1-Click login directly with Meta</li>
                  <li>💡 Zero manual configurations or code entry</li>
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button className="onboarding-btn meta" onClick={handleConnectMeta}>
                  <Sparkles size={18} /> Link Account via Meta
                </button>
                <button 
                  onClick={handleNextStep}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '8px',
                    textDecoration: 'underline'
                  }}
                >
                  Setup later from settings page
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ALL READY */}
          {step === 3 && (
            <div style={{ animation: 'onboardingFadeIn 0.4s ease-out both', textAlign: 'center' }}>
              <span className="step-pill active" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <CheckCircle size={14} /> Setup Completed
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                You're ready to go!
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '32px' }}>
                Your workspaces and Meta connection are fully customized. You can immediately construct custom AI DM automations or campaign broadcasts.
              </p>

              <div style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', marginBottom: '32px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle size={28} color="#10b981" />
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      Workspace Setup Successful
                    </h4>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                      Auto-linking completed. Account: <strong>{connectedName || 'Linked Profiles'}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <button className="onboarding-btn" onClick={handleCompleteSetup}>
                Explore Dashboard <ArrowRight size={18} />
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
