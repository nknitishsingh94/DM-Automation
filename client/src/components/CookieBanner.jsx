import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, ChevronDown, Shield, BarChart2, Settings, Zap } from 'lucide-react';

const STORAGE_KEY = 'smart10x_cookie_consent';

const preferences = [
  { id: 'necessary', label: 'Strictly Necessary', icon: <Shield size={15} color="#10b981" />, locked: true, desc: 'Required for the platform to function. Cannot be disabled.' },
  { id: 'performance', label: 'Performance & Analytics', icon: <BarChart2 size={15} color="#3b82f6" />, locked: false, desc: 'Help us understand how visitors interact with the platform.' },
  { id: 'functional', label: 'Functional', icon: <Settings size={15} color="#8b5cf6" />, locked: false, desc: 'Remember your preferences and personalise your experience.' },
  { id: 'targeting', label: 'Targeting & Advertising', icon: <Zap size={15} color="#f59e0b" />, locked: false, desc: 'Used to deliver relevant ads and measure their effectiveness.' },
];

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [prefs, setPrefs] = useState({ necessary: true, performance: true, functional: true, targeting: false });
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setTimeout(() => setVisible(true), 1200);
    }
  }, []);

  const dismiss = (accepted) => {
    setAnimateOut(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted, prefs, timestamp: Date.now() }));
      setVisible(false);
      setAnimateOut(false);
    }, 350);
  };

  const acceptAll = () => {
    setPrefs({ necessary: true, performance: true, functional: true, targeting: true });
    dismiss(true);
  };

  const rejectAll = () => {
    setPrefs({ necessary: true, performance: false, functional: false, targeting: false });
    dismiss(false);
  };

  const saveCustom = () => dismiss(true);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes cookieSlideUp {
          from { transform: translate(-50%, 120%); opacity: 0; }
          to   { transform: translate(-50%, 0);    opacity: 1; }
        }
        @keyframes cookieSlideDown {
          from { transform: translate(-50%, 0);    opacity: 1; }
          to   { transform: translate(-50%, 120%); opacity: 0; }
        }
        .cookie-banner {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 450px;
          z-index: 9999;
          font-family: 'Inter', sans-serif;
          animation: cookieSlideUp 0.45s cubic-bezier(0.4,0,0.2,1) both;
        }
        .cookie-banner.out {
          animation: cookieSlideDown 0.35s cubic-bezier(0.4,0,0.2,1) both;
        }
        .cookie-btn-accept {
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
          color: white; border: none; padding: 10px 20px; border-radius: 12px;
          font-weight: 700; font-size: 13px; cursor: pointer; white-space: nowrap;
        }
        .cookie-btn-reject {
          background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0;
          padding: 10px 18px; border-radius: 12px; font-weight: 700; font-size: 13px; cursor: pointer;
        }
        .cookie-btn-customize {
          background: none; color: #8b5cf6; border: 1.5px solid #ddd6fe;
          padding: 10px 18px; border-radius: 12px; font-weight: 700; font-size: 13px; cursor: pointer;
          display: flex; align-items: center; gap: 6px;
        }
        .cookie-toggle {
          width: 36px; height: 20px; border-radius: 10px; position: relative; cursor: pointer; border: none;
        }
        .cookie-toggle-thumb {
          width: 14px; height: 14px; background: white; border-radius: 50%; position: absolute; top: 3px; transition: left 0.3s;
        }
      `}</style>

      <div className={`cookie-banner${animateOut ? ' out' : ''}`}>
        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', border: '1px solid rgba(139,92,246,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Cookie size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Cookies 🍪</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                  We use cookies to improve your experience. <Link to="/cookies" style={{ color: '#8b5cf6', fontWeight: '700' }}>Learn more</Link>
                </p>
              </div>
              <button onClick={rejectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="cookie-btn-customize" onClick={() => setShowCustomize(!showCustomize)}>
                Settings <ChevronDown size={14} style={{ transform: showCustomize ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
              </button>
              <button className="cookie-btn-reject" onClick={rejectAll}>Reject</button>
              <button className="cookie-btn-accept" onClick={acceptAll}>Accept All</button>
            </div>
          </div>

          {showCustomize && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px', background: 'var(--bg-card)', maxHeight: '300px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {preferences.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {p.icon}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700' }}>{p.label}</div>
                      </div>
                    </div>
                    {p.locked ? (
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#10b981' }}>Essential</span>
                    ) : (
                      <button className="cookie-toggle" style={{ background: prefs[p.id] ? '#8b5cf6' : 'var(--border-subtle)' }} onClick={() => setPrefs(prev => ({ ...prev, [p.id]: !prev[p.id] }))}>
                        <div className="cookie-toggle-thumb" style={{ left: prefs[p.id] ? '19px' : '3px' }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button className="cookie-btn-accept" style={{ width: '100%', marginTop: '16px' }} onClick={saveCustom}>Save Settings</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
