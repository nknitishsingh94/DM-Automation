import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, GitBranch, AlertCircle, Sparkles, ChevronRight, MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am the smart100X AI assistant. How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMsg = { role: 'user', content: message };
    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages.slice(-5)
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again or email smart100x.support@gmail.com' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="help-page-container">
      {/* Top Gradient Background */}
      <div className="help-hero-bg">
        <header className="help-header">
          <div className="help-logo">
            <span>smart100X</span>
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
        <div className="help-start-box">
          <h2>Start Here</h2>
          <div className="help-start-links">
            <Link to="/settings" className="help-start-link">
              <span>Setup Guide: Linking Instagram Business</span>
              <ChevronRight size={18} color='var(--accent-color)' />
            </Link>
            <Link to="/settings" className="help-start-link">
              <span>Setting up WhatsApp Cloud API for Automations</span>
              <ChevronRight size={18} color='var(--accent-color)' />
            </Link>
            <Link to="#" className="help-start-link">
              <span>smart100X — Official Meta Partner onboarding roadmap</span>
              <ChevronRight size={18} color='var(--accent-color)' />
            </Link>
          </div>
        </div>

        <div className="help-grid">
          <Link to="/blog" className="help-grid-card">
            <div className="help-card-icon"><BookOpen size={24} /></div>
            <h3>Getting Started</h3>
            <p>Get started with the essentials and learn the core features in minutes</p>
            <span className="help-article-count">1 article</span>
          </Link>

          <Link to="/hub" className="help-grid-card">
            <div className="help-card-icon"><GitBranch size={24} /></div>
            <h3>Automations</h3>
            <p>Understand how to set up and manage DM automation</p>
            <span className="help-article-count">5 articles</span>
          </Link>

          <Link to="/contact" className="help-grid-card">
            <div className="help-card-icon"><AlertCircle size={24} /></div>
            <h3>Troubleshooting Common Issues</h3>
            <p>Step-by-step solutions for the most frequent problems users face</p>
            <span className="help-article-count">12 articles</span>
          </Link>

          <Link to="/blog" className="help-grid-card">
            <div className="help-card-icon"><Sparkles size={24} /></div>
            <h3>What's New</h3>
            <p>See the latest features, improvements, & updates shipped</p>
            <span className="help-article-count">4 articles</span>
          </Link>
        </div>
      </div>
      
      {/* REAL AI CHAT WIDGET */}
      <div className={`ai-chat-window ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="ai-avatar">🤖</div>
            <div>
              <h4>smart100X AI Support</h4>
              <p>Always online</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="close-chat"><X size={20} /></button>
        </div>

        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`msg-bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {isLoading && (
            <div className="msg-bubble assistant typing">
              <Loader2 size={16} className="animate-spin" /> Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <input 
            type="text" 
            placeholder="Type your question..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={isLoading || !message.trim()} className="send-btn">
            <Send size={18} />
          </button>
        </div>
      </div>

      <div className="help-chat-widget" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} color="white" /> : <MessageCircle size={24} color="white" />}
        {!isOpen && <span className="widget-badge">1</span>}
      </div>

      <style>{`
        .ai-chat-window {
          position: fixed;
          bottom: 100px;
          right: 30px;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1000;
          transform: translateY(20px);
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ai-chat-window.open {
          transform: translateY(0);
          opacity: 1;
          pointer-events: all;
        }
        .chat-header {
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          padding: 20px;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chat-header-info { display: flex; gap: 12px; align-items: center; }
        .ai-avatar { width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; alignItems: center; justifyContent: center; fontSize: 20px; }
        .chat-header h4 { margin: 0; font-size: 15px; font-weight: 700; }
        .chat-header p { margin: 0; font-size: 11px; opacity: 0.8; }
        .close-chat { background: none; border: none; color: white; cursor: pointer; }
        
        .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; background: #f8fafc; }
        .msg-bubble { padding: 12px 16px; border-radius: 18px; max-width: 80%; font-size: 13.5px; line-height: 1.5; }
        .msg-bubble.assistant { background: white; color: #1e293b; align-self: flex-start; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }
        .msg-bubble.user { background: #7c3aed; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
        .typing { display: flex; align-items: center; gap: 8px; font-style: italic; color: #64748b; }
        
        .chat-input-area { padding: 16px; background: white; border-top: 1px solid #f1f5f9; display: flex; gap: 10px; }
        .chat-input-area input { flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; font-size: 13.5px; outline: none; transition: border 0.2s; }
        .chat-input-area input:focus { border-color: #7c3aed; }
        .send-btn { background: #7c3aed; color: white; border: none; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justifyContent: center; cursor: pointer; transition: all 0.2s; }
        .send-btn:hover { background: #6d28d9; transform: scale(1.05); }
        .send-btn:disabled { background: #e2e8f0; cursor: not-allowed; }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
