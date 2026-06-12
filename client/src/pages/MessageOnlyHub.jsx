import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Instagram, MessageCircle, Phone, ArrowRight, Settings as SettingsIcon, Zap, MessageSquare, Youtube, Linkedin, MapPin, Twitter, Search, MoreVertical, Plus, User, CircleDashed, Users, Lock, Send, Paperclip, Smile } from 'lucide-react';
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

  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [activeChat, setActiveChat] = useState(null);

  const mockChats = [
    { id: 1, platformId: 'instagram', userName: 'Alex Johnson', lastMessage: 'Is this product still available?', time: '10:30 AM', unread: 2, avatar: 'https://i.pravatar.cc/150?img=11' },
    { id: 2, platformId: 'whatsapp', userName: 'Maria Garcia', lastMessage: 'Thanks for the info!', time: 'Yesterday', unread: 0, avatar: 'https://i.pravatar.cc/150?img=5' },
    { id: 3, platformId: 'facebook', userName: 'David Smith', lastMessage: 'Can you help me with my order?', time: 'Tuesday', unread: 1, avatar: 'https://i.pravatar.cc/150?img=14' },
    { id: 4, platformId: 'youtube', userName: 'Tech Enthusiast', lastMessage: 'Great video! Loved the review.', time: 'Monday', unread: 0, avatar: 'https://i.pravatar.cc/150?img=33' },
    { id: 5, platformId: 'instagram', userName: 'Sarah Lee', lastMessage: 'Do you ship internationally?', time: '12:15 PM', unread: 3, avatar: 'https://i.pravatar.cc/150?img=9' },
    { id: 6, platformId: 'twitter', userName: 'Crypto Fan', lastMessage: 'DM me the link please.', time: 'Sunday', unread: 0, avatar: 'https://i.pravatar.cc/150?img=12' },
  ];

  if (loading) return <LoadingSpinner minHeight="60vh" />;

  const connectedPlatforms = platforms.filter(p => p.isConnected);

  // Filter chats by both connected platforms and the selected dropdown option
  const visibleChats = mockChats.filter(chat => {
    const isPlatformConnected = connectedPlatforms.some(p => p.id === chat.platformId);
    if (!isPlatformConnected) return false;
    if (selectedPlatform === 'all') return true;
    return chat.platformId === selectedPlatform;
  });

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#e0e0de', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: '1600px', margin: '0 auto', background: '#ffffff', boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
        
        {/* Left Sidebar (Chats List) */}
        <div style={{ width: '35%', minWidth: '320px', maxWidth: '420px', background: '#ffffff', borderRight: '1px solid #d1d7db', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header */}
          <div style={{ background: '#f0f2f5', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dfe5e7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={24} color="#aebac1" />
                )}
              </div>
              <select 
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid #d1d7db', 
                  padding: '6px 30px 6px 12px', 
                  borderRadius: '20px', 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  color: '#111b21',
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2354656f%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px top 50%',
                  backgroundSize: '10px auto'
                }}
              >
                <option value="all">All Platforms</option>
                {platforms.filter(p => p.isConnected).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '20px', color: '#54656f' }}>
              <MoreVertical size={24} />
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ padding: '8px 12px', background: '#ffffff', borderBottom: '1px solid #f2f2f2' }}>
            <div style={{ background: '#f0f2f5', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '6px 12px', gap: '12px' }}>
              <Search size={18} color="#54656f" />
              <input 
                type="text" 
                placeholder="Search or start new chat" 
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: '#111b21' }} 
              />
            </div>
          </div>

          {/* Chats / Users List */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff' }}>
            {connectedPlatforms.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#667781' }}>
                <SettingsIcon size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>No platforms connected yet.</p>
                <button 
                  onClick={() => navigate('/settings')}
                  style={{ marginTop: '16px', padding: '8px 24px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Connect in Settings
                </button>
              </div>
            ) : visibleChats.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#667781' }}>
                <p>No recent messages found.</p>
              </div>
            ) : (
              visibleChats.map((chat) => {
                const plat = platforms.find(p => p.id === chat.platformId);
                return (
                  <div 
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    style={{ 
                      display: 'flex', 
                      padding: '12px 16px', 
                      cursor: 'pointer', 
                      transition: 'background 0.2s',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f5f6f6'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* User Avatar with Platform Badge */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={chat.avatar} alt={chat.userName} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ 
                        position: 'absolute', bottom: -2, right: -2, 
                        width: '20px', height: '20px', borderRadius: '50%', 
                        background: plat?.gradient || '#ccc', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', border: '2px solid white'
                      }}>
                        <div style={{ transform: 'scale(0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {plat?.icon}
                        </div>
                      </div>
                    </div>
                    
                    {/* Chat Content */}
                    <div style={{ flex: 1, borderBottom: '1px solid #f2f2f2', paddingBottom: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                        <span style={{ fontSize: '1.05rem', color: '#111b21', fontWeight: chat.unread > 0 ? '600' : '400' }}>{chat.userName}</span>
                        <span style={{ fontSize: '0.75rem', color: chat.unread > 0 ? '#00a884' : '#667781', fontWeight: chat.unread > 0 ? '600' : '400' }}>{chat.time}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: '#667781', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                          {chat.lastMessage}
                        </span>
                        {chat.unread > 0 && (
                          <div style={{ background: '#00a884', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {chat.unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane */}
        {activeChat ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#efeae2', position: 'relative' }}>
            {/* Chat Header */}
            <div style={{ padding: '10px 16px', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #d1d7db', height: '60px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src={activeChat.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#111b21', fontWeight: '500' }}>{activeChat.userName}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#667781' }}>click here for contact info</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', color: '#54656f' }}>
                <Search size={24} style={{ cursor: 'pointer' }} />
                <MoreVertical size={24} style={{ cursor: 'pointer' }} />
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Received Message */}
                <div style={{ alignSelf: 'flex-start', maxWidth: '65%', background: '#ffffff', padding: '8px 12px', borderRadius: '8px 8px 8px 0', boxShadow: '0 1px 0.5px rgba(11,20,26,.13)', position: 'relative' }}>
                  <div style={{ fontSize: '0.9rem', color: '#111b21', lineHeight: '19px' }}>{activeChat.lastMessage}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '4px', gap: '4px' }}>
                    <span style={{ fontSize: '0.65rem', color: '#667781' }}>{activeChat.time}</span>
                  </div>
                </div>
                
                {/* Send a mock reply to show UI */}
                {activeChat.unread === 0 && (
                  <div style={{ alignSelf: 'flex-end', maxWidth: '65%', background: '#d9fdd3', padding: '8px 12px', borderRadius: '8px 8px 0 8px', boxShadow: '0 1px 0.5px rgba(11,20,26,.13)', position: 'relative' }}>
                    <div style={{ fontSize: '0.9rem', color: '#111b21', lineHeight: '19px' }}>We have received your message. A representative will be with you shortly.</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '4px', gap: '4px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#667781' }}>{activeChat.time}</span>
                      <svg viewBox="0 0 16 16" width="16" height="16"><path fill="#53bdeb" d="M11.804 3.006l1.52-.468a.5.5 0 01.625.626l-.468 1.52a.5.5 0 01-.223.223l-3.323 1.88a10.957 10.957 0 01-2.905-2.904l1.88-3.324a.5.5 0 01.223-.223zM5.385 10.375l-1.88 3.323a.5.5 0 01-.625-.626l.468-1.52a.5.5 0 01.223-.223l3.323-1.88a10.957 10.957 0 012.905 2.904z"></path></svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Input */}
            <div style={{ padding: '10px 16px', background: '#f0f2f5', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', color: '#54656f' }}>
                <Smile size={26} style={{ cursor: 'pointer' }} />
                <Paperclip size={24} style={{ cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, background: '#ffffff', borderRadius: '8px', padding: '9px 12px' }}>
                <input 
                  type="text" 
                  placeholder="Type a message" 
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.95rem', color: '#111b21' }} 
                />
              </div>
              <div style={{ color: '#54656f', cursor: 'pointer' }}>
                <Send size={24} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            flex: 1, 
            background: '#f0f2f5', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            borderBottom: '6px solid #7c3aed'
          }}>
            {/* Subtle Background */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
              backgroundSize: 'cover',
              opacity: 0.06,
              pointerEvents: 'none'
            }}></div>

            <div style={{ textAlign: 'center', zIndex: 1, maxWidth: '460px', padding: '0 20px' }}>
              <div style={{ marginBottom: '32px' }}>
                <svg width="320" height="188" viewBox="0 0 320 188" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="20" y="20" width="280" height="148" rx="8" fill="#E9EDEF" />
                  <rect x="40" y="40" width="80" height="10" rx="5" fill="#D1D7DB" />
                  <rect x="40" y="60" width="240" height="8" rx="4" fill="#D1D7DB" />
                  <rect x="40" y="80" width="200" height="8" rx="4" fill="#D1D7DB" />
                  <circle cx="160" cy="120" r="20" fill="#7c3aed" opacity="0.8" />
                  <path d="M152 120L158 126L168 114" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 style={{ fontSize: '2rem', color: '#41525d', fontWeight: '300', marginBottom: '18px' }}>Message Only Web</h1>
              <p style={{ color: '#667781', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '32px' }}>
                Send and receive automated messages without keeping your phone online.<br/>
                Click on a chat to start responding.
              </p>
            </div>
            
            <div style={{ position: 'absolute', bottom: '40px', display: 'flex', alignItems: 'center', gap: '6px', color: '#8696a0', fontSize: '0.8rem' }}>
              <Lock size={12} />
              <span>End-to-end encrypted</span>
            </div>
          </div>
        )}

      </div>
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

