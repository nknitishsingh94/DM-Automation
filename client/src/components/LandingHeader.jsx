import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, ArrowRight } from 'lucide-react';

export default function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: isScrolled ? '12px 0' : '20px 0',
      background: isScrolled ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
      backdropFilter: isScrolled ? 'blur(20px)' : 'none',
      borderBottom: isScrolled ? '1px solid rgba(0,0,0,0.05)' : 'none',
      transition: 'all 0.3s ease'
    }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/zenxchat-logo.png" alt="Logo" style={{ height: '32px' }} onError={(e) => { e.target.style.display = 'none'; }} />
          <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>smart10X</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link to="/about" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b', textDecoration: 'none' }}>About</Link>
          <a href="/#features" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b', textDecoration: 'none' }}>Features</a>
          <Link to="/resources" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b', textDecoration: 'none' }}>Resources</Link>
        </nav>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <Link to="/dashboard" style={{
              background: '#0f172a', color: 'white', padding: '8px 20px', borderRadius: '10px',
              fontSize: '0.9rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', textDecoration: 'none', padding: '0 12px' }}>Sign In</Link>
              <Link to="/signup" style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', color: 'white', padding: '10px 24px', borderRadius: '12px',
                fontSize: '0.9rem', fontWeight: '800', textDecoration: 'none', boxShadow: '0 10px 20px rgba(124, 58, 237, 0.2)'
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
