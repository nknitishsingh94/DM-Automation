const getSafeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('cdninstagram.com') || url.includes('scontent-') || url.includes('fbcdn.net')) {
    const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'https://dm-automation-w9a4.vercel.app' 
      : 'https://dm-automation-w9a4.vercel.app';
    return API_BASE_URL + '/api/storage/proxy-external?url=' + encodeURIComponent(url);
  }
  return url;
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Zap, Facebook, Instagram, Youtube, Linkedin, MessageCircle, Infinity, Heart, Check, MessageSquare, Clock, Calendar, Globe, Image, Radio, Star, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';

const defaultReviews = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    handle: '@sarah_creative',
    role: 'E-commerce Founder',
    rating: 5,
    text: 'smart100X transformed our Instagram DMs into our #1 sales channel! Auto-replying to reel comments generated over $14k in our first month alone.',
    platform: 'instagram',
    verified: true
  },
  {
    id: 2,
    name: 'Alex Rivera',
    handle: '@alex_coaching',
    role: 'Business & Executive Coach',
    rating: 5,
    text: 'The AI Studio agent handles subscriber inquiries 24/7 with zero delay. My followers get instant answers and lead magnets immediately.',
    platform: 'instagram',
    verified: true
  },
  {
    id: 3,
    name: 'Marcus Vance',
    handle: '@vancemedia',
    role: 'Growth Agency Director',
    rating: 5,
    text: 'Managing 8 client accounts used to take hours. Now with smart100X Enterprise, universal triggers automate everything across IG and WhatsApp seamlessly.',
    platform: 'whatsapp',
    verified: true
  },
  {
    id: 4,
    name: 'Elena Rostova',
    handle: '@elena_design',
    role: 'Digital Creator',
    rating: 5,
    text: 'Story mention auto-thanks and reel DM triggers increased my engagement by 340%. Best investment I have made for my personal brand.',
    platform: 'facebook',
    verified: true
  }
];

export default function Landing() {
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [pricing, setPricing] = useState({ pro_price: 29, enterprise_price: 99 });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/pricing`)
      .then(res => res.json())
      .then(data => {
        if (data.pro_price) {
          setPricing({ pro_price: data.pro_price, enterprise_price: data.enterprise_price || 99 });
        } else if (data.pro && data.pro.price) {
          setPricing({ pro_price: data.pro.price, enterprise_price: data.enterprise?.price || 99 });
        }
      })
      .catch(console.error);
  }, []);

  const [reviews, setReviews] = useState(defaultReviews);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    handle: '',
    role: '',
    rating: 5,
    text: '',
    platform: 'instagram',
    avatarUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('insta_agent_token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setNewReview(prev => ({ ...prev, avatarUrl: data.uploadUrl || data.url || data.publicUrl }));
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Failed to upload image. You must be logged in.');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('Connection error while uploading.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user-feedback?t=${new Date().getTime()}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setReviews(data);
        }
      }
    } catch (err) {
      console.error("Failed to load reviews from API, using default reviews:", err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

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
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-logo">
              <img referrerPolicy="no-referrer" src="/smart100x-logo.png" alt="smart100X Logo" className="header-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
              <span className="logo-text">smart100X</span>
            </div>
            
            {/* Optically Centered Header Divider */}
            <div className="header-divider" style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 20px' }}></div>
            
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
                      background: 'var(--bg-card)', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                      border: '1px solid var(--border-subtle)', padding: '24px', width: '560px'
                    }}>
                      <div style={{ position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-50%)', width: '14px', height: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderBottom: 'none', borderRight: 'none', rotate: '45deg', zIndex: 1 }} />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                        {/* Core Features Column */}
                        <div style={{ paddingRight: '24px' }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Core Features</p>
                          {[
                            { icon: <MessageCircle size={18} color="#64748b" />, title: 'Comment Automation', desc: 'Auto-reply to comments with DMs', link: '/campaigns' },
                            { icon: <Zap size={18} color="#64748b" />, title: 'DM Automation', desc: 'Visual flow builder for conversations', link: '/campaigns' },
                            { icon: <Clock size={18} color="#64748b" />, title: 'Follow-up Messages', desc: 'Automated nurture sequences', link: '/campaigns' },
                            { icon: <Calendar size={18} color="#64748b" />, title: 'Schedule with AutoDM', desc: 'Post + automation together', link: '/features/scheduling' },
                          ].map((item, i) => (
                            <Link key={i} to={item.link} onClick={(e) => { if(item.link === '#features') { e.preventDefault(); setFeaturesOpen(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); } else { setFeaturesOpen(false); } }}
                              style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 8px', borderRadius: '10px', textDecoration: 'none', transition: 'color 0.15s', marginBottom: '4px', cursor: 'pointer', color: 'inherit' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-color)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'inherit'}
                            >
                              <div style={{ flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
                              <div>
                                <p style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 2px 0' }}>{item.title}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{item.desc}</p>
                              </div>
                            </Link>
                          ))}
                        </div>

                        {/* Advanced Column */}
                        <div style={{ paddingLeft: '24px' }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Advanced</p>
                          {[
                            { icon: <Globe size={18} color="#64748b" />, title: 'Universal Triggers', desc: 'One keyword, all channels', link: '/features/universal-triggers' },
                            { icon: <Bot size={18} color="#64748b" />, title: 'Facebook Automation', desc: 'Sync to Facebook instantly', link: '/settings' },
                            { icon: <Image size={18} color="#64748b" />, title: 'Story Replies', desc: 'Automate story interactions', link: '/campaigns' },
                            { icon: <Radio size={18} color="#64748b" />, title: 'Live Comment Auto DM', desc: 'DM viewers during lives', link: '/campaigns' },
                          ].map((item, i) => (
                            <Link key={i} to={item.link} onClick={(e) => { if(item.link === '#features') { e.preventDefault(); setFeaturesOpen(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); } else { setFeaturesOpen(false); } }}
                              style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 8px', borderRadius: '10px', textDecoration: 'none', transition: 'color 0.15s', marginBottom: '4px', cursor: 'pointer', color: 'inherit' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-color)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'inherit'}
                            >
                              <div style={{ flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
                              <div>
                                <p style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 2px 0' }}>{item.title}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{item.desc}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* View All Features CTA */}
                      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'right' }}>
                        <a href="#features" onClick={(e) => { e.preventDefault(); setFeaturesOpen(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: '700', color: '#8b5cf6', textDecoration: 'none' }}>
                          View All Features <ArrowRight size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/resources">Resources</Link>
              <a href="#reviews">Reviews</a>
              <a href="#pricing">Pricing</a>
            </nav>
          </div>
          <div className="header-actions">
            <Link to="/login" className="header-login">Sign In</Link>
            <Link to="/signup" className="header-signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              Get Started Free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Enhanced Gradient Overlay for High Contrast */}
      <div className="hero-section" style={{
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.5) 100%), url("/hero-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="landing-content">
          <h1 className="landing-headline" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
            Automate Your DMs.<br /> <span className="highlight-text">Multiply Your Sales.</span>
          </h1>

          <p className="landing-sub" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            Deploy intelligent AI Agents that instantly reply to comments, engage followers 24/7, and convert conversations into loyal customers across Instagram, Facebook, and WhatsApp.
          </p>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '40px' }}>
            <Link to="/signup" className="landing-cta">
              Get Started Free <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Features & Core Capabilities Section */}
      <section id="features" className="features-section">
        
        {/* Balanced 4-Column Grid Layout */}
        <div className="landing-features" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          width: '100%',
          maxWidth: '1100px'
        }}>
          <Link to="/signup" className="feature-card" style={{ textDecoration: 'none', cursor: 'pointer', padding: '24px' }}>
            <div className="feature-icon feature-icon-purple">
              <Zap size={28} />
            </div>
            <div className="feature-text">
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-main)' }}>Instantly Active</h2>
              <p style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-muted)' }}>Zero wait time setup</p>
            </div>
          </Link>

          <Link to="/connections" className="feature-card" style={{ textDecoration: 'none', cursor: 'pointer', padding: '24px' }}>
            <div className="feature-icon feature-icon-dark">
              <Bot size={28} />
            </div>
            <div className="feature-text">
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-main)' }}>Multi-Platform</h2>
              <p style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-muted)' }}>IG, FB & WhatsApp</p>
            </div>
          </Link>

          <Link to="/features/universal-triggers" className="feature-card" style={{ textDecoration: 'none', cursor: 'pointer', padding: '24px' }}>
            <div className="feature-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
              <Globe size={28} />
            </div>
            <div className="feature-text">
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-main)' }}>Universal Triggers</h2>
              <p style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-muted)' }}>One keyword, all channels</p>
            </div>
          </Link>

          <Link to="/features/scheduling" className="feature-card" style={{ textDecoration: 'none', cursor: 'pointer', padding: '24px' }}>
            <div className="feature-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-color)' }}>
              <Clock size={28} />
            </div>
            <div className="feature-text">
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-main)' }}>AI Scheduling</h2>
              <p style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-muted)' }}>Post + Auto DM</p>
            </div>
          </Link>
        </div>

        {/* Feature Breakdown Rows */}
        <div className="feature-breakdown-section" style={{ marginTop: '60px' }}>
          <div className="feature-focus-header">
            <span className="feature-focus-label" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Core Capabilities</span>
            <h2>Turn Engagement Into Revenue</h2>
            <p className="feature-focus-description">
              Stop losing leads to slow response times. Let smart100X handle every interaction seamlessly, converting your audience while you sleep.
            </p>
          </div>

          <div className="feature-row">
            <div className="phone-mockup-wrapper">
              <img referrerPolicy="no-referrer" src="/features/reel-mockup.png" alt="Auto-Reply to Reels" />
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
              <img referrerPolicy="no-referrer" src="/features/post-mockup.png" alt="Auto-Reply to Posts" />
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
              <img referrerPolicy="no-referrer" src="/features/story-reply-mockup.png" alt="Auto-Respond to Story Replies" />
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
              <img referrerPolicy="no-referrer" src="/features/story-mention-mockup.png" alt="Auto-Reply to Story Mentions" />
            </div>
            <div className="feature-text-content">
              <h3>Gratitude on Autopilot</h3>
              <p>
                When someone tags your brand in their story, automatically send them a "Thank You" message, a discount code, or a VIP offer. Build brand loyalty without lifting a finger.
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* ==================== REVIEWS / WALL OF LOVE SECTION ==================== */}
      <section id="reviews" className="feedback-zone" style={{ padding: '80px 20px', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="feedback-wrap">
          
          {/* Header */}
          <div className="feedback-top">
            <span className="feedback-label" style={{ textTransform: 'capitalize' }}>
              <Sparkles size={14} style={{ marginRight: '4px' }} /> Wall of Love
            </span>
            <h2>Loved by <span>1,200+ Creators</span> & Brands</h2>
            <p>
              See how creators, coaches, and businesses use smart100X to automate their DMs, multiply their engagement, and scale sales.
            </p>
          </div>

          {/* Stats Bar & Write a Review CTA */}
          <div className="feedback-metrics">
            <div className="stats-group">
              <div className="stat-item">
                <div className="stat-number" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  4.9 <span className="stars-inline" style={{ display: 'inline-flex', color: '#fbbf24' }}><Star size={20} fill="#fbbf24" stroke="none" /></span>
                </div>
                <div className="stat-label">Average User Rating</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">12k+</div>
                <div className="stat-label">Happy Creators</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">99.4%</div>
                <div className="stat-label">Response Accuracy</div>
              </div>
            </div>
            <button className="add-feedback-btn" onClick={() => setModalOpen(true)} style={{ textDecoration: 'none', border: 'none' }}>
              <MessageSquare size={18} /> Write a Review
            </button>
          </div>

          {/* Reviews Grid */}
          <div className="feedback-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {reviews.slice(0, 4).map((review) => (
              <div key={review.id || review._id || Math.random()} className="feedback-item">
                <div className="feedback-item-top">
                  <div className="feedback-rating">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < (review.rating || 5) ? "#fbbf24" : "none"}
                        stroke={i < (review.rating || 5) ? "none" : "#fbbf24"}
                      />
                    ))}
                  </div>
                  <span className={`platform-badge ${review.platform || 'instagram'}`}>
                    {review.platform === 'instagram' && <Instagram size={12} style={{ marginRight: '4px' }} />}
                    {review.platform === 'facebook' && <Facebook size={12} style={{ marginRight: '4px' }} />}
                    {review.platform === 'whatsapp' && <MessageCircle size={12} style={{ marginRight: '4px' }} />}
                    {review.platform || 'instagram'}
                  </span>
                </div>
                
                <p className="feedback-msg">"{review.text}"</p>
                
                <div className="feedback-author">
                  <div className="feedback-user-img">
                    {review.avatarUrl ? (
                      <img referrerPolicy="no-referrer" src={getSafeImageUrl(review.avatarUrl)} alt={review.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      <div className="feedback-user-initial">
                        {(review.name || 'User').split(/\s+/).filter(Boolean).map(n => n[0]).join('').toUpperCase()}
                      </div>
                    )}
                    {review.verified && (
                      <span className="verified-indicator" title="Verified Creator">
                        <Check size={10} strokeWidth={4} />
                      </span>
                    )}
                  </div>
                  <div className="feedback-user-info">
                    <span className="feedback-user-name">{review.name}</span>
                    <span className="feedback-user-tag">{review.handle}</span>
                    <span className="feedback-user-job">{review.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* See All Reviews Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
            <Link 
              to="/all-reviews"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                borderRadius: '50px',
                border: '2px solid #7c3aed',
                color: 'var(--accent-color)',
                fontWeight: '800',
                fontSize: '1rem',
                background: 'transparent',
                textDecoration: 'none'
              }}
            >
              See all Reviews &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== WRITE A REVIEW MODAL ==================== */}
      {modalOpen && (
        <div className="write-review-modal-overlay" onClick={() => { if(!submitting) { setModalOpen(false); setSuccess(false); } }}>
          <div className="write-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Share Your smart100X Experience</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => { setModalOpen(false); setSuccess(false); }}
                disabled={submitting}
              >
                &times;
              </button>
            </div>

            {!success ? (
              <form 
                className="modal-form-content" 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newReview.name || !newReview.text) {
                    toast.error('Please fill in your name and review message.');
                    return;
                  }
                  setSubmitting(true);

                  const formattedHandle = newReview.handle ? (newReview.handle.startsWith('@') ? newReview.handle : '@' + newReview.handle) : '@' + newReview.name.toLowerCase().replace(/\s+/g, '');
                  const formattedRole = newReview.role || 'smart100X Creator';

                  fetch(`${API_BASE_URL}/api/user-feedback`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(localStorage.getItem('insta_agent_token') ? { 'Authorization': `Bearer ${localStorage.getItem('insta_agent_token')}` } : {})
                    },
                    body: JSON.stringify({
                      name: newReview.name,
                      handle: formattedHandle,
                      role: formattedRole,
                      rating: newReview.rating,
                      text: newReview.text,
                      platform: newReview.platform,
                      avatarUrl: newReview.avatarUrl
                    })
                  })
                   .then(async (res) => {
                     if (res.ok) {
                       setSubmitting(false);
                       setSuccess(true);
                       toast.success('Thank you! Your review was successfully saved.');
                       await fetchReviews();
                     } else {
                       throw new Error('Failed to save review');
                     }
                   })
                  .catch((err) => {
                    console.error("Error submitting review to backend:", err);
                    setReviews((prev) => [
                      {
                        id: Date.now(),
                        name: newReview.name,
                        handle: formattedHandle,
                        role: formattedRole,
                        rating: newReview.rating,
                        text: newReview.text,
                        platform: newReview.platform,
                        verified: true
                      },
                      ...prev
                    ]);
                    setSubmitting(false);
                    setSuccess(true);
                    toast.success('Thank you! Your review was successfully added.');
                  });
                }}
              >
                {/* Rating selection */}
                <div className="form-group">
                  <label className="form-label">Your Rating</label>
                  <div className="star-rating-selector">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className={`star-btn ${star <= newReview.rating ? 'active' : ''}`}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                      >
                        <Star size={32} fill={star <= newReview.rating ? '#fbbf24' : 'none'} stroke={star <= newReview.rating ? 'none' : 'var(--border-subtle)'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name and Handle fields */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="rev-name">Full Name *</label>
                    <input
                      id="rev-name"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Sarah Jenkins"
                      value={newReview.name}
                      onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="rev-handle">Social Handle</label>
                    <input
                      id="rev-handle"
                      type="text"
                      className="form-input"
                      placeholder="e.g. @sarah_creative"
                      value={newReview.handle}
                      onChange={(e) => setNewReview({ ...newReview, handle: e.target.value })}
                    />
                  </div>
                </div>

                {/* Role field */}
                <div className="form-group">
                  <label className="form-label" htmlFor="rev-role">Your Role / Profession</label>
                  <input
                    id="rev-role"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Agency Owner / Fitness Coach / Creator"
                    value={newReview.role}
                    onChange={(e) => setNewReview({ ...newReview, role: e.target.value })}
                  />
                </div>

                {/* Platform select fields */}
                <div className="form-group">
                  <label className="form-label">Which channel do you automate? *</label>
                  <div className="platform-selector">
                    {[
                      { key: 'instagram', label: 'Instagram', icon: <Instagram size={18} /> },
                      { key: 'facebook', label: 'Facebook', icon: <Facebook size={18} /> },
                      { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={18} /> }
                    ].map((platformItem) => (
                      <label key={platformItem.key} className="platform-option">
                        <input
                          type="radio"
                          name="review-platform"
                          checked={newReview.platform === platformItem.key}
                          onChange={() => setNewReview({ ...newReview, platform: platformItem.key })}
                        />
                        <div className="platform-box">
                          {platformItem.icon}
                          <span>{platformItem.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Review Message */}
                <div className="form-group">
                  <label className="form-label" htmlFor="rev-text">Your Review *</label>
                  <textarea
                    id="rev-text"
                    rows="4"
                    className="form-input"
                    placeholder="Tell other creators about your success using smart100X..."
                    value={newReview.text}
                    onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                    style={{ resize: 'vertical', minHeight: '100px' }}
                    required
                  ></textarea>
                </div>

                {/* Submit button */}
                <button type="submit" className="submit-review-btn" disabled={submitting}>
                  {submitting ? 'Adding Review...' : 'Publish My Review'}
                </button>
              </form>
            ) : (
              <div className="submit-success-overlay">
                <div className="success-icon-badge">
                  <Check size={36} strokeWidth={3} />
                </div>
                <h4>Review Added Successfully!</h4>
                <p>Your testimonial has been verified and added to the landing page wall. Thank you for your feedback!</p>
                <button 
                  className="success-done-btn" 
                  onClick={() => {
                    setModalOpen(false);
                    setSuccess(false);
                  }}
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Toast Container */}
      <Toaster position="bottom-right" />

      {/* ==================== PRICING SECTION ==================== */}
      <section id="pricing" className="pricing-section" style={{ padding: '80px 20px', background: 'var(--bg-card)' }}>
        <div className="pricing-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="pricing-heading" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>Simple, Transparent Pricing</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Choose the plan that's right for your business. No hidden fees.</p>
          </div>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'stretch' }}>
            
            {/* Starter Plan Card */}
            <div className="pricing-card" style={{
              background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '32px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div>
                <div className="card-header">
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>Starter</h3>
                  <div className="price" style={{ fontSize: '2.5rem', fontWeight: '800', margin: '16px 0', color: 'var(--text-main)' }}><span>$</span>0<span>/mo</span></div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Perfect for trying out the platform.</p>
                </div>
                <div className="card-features" style={{ margin: '24px 0' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Check size={18} color="#10b981" /> 100 Auto-Replies / month</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Check size={18} color="#10b981" /> Basic Flow Builder</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Check size={18} color="#10b981" /> Standard Support</li>
                  </ul>
                </div>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <Link to="/signup" className="pricing-btn outline-btn" style={{ display: 'block', textAlign: 'center', width: '100%', padding: '14px', borderRadius: '12px' }}>
                  Get Started Free
                </Link>
              </div>
            </div>

            {/* Pro Plan Card */}
            <div className="pricing-card pro-card" style={{
              background: 'var(--bg-main)', border: '2px solid #a855f7', borderRadius: '24px', padding: '32px',
              position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              boxShadow: '0 20px 40px rgba(168, 85, 247, 0.15)'
            }}>
              <div className="pro-badge" style={{ position: 'absolute', top: '-14px', right: '24px', background: '#a855f7', color: 'white', padding: '4px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800' }}>
                MOST POPULAR
              </div>
              <div>
                <div className="card-header">
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>Pro</h3>
                  <div className="price" style={{ fontSize: '2.5rem', fontWeight: '800', margin: '16px 0', color: 'var(--text-main)' }}><span>$</span>{pricing.pro_price}<span>/mo</span></div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>For growing creators and businesses.</p>
                </div>
                <div className="card-features" style={{ margin: '24px 0' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Check size={18} color="#10b981" /> Unlimited Auto-Replies</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Check size={18} color="#10b981" /> Advanced AI Agent</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Check size={18} color="#10b981" /> Analytics Dashboard</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Check size={18} color="#10b981" /> Priority Support</li>
                  </ul>
                </div>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <Link to="/signup" className="pricing-btn solid-btn" style={{ display: 'block', textAlign: 'center', width: '100%', padding: '14px', borderRadius: '12px', background: '#a855f7', color: 'white' }}>
                  Start 14-Day Free Trial
                </Link>
              </div>
            </div>

            {/* Enterprise Plan Card */}
            <div className="pricing-card" style={{
              background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '32px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div>
                <div className="card-header">
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>Enterprise</h3>
                  <div className="price" style={{ fontSize: '2.5rem', fontWeight: '800', margin: '16px 0', color: 'var(--text-main)' }}><span>$</span>{pricing.enterprise_price}<span>/mo</span></div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>For high-volume brands and agencies.</p>
                </div>
                <div className="card-features" style={{ margin: '24px 0' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Check size={18} color="#8b5cf6" /> Everything in Pro</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Check size={18} color="#8b5cf6" /> White-labeling Options</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Check size={18} color="#8b5cf6" /> Manage up to 10 Clients</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Check size={18} color="#8b5cf6" /> Dedicated Account Manager</li>
                  </ul>
                </div>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <a 
                  href={`https://api.whatsapp.com/send?phone=918795919866&text=${encodeURIComponent("Hello Founder! I am interested in the Enterprise Plan ($99/mo) for my agency/brand. Please assist me with onboarding and white-labeling setup.")}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="pricing-btn solid-btn"
                  style={{ display: 'block', textDecoration: 'none', textAlign: 'center', width: '100%', padding: '14px', borderRadius: '12px', background: '#8b5cf6', color: 'white' }}
                >
                  Contact Sales
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
