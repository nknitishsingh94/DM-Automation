import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Facebook, Instagram, Youtube, Linkedin, Globe } from 'lucide-react';

export default function Footer() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  return (
    <footer className="landing-footer">
      <div className="footer-top">
        <div className="footer-col brand-col">
          <h2 className="footer-logo">ZenXchat</h2>
          <p className="made-in">Made with <Heart className="heart-icon" size={14} fill="red" color="red" /> in India.</p>
          <div className="footer-socials">
            <a href="#" className="social-link fb"><Facebook size={20} /></a>
            <a href="https://www.instagram.com/zenxchat/" target="_blank" rel="noopener noreferrer" className="social-link ig" style={{ width: 'auto', padding: '0 12px', borderRadius: '20px', gap: '8px' }}>
              <Instagram size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>@zenxchat</span>
            </a>
            <a href="#" className="social-link yt"><Youtube size={20} /></a>
            <a href="#" className="social-link li"><Linkedin size={20} /></a>
          </div>
          {!isLandingPage && (
            <div style={{ marginTop: '24px' }}>
              <Link to="/" className="back-home-footer">
                <span style={{ marginRight: '8px' }}>←</span> Back to Home
              </Link>
            </div>
          )}
        </div>

        <div className="footer-col">
          <Link to="/about" style={{ textDecoration: 'none' }}>
            <h3 style={{ cursor: 'pointer' }}>Company</h3>
          </Link>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><a href="/#pricing">Pricing</a></li>
            <li><a href="#">Legal</a></li>
            <li><a href="https://www.instagram.com/zenxchat/" target="_blank" rel="noopener noreferrer">Instagram: @zenxchat</a></li>
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
          <Link to="/resources" style={{ textDecoration: 'none' }}>
            <h3 style={{ cursor: 'pointer' }}>Resources</h3>
          </Link>
          <ul>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/help">Help & Support</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="copyright">&copy; 2026 ZenXchat. All rights reserved</p>
        <div className="footer-legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Statement</a>
        </div>
      </div>
    </footer>
  );
}
