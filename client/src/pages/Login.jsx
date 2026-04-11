import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Facebook, Mail, Phone, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, GOOGLE_CLIENT_ID } from '../config';

export default function Login() {
  const [authMode, setAuthMode] = useState('phone'); // 'phone' or 'email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpViaWhatsapp, setOtpViaWhatsapp] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authMode === 'phone' && !isOtpSent) {
      handleSendOtp();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: authMode === 'email' ? email : undefined, 
          password: authMode === 'email' ? password : undefined,
          phone: authMode === 'phone' ? phone : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(`Connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = () => {
    setLoading(true);
    // Mocking OTP send
    setTimeout(() => {
      setLoading(false);
      setIsOtpSent(true);
    }, 1500);
  };

  useEffect(() => {
    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large", width: "100%", shape: "rectangular", text: "signin_with" }
        );
      }
    };
    initGoogle();
  }, []);

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
      });
      const data = await res.json();
      if (res.ok) { login(data.user, data.token); navigate('/dashboard'); }
      else { setError(data.message || 'Google login failed'); }
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError(`Google Auth failed: ${err.message}`);
    } finally { setLoading(false); }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded. Please check your internet.');
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
      const res = await fetch(`${API_BASE_URL}/api/auth/facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: authResponse.accessToken, userId: authResponse.userID })
      });
      const data = await res.json();
      if (res.ok) { login(data.user, data.token); navigate('/dashboard'); }
      else { setError(data.message || 'Facebook login failed'); }
    } catch (err) {
      console.error("Facebook Auth Error:", err);
      setError(`Facebook Auth failed: ${err.message}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Column: Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-500">
              Don't have an account? 
              <Link to="/signup" className="ml-1 text-accent font-semibold hover:underline">Sign Up</Link>
            </p>
          </div>

          {/* Social Buttons Section */}
          <div className="space-y-4 mb-8">
            <div id="googleBtn" className="w-full"></div>
            
            <button
              onClick={handleFacebookLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              <Facebook size={20} className="text-[#1877F2] fill-[#1877F2]" />
              <span className="text-gray-700 font-medium">Continue with Facebook</span>
            </button>
          </div>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-red-600"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isOtpSent ? (
              <>
                {authMode === 'phone' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block text-left">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500 text-sm font-medium pr-2 border-r border-gray-200">+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="block w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                        placeholder="98765 43210"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 block text-left">Email Address</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-accent">
                          <Mail size={18} className="text-gray-400" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                          placeholder="admin@example.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 block text-left">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'phone' ? 'email' : 'phone')}
                    className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors flex items-center gap-1.5"
                  >
                    {authMode === 'phone' ? <Mail size={16} /> : <Phone size={16} />}
                    Use {authMode === 'phone' ? 'email' : 'phone'}
                  </button>
                </div>

                {authMode === 'phone' && (
                  <div className="flex items-center gap-3 p-3 bg-green-50/50 rounded-xl border border-green-100">
                    <input
                      type="checkbox"
                      id="whatsapp-otp"
                      checked={otpViaWhatsapp}
                      onChange={(e) => setOtpViaWhatsapp(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent/20"
                    />
                    <label htmlFor="whatsapp-otp" className="text-sm text-gray-600 font-medium cursor-pointer">
                      OTP via WhatsApp
                    </label>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Verify OTP</h3>
                  <p className="text-sm text-gray-500 mt-1">We've sent a code via {otpViaWhatsapp ? 'WhatsApp' : 'SMS'}.</p>
                </div>
                
                <div className="flex justify-between gap-2">
                  <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="block w-full text-center tracking-[0.5em] text-2xl font-bold py-4 border-2 border-accent/20 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none bg-white transition-all"
                    placeholder="••••••"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="w-full text-sm font-semibold text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Change {authMode}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-accent/25 transform transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isOtpSent || authMode === 'email' ? 'Sign In' : 'Send OTP'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-xs text-gray-400 leading-relaxed">
            By proceeding, you agree to our 
            <a href="#" className="mx-1 text-gray-500 font-semibold hover:underline">Terms of Service</a>
            and
            <a href="#" className="mx-1 text-gray-500 font-semibold hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* Right Column: Hero Image Section */}
      <div className="hidden lg:flex w-1/2 relative bg-gray-50 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/signup-hero.png" 
            alt="DM Automate" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/40 to-transparent"></div>
        </div>
        
        {/* Floating Info Card */}
        <div className="relative z-10 max-w-sm p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl text-white">
          <p className="text-xl font-medium leading-relaxed mb-6">
            "Manage your Instagram automation with simplicity and power. DM Automate helps you grow faster."
          </p>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-accent/30 flex items-center justify-center text-[10px] font-bold">
                  U{i}
                </div>
              ))}
            </div>
            <p className="text-white/80 text-sm font-medium">Joined by 2,000+ creators</p>
          </div>
        </div>
      </div>
    </div>
  );
}
