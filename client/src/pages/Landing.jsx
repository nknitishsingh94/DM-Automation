import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Zap, Facebook, Instagram, Youtube, Linkedin, MessageCircle, Infinity, Heart, Check } from 'lucide-react';

export default function Landing() {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="header-content">
          <div className="header-logo">
            <img src="/zenxchat-logo.png" alt="ZenXchat Logo" className="header-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
            <span>ZenXchat</span>
          </div>
          <nav className="header-nav">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
          </nav>
          <div className="header-actions">
            <Link to="/login" className="header-login">Log in</Link>
            <Link to="/signup" className="header-signup">Sign up free</Link>
          </div>
        </div>
      </header>

      <div className="hero-section">
        <div className="landing-content">
          <h1 className="landing-headline">
            Welcome to my<br /> <span className="highlight-text">real world interaction</span>
          </h1>

          <p className="landing-sub">
            The ultimate multi-channel AI Agent for SaaS and agencies. Seamlessly automate Instagram, Facebook, and WhatsApp messaging while you focus on what really matters.
          </p>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '40px' }}>
            <Link to="/login" className="landing-cta">
              Get Started Free <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>

      <section className="features-section">
        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon feature-icon-red">
              <Zap size={24} />
            </div>
            <div className="feature-text">
              <h3>Instantly Active</h3>
              <p>Zero wait time</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon feature-icon-dark">
              <Bot size={24} />
            </div>
            <div className="feature-text">
              <h3>Multi-Platform</h3>
              <p>IG, FB & WhatsApp</p>
            </div>
          </div>
        </div>


      </section>

      <section id="pricing" className="pricing-section">
        <div className="pricing-container">
          <div className="pricing-heading">
            <h2>Simple, transparent pricing</h2>
            <p>Choose the plan that's right for your business. No hidden fees.</p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="card-header">
                <h3>Starter</h3>
                <div className="price"><span>$</span>0<span>/mo</span></div>
                <p>Perfect for trying out the platform.</p>
              </div>
              <div className="card-features">
                <ul>
                  <li><Check size={18} className="check-icon" /> 100 Auto-Replies / month</li>
                  <li><Check size={18} className="check-icon" /> Basic Flow Builder</li>
                  <li><Check size={18} className="check-icon" /> Standard Support</li>
                </ul>
              </div>
              <Link to="/signup" className="pricing-btn outline-btn">Get Started</Link>
            </div>

            <div className="pricing-card pro-card">
              <div className="pro-badge">Most Popular</div>
              <div className="card-header">
                <h3>Pro</h3>
                <div className="price"><span>$</span>29<span>/mo</span></div>
                <p>For growing creators and businesses.</p>
              </div>
              <div className="card-features">
                <ul>
                  <li><Check size={18} className="check-icon" /> Unlimited Auto-Replies</li>
                  <li><Check size={18} className="check-icon" /> Advanced AI AI-Agent</li>
                  <li><Check size={18} className="check-icon" /> Analytics Dashboard</li>
                  <li><Check size={18} className="check-icon" /> Priority Support</li>
                </ul>
              </div>
              <Link to="/signup" className="pricing-btn solid-btn">Start 14-Day Free Trial</Link>
            </div>

            <div className="pricing-card">
              <div className="card-header">
                <h3>Agency</h3>
                <div className="price"><span>$</span>99<span>/mo</span></div>
                <p>For agencies managing multi-accounts.</p>
              </div>
              <div className="card-features">
                <ul>
                  <li><Check size={18} className="check-icon" /> Everything in Pro</li>
                  <li><Check size={18} className="check-icon" /> White-labeling Options</li>
                  <li><Check size={18} className="check-icon" /> Manage up to 10 Clients</li>
                  <li><Check size={18} className="check-icon" /> Dedicated Account Manager</li>
                </ul>
              </div>
              <Link to="/signup" className="pricing-btn outline-btn">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-col brand-col">
            <h2 className="footer-logo">ZenXchat</h2>
            <p className="made-in">Made with <Heart className="heart-icon" size={14} fill="red" color="red" /> in India.</p>
            <div className="footer-socials">
              <a href="#" className="social-link fb"><Facebook size={20} /></a>
              <a href="#" className="social-link ig"><Instagram size={20} /></a>
              <a href="#" className="social-link yt"><Youtube size={20} /></a>
              <a href="#" className="social-link li"><Linkedin size={20} /></a>
            </div>
          </div>

          <div className="footer-col">
            <h3>Company</h3>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Legal</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Features <span className="soon-badge">Soon</span></h3>
            <ul>
              <li><a href="#" className="disabled-link">Comment-to-DM</a></li>
              <li><a href="#" className="disabled-link">Grow your Followers</a></li>
              <li><a href="#" className="disabled-link">Never Miss a Comment</a></li>
              <li><a href="#" className="disabled-link">Collect Emails</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Compare</h3>
            <ul>
              <li><a href="#">vs Manychat</a></li>
              <li><a href="#">vs ChatFuel</a></li>
              <li><a href="#">vs LinkDM</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Resources</h3>
            <ul>
              <li><a href="#">Become a Partner</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Help & Support</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">&copy; 2025 ZenXchat. All rights reserved</p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Statement</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
