import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, MoreHorizontal, Send, Trash2, Instagram, Facebook, MessageSquare, Video, ExternalLink, ChevronLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';


export default function Inbox() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [senderRole, setSenderRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [isChatViewMobile, setIsChatViewMobile] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      const token = localStorage.getItem('insta_agent_token');
      try {
        const res = await fetch('http://localhost:5000/api/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    // Socket Setup
    const socket = io('http://localhost:5000');

    if (user && user.id) {
      socket.emit('join_room', user.id);
    }

    socket.on('new_message', (message) => {
      console.log("📨 Real-time message received:", message);
      setMessages((prev) => {
        // Prevent duplicate if message was already added via REST response
        if (prev.find(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);


  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Sending as 'admin' or 'user' (for testing auto-replies)
    const msgData = {
      sender: senderRole === "admin" ? "admin" : "user",
      text: newMessage,
      type: senderRole === "admin" ? "sent" : "received",
      chatId: "ai_bot_support",
      platform: selectedPlatform
    };


    try {
      const token = localStorage.getItem('insta_agent_token');
      if (!token) {
        alert("You are not logged in. Please log in again.");
        return;
      }

      console.log("Sending message...", msgData);
      const res = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(msgData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Server Error:", errorData);
        alert("Backend failed to save: " + (errorData.message || res.statusText));
        return;
      }

      const data = await res.json();
      console.log("Message saved successfully:", data);
      
      // Update UI immediately (handling both simple message and auto-reply structure)
      setMessages(prev => {
        const newMsgs = [];
        if (data.original) {
          if (!prev.find(m => m._id === data.original._id)) newMsgs.push(data.original);
          if (data.reply && !prev.find(m => m._id === data.reply._id)) newMsgs.push(data.reply);
        } else {
          if (!prev.find(m => m._id === data._id)) newMsgs.push(data);
        }
        return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
      });
      
      setNewMessage("");

    } catch (err) {
      console.error("Network/App Error:", err);
      alert("Could not connect to backend. Is the server running?");
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`http://localhost:5000/api/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m._id !== id));
      } else {
        const errData = await res.json();
        alert("Delete failed: " + errData.message);
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      alert("Error deleting message. Check console.");
    }
  };

  return (
    <div className="inbox-container">
      <div className={`inbox-sidebar ${isChatViewMobile ? 'mobile-hide' : ''}`}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: '600', color: 'var(--text-main)' }}>
          Active Conversations
        </div>
        <div className="inbox-list">
          <div className="chat-item active" onClick={() => setIsChatViewMobile(true)}>
            <div className="chat-avatar" style={{ 
              color: 'white', 
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.username?.charAt(0).toUpperCase() || 'A'
              )}
            </div>
            <div className="chat-meta">
              <div className="chat-name" style={{ color: 'var(--text-main)' }}>{user?.username}</div>
              <div className="chat-preview">{messages[messages.length - 1]?.text || "No messages yet"}</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: '600' }}>Active</div>
          </div>

        </div>
      </div>
      
      <div className={`inbox-main ${!isChatViewMobile ? 'mobile-hide' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
        <div className="chat-header">
          <button 
            onClick={() => setIsChatViewMobile(false)}
            className="mobile-show" 
            style={{ marginRight: '12px', color: 'var(--accent-color)', padding: '4px' }}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="chat-avatar" style={{ 
            color: 'white', 
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Header Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.username?.charAt(0).toUpperCase() || 'A'
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user?.username}</div>
            <div style={{ fontSize: '0.8rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={14} /> Profile Active
            </div>
          </div>

          <button className="action-btn">
             <MoreHorizontal size={20} />
          </button>
        </div>
        
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '40px', fontWeight: '500' }}>
              No messages here. Type below to start!
            </div>
          ) : messages.map((msg, index) => {
            const isSentByMe = msg.sender === 'admin' || msg.sender === 'AI Agent';
            return (
              <div key={msg._id || index} 
                   className={`message-wrapper ${isSentByMe ? 'wrap-sent' : 'wrap-received'}`}
                   style={{ 
                     display: 'flex', 
                     flexDirection: 'column', 
                     alignItems: isSentByMe ? 'flex-end' : 'flex-start', 
                     gap: '6px', 
                     marginBottom: '24px' 
                   }}>
                
                {msg.sender === 'AI Agent' && (
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#8b5cf6', marginBottom: '4px', textTransform: 'uppercase' }}>
                    🤖 AI Auto-Reply
                  </span>
                )}
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', alignSelf: isSentByMe ? 'flex-end' : 'flex-start', marginBottom: '2px' }}>
                  {msg.platform === 'facebook' ? <Facebook size={12} color="#1877f2" /> : 
                   msg.platform === 'whatsapp' ? <MessageSquare size={12} color="#25D366" /> :
                   <Instagram size={12} color="#e1306c" />}
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>{msg.platform || 'instagram'}</span>
                </div>

                <div className={`message ${isSentByMe ? 'msg-sent' : 'msg-received'}`} 
                     style={{ 
                       background: msg.sender === 'AI Agent' ? '#f3f0ff' : (isSentByMe ? 'var(--accent-color)' : '#ffffff'),
                       color: msg.sender === 'AI Agent' ? '#5b21b6' : (isSentByMe ? '#ffffff' : '#111827'), // High contrast Black/White
                       border: isSentByMe ? 'none' : '1px solid #d1d5db',
                       padding: '14px 22px',
                       borderRadius: '22px',
                       boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                       maxWidth: '75%',
                       fontSize: '1rem',
                       fontWeight: '500',
                       lineHeight: '1.5',
                       position: 'relative'
                     }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span>{msg.text}</span>
                    
                    {msg.videoUrl && (
                      <div style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                        {msg.videoUrl.includes('youtube.com') || msg.videoUrl.includes('youtu.be') ? (
                          <iframe 
                            width="100%" 
                            height="180" 
                            src={`https://www.youtube.com/embed/${msg.videoUrl.split('v=')[1] || msg.videoUrl.split('/').pop()}`}
                            title="Video message"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : (
                          <video src={msg.videoUrl} controls style={{ width: '100%', borderRadius: '12px' }} />
                        )}
                      </div>
                    )}

                    {msg.linkUrl && (
                      <a 
                        href={msg.linkUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          background: isSentByMe ? 'rgba(255,255,255,0.2)' : 'rgba(139, 92, 246, 0.1)', 
                          color: isSentByMe ? 'white' : 'var(--accent-color)', 
                          padding: '10px 16px', 
                          borderRadius: '12px', 
                          fontSize: '0.85rem', 
                          fontWeight: '600',
                          textDecoration: 'none',
                          marginTop: '4px',
                          border: isSentByMe ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(139, 92, 246, 0.2)'
                        }}
                      >
                        <ExternalLink size={14} /> Open Link
                      </a>
                    )}
                  </div>

                  <button 
                    onClick={() => deleteMessage(msg._id)}
                    style={{ 
                      position: 'absolute',
                      right: '8px',
                      top: '8px',
                      opacity: 0, 
                      color: 'inherit', 
                      cursor: 'pointer',
                      border: 'none',
                      background: 'transparent',
                      transition: 'opacity 0.2s'
                    }}
                    className="msg-delete-btn"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        
        <form 
          className="chat-input" 
          onSubmit={handleSendMessage} 
          style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '16px', background: '#f8fafc', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}
        >
          <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '8px' }} className="mobile-show">
            <select 
              value={senderRole}
              onChange={(e) => setSenderRole(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: '#e0e7ff', outline: 'none', cursor: 'pointer', fontWeight: '600', color: '#4f46e5' }}
            >
              <option value="admin">Send as Admin</option>
              <option value="user">Test as User</option>
            </select>
          </div>

          <select 
            value={senderRole}
            onChange={(e) => setSenderRole(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: '#e0e7ff', outline: 'none', cursor: 'pointer', fontWeight: '600', color: '#4f46e5' }}
            className="mobile-hide"
          >
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select 
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: '#f8fafc', outline: 'none', cursor: 'pointer' }}
          >
            <option value="instagram">IG</option>
            <option value="facebook">FB</option>
            <option value="whatsapp">WA</option>
          </select>
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', outline: 'none' }}
          />
          <button type="submit" className="send-btn" style={{ padding: '12px', borderRadius: '12px', background: 'var(--accent-color)', color: 'white' }}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
