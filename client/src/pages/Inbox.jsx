import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, MoreHorizontal, Send, Trash2, Copy, Download, Instagram, Facebook, MessageSquare, Video, ExternalLink, ChevronLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';


export default function Inbox() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [senderRole, setSenderRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [isChatViewMobile, setIsChatViewMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    // Scroll only the specific chat messages container
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      const token = localStorage.getItem('insta_agent_token');
      try {
        const res = await fetch(`${API_BASE_URL}/api/messages`, {
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
    const socket = io(API_BASE_URL);

    if (user && user.id) {
      socket.emit('join_room', user.id);
    }

    socket.on('new_message', (message) => {
      console.log("📨 Real-time message received:", message);
      setMessages((prev) => {
        // Prevent duplicate if message was already added via REST response
        // Also check if the socket message matches a tempId we optimistically added
        const isDuplicate = prev.some(m => 
          String(m._id) === String(message._id) || 
          (message.tempId && String(m._id) === String(message.tempId)) ||
          (message.tempId && String(m.tempId) === String(message.tempId))
        );

        if (isDuplicate) {
          console.log("♻️ Duplicate message detected via Socket, ignoring.");
          return prev;
        }
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


    const tempId = Date.now().toString();
    const tempMessage = {
      _id: tempId,
      tempId: tempId,
      sender: senderRole === "admin" ? "admin" : "user",
      text: newMessage,
      type: senderRole === "admin" ? "sent" : "received",
      chatId: "ai_bot_support",
      platform: selectedPlatform,
      timestamp: new Date().toISOString()
    };

    // 1. Optimistically clear input instantly
    setNewMessage("");
    
    // 2. Optimistically add to UI instantly
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(scrollToBottom, 50);

    try {
      const token = localStorage.getItem('insta_agent_token');
      if (!token) {
        alert("You are not logged in. Please log in again.");
        return;
      }

      console.log("Sending message...", msgData);
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...msgData, tempId })
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Server Error:", errorData);
        alert("Backend failed to save: " + (errorData.message || res.statusText));
        // Revert message on failure
        setMessages(prev => prev.filter(m => m._id !== tempId));
        return;
      }

      const data = await res.json();
      console.log("Message saved successfully:", data);

      // Update UI: Avoid duplicate if socket already added the message
      setMessages(prev => {
        const hasSocketVersion = prev.find(m => m._id === data._id);
        if (hasSocketVersion) {
          // Keep the socket version, remove the temporary one
          return prev.filter(m => m._id !== tempId);
        } else {
          // Replace temp version with DB version
          return prev.map(m => m._id === tempId ? data : m);
        }
      });

    } catch (err) {
      console.error("Network/App Error:", err);
      alert("Could not connect to backend. Is the server running?");
    }
  };

  const deleteMessage = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Message",
      message: "Are you sure you want to remove this message? This cannot be undone.",
      onConfirm: async () => {
        const token = localStorage.getItem('insta_agent_token');
        try {
          const res = await fetch(`${API_BASE_URL}/api/messages/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setMessages(prev => prev.filter(m => m._id !== id));
            setConfirmModal({ isOpen: false });
          } else {
            console.error("Delete failed");
            setConfirmModal({ isOpen: false });
          }
        } catch (err) {
          console.error("Error deleting message:", err);
          setConfirmModal({ isOpen: false });
        }
      }
    });
  };

  const deleteAllMessages = async () => {
    setIsMenuOpen(false); // Close menu first
    setConfirmModal({
      isOpen: true,
      title: "Clear All Chat",
      message: "This will permanently delete ALL messages in this conversation. Are you sure?",
      onConfirm: async () => {
        const token = localStorage.getItem('insta_agent_token');
        try {
          const res = await fetch(`${API_BASE_URL}/api/messages/all`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setMessages([]);
            setConfirmModal({ isOpen: false });
          } else {
            setConfirmModal({ isOpen: false });
          }
        } catch (err) {
          console.error("Error clearing chat:", err);
          setConfirmModal({ isOpen: false });
        }
      }
    });
  };

  const copyToClipboard = () => {
    console.log("📋 Copying chat transcript...");
    if (messages.length === 0) return;
    const transcript = messages.map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.sender}: ${m.text}`).join('\n');
    navigator.clipboard.writeText(transcript).then(() => {
      setIsMenuOpen(false);
    }).catch(err => console.error(err));
  };

  const saveChatAsFile = () => {
    console.log("💾 Saving chat as file...");
    if (messages.length === 0) {
      alert("Nothing to save!");
      return;
    }
    const transcript = messages.map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.sender}: ${m.text}`).join('\n');
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_transcript_${user?.username || 'user'}_${new Date().toLocaleDateString()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsMenuOpen(false);
    console.log("✅ File download triggered.");
  };

  return (
    <div className="inbox-container" style={{ flex: 1, minHeight: 0, background: 'transparent', display: 'flex' }}>
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
      
      <div className={`inbox-main ${!isChatViewMobile ? 'mobile-hide' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', minWidth: 0, height: '100%' }}>
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

          <div style={{ position: 'relative' }} ref={menuRef}>
            <button 
              className="action-btn" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isMenuOpen ? '#f3f4f6' : 'transparent',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                border: 'none',
                color: 'var(--text-muted)'
              }}
            >
              <MoreHorizontal size={20} />
            </button>
            
            {isMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '10px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                zIndex: 100,
                minWidth: '200px',
                overflow: 'hidden',
                animation: 'slideUp 0.2s ease-out'
              }}>
                <div style={{ padding: '8px 0' }}>
                  <button 
                    onClick={copyToClipboard}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: 'var(--text-main)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Copy size={16} color="#6b7280" />
                    Copy Transcript
                  </button>

                  <button 
                    onClick={saveChatAsFile}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: 'var(--text-main)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Download size={16} color="#6b7280" />
                    Download Chat (.txt)
                  </button>

                  <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }}></div>

                  <button 
                    onClick={deleteAllMessages}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: '#ef4444',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Trash2 size={16} />
                    Clear Chat History
                  </button>
                </div>
              </div>
            )}
          </div>
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

      {/* --- PREMIUM CONFIRM MODAL --- */}
      {confirmModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: '#fee2e2',
              color: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Trash2 size={30} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px', color: '#111827' }}>{confirmModal.title}</h3>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '25px' }}>{confirmModal.message}</p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#ef4444',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
