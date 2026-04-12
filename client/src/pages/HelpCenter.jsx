import React from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, GitBranch, AlertCircle, Sparkles, ChevronRight, MessageSquare } from 'lucide-react';

export default function HelpCenter() {
  return (
    <div className="help-page-container">
      {/* Top Gradient Background */}
      <div className="help-hero-bg">
        <header className="help-header">
          <div className="help-logo">
            <img src="/zenxchat-logo.png" alt="ZenXchat Logo" style={{ filter: 'brightness(0) invert(1)' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <span>ZenXchat</span>
          </div>
          <nav className="help-nav">
            <Link to="/#pricing">Pricing</Link>
            <Link to="/login">Sign In</Link>
            <span>English</span>
          </nav>
        </header>

        <div className="help-hero-content">
          <h1>How can we help?</h1>
          <div className="help-search-container">
            <Search className="help-search-icon" size={20} />
            <input type="text" placeholder="Search for articles..." className="help-search-input" />
          </div>
        </div>
      </div>

      <div className="help-main-content">
        {/* Start Here Box */}
        <div className="help-start-box">
          <h2>Start Here</h2>
          <div className="help-start-links">
            <Link to="#" className="help-start-link">
              <span>Introducing AI FAQs</span>
              <ChevronRight size={18} color="#7c3aed" />
            </Link>
            <Link to="#" className="help-start-link">
              <span>ZenXchat — Official Meta Partner</span>
              <ChevronRight size={18} color="#7c3aed" />
            </Link>
          </div>
        </div>

        {/* 2x2 Grid Categories */}
        <div className="help-grid">
          <Link to="#" className="help-grid-card">
            <div className="help-card-icon">
              <BookOpen size={24} />
            </div>
            <h3>Getting Started</h3>
            <p>Get started with the essentials and learn the core features in minutes</p>
            <span className="help-article-count">1 article</span>
          </Link>

          <Link to="#" className="help-grid-card">
            <div className="help-card-icon">
              <GitBranch size={24} />
            </div>
            <h3>Automations</h3>
            <p>Understand how to set up and manage DM automation</p>
            <span className="help-article-count">5 articles</span>
          </Link>

          <Link to="#" className="help-grid-card">
            <div className="help-card-icon">
              <AlertCircle size={24} />
            </div>
            <h3>Troubleshooting Common Issues</h3>
            <p>Step-by-step solutions for the most frequent problems users face</p>
            <span className="help-article-count">12 articles</span>
          </Link>

          <Link to="#" className="help-grid-card">
            <div className="help-card-icon">
              <Sparkles size={24} />
            </div>
            <h3>What's New</h3>
            <p>See the latest features, improvements, & updates shipped</p>
            <span className="help-article-count">4 articles</span>
          </Link>
        </div>
      </div>
      
      {/* Chat floating widget UI Mockup */}
      <div className="help-chat-widget">
        <MessageSquare size={24} fill="white" color="white" style={{ border: 'none' }} />
        <span className="widget-badge">1</span>
      </div>
    </div>
  );
}
