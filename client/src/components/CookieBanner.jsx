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
      // Small delay so page loads first
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
          from { transform: translateY(120%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes cookieSlideDown {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(120%); opacity: 0; }
        }
        .cookie-banner {
          animation: cookieSlideUp 0.45s cubic-bezier(0.4,0,0.2,1) both;
        }
        .cookie-banner.out {
          animation: cookieSlideDown 0.35s cubic-bezier(0.4,0,0.2,1) both;
        }
        .cookie-btn-accept {
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
          color: white;
          border: none;
          padding: 11px 22px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(139,92,246,0.35);
        }
        .cookie-btn-accept:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(139,92,246,0.45); }
        .cookie-btn-reject {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 11px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .cookie-btn-reject:hover { background: #e2e8f0; color: #475569; }
        .cookie-btn-customize {
          background: none;
          color: #8b5cf6;
          border: 1.5px solid #ddd6fe;
          padding: 11px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cookie-btn-customize:hover { background: #f5f3ff; border-color: #8b5cf6; }
        .cookie-toggle {
          width: 40px;
          height: 22px;
          border-radius: 11px;
          position: relative;
          cursor: pointer;
          transition: background 0.3s;
          flex-shrink: 0;
          border: none;
        }
        .cookie-toggle-thumb {
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 3px;
          transition: left 0.3s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        }
      `}</style>

      {/* Overlay (optional dim) */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none', background: 'rgba(0,0,0,0.12)', opacity: visible ? 1 : 0, transition: 'opacity 0.35s' }} />

      {/* Banner */}
      <div
        className={`cookie-banner${animateOut ? ' out' : ''}`}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '780px',
          zIndex: 9999,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)', border: '1px solid rgba(139,92,246,0.12)', overflow: 'hidden' }}>

          {/* Main Banner */}
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              {/* Cookie Icon */}
              <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(217,119,6,0.25)' }}>
                <Cookie size={22} color="white" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
                  We use cookies 🍪
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  smart10X uses cookies to enhance your experience, analyze performance, and deliver personalized content. By clicking "Accept All", you consent to our use of cookies.{' '}
                  <Link to="/cookies" style={{ color: '#8b5cf6', fontWeight: '700', textDecoration: 'none' }}>Cookie Statement</Link>
                  {' · '}
                  <Link to="/privacy" style={{ color: '#8b5cf6', fontWeight: '700', textDecoration: 'none' }}>Privacy Policy</Link>
                </p>
              </div>

              {/* Close */}
              <button onClick={rejectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', borderRadius: '8px', display: 'flex', flexShrink: 0 }}>
                <X size={18} />
              </button>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '18px', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button className="cookie-btn-customize" onClick={() => setShowCustomize(!showCustomize)}>
                Customize <ChevronDown size={14} style={{ transform: showCustomize ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
              </button>
              <button className="cookie-btn-reject" onClick={rejectAll}>Reject All</button>
              <button className="cookie-btn-accept" onClick={acceptAll}>Accept All</button>
            </div>
          </div>

          {/* Customize Panel */}
          {showCustomize && (
            <div style={{ borderTop: '1px solid #f1f5f9', padding: '20px 28px 24px', background: '#fafafa' }}>
              <p style={{ fontSize: '12.5px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>Manage Preferences</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
                {preferences.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 16px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {p.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{p.label}</div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4' }}>{p.desc}</div>
                      </div>
                    </div>
                    {p.locked ? (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', background: '#dcfce7', padding: '3px 10px', borderRadius: '100px', flexShrink: 0, border: '1px solid #bbf7d0' }}>Always On</span>
                    ) : (
                      <button
                        className="cookie-toggle"
                        style={{ background: prefs[p.id] ? '#8b5cf6' : '#cbd5e1' }}
                        onClick={() => setPrefs(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      >
                        <div className="cookie-toggle-thumb" style={{ left: prefs[p.id] ? '21px' : '3px' }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="cookie-btn-reject" onClick={rejectAll}>Reject All</button>
                <button className="cookie-btn-accept" onClick={saveCustom}>Save My Preferences</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
