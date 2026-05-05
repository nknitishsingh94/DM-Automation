import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Globe, Zap, CheckCircle2, MessageSquare, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LandingHeader from '../components/LandingHeader';
import Footer from '../components/Footer';

export default function UniversalTriggersFeature() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCTAClick = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/signup?redirect=/select-channel');
    } else {
      navigate('/select-channel');
    }
  };

  return (
    <div className="landing-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse-soft {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        .feature-page-main {
          padding-top: 120px;
          flex: 1;
        }
        @media (max-width: 1024px) {
          .feature-page-main {
            padding-top: 80px;
          }
        }
      `}</style>

      <LandingHeader />

      <main className="feature-page-main">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', fontWeight: '600', marginBottom: '40px', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Features
          </Link>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
            gap: isMobile ? '40px' : '80px',
            alignItems: 'center',
            textAlign: isMobile ? 'center' : 'left'
          }}>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-start' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(14, 165, 233, 0.08)',
                color: '#0ea5e9',
                borderRadius: '50px',
                fontSize: '0.85rem',
                fontWeight: '700',
                marginBottom: '24px'
              }}>
                <Globe size={14} /> smart10X-Intelligence
              </div>

              <h1 style={{
                fontSize: isMobile ? '2.2rem' : '3rem',
                fontWeight: '900',
                lineHeight: '1.1',
                color: '#0f172a',
                marginBottom: '20px',
                letterSpacing: '-1px'
              }}>
                One Keyword. <br />
                <span style={{ color: '#0ea5e9' }}>Every Single Channel.</span>
              </h1>

              <h2 style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>
                Universal Triggers sync your brand across the web.
              </h2>

              <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: '1.6', marginBottom: '40px', maxWidth: isMobile ? '100%' : '600px' }}>
                Create a single "Trigger Word" that works instantly on Instagram,
                Facebook, and WhatsApp. Whether they comment on a Reel or send
                a DM, your AI Agent responds with the same power and consistency.
              </p>

              <button onClick={handleCTAClick} style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                color: 'white',
                padding: '12px 28px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '800',
                fontSize: '0.95rem',
                boxShadow: '0 8px 20px rgba(14, 165, 233, 0.3)',
                display: 'inline-block',
                border: 'none',
                cursor: 'pointer'
              }}>
                Set Universal Triggers
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                boxShadow: '0 40px 100px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                position: 'relative',
                aspectRatio: '1/1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
              }}>
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', width: '80%', height: '80%', border: '1px dashed rgba(14, 165, 233, 0.2)', borderRadius: '50%' }}></div>
                  <div style={{ position: 'absolute', width: '60%', height: '60%', border: '1px dashed rgba(14, 165, 233, 0.3)', borderRadius: '50%' }}></div>

                  <div style={{
                    width: '100px',
                    height: '100px',
                    background: '#ffffff',
                    borderRadius: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    zIndex: 2,
                    border: '1px solid #e0f2fe'
                  }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#0ea5e9', textTransform: 'uppercase' }}>Keyword</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a' }}>"GO"</span>
                  </div>

                  {[
                    { icon: <MessageSquare size={20} />, label: 'Instagram', pos: { top: '15%', left: '50%' }, color: '#e1306c' },
                    { icon: <Share2 size={20} />, label: 'Facebook', pos: { bottom: '25%', left: '20%' }, color: '#1877f2' },
                    { icon: <Zap size={20} />, label: 'WhatsApp', pos: { bottom: '25%', right: '20%' }, color: '#25d366' }
                  ].map((node, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      ...node.pos,
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      zIndex: 3
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        background: '#ffffff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: node.color,
                        boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                        animation: `pulse-soft ${2 + i}s infinite ease-in-out`
                      }}>
                        {node.icon}
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>{node.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: isMobile ? '80px' : '120px', padding: isMobile ? '40px 0' : '80px 0', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h3 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800', color: '#0f172a' }}>Why go Universal?</h3>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '32px'
            }}>
              {[
                { title: 'Zero Configuration', desc: 'Set it once. It automatically maps to all connected social channels without extra work.' },
                { title: 'Unified Data', desc: 'See how your keyword is performing across all platforms in a single, beautiful dashboard.' },
                { title: 'Viral Ready', desc: 'When your content goes viral on one platform, you can instantly clone the success to others.' }
              ].map((item, i) => (
                <div key={i} style={{ padding: '32px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                  <div style={{ width: '40px', height: '40px', background: '#ffffff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <h4 style={{ fontWeight: '800', marginBottom: '12px' }}>{item.title}</h4>
                  <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
