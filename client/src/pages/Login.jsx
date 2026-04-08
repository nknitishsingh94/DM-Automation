import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, LogIn, Mail, Lock, Info, Facebook } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  @keyframes loginFloat {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-18px) rotate(1deg); }
    66% { transform: translateY(-8px) rotate(-1deg); }
  }

  @keyframes loginOrb {
    0% { transform: scale(1) translate(0, 0); opacity: 0.4; }
    50% { transform: scale(1.2) translate(30px, -20px); opacity: 0.7; }
    100% { transform: scale(1) translate(0, 0); opacity: 0.4; }
  }

  @keyframes loginFadeIn {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes loginShimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes loginPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
    50%       { box-shadow: 0 0 0 8px rgba(139, 92, 246, 0); }
  }

  .login-page-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), 
                url('/landing-bg.png');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    position: relative;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
  }

  .login-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }

  .login-orb-1 {
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
    top: -200px; right: -150px;
    animation: loginOrb 12s ease-in-out infinite;
  }

  .login-orb-2 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%);
    bottom: -150px; left: -100px;
    animation: loginOrb 16s ease-in-out infinite reverse;
  }

  .login-orb-3 {
    width: 350px; height: 350px;
    background: radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 70%);
    top: 60%; left: 60%;
    animation: loginOrb 20s ease-in-out infinite;
  }

  .login-card {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 760px;
    margin: 24px;
    background: #ffffff;
    border: 1px solid rgba(139, 92, 246, 0.1);
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(139, 92, 246, 0.12), 0 4px 16px rgba(0,0,0,0.06);
    animation: loginFadeIn 0.6s cubic-bezier(0.4,0,0.2,1) both;
    display: flex;
    overflow: hidden;
    min-height: 480px;
  }

  /* LEFT PANEL — form */
  .login-left {
    flex: 1;
    width: 50%;
    padding: 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }


  /* RIGHT PANEL — social */
  .login-right {
    flex: 1;
    width: 50%;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8f7ff;
    border-left: 1px solid rgba(139, 92, 246, 0.15);
    gap: 14px;
  }

  .login-right-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 4px;
    text-align: center;
  }

  .login-right-subtitle {
    font-size: 0.82rem;
    color: #6b7280;
    text-align: center;
    margin-bottom: 8px;
    line-height: 1.5;
  }

  .login-logo-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 28px;
  }

  .login-logo-circle {
    width: 56px; height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, #8b5cf6, #6366f1, #3b82f6);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    box-shadow: 0 6px 20px rgba(139,92,246,0.4);
    animation: loginPulse 3s ease-in-out infinite;
  }

  .login-title {
    font-size: 1.7rem;
    font-weight: 800;
    color: #1a1a1a;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }

  .login-subtitle {
    font-size: 0.86rem;
    color: #65676b;
    font-weight: 500;
  }

  .login-error {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    background: rgba(239,68,68,0.12);
    border: 1px solid rgba(239,68,68,0.25);
    color: #f87171;
    border-radius: 14px;
    font-size: 0.84rem;
    margin-bottom: 22px;
  }

  .login-label {
    display: block;
    margin-bottom: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    color: #4b5563;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  .login-input-wrap {
    position: relative;
    margin-bottom: 18px;
  }

  .login-input-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    pointer-events: none;
  }

  .login-input {
    width: 100%;
    padding: 14px 16px 14px 46px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    color: #1a1a1a;
    font-size: 0.95rem;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border 0.2s, box-shadow 0.2s, background 0.2s;
  }

  .login-input::placeholder { color: #9ca3af; }

  .login-input:focus {
    border-color: rgba(139,92,246,0.6);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
  }

  .login-submit-btn {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 14px;
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 8px;
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%);
    background-size: 200% auto;
    transition: background-position 0.4s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 6px 24px rgba(139,92,246,0.45);
    letter-spacing: 0.3px;
  }

  .login-submit-btn:hover:not(:disabled) {
    background-position: right center;
    transform: translateY(-2px);
    box-shadow: 0 10px 32px rgba(139,92,246,0.6);
  }

  .login-submit-btn:active:not(:disabled) { transform: translateY(0); }

  .login-submit-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .login-divider {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 28px 0;
  }

  .login-divider-line {
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  .login-divider-text {
    font-size: 0.78rem;
    color: #9ca3af;
    font-weight: 500;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .login-social-wrap {
    display: flex;
    flex-direction: column;
    gap: 14px;
    align-items: stretch;
    width: 100%;
  }

  .login-fb-btn {
    width: 100%;
    padding: 13px 20px;
    border-radius: 14px;
    border: 1px solid rgba(24,119,242,0.4);
    background: rgba(24,119,242,0.06);
    color: #1877f2;
    font-weight: 700;
    font-size: 0.93rem;
    font-family: 'Inter', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    transition: background 0.25s, border-color 0.25s, transform 0.2s, box-shadow 0.25s;
    letter-spacing: 0.2px;
  }

  .login-fb-btn:hover {
    background: rgba(24,119,242,0.12);
    border-color: rgba(24,119,242,0.7);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(24,119,242,0.2);
  }

  .login-fb-btn:active { transform: translateY(0); }

  .login-fb-icon-wrap {
    width: 28px; height: 28px;
    border-radius: 7px;
    background: #1877f2;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .login-social-note {
    font-size: 0.78rem;
    color: #9ca3af;
    text-align: center;
    margin-top: 4px;
    line-height: 1.5;
  }

  .login-social-note a {
    color: #8b5cf6;
    font-weight: 600;
    text-decoration: none;
  }

  .login-footer {
    text-align: left;
    margin-top: 24px;
    font-size: 0.86rem;
    color: #6b7280;
  }

  .login-footer a {
    color: #8b5cf6;
    font-weight: 700;
    text-decoration: none;
    transition: color 0.2s;
  }

  .login-footer a:hover { color: #7c3aed; }

  #googleBtn {
    width: 100% !important;
  }

  #googleBtn iframe,
  #googleBtn > div {
    width: 100% !important;
    border-radius: 12px !important;
    overflow: hidden;
  }

  @media (max-width: 640px) {
    .login-card { flex-direction: column; }
    .login-right { width: 100%; border-left: none; border-top: 2px solid rgba(139,92,246,0.1); padding: 32px 28px; }
    .login-left { padding: 36px 28px; }
  }
`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (window.google && document.getElementById("googleBtn")) {
        window.google.accounts.id.initialize({
          client_id: "172282091381-3djv5rjg2mfdhid2o0i31ujss6hbsemb.apps.googleusercontent.com",
          callback: handleGoogleResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large", width: "300", logo_alignment: "center" }
        );
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const intervalId = setInterval(() => {
        if (window.google) {
          clearInterval(intervalId);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(intervalId);
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
      });
      const data = await res.json();
      if (res.ok) { login(data.user, data.token); navigate('/dashboard'); }
      else { setError(data.message || 'Google login failed'); }
    } catch { setError('Google Auth failed'); }
    finally { setLoading(false); }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded. Please check your internet or App ID.');
      return;
    }
    window.FB.login((response) => {
      if (response.authResponse) processFacebookLogin(response.authResponse);
      else setError('Facebook login was cancelled or failed.');
    }, { scope: 'public_profile,email' });
  };

  const processFacebookLogin = async (authResponse) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: authResponse.accessToken, userId: authResponse.userID })
      });
      const data = await res.json();
      if (res.ok) { login(data.user, data.token); navigate('/dashboard'); }
      else { setError(data.message || 'Facebook login failed'); }
    } catch { setError('Facebook Auth failed'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-page-wrapper">
        {/* Animated background orbs */}
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />

        <div className="login-card">

          {/* ── LEFT PANEL: Form ── */}
          <div className="login-left">
            {/* Logo */}
            <div className="login-logo-wrap">
              <h1 className="login-title">Welcome Back</h1>
              <p className="login-subtitle">Sign in to your Auto Chat account</p>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error">
                <Info size={16} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="login-input-wrap">
                <label className="login-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={17} className="login-input-icon" />
                  <input
                    className="login-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div className="login-input-wrap">
                <label className="login-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} className="login-input-icon" />
                  <input
                    className="login-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" className="login-submit-btn" disabled={loading}>
                <LogIn size={18} />
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Footer */}
            <div className="login-footer" style={{ marginTop: '20px' }}>
              Don't have an account?{' '}
              <Link to="/signup">Create one</Link>
            </div>
          </div>


          {/* ── RIGHT PANEL: Social Login ── */}
          <div className="login-right">
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <p className="login-right-title">Quick Sign In</p>
              <p className="login-right-subtitle">Use your Google or Facebook account to sign in instantly</p>
            </div>

            <div className="login-social-wrap">
              {/* Google */}
              <div
                id="googleBtn"
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              />

              {/* Facebook */}
              <button
                type="button"
                className="login-fb-btn"
                onClick={handleFacebookLogin}
              >
                <div className="login-fb-icon-wrap">
                  <Facebook size={16} color="#fff" fill="#fff" />
                </div>
                Continue with Facebook
              </button>
            </div>

            <p className="login-social-note">
              By continuing, you agree to our{' '}
              <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
