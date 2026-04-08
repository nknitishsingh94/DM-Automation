import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, UserPlus, Mail, Lock, User, Info, Facebook } from 'lucide-react';
import { useAuth } from '../context/AuthContext';




export default function Signup() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.user, data.token);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Something went wrong. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    /* Initialize Google Login */
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: "172282091381-3djv5rjg2mfdhid2o0i31ujss6hbsemb.apps.googleusercontent.com",
        callback: handleGoogleResponse
      });
      window.google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        { theme: "outline", size: "large", width: "320" }
      );
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
      if (res.ok) {
        login(data.user, data.token);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Google login failed');
      }
    } catch (err) {
      setError('Google Auth failed');
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
      if (res.ok) {
        login(data.user, data.token);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Facebook login failed');
      }
    } catch (err) {
      setError('Facebook Auth failed');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("/landing-bg.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="table-card" style={{ 
        width: '100%', 
        maxWidth: '400px',
        padding: '30px 40px', 
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join the AI DM Automation Platform</p>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '500' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
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
                  transition: 'var(--transition-fast)'
                }}
              />
            </div>
          </div>

          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '500' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
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
                  transition: 'var(--transition-fast)'
                }}
              />
            </div>
          </div>

          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '500' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required
                minLength="6"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: 'white',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  color: 'var(--text-main)',
                  outline: 'none',
                  transition: 'var(--transition-fast)'
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: 'var(--accent-color)',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '10px'
            }}
          >
            <UserPlus size={18} /> {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <div id="googleBtn" style={{ width: '100%' }}></div>

          <button 
            type="button"
            onClick={handleFacebookLogin}
            style={{
              width: '100%',
              maxWidth: '320px',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #1877f2',
              background: 'white',
              color: '#1877f2',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            <Facebook size={20} fill="#1877f2" /> Continue with Facebook
          </button>
        </div>



        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: '600' }}>Log in</Link>
        </div>
      </div>
    </div>
  );
}
