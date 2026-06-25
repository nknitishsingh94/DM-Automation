import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Instagram, MessageCircle, Phone, ArrowRight, Settings as SettingsIcon, Zap, MessageSquare, Youtube, Linkedin, MapPin, Twitter, Search, MoreVertical, Plus, User, CircleDashed, Users, Lock, Send, Paperclip, Smile, Wand2, Bot, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../supabase';

const MessageOnlyHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [activeChat, setActiveChat] = useState(null);
  
  // AI States
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiContext, setAiContext] = useState({
    businessName: 'Insta AI',
    businessDescription: 'We provide AI automation services and software for businesses.',
    tone: 'Professional and helpful'
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('insta_agent_token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const [settingsRes, contactsRes, messagesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/settings`, { headers }),
          fetch(`${API_BASE_URL}/api/contacts`, { headers }),
          fetch(`${API_BASE_URL}/api/messages`, { headers })
        ]);

        if (settingsRes.ok) setSettings(await settingsRes.json());
        if (contactsRes.ok) setContacts(await contactsRes.json());
        if (messagesRes.ok) setMessages(await messagesRes.json());
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // SUPABASE REALTIME MESSAGE SUBSCRIPTION
    let supabaseChannel = null;
    try {
      supabaseChannel = supabase
        .channel('public:messages_hub')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const rawMessage = payload.new;
            const formattedMessage = {
              ...rawMessage,
              _id: rawMessage.id,
              userId: rawMessage.userId || rawMessage.user_id,
              timestamp: rawMessage.timestamp || rawMessage.created_at || new Date().toISOString(),
              createdAt: rawMessage.created_at,
              sender: rawMessage.sender,
              text: rawMessage.text,
              type: rawMessage.type,
              chatId: rawMessage.chatId,
              platform: rawMessage.platform
            };

            setMessages((prev) => {
              const isDuplicate = prev.some(m => 
                String(m._id) === String(formattedMessage._id) || 
                (formattedMessage.tempId && String(m._id) === String(formattedMessage.tempId)) ||
                (formattedMessage.tempId && String(m.tempId) === String(formattedMessage.tempId))
              );
              if (isDuplicate) return prev;
              return [...prev, formattedMessage];
            });
          }
        )
        .subscribe();
    } catch (e) {
      console.error("Failed to initialize Supabase Realtime:", e);
    }

    return () => {
      if (supabaseChannel) supabase.removeChannel(supabaseChannel);
    };
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
      id: 'threads',
      name: 'Threads',
      description: 'Automate posts, messages, and replies on your Threads account.',
      icon: <ThreadsIcon size={40} />,
      color: '#000000',
      gradient: 'linear-gradient(135deg, #000000, #333333)',
      isConnected: settings && settings.isThreadsConnected,
      accountName: settings?.connectedThreadsName || 'Threads User'
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
      id: 'pinterest',
      name: 'Pinterest',
      description: 'Schedule pins, reply to comments, and manage boards automatically.',
      icon: <PinterestIcon size={40} color="#E60023" />,
      color: '#E60023',
      gradient: 'linear-gradient(135deg, #E60023, #bd081c)',
      isConnected: settings && settings.isPinterestConnected,
      accountName: settings?.connectedPinterestName || 'Pinterest User'
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

  // End of platforms array
  const handleGenerateAiResponse = () => {
    if (!activeChat || !isAiEnabled) return;
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      const responses = [
        `Hi ${activeChat.userName.split(' ')[0]}! Thanks for reaching out to ${aiContext.businessName}. Based on what you said: "${activeChat.lastMessage}", we can definitely help with that. ${aiContext.businessDescription} Let me know if you need more details!`,
        `Hello! I'd be happy to assist you with "${activeChat.lastMessage}". At ${aiContext.businessName}, we specialize in this. How else can I help?`,
        `Hi there! Thanks for your message. I can confirm we can help you with that. Feel free to ask any other questions.`
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setDraftMessage(randomResponse);
      setIsGenerating(false);
    }, 1200);
  };

  const handleSendMessage = async () => {
    if (!draftMessage.trim() || !activeChat) return;

    const tempId = Date.now().toString();
    const msgData = {
      sender: 'admin',
      text: draftMessage,
      type: 'sent',
      chatId: activeChat.id,
      platform: activeChat.platformId || 'instagram'
    };

    const tempMessage = { ...msgData, _id: tempId, tempId, timestamp: new Date().toISOString() };

    setDraftMessage('');
    setMessages(prev => [...prev, tempMessage]);

    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...msgData, tempId })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m => m._id === tempId ? data : m));
      } else {
        setMessages(prev => prev.filter(m => m._id !== tempId));
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages(prev => prev.filter(m => m._id !== tempId));
    }
  };

  // Derive real chats from messages and contacts
  const realChatsObj = messages.reduce((acc, m) => {
    if (!m.chatId) return acc;
    if (!acc[m.chatId]) {
      const contact = contacts.find(c => c.chatId === m.chatId) || {};
      let name = contact.name || contact.username;
      if (!name) {
        if (m.chatId === 'ai_bot_support') name = 'Support Chat';
        else name = `User ${m.chatId.substring(0, 6)}`;
      }
      
      acc[m.chatId] = {
        id: m.chatId,
        platformId: m.platform || contact.platform || 'instagram',
        userName: name,
        lastMessage: m.text,
        time: new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        unread: contact.unreadCount || 0,
        avatar: contact.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      };
    } else {
      acc[m.chatId].lastMessage = m.text;
      acc[m.chatId].time = new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    return acc;
  }, {});

  const allRealChats = Object.values(realChatsObj).reverse(); // newest first if messages was asc

  if (loading) return <LoadingSpinner minHeight="60vh" />;

  const connectedPlatforms = platforms.filter(p => p.isConnected);

  // Filter chats by both connected platforms and the selected dropdown option
  const visibleChats = allRealChats.filter(chat => {
    const isPlatformConnected = connectedPlatforms.some(p => p.id === chat.platformId);
    if (!isPlatformConnected && chat.id !== 'ai_bot_support') return false;
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
                  <img referrerPolicy="no-referrer" src={user.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/zenxchat-logo.png'; e.currentTarget.onerror = null; }} />
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
                  padding: '4px 24px 4px 10px', 
                  borderRadius: '16px', 
                  fontSize: '0.8rem', 
                  fontWeight: '600', 
                  color: '#111b21',
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2354656f%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px top 50%',
                  backgroundSize: '8px auto',
                  maxWidth: '130px',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                <option value="all">All Platforms</option>
                {platforms.filter(p => p.isConnected).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#54656f' }}>
              {/* AI Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', background: isAiEnabled ? '#f3e8ff' : '#f0f2f5', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${isAiEnabled ? '#d8b4fe' : '#d1d7db'}` }}>
                <Bot size={16} color={isAiEnabled ? '#7c3aed' : '#54656f'} style={{ marginRight: '6px' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isAiEnabled ? '#7c3aed' : '#54656f', marginRight: '8px' }}>AI Reply</span>
                <div 
                  onClick={() => setIsAiEnabled(!isAiEnabled)}
                  style={{ width: '32px', height: '18px', background: isAiEnabled ? '#7c3aed' : '#d1d7db', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                >
                  <div style={{ width: '14px', height: '14px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: isAiEnabled ? '16px' : '2px', transition: '0.3s' }}></div>
                </div>
                {isAiEnabled && (
                  <SettingsIcon size={14} color="#7c3aed" style={{ marginLeft: '8px', cursor: 'pointer' }} onClick={() => setShowAiSettings(true)} />
                )}
              </div>
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
                      <img referrerPolicy="no-referrer" src={chat.avatar} alt={chat.userName} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/zenxchat-logo.png'; e.currentTarget.onerror = null; }} />
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
                <img referrerPolicy="no-referrer" src={activeChat.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/zenxchat-logo.png'; e.currentTarget.onerror = null; }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#111b21', fontWeight: '500' }}>{activeChat.userName}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#667781' }}>click here for contact info</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', color: '#54656f' }}>
                <Search size={24} style={{ cursor: 'pointer' }} />
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {messages.filter(m => m.chatId === activeChat.id).map((msg, index) => {
                  const isSentByMe = msg.sender === 'admin' || msg.sender === 'AI Agent';
                  return (
                    <div 
                      key={msg._id || index} 
                      style={{ 
                        alignSelf: isSentByMe ? 'flex-end' : 'flex-start', 
                        maxWidth: '65%', 
                        background: isSentByMe ? '#d9fdd3' : '#ffffff', 
                        padding: '8px 12px', 
                        borderRadius: isSentByMe ? '8px 8px 0 8px' : '8px 8px 8px 0', 
                        boxShadow: '0 1px 0.5px rgba(11,20,26,.13)', 
                        position: 'relative',
                        borderTop: msg.sender === 'AI Agent' ? '2px solid #7c3aed' : 'none'
                      }}
                    >
                      {msg.sender === 'AI Agent' && (
                        <div style={{ fontSize: '0.65rem', color: '#7c3aed', fontWeight: 'bold', marginBottom: '2px' }}>🤖 AI Agent</div>
                      )}
                      <div style={{ fontSize: '0.9rem', color: '#111b21', lineHeight: '19px', wordBreak: 'break-word' }}>{msg.text}</div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '4px', gap: '4px' }}>
                        <span style={{ fontSize: '0.65rem', color: '#667781' }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {isSentByMe && (
                          <svg viewBox="0 0 16 16" width="16" height="16"><path fill="#53bdeb" d="M11.804 3.006l1.52-.468a.5.5 0 01.625.626l-.468 1.52a.5.5 0 01-.223.223l-3.323 1.88a10.957 10.957 0 01-2.905-2.904l1.88-3.324a.5.5 0 01.223-.223zM5.385 10.375l-1.88 3.323a.5.5 0 01-.625-.626l.468-1.52a.5.5 0 01.223-.223l3.323-1.88a10.957 10.957 0 012.905 2.904z"></path></svg>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div style={{ padding: '10px 16px', background: '#f0f2f5', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', color: '#54656f' }}>
                <Smile size={26} style={{ cursor: 'pointer' }} />
                <Paperclip size={24} style={{ cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, background: '#ffffff', borderRadius: '8px', padding: '9px 12px', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Type a message" 
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.95rem', color: '#111b21', width: '100%' }} 
                />
                {isAiEnabled && (
                  <div 
                    onClick={handleGenerateAiResponse}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', 
                      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', 
                      padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                      opacity: isGenerating ? 0.7 : 1, pointerEvents: isGenerating ? 'none' : 'auto'
                    }}
                  >
                    <Wand2 size={14} className={isGenerating ? "animate-pulse" : ""} />
                    {isGenerating ? "Thinking..." : "AI Reply"}
                  </div>
                )}
              </div>
              <div 
                style={{ color: draftMessage.trim() ? '#7c3aed' : '#54656f', cursor: draftMessage.trim() ? 'pointer' : 'default' }}
                onClick={() => draftMessage.trim() && handleSendMessage()}
              >
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

      {/* AI Settings Modal */}
      {showAiSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#111b21', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={24} color="#7c3aed" />
                AI Auto-Reply Settings
              </h2>
              <X size={24} color="#667781" style={{ cursor: 'pointer' }} onClick={() => setShowAiSettings(false)} />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#41525d', fontWeight: 'bold' }}>Business Name</label>
              <input 
                type="text" 
                value={aiContext.businessName}
                onChange={(e) => setAiContext({...aiContext, businessName: e.target.value})}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d7db', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#41525d', fontWeight: 'bold' }}>Business Description & Knowledge</label>
              <textarea 
                value={aiContext.businessDescription}
                onChange={(e) => setAiContext({...aiContext, businessDescription: e.target.value})}
                rows={4}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d7db', fontSize: '0.95rem', outline: 'none', resize: 'none' }}
                placeholder="Enter what your business does, products, prices, etc."
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#41525d', fontWeight: 'bold' }}>AI Tone</label>
              <select 
                value={aiContext.tone}
                onChange={(e) => setAiContext({...aiContext, tone: e.target.value})}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d7db', fontSize: '0.95rem', outline: 'none', background: 'white' }}
              >
                <option value="Professional and helpful">Professional & Helpful</option>
                <option value="Friendly and casual">Friendly & Casual</option>
                <option value="Persuasive and sales-oriented">Persuasive & Sales-oriented</option>
                <option value="Short and direct">Short & Direct</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowAiSettings(false)}
                style={{ padding: '10px 20px', background: '#f0f2f5', color: '#54656f', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowAiSettings(false)}
                style={{ padding: '10px 20px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Save AI Context
              </button>
            </div>
          </div>
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

function PinterestIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.182 0 7.437 2.981 7.437 6.933 0 4.156-2.62 7.508-6.262 7.508-1.22 0-2.368-.636-2.763-1.385l-.754 2.878c-.274 1.042-1.016 2.348-1.513 3.141 1.144.336 2.347.514 3.585.514 6.62 0 11.988-5.367 11.988-11.988 0-6.62-5.368-11.987-11.988-11.987z"/>
    </svg>
  );
}

export default MessageOnlyHub;

