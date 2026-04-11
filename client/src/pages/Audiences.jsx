import { useEffect, useState } from 'react';
import { Search, ChevronLeft, MessageCircle, Activity, Instagram, Facebook, Phone, Tag, StickyNote, Plus, X, Filter } from 'lucide-react';
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Audience Insights</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Manage and categorize your AI Agent's interactions.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div className="table-card" style={{ padding: '8px 16px', flex: 1, display: 'flex', alignItems: 'center', minWidth: '300px' }}>
          <Search size={18} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
          <input 
            type="text" 
            placeholder="Search name, ID or notes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 0', background: 'transparent', border: 'none', outline: 'none', fontSize: '0.95rem' }}
          />
        </div>
        <div className="table-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Filter size={18} style={{ color: 'var(--text-muted)' }} />
          <select 
            value={selectedTagFilter} 
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            <option value="All">All Tags</option>
            {allAvailableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </div>
      </div>

      <div className="table-card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '20px 24px', textAlign: 'left', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category Tags</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Interactions</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Live</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '100px 20px' }}>
                  <div style={{ opacity: 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <Users size={64} />
                    <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>No Audience Matches</div>
                  </div>
                </td>
              </tr>
            ) : filteredContacts.map((contact) => (
              <tr 
                key={contact._id} 
                onClick={() => setSelectedContact(contact)}
                style={{ cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.03)'; e.currentTarget.style.transform = 'scale(1.002)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; }}
              >
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                     <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: 'white', fontWeight: '700', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.2)'
                      }}>
                       {contact.name.charAt(0).toUpperCase()}
                     </div>
                     <div>
                       <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1rem' }}>{contact.name}</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         {getPlatformIcon(contact.platform)} {contact.platform}
                       </div>
                     </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {contact.tags.length > 0 ? contact.tags.map(tag => (
                      <span key={tag} style={{ ...getTagColor(tag), padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', border: `1px solid ${getTagColor(tag).border}` }}>{tag}</span>
                    )) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>Untagged</span>}
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '1rem' }}>
                    <MessageCircle size={16} color="var(--accent-color)" /> {contact.totalMessages}
                  </div>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <div>{new Date(contact.lastActive).toLocaleDateString()}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{new Date(contact.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
