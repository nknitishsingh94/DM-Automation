import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, UserPlus, Mail, Lock, User, Info, Facebook, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, GOOGLE_CLIENT_ID } from '../config';




const styles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .signup-page-wrapper {
    min-height: 100vh;
    min-height: 100svh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("/landing-bg.png");
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    padding: 20px 0;
    overflow-x: hidden;
    overflow-y: auto;
    width: 100vw;
  }

  .signup-card {
    width: 90%;
    margin: auto;
    max-width: 520px;
    padding: 36px 48px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    animation: fadeIn 0.6s ease-out;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  @media (max-width: 480px) {
    .signup-card {
      padding: 24px 20px;
    }
  }

  #googleBtn {
    width: 100%;
    max-width: 320px;
    display: flex;
    justify-content: center;
    margin: 0 auto;
    min-height: 40px;
  }
`;

export default function Signup() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Removed Gmail-only restriction to allow universal signup

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.user, data.token);
        navigate('/onboarding');
      } else {
        // Look for message or error key from backend
        setError(data.message || data.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error("Signup Error Details:", {
        message: err.message,
        apiUrl: `${API_BASE_URL}/api/auth/signup`,
        stack: err.stack
      });
      setError(`Connection Error: ${err.message}. Backend at ${API_BASE_URL} is either down or misconfigured (CORS).`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (window.google && document.getElementById("googleBtn")) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
            itp_support: true
          });
          
          window.google.accounts.id.renderButton(
            document.getElementById("googleBtn"),
            { theme: "outline", size: "large", width: "320", shape: "rectangular" }
          );
        } catch (err) {
          console.error("Google Init Error:", err);
        }
      }
    };

    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    } else if (window.google) {
      initGoogle();
    }
  }, []);


  const handleGoogleResponse = async (response) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential, mode: 'signup' })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        navigate('/onboarding');
      } else {
        setError(data.message || 'Google login failed');
      }
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError(`Google Auth failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded. Please check your internet or App ID.');
      return;
    }
    window.FB.login((response) => {
      if (response.authResponse) {
        processFacebookLogin(response.authResponse);
      } else {
        setError('Facebook login was cancelled or failed.');
      }
    }, { scope: 'openid,email' });
  };




  const processFacebookLogin = async (authResponse) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: authResponse.accessToken, userId: authResponse.userID, mode: 'signup' })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        navigate('/onboarding');
      } else {
        setError(data.message || 'Facebook login failed');
      }
    } catch (err) {
      console.error("Facebook Auth Error:", err);
      setError(`Facebook Auth failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      <style>{styles}</style>
      <div className="signup-page-wrapper">
        <div className="signup-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join the smart10X Automation Platform</p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#f87171', 
            borderRadius: '8px', 
            fontSize: '0.85rem', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Info size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '500' }}>Full Name</label>
            </div>
            <div style={{ position: 'relative', width: '100%' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: 'white',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  color: 'var(--text-main)',
                  outline: 'none',
                  transition: 'var(--transition-fast)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '500' }}>Email Address</label>
            </div>
            <div style={{ position: 'relative', width: '100%' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="admin@example.com"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: 'white',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  color: 'var(--text-main)',
                  outline: 'none',
                  transition: 'var(--transition-fast)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '500' }}>Password</label>
            </div>
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 5 }} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                minLength="7"
                maxLength="15"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 45px 12px 40px',
                  background: 'white',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '1.15rem',
                  height: '48px',
                  transition: 'var(--transition-fast)',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  zIndex: 10
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: 'var(--accent-color)',
              color: 'white',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              maxWidth: '320px',
              width: '100%',
              margin: '10px auto 0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '10px'
            }}
          >
            <UserPlus size={16} /> {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '10px', width: '100%' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
          <div id="googleBtn" style={{ width: '100%' }}></div>
          <button
            type="button"
            onClick={() => {
              if (window.google) {
                window.google.accounts.id.prompt((notification) => {
                  if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    console.log("One tap not displayed. Rendering default prompt.");
                  }
                });
              } else {
                alert('Google Sign-In is still loading. Please wait a moment or refresh.');
              }
            }}
            style={{
              width: '100%',
              maxWidth: '320px',
              height: '40px',
              borderRadius: '10px',
              border: '1px solid #dadce0',
              background: '#ffffff',
              color: '#3c4043',
              fontWeight: '600',
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(60,64,67,0.3)',
              transition: 'background-color 0.2s, box-shadow 0.2s',
              margin: '0 auto'
            }}
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Sign in with Google (Fallback)
          </button>

          <button 
            type="button"
            onClick={handleFacebookLogin}
            style={{
              width: '100%',
              maxWidth: '320px',
              height: '40px',
              borderRadius: '10px',
              border: 'none',
              background: '#1877f2',
              color: 'white',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(24, 119, 242, 0.12)',
              transition: 'all 0.2s',
              margin: '0 auto'
            }}
          >
            <Facebook size={18} fill="white" color="white" /> Continue with Facebook
          </button>
        </div>



        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: '600' }}>Log in</Link>
        </div>
      </div>
    </div>
    </>
  );
}
