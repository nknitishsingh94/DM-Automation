import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Facebook, Instagram, Youtube, Linkedin, Globe } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Footer() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  return (
    <footer className="landing-footer">
      <div className="footer-top">
        <div className="footer-col brand-col">
          <h2 className="footer-logo">smart10X</h2>
          <p className="made-in">Made with <Heart className="heart-icon" size={14} fill="red" color="red" /> in India.</p>
          <div className="footer-socials">
            <a href="#" className="social-link fb"><Facebook size={20} /></a>
            <a href="https://www.instagram.com/smart10Xchat/" target="_blank" rel="noopener noreferrer" className="social-link ig" style={{ width: 'auto', padding: '0 12px', borderRadius: '20px', gap: '8px' }}>
              <Instagram size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>@smart10Xchat</span>
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
            <li><a href="https://www.instagram.com/smart10Xchat/" target="_blank" rel="noopener noreferrer">Instagram: @smart10Xchat</a></li>
          </ul>
        </div>


        <div className="footer-col">
          <h3>Features</h3>
          <ul>
            <li><Link to="/hub">Comment-to-DM</Link></li>
            <li><Link to="/hub">Grow your Followers</Link></li>
            <li><Link to="/hub">Never Miss a Comment</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <Link to="/resources" style={{ textDecoration: 'none' }}>
            <h3 style={{ cursor: 'pointer' }}>Resources</h3>
          </Link>
          <ul>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/help">Help & Support</Link></li>
            <li><a href={`${API_BASE_URL}/api-docs`} target="_blank" rel="noopener noreferrer" style={{display:'flex', alignItems:'center'}}>Developer API Docs <span style={{fontSize:'9px', background:'#ec4899', color:'white', padding:'2px 6px', borderRadius:'4px', marginLeft:'6px', fontWeight:'bold'}}>NEW</span></a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="copyright">&copy; 2026 smart10X. All rights reserved</p>
        <div className="footer-legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <a href="#">Cookie Statement</a>
        </div>
      </div>
    </footer>
  );
}
