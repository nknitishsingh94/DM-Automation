import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Calendar, Zap, CheckCircle2, MessageCircle, Clock, MoreHorizontal, Image as ImageIcon, Link as LinkIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LandingHeader from '../components/LandingHeader';
import Footer from '../components/Footer';

export default function ScheduleFeature() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCTAClick = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('insta_agent_token');
    if (user || token) {
      navigate('/scheduling');
    } else {
      navigate('/signup?redirect=/campaigns');
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);

    const timer = setInterval(() => {
      setShowSuccess(prev => !prev);
    }, 4000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="landing-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
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
        .mock-ui-container {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
          overflow: hidden;
          width: 100%;
          max-width: 500px;
          height: 550px;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .mock-header {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: center;
          position: relative;
        }
        .mock-dots {
          position: absolute;
          left: 16px;
          display: flex;
          gap: 6px;
        }
        .dot { width: 10px; height: 10px; borderRadius: 50%; }
        .red { background: #ff5f56; }
        .yellow { background: #ffbd2e; }
        .green { background: #27c93f; }
        
        .mock-content {
          padding: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
        }
        .auto-reply-box {
          border: 1.5px solid #ff7a00;
          border-radius: 16px;
          padding: 16px;
          background: #fff;
          position: relative;
        }
        .toggle-switch {
          width: 36px;
          height: 20px;
          background: #10b981;
          border-radius: 20px;
          position: relative;
        }
        .toggle-circle {
          width: 14px;
          height: 14px;
          background: white;
          border-radius: 50%;
          position: absolute;
          right: 3px;
          top: 3px;
        }
        .keyword-badge {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          display: inline-block;
          color: #1e293b;
        }
        .dm-preview {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .link-pill {
          background: #eff6ff;
          color: #2563eb;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          border: 1px solid #dbeafe;
        }
        .mock-footer {
          padding: 16px 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
        }
        .schedule-time-pill {
          background: #f1f5f9;
          padding: 8px 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
        }
        .schedule-btn {
          background: #0f172a;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
        }
      `}</style>

      <LandingHeader />

      <main className="feature-page-main">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '40px', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Features
          </Link>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr',
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
                background: 'rgba(124, 58, 237, 0.08)',
                color: 'var(--accent-color)',
                borderRadius: '50px',
                fontSize: '0.85rem',
                fontWeight: '700',
                marginBottom: '24px'
              }}>
                <Sparkles size={14} /> Schedule Post + DM Automation
              </div>

              <h1 style={{
                fontSize: isMobile ? '2.2rem' : '3rem',
                fontWeight: '900',
                lineHeight: '1.1',
                color: 'var(--text-main)',
                marginBottom: '20px',
                letterSpacing: '-1px'
              }}>
                Schedule Your Results, Not Just Posts
              </h1>

              <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '24px' }}>
                Set your Auto DM triggers <span style={{ color: 'var(--accent-color)' }}>before</span> the post goes live.
              </h2>

              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '40px', maxWidth: isMobile ? '100%' : '500px' }}>
                Stop jumping between tools. Smart10X allows you to upload your content,
                write your caption, and configure your comment-to-DM triggers in
                one powerful workflow.
              </p>

              <button onClick={handleCTAClick} style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                color: 'white',
                padding: '12px 28px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '800',
                fontSize: '0.95rem',
                boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
                display: 'inline-block',
                border: 'none',
                cursor: 'pointer'
              }}>
                Start Scheduling
              </button>
            </div>

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div className="mock-ui-container">
                {/* Header */}
                <div className="mock-header">
                  <div className="mock-dots">
                    <div className="dot red"></div>
                    <div className="dot yellow"></div>
                    <div className="dot green"></div>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>New Post</span>
                </div>

                {/* Content */}
                <div className="mock-content">
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ width: '140px', height: '180px', background: 'var(--sidebar-bg)', borderRadius: '12px', border: '1.5px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--border-subtle)' }}>
                      <ImageIcon size={32} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>Caption</p>
                      <div style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px', height: '140px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>Summer Collection is here! 🌻<br />Comment <span style={{ color: '#2563eb', fontWeight: '800' }}>LINK</span> to shop!</p>
                      </div>
                    </div>
                  </div>

                  <div className="auto-reply-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={18} color="#ff7a00" fill="#ff7a00" />
                        <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>Auto-Reply</span>
                      </div>
                      <div className="toggle-switch">
                        <div className="toggle-circle"></div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>If comment is...</p>
                    <div className="keyword-badge">LINK</div>

                    <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginTop: '16px', marginBottom: '8px' }}>Then send DM...</p>
                    <div className="dm-preview">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)' }}>Summer Lookbook 📖</span>
                      </div>
                      <div className="link-pill">
                        <LinkIcon size={12} /> Product Link
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mock-footer">
                  <div className="schedule-time-pill">
                    <Calendar size={14} /> Tomorrow, 10:00 AM
                  </div>
                  <div className="schedule-btn">
                    Schedule Reel <ChevronDown size={14} />
                  </div>
                </div>

                {/* Success Overlay */}
                {showSuccess && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                    zIndex: 20
                  }}>
                    <div style={{
                      width: '72px',
                      height: '72px',
                      background: '#10b981',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      marginBottom: '24px',
                      boxShadow: '0 12px 24px rgba(16, 185, 129, 0.3)'
                    }}>
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '8px' }}>Scheduled!</h3>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Your Post & Automation are ready.</p>
                  </div>
                )}
              </div>

              {/* Decorative blobs */}
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(124,58,237,0.1)', borderRadius: '50%', filter: 'blur(40px)', zIndex: -1 }}></div>
              <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '150px', height: '150px', background: 'rgba(59,130,246,0.1)', borderRadius: '50%', filter: 'blur(50px)', zIndex: -1 }}></div>
            </div>
          </div>

          <div style={{ marginTop: isMobile ? '80px' : '120px', padding: isMobile ? '40px 0' : '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h3 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800', color: 'var(--text-main)' }}>Why automate your scheduling?</h3>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '32px'
            }}>
              {[
                { icon: <Clock size={20} />, title: 'Save 2+ Hours Daily', desc: 'No more manual checking for comments on new posts. Everything is ready before you hit post.' },
                { icon: <Zap size={20} />, title: 'Higher Engagement', desc: 'Instant replies in the first 10 minutes of a post signal the algorithm to push your content further.' },
                { icon: <MessageCircle size={20} />, title: 'Consistent Brand Voice', desc: 'Pre-written replies ensure your brand tone is consistent even when you are asleep.' }
              ].map((item, i) => (
                <div key={i} style={{ padding: '32px', background: 'var(--sidebar-bg)', borderRadius: '20px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--bg-card)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    {item.icon}
                  </div>
                  <h4 style={{ fontWeight: '800', marginBottom: '12px' }}>{item.title}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>{item.desc}</p>
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
