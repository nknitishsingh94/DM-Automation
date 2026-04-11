import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Zap, Facebook, Instagram, MessageCircle, Infinity } from 'lucide-react';

export default function Landing() {
  return (
    <div className="landing-container">
      <div className="landing-overlay"></div>
      
      <div className="landing-content">
        
        <h1 className="landing-headline">
          Welcome to my<br /> real world interaction
        </h1>
        
        <p className="landing-sub">
          The ultimate multi-channel AI Agent for SaaS and agencies. Seamlessly automate Instagram, Facebook, and WhatsApp messaging while you focus on what really matters.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
          <Link to="/login" className="landing-cta">
            Get Started Free <ArrowRight size={20} />
          </Link>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon feature-icon-green">
              <Zap size={24} />
            </div>
            <div className="feature-text">
              <h3 style={{ color: '#fff' }}>Instantly Active</h3>
              <p>Zero wait time</p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon feature-icon-blue">
              <Bot size={24} />
            </div>
            <div className="feature-text">
              <h3 style={{ color: '#fff' }}>Multi-Platform</h3>
              <p>IG, FB & WhatsApp</p>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="social-proof">
          <div className="sp-text" style={{ marginBottom: '16px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Seamlessly Integrated With
          </div>
          
          <div className="sp-logos">
            <div className="sp-logo-placeholder" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Infinity size={28} /> META
            </div>
            <div className="sp-logo-placeholder" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Instagram size={28} /> INSTAGRAM
            </div>
            <div className="sp-logo-placeholder" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Facebook size={28} /> FACEBOOK
            </div>
            <div className="sp-logo-placeholder" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={28} /> WHATSAPP
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
