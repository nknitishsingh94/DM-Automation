import { useEffect, useState } from 'react';
import { Megaphone, Users, Send, CheckCircle2, AlertCircle, Clock, Search, Filter, MessageSquare, ChevronRight, Zap } from 'lucide-react';
import { API_BASE_URL } from '../config';

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
      setContacts(data);
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
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.chatId.toLowerCase().includes(searchTerm.toLowerCase());
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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading contacts...</div>;

  return (
    <div style={{ maxWidth: '1000px', animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header Section */}
      <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', borderRadius: '24px', padding: '40px', color: 'white', marginBottom: '32px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(79, 70, 229, 0.2)' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '14px', backdropFilter: 'blur(10px)' }}>
              <Megaphone size={24} color="white" />
            </div>
            <span style={{ fontWeight: '700', letterSpacing: '1px', fontSize: '0.85rem', textTransform: 'uppercase' }}>Bulk Messaging</span>
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '12px' }}>Spread the word.</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', maxWidth: '500px' }}>
            Send announcements, updates, or offers to your community in bulk. 
            <span style={{ display: 'block', marginTop: '8px', color: '#fbbf24', fontWeight: 'bold' }}>
              ⚠️ Reminder: Only message users active in the last 24h to stay compliant.
            </span>
          </p>
        </div>
        <Zap size={200} style={{ position: 'absolute', right: '-20px', bottom: '-40px', opacity: 0.1, transform: 'rotate(-10deg)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        {/* Left Column: Contact Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '12px 20px', flex: 1, display: 'flex', alignItems: 'center' }}>
              <Search size={18} color="#6366f1" style={{ marginRight: '12px' }} />
              <input 
                type="text" 
                placeholder="Search contacts..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }}
              />
            </div>
            <button 
              onClick={() => setFilterActiveOnly(!filterActiveOnly)}
              style={{ 
                background: filterActiveOnly ? '#eef2ff' : 'white', 
                border: '1px solid #e2e8f0', 
                padding: '0 20px', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: filterActiveOnly ? '#4f46e5' : '#64748b',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <Clock size={16} /> {filterActiveOnly ? 'Last 24h Only' : 'Show All'}
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0} 
                    onChange={toggleSelectAll} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>Select All ({filteredContacts.length})</span>
               </div>
               <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>{selectedContacts.length} Selected</span>
            </div>

            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {filteredContacts.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>No contacts match your filters.</div>
              ) : filteredContacts.map(contact => {
                const active = isWithin24h(contact.lastActive);
                return (
                  <div 
                    key={contact._id} 
                    onClick={() => toggleSelectContact(contact._id)}
                    style={{ 
                      padding: '16px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
                      background: selectedContacts.includes(contact._id) ? '#f5f7ff' : 'white',
                      transition: 'background 0.2s'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedContacts.includes(contact._id)} 
                      onChange={() => {}} 
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '12px', 
                      background: active ? 'linear-gradient(135deg, #10b981, #34d399)' : '#f1f5f9', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? 'white' : '#94a3b8', fontWeight: '700' 
                    }}>
                      {contact.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1rem' }}>{contact.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                         {active ? '🟢 Active now' : `Last seen ${new Date(contact.lastActive).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {contact.platform.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Broadcast Composer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '24px', displa: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={20} color="#6366f1" /> Create Message
            </h3>
            
            <textarea 
              placeholder="Type your broadcast message here..." 
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              disabled={sending}
              style={{ 
                width: '100%', minHeight: '180px', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', 
                fontSize: '1rem', outline: 'none', resize: 'none', marginBottom: '24px', background: sending ? '#f8fafc' : 'white',
                lineHeight: '1.5'
              }}
            />

            {status.text && (
              <div style={{ 
                padding: '16px', borderRadius: '12px', marginBottom: '24px',
                background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: status.type === 'success' ? '#166534' : '#b91c1c',
                display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: '600'
              }}>
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {status.text}
              </div>
            )}

            <button 
              onClick={handleSendBroadcast}
              disabled={sending || selectedContacts.length === 0 || !broadcastText.trim()}
              style={{ 
                width: '100%', padding: '16px', borderRadius: '16px', 
                background: (sending || selectedContacts.length === 0 || !broadcastText.trim()) ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: 'white', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.3s'
              }}
            >
              {sending ? (
                <>Sending Messages...</>
              ) : (
                <><Send size={20} /> Send Broadcast Now</>
              )}
            </button>

            {sending && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ height: '8px', width: '100%', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `100%`, background: '#6366f1', animation: 'progressAnim 2s infinite' }}></div>
                </div>
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginTop: '10px', fontWeight: '600' }}>
                  Sending to {selectedContacts.length} contacts. Please don't close this tab.
                </p>
              </div>
            )}
          </div>

          <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '24px', border: '1px dashed #cbd5e1' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: '800', color: '#475569' }}>Pro Tip</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
              Use broadcasts for high-value announcements. Over-messaging can lead to reports or bans. We recommend keeping broadcasts to a maximum of 1-2 per week.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progressAnim {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
