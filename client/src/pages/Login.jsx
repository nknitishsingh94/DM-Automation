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
    setTimeout(() => {
      setLoading(false);
      setIsOtpSent(true);
    }, 1500);
  };

  useEffect(() => {
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
    if (!window.FB) { setError('Facebook SDK not loaded.'); return; }
    window.FB.login((response) => {
      if (response.authResponse) processFacebookLogin(response.authResponse);
      else setError('Facebook login cancelled.');
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
      console.error("Facebook Error:", err);
      setError(`Facebook Auth failed: ${err.message}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: 'url("/landing-bg.png")' }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      </div>

      {/* Auth Card (The "Box") */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 p-8 sm:p-12">
          
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-500 text-sm italic">Welcome back to DM Automate</p>
          </div>

          {/* Social Buttons */}
          <div className="space-y-4 mb-8">
            <div id="googleBtn" className="w-full"></div>
            <button
              onClick={handleFacebookLogin}
              className="w-full h-[40px] flex items-center justify-center gap-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-semibold text-[#1877F2]"
            >
              <Facebook size={20} fill="#1877F2" /> Continue with Facebook
            </button>
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isOtpSent ? (
              <>
                {authMode === 'phone' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-tight ml-1">Phone Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 border-r border-gray-100 pr-2">
                        <span className="text-sm font-bold">+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="block w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                        placeholder="00000 00000"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-tight ml-1">Email Address</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail size={16} className="text-gray-400 group-focus-within:text-accent" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-tight ml-1">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'phone' ? 'email' : 'phone')}
                    className="text-xs font-bold text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                  >
                    {authMode === 'phone' ? 'Use Email instead' : 'Use Phone instead'}
                  </button>
                </div>

                {authMode === 'phone' && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      id="whatsapp-otp-login"
                      checked={otpViaWhatsapp}
                      onChange={(e) => setOtpViaWhatsapp(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent/20 shadow-sm"
                    />
                    <label htmlFor="whatsapp-otp-login" className="text-xs text-gray-600 font-bold select-none cursor-pointer">
                      Get Login Link on WhatsApp
                    </label>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-5 py-2">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 text-accent mb-4 shadow-inner">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 italic">Welcome Back</h3>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Verifying your information</p>
                </div>
                
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full text-center tracking-[0.8em] text-2xl font-black py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl focus:bg-white focus:border-accent focus:border-solid outline-none transition-all"
                  placeholder="000000"
                />
                
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="w-full text-[10px] font-black uppercase text-gray-400 hover:text-accent transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={10} /> Try a different method
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 text-white font-black uppercase tracking-widest py-4 px-6 rounded-xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isOtpSent || authMode === 'email' ? 'Enter Dashboard' : 'Send Access Link'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-[10px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed">
            New to DM Automate? <Link to="/signup" className="text-accent hover:underline">Create Account</Link>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-white/40 font-bold uppercase tracking-tighter">
          Secure, automated, and professional dashboard access.
        </p>
      </div>
    </div>
  );
}
