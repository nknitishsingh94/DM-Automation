import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Zap, Target, ArrowRight } from 'lucide-react';
import Footer from '../../components/Footer';

export default function CommentToDM() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Navbar */}
      <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <img src="/zenxchat-logo.png" alt="Logo" style={{ width: '32px', height: '32px' }} />
          <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '800' }}>smart10X</span>
        </Link>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/login" style={{ color: '#a3a3a3', textDecoration: 'none', fontWeight: '600' }}>Log In</Link>
          <Link to="/signup" style={{ color: '#fff', background: '#3b82f6', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700' }}>Get Started</Link>
        </div>
      </header>

      {/* Hero Section */}
      <div style={{ padding: '100px 20px', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '24px' }}>
          <Zap size={14} /> The Ultimate Automation
        </div>
        <h1 style={{ fontSize: '4rem', fontWeight: '900', lineHeight: '1.1', marginBottom: '24px', background: 'linear-gradient(to right, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Turn Comments into <br /> Conversations & Sales
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#9ca3af', lineHeight: '1.6', marginBottom: '40px', maxWidth: '700px', margin: '0 auto 40px auto' }}>
          Automatically send a personalized Direct Message to anyone who comments on your Instagram or Facebook posts. Maximize engagement without lifting a finger.
        </p>
        <Link to="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#fff', color: '#000', padding: '16px 32px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '800', textDecoration: 'none', transition: 'transform 0.2s' }}>
          Start Automating Free <ArrowRight size={20} />
        </Link>
      </div>

      {/* Features Grid */}
      <div style={{ padding: '60px 40px', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', borderRadius: '24px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <MessageSquare size={30} color="#c084fc" />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px' }}>Instant Replies</h3>
          <p style={{ color: '#9ca3af', lineHeight: '1.6' }}>Respond in seconds. Send links, resources, or greetings instantly when someone triggers your set keyword in a comment.</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', borderRadius: '24px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <Target size={30} color="#f472b6" />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px' }}>Keyword Triggers</h3>
          <p style={{ color: '#9ca3af', lineHeight: '1.6' }}>Set specific words like "LINK" or "PDF". The automation only fires when the exact intent is shown by the user.</p>
        </div>

      </div>

      <Footer />
    </div>
  );
}
