import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Activity, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LandingHeader from '../../components/LandingHeader';
import Footer from '../../components/Footer';

export default function GrowFollowers() {
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
    if (user || localStorage.getItem('insta_agent_token')) {
      navigate('/hub/message-only');
    } else {
      navigate('/signup?redirect=/hub/message-only');
    }
  };

  return (
    <div className="landing-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <style>{`
        .feature-page-main { padding-top: 120px; flex: 1; }
        @media (max-width: 1024px) { .feature-page-main { padding-top: 80px; } }
      `}</style>

      <LandingHeader />

      <main className="feature-page-main">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', marginBottom: '80px' }}>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '80px'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '24px' }}>
              <TrendingUp size={14} /> Organic Growth Engine
            </div>
            
            <h1 style={{ fontSize: isMobile ? '2.5rem' : '4rem', fontWeight: '900', lineHeight: '1.1', marginBottom: '24px', color: 'var(--text-main)', letterSpacing: '-1px' }}>
              Grow Your Followers <br /> <span style={{ color: '#10b981' }}>Exponentially</span>
            </h1>
            
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '40px', maxWidth: '700px' }}>
              Engage with your audience 24/7. Use smart automations, cross-posting, and AI-driven replies to boost your algorithm ranking and organically grow your follower base.
            </p>
            
            <button onClick={handleCTAClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#10b981', color: '#fff', padding: '16px 32px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '800', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 10px 25px -5px rgba(16,185,129,0.5)' }}>
              Start Growing Free <ArrowRight size={20} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '30px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '40px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Users size={30} color="#3b82f6" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main)' }}>Audience Retention</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1.05rem' }}>Fast replies make followers feel valued. By automating responses, you retain your audience and build extreme brand loyalty.</p>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '40px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Activity size={30} color="#10b981" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main)' }}>Algorithm Boost</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1.05rem' }}>More comments and DMs signal high engagement to algorithms, pushing your posts to the Explore page and increasing reach.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
