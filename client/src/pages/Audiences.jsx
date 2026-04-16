import { useEffect, useState } from 'react';
import { Search, ChevronLeft, MessageCircle, Activity, Instagram, Facebook, Phone, Tag, StickyNote, Plus, X, Filter, Users } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Audiences() {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState('All');
  
  // Tag Modal / Management State
  const [tagInput, setTagInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchContactsData = async () => {
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/contacts`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const contactsData = await res.json();
      setContacts(contactsData);
      
      // If a contact was selected, update its local state too
      if (selectedContact) {
        const updated = contactsData.find(c => c._id === selectedContact._id);
        if (updated) setSelectedContact(updated);
      }
    } catch (err) {
      console.error("Error fetching audience data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactHistory = async (chatId) => {
    setLoadingMessages(true);
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/contact/${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchContactsData();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchContactHistory(selectedContact.chatId);
      setNoteInput(selectedContact.notes || '');
    } else {
      setMessages([]);
    }
  }, [selectedContact?._id]);

  const handleUpdateContact = async (updates) => {
    if (!selectedContact) return;
    setIsUpdating(true);
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/contacts/${selectedContact._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedContact = await res.json();
        setSelectedContact(updatedContact);
        setContacts(prev => prev.map(c => c._id === updatedContact._id ? updatedContact : c));
      }
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const addTag = () => {
    if (!tagInput.trim() || selectedContact.tags.includes(tagInput.trim())) return;
    const newTags = [...selectedContact.tags, tagInput.trim()];
    handleUpdateContact({ tags: newTags });
    setTagInput('');
  };

  const removeTag = (tag) => {
    const newTags = selectedContact.tags.filter(t => t !== tag);
    handleUpdateContact({ tags: newTags });
  };

  const saveNote = () => {
    handleUpdateContact({ notes: noteInput });
  };

  useEffect(() => {
    if (selectedContact) {
      setNoteInput(selectedContact.notes || '');
    }
  }, [selectedContact?._id]);

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.chatId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTagFilter === 'All' || c.tags.includes(selectedTagFilter);
    return matchesSearch && matchesTag;
  });

  const allAvailableTags = [...new Set(contacts.flatMap(c => c.tags))];

  const getTagColor = (tag) => {
    const colors = {
      'Lead': { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' },
      'Customer': { bg: '#f0fdf4', text: '#15803d', border: '#dcfce7' },
      'VIP': { bg: '#faf5ff', text: '#7e22ce', border: '#f3e8ff' },
      'Spam': { bg: '#fef2f2', text: '#b91c1c', border: '#fee2e2' },
      'Interested': { bg: '#eff6ff', text: '#1d4ed8', border: '#dbeafe' }
    };
    return colors[tag] || { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
  };

  const getPlatformIcon = (platform) => {
    switch(platform) {
      case 'instagram': return <Instagram size={14} color="#e1306c" />;
      case 'facebook': return <Facebook size={14} color="#1877f2" />;
      case 'whatsapp': return <Phone size={14} color="#25D366" />;
      default: return <MessageCircle size={14} />;
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>Loading audience data...</div>;

  if (selectedContact) {
    const userMessages = allMessages.filter(m => m.chatId === selectedContact.chatId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);

    return (
      <div style={{ maxWidth: '1000px', animation: 'fadeIn 0.3s ease-out' }}>
        <button 
          onClick={() => setSelectedContact(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '24px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
          <ChevronLeft size={18} /> Back to Audience List
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Profile Header Card */}
            <div className="table-card" style={{ padding: '32px', display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', 
                background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: 'white', fontSize: '2rem', fontWeight: '700', flexShrink: 0 
              }}>
                {selectedContact.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: '700', margin: 0 }}>{selectedContact.name}</h2>
                  {getPlatformIcon(selectedContact.platform)}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>ID: {selectedContact.chatId}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedContact.tags.map(tag => (
                    <span 
                      key={tag} 
                      style={{ 
                        ...getTagColor(tag), 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                        display: 'flex', alignItems: 'center', gap: '4px', border: `1px solid ${getTagColor(tag).border}`
                      }}
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} style={{ color: 'inherit', opacity: 0.6 }}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="var(--accent-color)" /> Interaction History
              </h3>
              <div className="table-card" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                {loadingMessages ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      Loading history...
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No historical messages found for this contact.
                  </div>
                ) : (
                  <div style={{ padding: '0 24px' }}>
                    {messages.map((msg, idx) => {
                      const isAI = msg.sender === 'AI Agent';
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div key={msg._id || idx} style={{ 
                          display: 'flex', gap: '16px', padding: '16px 0', 
                          borderBottom: idx !== messages.length - 1 ? '1px solid var(--border-subtle)' : 'none' 
                        }}>
                          <div style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                            background: isAI ? 'rgba(139, 92, 246, 0.1)' : (isAdmin ? 'rgba(16, 185, 129, 0.1)' : '#f1f5f9'),
                            color: isAI ? 'var(--accent-color)' : (isAdmin ? '#059669' : '#475569'),
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.75rem'
                          }}>
                            {isAI ? 'AI' : (isAdmin ? 'ME' : 'U')}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                                {isAI ? 'Auto-Reply' : (isAdmin ? 'Admin' : 'Audience')}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(msg.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p style={{ color: '#334155', fontSize: '0.9rem', margin: 0 }}>{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Management Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Tags Manager Card */}
            <div className="table-card" style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={18} color="var(--accent-color)" /> Manage Tags
              </h4>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input 
                  type="text" 
                  placeholder="New tag..." 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
                />
                <button 
                  onClick={addTag}
                  disabled={isUpdating}
                  style={{ background: 'var(--accent-color)', color: 'white', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                >
                  <Plus size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {['Lead', 'Customer', 'VIP', 'Interested', 'Spam'].map(preset => (
                  <button 
                    key={preset}
                    onClick={() => { setTagInput(preset); }}
                    style={{ 
                      fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)',
                      background: 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Card */}
            <div className="table-card" style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StickyNote size={18} color="var(--accent-color)" /> Private Notes
              </h4>
              <textarea 
                placeholder="Add notes about this user..." 
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', outline: 'none', resize: 'vertical', marginBottom: '12px', fontFamily: 'inherit' }}
              />
              <button 
                onClick={saveNote}
                disabled={isUpdating}
                style={{ 
                  width: '100%', padding: '10px', borderRadius: '8px', background: isUpdating ? 'var(--text-muted)' : 'var(--accent-color)', 
                  color: 'white', fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.2s' 
                }}
              >
                {isUpdating ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', animation: 'fadeIn 0.5s ease-out' }}>
      {/* Stunning Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderRadius: '24px', padding: '40px', color: 'white', marginBottom: '32px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.2)' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '14px', backdropFilter: 'blur(10px)' }}>
              <Users size={24} color="#a78bfa" />
            </div>
            <span style={{ color: '#a78bfa', fontWeight: '700', letterSpacing: '1px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Audience Manager</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '12px', lineHeight: '1.1' }}>Manage your<br/>growing community.</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '400px', margin: 0, lineHeight: '1.5' }}>Categorize interactions, assign tags, and track how your AI Agent is converting leads into loyal customers.</p>
        </div>
        
        {/* Decorative Background Elements */}
        <div style={{ position: 'absolute', right: '-10%', top: '-20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', right: '5%', bottom: '-20%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
        <Users size={240} style={{ position: 'absolute', right: '-20px', bottom: '-40px', opacity: 0.05, transform: 'rotate(-10deg)' }} />
      </div>

      {/* Advanced Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '14px 24px', flex: 1, display: 'flex', alignItems: 'center', minWidth: '300px', transition: 'all 0.3s ease', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}
             onMouseOver={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.05)'; }}
             onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)'; }}>
          <Search size={20} style={{ color: '#8b5cf6', marginRight: '16px' }} />
          <input 
            type="text" 
            placeholder="Search by name, ID, or private notes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0', background: 'transparent', border: 'none', outline: 'none', fontSize: '1rem', color: '#1e293b', fontWeight: '500' }}
          />
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'all 0.3s ease' }}
             onMouseOver={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.05)'; }}
             onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)'; }}>
          <Filter size={20} style={{ color: '#8b5cf6' }} />
          <select 
            value={selectedTagFilter} 
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', fontWeight: '600', color: '#334155', cursor: 'pointer' }}
          >
            <option value="All">All Tags</option>
            {allAvailableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </div>
      </div>

      {/* Premium Data Table Container */}
      <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(248, 250, 252, 0.5)', borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ padding: '24px', textAlign: 'left', color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contact Identity</th>
              <th style={{ padding: '24px', textAlign: 'left', color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Category Tags</th>
              <th style={{ padding: '24px', textAlign: 'left', color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Interactions</th>
              <th style={{ padding: '24px', textAlign: 'left', color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '100px 20px', background: '#ffffff' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: 0 }}></div>
                      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '50%', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', position: 'relative', zIndex: 1 }}>
                        <Users size={56} style={{ color: '#c084fc' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>No Audience Found</div>
                      <div style={{ color: '#64748b', fontSize: '1rem', maxWidth: '300px', margin: '0 auto' }}>Try adjusting your search filters or wait for new AI interactions.</div>
                    </div>
                  </div>
                </td>
              </tr>
            ) : filteredContacts.map((contact) => (
              <tr 
                key={contact._id} 
                onClick={() => setSelectedContact(contact)}
                style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: '#ffffff' }}
                onMouseOver={(e) => { 
                  e.currentTarget.style.background = '#f8fafc'; 
                  e.currentTarget.style.transform = 'translateY(-2px)'; 
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)'; 
                  e.currentTarget.style.zIndex = '10';
                  e.currentTarget.style.position = 'relative';
                }}
                onMouseOut={(e) => { 
                  e.currentTarget.style.background = '#ffffff'; 
                  e.currentTarget.style.transform = 'none'; 
                  e.currentTarget.style.boxShadow = 'none'; 
                  e.currentTarget.style.zIndex = '1';
                }}
              >
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                     <div style={{ 
                        width: '46px', height: '46px', borderRadius: '14px', 
                        background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: 'white', fontWeight: '800', fontSize: '1.2rem', boxShadow: '0 4px 14px rgba(168, 85, 247, 0.3)'
                      }}>
                       {contact.name.charAt(0).toUpperCase()}
                     </div>
                     <div>
                       <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '1.05rem', marginBottom: '4px' }}>{contact.name}</div>
                       <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                         {getPlatformIcon(contact.platform)} <span style={{ textTransform: 'capitalize' }}>{contact.platform}</span>
                       </div>
                     </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {contact.tags.length > 0 ? contact.tags.map(tag => (
                      <span key={tag} style={{ ...getTagColor(tag), padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', border: `1px solid ${getTagColor(tag).border}` }}>{tag}</span>
                    )) : <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', fontWeight: '500' }}>Untagged</span>}
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', fontSize: '1.1rem', color: '#334155' }}>
                    <div style={{ padding: '8px', background: '#f3e8ff', borderRadius: '10px' }}>
                      <MessageCircle size={16} color="#9333ea" />
                    </div>
                    {contact.totalMessages}
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ color: '#1e293b', fontWeight: '600', fontSize: '0.95rem', marginBottom: '2px' }}>{new Date(contact.lastActive).toLocaleDateString()}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>{new Date(contact.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
