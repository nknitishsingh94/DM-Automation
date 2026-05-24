import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Instagram, MessageCircle, Phone, ArrowRight, Settings as SettingsIcon, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const PlatformHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('insta_agent_token');
        const res = await fetch(`${API_BASE_URL}/api/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Automate DMs, Story replies, and Comments on your Instagram account.',
      icon: <Instagram size={40} />,
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
      isConnected: settings && (settings.isAccountConnected || (settings.instagramAccessToken && settings.businessAccountId)),
      accountName: settings?.connectedInstagramName || 'Instagram Account'
    },
    {
      id: 'facebook',
      name: 'Facebook Messenger',
      description: 'Engage with your Facebook Page audience via automated Messenger replies.',
      icon: <MessageCircle size={40} />,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
      isConnected: settings && (settings.isFacebookConnected || (settings.facebookAccessToken && settings.facebookPageId)),
      accountName: settings?.connectedFacebookName || 'Facebook Page'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Build powerful chat flows and trigger automated responses on WhatsApp.',
      icon: <Phone size={40} />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      isConnected: settings && (settings.isWhatsAppConnected || (settings.whatsappToken && settings.whatsappPhoneNumberId)),
      accountName: 'WhatsApp Account'
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: '#7c3aed', borderRadius: '50%' }}></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '800', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <Zap size={16} /> Automation Suite
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', marginBottom: '16px', letterSpacing: '-1px' }}>
          Platform Hub
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          Select a connected platform to access its dedicated automation workspace and analytics.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {platforms.map((platform) => (
          <div 
            key={platform.id}
            onClick={() => {
              if (platform.isConnected) {
                navigate(`/platform/${platform.id}`);
              } else {
                navigate('/settings');
              }
            }}
            style={{ 
              background: '#ffffff',
              borderRadius: '24px',
              border: platform.isConnected ? `1px solid ${platform.color}40` : '1px solid #e2e8f0',
              padding: '32px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: platform.isConnected ? `0 10px 40px -10px ${platform.color}30` : '0 10px 30px -10px rgba(0,0,0,0.05)',
              transform: 'translateY(0)',
              filter: platform.isConnected ? 'none' : 'grayscale(100%) opacity(0.7)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = platform.isConnected ? `0 20px 40px -10px ${platform.color}40` : '0 20px 30px -10px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = platform.isConnected ? `0 10px 40px -10px ${platform.color}30` : '0 10px 30px -10px rgba(0,0,0,0.05)';
            }}
          >
            {/* Background Glow */}
            {platform.isConnected && (
              <div style={{ 
                position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', 
                background: platform.gradient, opacity: 0.1, borderRadius: '50%', filter: 'blur(30px)' 
              }}></div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '20px', 
                background: platform.isConnected ? platform.gradient : '#f1f5f9', 
                color: platform.isConnected ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: platform.isConnected ? `0 10px 20px -5px ${platform.color}50` : 'none'
              }}>
                {platform.icon}
              </div>
              
              {platform.isConnected ? (
                <div style={{ padding: '6px 12px', background: `${platform.color}15`, color: platform.color, borderRadius: '50px', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: platform.color }}></div>
                  Connected
                </div>
              ) : (
                <div style={{ padding: '6px 12px', background: '#f1f5f9', color: '#64748b', borderRadius: '50px', fontSize: '0.75rem', fontWeight: '800' }}>
                  Not Connected
                </div>
              )}
            </div>

            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                {platform.name}
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: '1.5', marginBottom: '24px' }}>
                {platform.description}
              </p>

              {platform.isConnected ? (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Active Account</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>{platform.accountName}</span>
                  </div>
                  <ArrowRight size={20} color={platform.color} />
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: '700', fontSize: '0.9rem' }}>
                    <SettingsIcon size={18} /> Connect in Settings
                  </div>
                  <ArrowRight size={20} color="#94a3b8" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlatformHub;
