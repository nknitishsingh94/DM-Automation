import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Zap, Facebook, Instagram, Youtube, Linkedin, MessageCircle, Infinity, Heart, Check } from 'lucide-react';
import Footer from '../components/Footer';

export default function Landing() {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-logo">
              <img src="/zenxchat-logo.png" alt="Zorcha Logo" className="header-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
              <span className="logo-text">ZenXchat</span>
            </div>
            <div className="header-divider"></div>
            <nav className="header-nav">
              <Link to="/about">About</Link>
              <Link to="/resources">Resources</Link>
              <a href="#pricing">Pricing</a>
            </nav>
          </div>
          <div className="header-actions">
            <Link to="/login" className="header-login">Sign In</Link>
            <Link to="/signup" className="header-signup">Start For Free</Link>
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
            <div className="feature-icon feature-icon-purple">
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

        <div className="feature-breakdown-section">
          <div className="feature-focus-header">
            <span className="feature-focus-label">Feature Focus</span>
            <h2>Feature Breakdown</h2>
            <p className="feature-focus-description">
              Dive into the specifics of each feature, understanding its functionality and how it can elevate your Instagram strategy.
            </p>
          </div>

          <div className="feature-row">
            <div className="phone-mockup-wrapper">
              <img src="/features/reel-mockup.png" alt="Auto-Reply to Reels" />
            </div>
            <div className="feature-text-content">
              <h3>Auto-Reply to Instagram Reel Comments</h3>
              <p>
                Reply to Instagram reel comments automatically with a DM sent straight to the users inbox. Add trigger keywords or respond to all comments.
              </p>
            </div>
          </div>

          <div className="feature-row reverse">
            <div className="phone-mockup-wrapper">
              <img src="/features/post-mockup.png" alt="Auto-Reply to Posts" />
            </div>
            <div className="feature-text-content">
              <h3>Auto-Reply to Instagram Post Comments</h3>
              <p>
                Reply to Instagram post comments automatically with a DM sent straight to the users inbox. Add trigger keywords or respond to all comments.
              </p>
            </div>
          </div>

          <div className="feature-row">
            <div className="phone-mockup-wrapper">
              <img src="/features/story-reply-mockup.png" alt="Auto-Respond to Story Replies" />
            </div>
            <div className="feature-text-content">
              <h3>Auto-Respond to Instagram Story Replies</h3>
              <p>
                Automatically respond to story replies with a DM sent directly to the users inbox. Add trigger keywords or respond to all comments.
              </p>
            </div>
          </div>

          <div className="feature-row reverse">
            <div className="phone-mockup-wrapper">
              <img src="/features/story-mention-mockup.png" alt="Auto-Reply to Story Mentions" />
            </div>
            <div className="feature-text-content">
              <h3>Auto-Reply to Instagram Story Mentions</h3>
              <p>
                Automatically respond to story @mentions with a message sent directly to the users inbox.
              </p>
            </div>
          </div>

          <div className="feature-row">
            <div className="phone-mockup-wrapper">
              <img src="/features/ad-mockup.png" alt="Auto-Reply to Sponsored Ad Comments" />
            </div>
            <div className="feature-text-content">
              <h3>Auto-Reply to Sponsored Ad Comments</h3>
              <p>
                Auto-reply to post comments on your sponsored content with a DM sent directly to the users inbox. Respond to keywords or all comments.
              </p>
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
                <div className="price"><span>$</span>50<span>/mo</span></div>
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

      <Footer />
    </div>
  );
}
