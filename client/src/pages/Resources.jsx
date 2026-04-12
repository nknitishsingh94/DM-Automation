import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Newspaper, Activity, ArrowRight, MessageCircle } from 'lucide-react';
import Footer from '../components/Footer';

export default function Resources() {
  return (
    <div className="resources-page-container">
      {/* Header Overlay */}
      <header className="about-header">
        <div className="landing-header-content" style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', flexDirection: 'row-reverse' }}>
          <div className="header-logo">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <img src="/zenxchat-logo.png" alt="ZenXchat Logo" style={{ width: '32px', height: '32px' }} />
              <span className="logo-text" style={{ color: '#0f172a' }}>ZenXchat</span>
            </Link>
          </div>
          <nav className="header-nav" style={{ display: 'flex', gap: '24px' }}>
            <Link to="/about">About</Link>
            <Link to="/resources" style={{ fontWeight: '700', color: '#7c3aed' }}>Resources</Link>
            <Link to="/#pricing">Pricing</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-badge">Knowledge Hub</span>
          <h1>Empowering Your <span>Growth</span></h1>
          <p>
            Everything you need to master Instagram automation and scale your digital presence with ZenXchat.
          </p>
        </div>
      </section>

      {/* Resource Grid */}
      <section className="resources-grid-section">
        <div className="resources-grid">
          <Link to="/help" className="resource-card glass-morphism">
            <div className="resource-icon purple">
              <BookOpen size={28} />
            </div>
            <div className="resource-info">
              <h3>Help Center</h3>
              <p>In-depth guides, tutorials, and step-by-step documentation for every feature.</p>
              <div className="resource-link">
                Explore Docs <ArrowRight size={18} />
              </div>
            </div>
          </Link>

          <a href="https://www.instagram.com/zenxchat/" target="_blank" rel="noopener noreferrer" className="resource-card glass-morphism">
            <div className="resource-icon pink">
              <Users size={28} />
            </div>
            <div className="resource-info">
              <h3>Community</h3>
              <p>Join thousands of creators sharing strategies and success stories on Instagram.</p>
              <div className="resource-link">
                Join Us <ArrowRight size={18} />
              </div>
            </div>
          </a>

          <Link to="#" className="resource-card glass-morphism">
            <div className="resource-icon blue">
              <Newspaper size={28} />
            </div>
            <div className="resource-info">
              <h3>ZenXchat Blog</h3>
              <p>Stay updated with the latest AI trends, platform updates, and marketing tips.</p>
              <div className="resource-link">
                Read Blog <ArrowRight size={18} />
              </div>
            </div>
          </Link>

          <Link to="#" className="resource-card glass-morphism">
            <div className="resource-icon green">
              <Activity size={28} />
            </div>
            <div className="resource-info">
              <h3>System Status</h3>
              <p>Real-time updates on system performance and platform availability.</p>
              <div className="resource-link">
                Check Status <ArrowRight size={18} />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Help Section CTA */}
      <section className="resources-footer-cta">
        <div className="cta-box">
          <div className="cta-icon-group">
            <MessageCircle size={32} />
          </div>
          <h2>Can't find what you're looking for?</h2>
          <p>Our support team is always here to help you get the most out of ZenXchat.</p>
          <a href="https://www.instagram.com/zenxchat/" target="_blank" rel="noopener noreferrer" className="cta-contact-btn">
            Contact Support
          </a>
        </div>
      </section>

      {/* Mini Footer */}
      <Footer />
    </div>
  );
}
