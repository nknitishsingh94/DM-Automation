import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, UserCheck, ListTodo, Zap, Bot, ArrowRight } from 'lucide-react';
import { HERO_IMAGE_PATH } from '../config'; // I'll add this to config or use direct path

export default function Landing() {
  const HERO_IMAGE = "/hero_woman_phone_ai_1775912265301.png"; // Direct path to artifact in public if served, else I'll use full URL

  return (
    <div className="landing-white-theme">
      {/* Sticky Header */}
      <header className="sticky-header">
        <div className="header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#7c3aed', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot color="white" size={24} />
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', tracking: '-0.5px' }}>Harichat</span>
          </div>

          <nav className="nav-links">
            <a href="#" className="nav-link">About</a>
            <a href="#" className="nav-link">Resources</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <Link to="/login" className="nav-link" style={{ marginLeft: '20px' }}>Sign In</Link>
            <Link to="/signup" className="zorcha-btn-primary">Start For Free</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero-main">
        {/* Left Features */}
        <div className="feature-list">
          <div className="feature-item">
            <div className="feature-item-icon">
              <MessageSquare color="#f472b6" size={32} />
            </div>
            <div className="feature-item-content">
              <h3>Respond to every comment</h3>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-item-icon" style={{ marginTop: '4px' }}>
              <UserCheck color="#8b5cf6" size={32} />
            </div>
            <div className="feature-item-content">
              <h3>Only send links after they follow you</h3>
              <p>Ensure your discounts, offers, or exclusives are going to only real, actual Instagram followers with Ask for a Follow automation.</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-item-icon">
              <ListTodo color="#64748b" size={32} />
            </div>
            <div className="feature-item-content">
              <h3>Create data collection forms</h3>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-item-icon">
              <Zap color="#f472b6" size={32} />
            </div>
            <div className="feature-item-content">
              <h3>Never leave a DM unanswered</h3>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="hero-image-container">
          <img 
            src="/hero_woman_phone_ai_1775912265301.png" 
            alt="Harichat Automation" 
            className="hero-image-main"
          />
        </div>
      </main>

      {/* Footer Branding */}
      <footer style={{ textAlign: 'center', padding: '40px 24px', color: '#64748b', fontSize: '0.9rem' }}>
        © 2026 Harichat. All rights reserved.
      </footer>
    </div>
  );
}
