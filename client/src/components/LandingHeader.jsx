import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, ArrowRight, ChevronDown, MessageCircle, Zap, Clock, Calendar, Globe, Bot, Image, Radio } from 'lucide-react';

export default function LandingHeader() {
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="landing-header">
      <div className="header-content">
        <div className="header-left">
          <Link to="/" className="header-logo" style={{ textDecoration: 'none' }}>
            <img src="/smart100x-logo.png" alt="Smart100X Logo" className="header-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="logo-text">Smart100X</span>
          </Link>
          
          <div className="header-divider"></div>
          
          <nav className="header-nav">
            <Link to="/about">About</Link>
            
            {/* Features Dropdown */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setFeaturesOpen(true)}
              onMouseLeave={() => setFeaturesOpen(false)}
            >
              <a href="/#features" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={(e) => { e.preventDefault(); setFeaturesOpen(!featuresOpen); }}>
                Features
                <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: featuresOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </a>

              {featuresOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                  paddingTop: '12px', zIndex: 1000, animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{
                    background: 'var(--bg-card)', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    border: '1px solid var(--border-subtle)', padding: '24px', width: '560px'
                  }}>
                    <div style={{ position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-50%)', width: '14px', height: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderBottom: 'none', borderRight: 'none', rotate: '45deg', zIndex: 1 }} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                      <div style={{ paddingRight: '24px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '800', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Core Features</p>
                        {[
                          { icon: <MessageCircle size={18} color="#64748b" />, title: 'Comment Automation', desc: 'Auto-reply to comments with DMs', link: '/campaigns' },
                          { icon: <Zap size={18} color="#64748b" />, title: 'DM Automation', desc: 'Visual flow builder for conversations', link: '/campaigns' },
                          { icon: <Clock size={18} color="#64748b" />, title: 'Follow-up Messages', desc: 'Automated nurture sequences', link: '/campaigns' },
                          { icon: <Calendar size={18} color="#64748b" />, title: 'Schedule with AutoDM', desc: 'Post + automation together', link: '/features/scheduling' },
                        ].map((item, i) => (
                          <Link key={i} to={item.link} onClick={() => setFeaturesOpen(false)}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 8px', borderRadius: '10px', textDecoration: 'none', transition: 'color 0.15s', marginBottom: '4px', cursor: 'pointer', color: 'var(--text-main)' }}
                          >
                            <div style={{ flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 2px 0' }}>{item.title}</p>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{item.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div style={{ paddingLeft: '24px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '800', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Advanced</p>
                        {[
                          { icon: <Globe size={18} color="#64748b" />, title: 'Universal Triggers', desc: 'One keyword, all channels', link: '/features/universal-triggers' },
                          { icon: <Bot size={18} color="#64748b" />, title: 'Facebook Automation', desc: 'Sync to Facebook instantly', link: '/settings' },
                          { icon: <Image size={18} color="#64748b" />, title: 'Story Replies', desc: 'Automate story interactions', link: '/campaigns' },
                          { icon: <Radio size={18} color="#64748b" />, title: 'Live Comment Auto DM', desc: 'DM viewers during lives', link: '/campaigns' },
                        ].map((item, i) => (
                          <Link key={i} to={item.link} onClick={() => setFeaturesOpen(false)}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 8px', borderRadius: '10px', textDecoration: 'none', transition: 'color 0.15s', marginBottom: '4px', cursor: 'pointer', color: 'var(--text-main)' }}
                          >
                            <div style={{ flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 2px 0' }}>{item.title}</p>
                              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{item.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <Link to="/dashboard" style={{
              background: 'var(--text-main)', color: 'white', padding: '10px 24px', borderRadius: '50px',
              fontSize: '0.9rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 10px 20px rgba(15, 23, 42, 0.1)'
            }}>
              Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-muted)', textDecoration: 'none', padding: '0 12px' }}>Sign In</Link>
              <Link to="/signup" style={{
                background: 'var(--accent-color)', color: 'white', padding: '10px 24px', borderRadius: '50px',
                fontSize: '0.95rem', fontWeight: '800', textDecoration: 'none', boxShadow: '0 10px 20px rgba(124, 58, 237, 0.2)'
              }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
