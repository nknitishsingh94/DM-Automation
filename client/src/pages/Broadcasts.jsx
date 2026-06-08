import { useEffect, useState } from 'react';
import { Megaphone, Users, Send, CheckCircle2, AlertCircle, Clock, Search, MessageSquare, Zap, Lightbulb } from 'lucide-react';
import { API_BASE_URL } from '../config';
import '../styles/Broadcasts.css';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Broadcasts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [broadcastText, setBroadcastText] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [filterActiveOnly, setFilterActiveOnly] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setContacts(data);
      } else {
        console.error("API returned non-array for contacts:", data);
        setContacts([]);
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const isWithin24h = (lastActive) => {
    return new Date(lastActive).getTime() > (Date.now() - 24 * 60 * 60 * 1000);
  };

  const filteredContacts = contacts.filter(c => {
    if (!c) return false;
    const name = String(c.name || '');
    const chatId = String(c.chatId || '');
    const matchesSearch = name.toLowerCase().includes(String(searchTerm || '').toLowerCase()) || 
                          chatId.toLowerCase().includes(String(searchTerm || '').toLowerCase());
    const matchesActive = filterActiveOnly ? isWithin24h(c.lastActive) : true;
    return matchesSearch && matchesActive;
  });

  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c._id));
    }
  };

  const toggleSelectContact = (id) => {
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleSendBroadcast = async () => {
    if (selectedContacts.length === 0 || !broadcastText.trim()) return;

    setSending(true);
    setStatus({ type: '', text: '' });
    setProgress({ current: 0, total: selectedContacts.length });

    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/broadcasts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contactIds: selectedContacts,
          text: broadcastText
        })
      });

      const result = await res.json();
      if (res.ok) {
        setStatus({ 
          type: 'success', 
          text: `Successfully sent to ${result.results.success} contacts! (${result.results.failed} failed)` 
        });
        setBroadcastText('');
        setSelectedContacts([]);
      } else {
        setStatus({ type: 'error', text: result.error || 'Failed to send broadcast' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="broadcasts-container">
      {/* Header Section */}
      <div className="broadcasts-hero">
        <div className="broadcasts-hero-content">
          <div className="broadcasts-badge">
            <Megaphone size={18} color="white" />
            <span>Bulk Messaging</span>
          </div>
          <h2>Spread the word.</h2>
          <p>
            Send announcements, updates, or offers to your community in bulk. 
            <span style={{ display: 'block', marginTop: '12px', color: '#fbbf24', fontWeight: 'bold' }}>
              ⚠️ Reminder: Only message users active in the last 24h to stay compliant.
            </span>
          </p>
        </div>
        <Zap size={250} className="broadcasts-hero-icon" />
      </div>

      <div className="broadcasts-layout">
        {/* Left Column: Contact Selection */}
        <div className="contact-selection">
          <div className="contact-filters">
            <div className="search-box">
              <Search size={18} color="#6366f1" style={{ marginRight: '12px' }} />
              <input 
                type="text" 
                placeholder="Search contacts..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className={`filter-btn ${filterActiveOnly ? 'active' : ''}`}
              onClick={() => setFilterActiveOnly(!filterActiveOnly)}
            >
              <Clock size={16} /> {filterActiveOnly ? 'Last 24h Only' : 'Show All'}
            </button>
          </div>

          <div className="contact-list-card">
            <div className="contact-list-header">
               <div className="select-all-group">
                  <input 
                    type="checkbox" 
                    className="custom-checkbox"
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0} 
                    onChange={toggleSelectAll} 
                  />
                  <span>Select All ({filteredContacts.length})</span>
               </div>
               <span className="selected-count">{selectedContacts.length} Selected</span>
            </div>

            <div className="contacts-scroll">
              {filteredContacts.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>No contacts match your filters.</div>
              ) : filteredContacts.map(contact => {
                const active = isWithin24h(contact.lastActive);
                const isSelected = selectedContacts.includes(contact._id);
                return (
                  <div 
                    key={contact?._id || Math.random()} 
                    className={`contact-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => contact?._id && toggleSelectContact(contact._id)}
                  >
                    <input 
                      type="checkbox" 
                      className="custom-checkbox"
                      checked={isSelected} 
                      onChange={() => {}} 
                    />
                    <div className={`contact-avatar ${active ? 'active' : 'inactive'}`}>
                      {String(contact?.name || contact?.chatId || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="contact-info">
                      <div className="contact-name">{contact?.name || contact?.chatId || 'Unknown'}</div>
                      <div className="contact-status">
                         {active ? '🟢 Active now' : `Last seen ${contact?.lastActive ? new Date(contact.lastActive).toLocaleDateString() : 'Unknown'}`}
                      </div>
                    </div>
                    <div className="platform-badge">
                      {String(contact?.platform || 'INSTAGRAM').toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Broadcast Composer */}
        <div className="broadcast-composer">
          <div className="composer-card">
            <h3 className="composer-title">
              <MessageSquare size={20} color="#6366f1" /> Create Message
            </h3>
            
            <textarea 
              className="composer-textarea"
              placeholder="Type your broadcast message here..." 
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              disabled={sending}
            />

            {status.text && (
              <div className={`status-message ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {status.text}
              </div>
            )}

            <button 
              className="send-btn"
              onClick={handleSendBroadcast}
              disabled={sending || selectedContacts.length === 0 || !broadcastText.trim()}
            >
              {sending ? (
                <>Sending Messages...</>
              ) : (
                <><Send size={20} /> Send Broadcast Now</>
              )}
            </button>

            {sending && (
              <div className="progress-container">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill"></div>
                </div>
                <p className="progress-text">
                  Sending to {selectedContacts.length} contacts. Please don't close this tab.
                </p>
              </div>
            )}
          </div>

          <div className="pro-tip-card">
            <h4><Lightbulb size={16} color="#fbbf24" /> Pro Tip</h4>
            <p>
              Use broadcasts for high-value announcements. Over-messaging can lead to reports or bans. We recommend keeping broadcasts to a maximum of 1-2 per week.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
