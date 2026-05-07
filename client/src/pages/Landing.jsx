import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Zap, Facebook, Instagram, Youtube, Linkedin, MessageCircle, Infinity, Heart, Check, MessageSquare, Clock, Calendar, Globe, Image, Radio } from 'lucide-react';
import Footer from '../components/Footer';

export default function Landing() {
  const [featuresOpen, setFeaturesOpen] = useState(false);
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
              <img src="/zenxchat-logo.png" alt="smart10X Logo" className="header-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
              <span className="logo-text">smart10X</span>
            </div>
            <div className="header-divider"></div>
            <nav className="header-nav">
              <Link to="/about">About</Link>

              {/* Features Dropdown */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setFeaturesOpen(true)}
                onMouseLeave={() => setFeaturesOpen(false)}
              >
                <a href="#features" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={(e) => { e.preventDefault(); setFeaturesOpen(!featuresOpen); }}>
                  Features
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 0.2s', transform: featuresOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>

                {featuresOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                    paddingTop: '12px', zIndex: 1000, animation: 'fadeIn 0.2s ease'
                  }}>
                    <div style={{
                      background: 'white', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                      border: '1px solid #e2e8f0', padding: '24px', width: '560px'
                    }}>
                      {/* Arrow */}
                      <div style={{ position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-50%)', width: '14px', height: '14px', background: 'white', border: '1px solid #e2e8f0', borderBottom: 'none', borderRight: 'none', rotate: '45deg', zIndex: 1 }} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                      {/* Core Features Column */}
                      <div style={{ paddingRight: '24px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '800', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Core Features</p>
                        {[
                          { icon: <MessageCircle size={18} color="#64748b" />, title: 'Comment Automation', desc: 'Auto-reply to comments with DMs', link: '/campaigns' },
                          { icon: <Zap size={18} color="#64748b" />, title: 'DM Automation', desc: 'Visual flow builder for conversations', link: '/campaigns' },
                          { icon: <Clock size={18} color="#64748b" />, title: 'Follow-up Messages', desc: 'Automated nurture sequences', link: '/campaigns' },
                          { icon: <Calendar size={18} color="#64748b" />, title: 'Schedule with AutoDM', desc: 'Post + automation together', link: '/features/scheduling' },
                        ].map((item, i) => (
                          <Link key={i} to={item.link} onClick={(e) => { if(item.link === '#features') { e.preventDefault(); setFeaturesOpen(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); } else { setFeaturesOpen(false); } }}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 8px', borderRadius: '10px', textDecoration: 'none', transition: 'color 0.15s', marginBottom: '4px', cursor: 'pointer', color: 'inherit' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                            onMouseLeave={e => e.currentTarget.style.color = 'inherit'}
                          >
                            <div style={{ flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>{item.title}</p>
                              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{item.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Advanced Column */}
                      <div style={{ paddingLeft: '24px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '800', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Advanced</p>
                        {[
                          { icon: <Globe size={18} color="#64748b" />, title: 'Universal Triggers', desc: 'One keyword, all channels', link: '/features/universal-triggers' },
                          { icon: <Bot size={18} color="#64748b" />, title: 'Facebook Automation', desc: 'Sync to Facebook instantly', link: '/settings' },
                          { icon: <Image size={18} color="#64748b" />, title: 'Story Replies', desc: 'Automate story interactions', link: '/campaigns' },
                          { icon: <Radio size={18} color="#64748b" />, title: 'Live Comment Auto DM', desc: 'DM viewers during lives', link: '/campaigns' },
                        ].map((item, i) => (
                          <Link key={i} to={item.link} onClick={(e) => { if(item.link === '#features') { e.preventDefault(); setFeaturesOpen(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); } else { setFeaturesOpen(false); } }}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 8px', borderRadius: '10px', textDecoration: 'none', transition: 'color 0.15s', marginBottom: '4px', cursor: 'pointer', color: 'inherit' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                            onMouseLeave={e => e.currentTarget.style.color = 'inherit'}
                          >
                            <div style={{ flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>{item.title}</p>
                              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{item.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* View All Features CTA */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
                      <a href="#features" onClick={(e) => { e.preventDefault(); setFeaturesOpen(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#8b5cf6', textDecoration: 'none' }}>
                        View All Features <ArrowRight size={14} />
                      </a>
                    </div>
                  </div>
                </div>
                )}
              </div>

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
            Automate Your DMs.<br /> <span className="highlight-text">Multiply Your Sales.</span>
          </h1>

          <p className="landing-sub">
            Deploy intelligent AI Agents that instantly reply to comments, engage followers 24/7, and convert conversations into loyal customers across Instagram, Facebook, and WhatsApp.
          </p>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '40px' }}>
            <Link to="/signup" className="landing-cta">
              Get Started Free <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>

      <section id="features" className="features-section">
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

          <Link to="/features/universal-triggers" className="feature-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
            <div className="feature-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
              <Globe size={24} />
            </div>
            <div className="feature-text">
              <h3>Universal Triggers</h3>
              <p>One keyword, all channels</p>
            </div>
          </Link>

          <Link to="/features/scheduling" className="feature-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
            <div className="feature-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
              <Clock size={24} />
            </div>
            <div className="feature-text">
              <h3>AI Scheduling</h3>
              <p>Post + Auto DM</p>
            </div>
          </Link>
        </div>

        <div className="feature-breakdown-section">
          <div className="feature-focus-header">
            <span className="feature-focus-label">Core Capabilities</span>
            <h2>Turn Engagement Into Revenue</h2>
            <p className="feature-focus-description">
              Stop losing leads to slow response times. Let smart10X handle every interaction seamlessly, converting your audience while you sleep.
            </p>
          </div>

          <div className="feature-row">
            <div className="phone-mockup-wrapper">
              <img src="/features/reel-mockup.png" alt="Auto-Reply to Reels" />
            </div>
            <div className="feature-text-content">
              <h3>Turn Reel Views into Customers</h3>
              <p>
                Automatically DM users who comment on your Reels. Capitalize on viral moments by delivering links, lead magnets, and customized responses instantly without missing a single lead.
              </p>
            </div>
          </div>

          <div className="feature-row reverse">
            <div className="phone-mockup-wrapper">
              <img src="/features/post-mockup.png" alt="Auto-Reply to Posts" />
            </div>
            <div className="feature-text-content">
              <h3>Smart Post Engagement</h3>
              <p>
                Reward engaged followers by automatically sending them a private DM the exact second they comment on your posts. Set up specific trigger words (e.g., "Send Link") to drive sales effortlessly.
              </p>
            </div>
          </div>

          <div className="feature-row">
            <div className="phone-mockup-wrapper">
              <img src="/features/story-reply-mockup.png" alt="Auto-Respond to Story Replies" />
            </div>
            <div className="feature-text-content">
              <h3>Scale Your Story Sales</h3>
              <p>
                Stories generate the highest intent leads. Use AI to auto-respond to story replies, process inquiries, and guide users through personalized funnels—all within their inbox.
              </p>
            </div>
          </div>

          <div className="feature-row reverse">
            <div className="phone-mockup-wrapper">
              <img src="/features/story-mention-mockup.png" alt="Auto-Reply to Story Mentions" />
            </div>
            <div className="feature-text-content">
              <h3>Gratitude on Autopilot</h3>
              <p>
                When someone tags your brand in their story, automatically send them a "Thank You" message, a discount code, or a VIP offer. Build brand loyalty without lifting a finger.
              </p>
            </div>
          </div>

          <div className="feature-row">
            <div className="phone-mockup-wrapper">
              <img src="/features/ad-mockup.png" alt="Auto-Reply to Sponsored Ad Comments" />
            </div>
            <div className="feature-text-content">
              <h3>Maximize Ad ROI</h3>
              <p>
                Don't let expensive ad clicks go to waste. Instantly capture intent by automatically DMing users who comment on your sponsored Facebook and Instagram Ads.
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
                <div className="price"><span>$</span>39<span>/mo</span></div>
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
