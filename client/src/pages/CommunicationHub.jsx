import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, MessageSquare, ArrowRight, Link2, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function CommunicationHub() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const token = localStorage.getItem('insta_agent_token');
        const res = await fetch(`${API_BASE_URL}/api/workspaces`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWorkspaces(data);
          const activeId = localStorage.getItem('active_workspace_id');
          const active = data.find(w => w._id === activeId || w.id === activeId) || data[0];
          setActiveWorkspace(active);
        }
      } catch (err) {
        console.error('Error fetching workspaces:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  const platforms = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      icon: MessageCircle,
      desc: 'Automate customer support and sales via WhatsApp APIs.',
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      isConnected: activeWorkspace?.isWhatsAppConnected
    },
    {
      id: 'telegram',
      name: 'Telegram Bot',
      icon: Send,
      desc: 'Build powerful interactive bots for your Telegram communities.',
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
      isConnected: activeWorkspace?.isTelegramConnected
    },
    {
      id: 'discord',
      name: 'Discord Bot',
      icon: MessageSquare,
      desc: 'Manage and automate your Discord server engagement.',
      color: '#8b5cf6',
      bgGradient: 'linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%)',
      isConnected: activeWorkspace?.isDiscordConnected
    }
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="loader"></div>
      <style>{`
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>;
  }

  return (
    <div style={{
      padding: '40px',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#fafafa',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      {/* Hero Header Area without 'Overview' text */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '24px',
        padding: '48px',
        color: 'white',
        marginBottom: '48px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '32px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '16px', backdropFilter: 'blur(10px)' }}>
              <Sparkles size={16} color="#fbbf24" /> Next-Gen Automation
            </div>
            <h1 style={{ margin: '0 0 16px 0', fontSize: '2.8rem', fontWeight: '800', letterSpacing: '-1px', lineHeight: '1.2' }}>
              Communication Hub
            </h1>
            <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.85, maxWidth: '500px', lineHeight: '1.6' }}>
              Manage your conversational workflows, send bulk broadcasts, and engage with users across multiple channels seamlessly.
            </p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', width: '300px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="#fbbf24" /> Quick Stats
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ opacity: 0.7 }}>Connected Channels</span>
              <span style={{ fontWeight: '700' }}>{platforms.filter(p => p.isConnected).length} / {platforms.length}</span>
            </div>
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(platforms.filter(p => p.isConnected).length / platforms.length) * 100}%`, background: 'linear-gradient(90deg, #3b82f6, #10b981)', height: '100%', borderRadius: '3px' }}></div>
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '24px' }}>
        {platforms.filter(p => p.isConnected).length > 0 ? 'Active Channels' : 'Get Started'}
      </h2>
      
      {/* Platform Cards Grid */}
      {platforms.filter(p => p.isConnected).length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {platforms.filter(p => p.isConnected).map(platform => (
            <div key={platform.id} style={{
              background: 'white',
              borderRadius: '24px',
              border: '1px solid #e2e8f0',
              padding: '32px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = `0 20px 25px -5px ${platform.color}22, 0 10px 10px -5px ${platform.color}11`;
              e.currentTarget.style.borderColor = platform.color;
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: platform.bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                  <platform.icon size={32} color="white" />
                </div>
                
                {platform.isConnected && (
                  <div style={{ background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> CONNECTED
                  </div>
                )}
              </div>

              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>{platform.name}</h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '0.95rem', color: '#64748b', lineHeight: '1.5', minHeight: '44px' }}>
                {platform.desc}
              </p>

              <button 
                onClick={() => {
                  if (platform.isConnected) {
                    navigate(`/autoops/${platform.id}`);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#f8fafc',
                  color: platform.color,
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = `${platform.color}11`;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = '#f8fafc';
                }}>
                Configure AutoOps <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          padding: '48px 32px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          maxWidth: '600px',
          margin: '40px auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '8px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)' }}>
              <MessageCircle size={28} />
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2)' }}>
              <Send size={28} />
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.2)' }}>
              <MessageSquare size={28} />
            </div>
          </div>
          
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
              Connect Your Channels
            </h3>
            <p style={{ margin: 0, fontSize: '1rem', color: '#64748b', lineHeight: '1.6', maxWidth: '460px' }}>
              You don't have any channels connected to this workspace yet. Link your WhatsApp Business, Telegram Bot, or Discord Bot to start automating.
            </p>
          </div>
          
          <button
            onClick={() => navigate('/connections')}
            style={{
              padding: '14px 28px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              fontWeight: '700',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 15px 20px -3px rgba(59, 130, 246, 0.4)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.3)';
            }}
          >
            Go to Connections <Link2 size={18} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
