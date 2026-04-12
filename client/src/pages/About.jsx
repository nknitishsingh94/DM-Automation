import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Target, Zap, Heart, Shield, ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';

export default function About() {
  return (
    <div className="about-page-container">
      {/* Header Overlay */}
      <header className="about-header">
        <div className="landing-header-content" style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', flexDirection: 'row-reverse' }}>
          <div className="header-logo">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <img src="/zenxchat-logo.png" alt="ZenXchat Logo" style={{ width: '32px', height: '32px' }} />
              <span className="logo-text" style={{ color: '#0f172a' }}>ZenXchat</span>
            </Link>
          </div>
          <nav className="header-nav">
            <Link to="/about" style={{ fontWeight: '700', color: '#7c3aed' }}>About</Link>
            <Link to="/help">Resources</Link>
            <Link to="/#pricing">Pricing</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-badge">Our Story</span>
          <h1>Redefining <span>Conversational</span> Intelligence</h1>
          <p>
            ZenXchat is on a mission to empower creators and businesses with human-like AI automation that builds real connections at scale.
          </p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="about-mission">
        <div className="mission-grid">
          <div className="mission-card glass-morphism">
            <div className="mission-icon purple">
              <Target size={24} />
            </div>
            <h3>Our Mission</h3>
            <p>
              To eliminate the barrier of manual messaging, allowing brand owners to focus on creativity while our AI handles the engagement.
            </p>
          </div>

          <div className="mission-card glass-morphism">
            <div className="mission-icon blue">
              <Sparkles size={24} />
            </div>
            <h3>Our Vision</h3>
            <p>
              A world where every digital interaction is personal, instant, and meaningful, powered by the next generation of AI Agents.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="about-values">
        <div className="values-header">
          <h2>Values that Drive Us</h2>
          <p>The principles that guide every feature we build and every update we ship.</p>
        </div>

        <div className="values-grid">
          <div className="value-item">
            <div className="value-icon"><Zap size={20} /></div>
            <h4>Speed & Reliability</h4>
            <p>We believe in instantaneous responses that never fail your community.</p>
          </div>
          <div className="value-item">
            <div className="value-icon"><Heart size={20} /></div>
            <h4>Customer First</h4>
            <p>Our platform is built around the feedback and needs of real creators.</p>
          </div>
          <div className="value-item">
            <div className="value-icon"><Shield size={20} /></div>
            <h4>Secure & Ethical</h4>
            <p>Data privacy and Meta-compliant automation are at our core.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="cta-content">
          <h3>Ready to join the future?</h3>
          <p>Start your journey with ZenXchat today and transform your social media presence.</p>
          <Link to="/signup" className="cta-button">
            Get Started Free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
