import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Instagram, MessageCircle, Phone, ArrowRight, Settings as SettingsIcon, Zap, MessageSquare, Youtube, Linkedin, MapPin, Twitter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';

const MessageOnlyHub = () => {
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
      name: 'WhatsApp',
      description: 'Automate WhatsApp Business messages, auto-replies, and customer flows.',
      icon: <MessageSquare size={40} />,
      color: '#25d366',
      gradient: 'linear-gradient(135deg, #25d366, #128C7E)',
      isConnected: settings && (settings.isWhatsAppConnected || (settings.whatsappToken && settings.whatsappPhoneNumberId)),
      accountName: settings?.connectedWhatsAppName || 'WhatsApp Business'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      description: 'Automate uploads and manage your YouTube channel content.',
      icon: <Youtube size={40} />,
      color: '#ff0000',
      gradient: 'linear-gradient(135deg, #ff0000, #dc2626)',
      isConnected: settings && (settings.isYouTubeConnected || settings.isYoutubeConnected),
      accountName: settings?.connectedYouTubeName || settings?.youtubeChannelName || 'YouTube Channel'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'Automate posts and engagement on your LinkedIn profile.',
      icon: <Linkedin size={40} />,
      color: '#0077b5',
      gradient: 'linear-gradient(135deg, #0077b5, #0284c7)',
      isConnected: settings && settings.isLinkedInConnected,
      accountName: settings?.connectedLinkedInName || 'LinkedIn Member'
    },
    {
      id: 'google-business',
      name: 'Google Business',
      description: 'Manage reviews and automate your Google Business Profile.',
      icon: <MapPin size={40} />,
      color: '#4285f4',
      gradient: 'linear-gradient(135deg, #4285f4, #3b82f6)',
      isConnected: settings && settings.isGoogleBusinessConnected,
      accountName: settings?.connectedGoogleBusinessName || 'Google Profile'
    },
    {
      id: 'twitter',
      name: 'Twitter / X',
      description: 'Automate tweets and engage with your audience on X.',
      icon: <Twitter size={40} />,
      color: '#0f1419',
      gradient: 'linear-gradient(135deg, #0f1419, #334155)',
      isConnected: settings && settings.isTwitterConnected,
      accountName: settings?.connectedTwitterName || 'Twitter User'
    },


    {
      id: 'telegram',
      name: 'Telegram',
      description: 'Automate messages and manage your Telegram bots.',
      icon: <MessageCircle size={40} />,
      color: '#0088cc',
      gradient: 'linear-gradient(135deg, #0088cc, #005580)',
      isConnected: settings && settings.isTelegramConnected,
      accountName: settings?.connectedTelegramName || 'Telegram Bot'
    }
  ];

  if (loading) return <LoadingSpinner minHeight="60vh" />;

  const messageIds = ['whatsapp', 'youtube', 'linkedin', 'google-business', 'twitter'];
  const connectedPlatforms = platforms.filter(p => p.isConnected && messageIds.includes(p.id));

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
      </div>

      {connectedPlatforms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <SettingsIcon size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>No Platforms Connected</h2>
          <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            You haven't connected any social media accounts yet. Head over to settings to connect Instagram or Facebook to get started.
          </p>
          <button 
            onClick={() => navigate('/settings')}
            style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}
          >
            Connect Account Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {connectedPlatforms.map((platform) => (
            <div 
              key={platform.id}
              onClick={() => navigate(`/platform/${platform.id}`)}
              style={{ 
                background: '#ffffff',
                borderRadius: '24px',
                border: `1px solid ${platform.color}40`,
                padding: '24px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 10px 40px -10px ${platform.color}30`,
                transform: 'translateY(0)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = `0 20px 40px -10px ${platform.color}40`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 10px 40px -10px ${platform.color}30`;
              }}
            >
              {/* Background Glow */}
              <div style={{ 
                position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', 
                background: platform.gradient, opacity: 0.1, borderRadius: '50%', filter: 'blur(30px)' 
              }}></div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '20px', 
                  background: platform.gradient, 
                  color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 10px 20px -5px ${platform.color}50`
                }}>
                  {platform.icon}
                </div>
                
                <div style={{ padding: '6px 12px', background: `${platform.color}15`, color: platform.color, borderRadius: '50px', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: platform.color }}></div>
                  Connected
                </div>
              </div>

              <div style={{ position: 'relative', zIndex: 2 }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  {platform.name}
                </h2>
                <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: '1.5', marginBottom: '24px' }}>
                  {platform.description}
                </p>

                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Active Account</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>{platform.accountName}</span>
                  </div>
                  <ArrowRight size={20} color={platform.color} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function ThreadsIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10H12Z" />
      <path d="M12 12a4 4 0 1 0 4 4h-4Z" />
    </svg>
  );
}

export default MessageOnlyHub;

