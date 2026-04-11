import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, UserCheck, ListTodo, Zap, Bot } from 'lucide-react';

export default function Landing() {
  return (
    <div className="landing-white-theme">
      {/* Sticky Topbar */}
      <header className="sticky-header">
        <div className="header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#7c3aed', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot color="white" size={24} />
            </div>
            <span style={{ fontSize: '1.45rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Hari-logo</span>
          </div>

          <nav className="nav-links">
            <a href="#pricing" className="nav-link">Pricing</a>
            <Link to="/login" className="nav-link" style={{ marginLeft: '12px' }}>Sign In</Link>
            <Link to="/signup" className="btn-start-free">Start For Free</Link>
          </nav>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="hero-main">
        {/* Left Side: Features */}
        <div className="feature-list">
          <div className="feature-item">
            <div style={{ padding: '10px', background: 'rgba(244, 114, 182, 0.1)', borderRadius: '12px', height: 'fit-content' }}>
              <MessageSquare color="#f472b6" size={28} />
            </div>
            <div className="feature-item-content">
              <h3>Respond to every comment</h3>
            </div>
          </div>

          <div className="feature-item">
            <div style={{ padding: '10px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '12px', height: 'fit-content' }}>
              <UserCheck color="#8b5cf6" size={28} />
            </div>
            <div className="feature-item-content">
              <h3>Only send links after they follow you</h3>
              <p>Ensure your discounts, offers, or exclusives are going to only real, actual Instagram followers with Ask for a Follow automation.</p>
            </div>
          </div>

          <div className="feature-item">
            <div style={{ padding: '10px', background: 'rgba(100, 116, 139, 0.1)', borderRadius: '12px', height: 'fit-content' }}>
              <ListTodo color="#64748b" size={28} />
            </div>
            <div className="feature-item-content">
              <h3>Create data collection forms</h3>
            </div>
          </div>

          <div className="feature-item">
            <div style={{ padding: '10px', background: 'rgba(244, 114, 182, 0.1)', borderRadius: '12px', height: 'fit-content' }}>
              <Zap color="#f472b6" size={28} />
            </div>
            <div className="feature-item-content">
              <h3>Never leave a DM unanswered</h3>
            </div>
          </div>
        </div>

        {/* Right Side: Visual */}
        <div className="hero-visual">
          <img 
            src="/hero_woman_phone_ai.png" 
            alt="AI Interaction Demo" 
            className="hero-image-main"
          />
        </div>
      </main>

      {/* Basic Pricing Section Placeholder */}
      <section id="pricing" style={{ padding: '100px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>Ready to Scale?</h2>
        <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '40px' }}>Join Harichat today and start automating like a Pro.</p>
        <Link to="/signup" className="btn-start-free" style={{ fontSize: '1.1rem', padding: '16px 40px' }}>
          Get Started Now
        </Link>
      </section>

      <footer style={{ padding: '60px 24px', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', color: '#94a3b8', fontSize: '0.9rem' }}>
        © 2026 Harichat. All rights reserved.
      </footer>
    </div>
  );
}
