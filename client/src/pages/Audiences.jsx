import { useEffect, useState } from 'react';
import { Search, ChevronLeft, Calendar, MessageCircle, Activity } from 'lucide-react';

export default function Audiences() {
  const [audiences, setAudiences] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAudience, setSelectedAudience] = useState(null);

  useEffect(() => {
    const fetchAudiences = async () => {
      const token = localStorage.getItem('insta_agent_token');
      try {
        const res = await fetch('http://localhost:5000/api/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const messages = await res.json();
        
        const audienceMap = new Map();
        
        messages.forEach(msg => {
          // Identify interactions from audience (received, or sent to them)
          const isFromAudience = msg.sender !== 'admin' && msg.sender !== 'AI Agent' && msg.sender !== 'System';
          
          if (isFromAudience) {
            const id = msg.chatId || msg.sender;
            if (!audienceMap.has(id)) {
              audienceMap.set(id, {
                id,
                name: msg.sender,
                lastActive: new Date(msg.timestamp),
                totalMessages: 1
              });
            } else {
              const current = audienceMap.get(id);
              current.totalMessages += 1;
              const msgDate = new Date(msg.timestamp);
              if (msgDate > current.lastActive) {
                current.lastActive = msgDate;
                current.name = msg.sender;
              }
            }
          }
        });
        
        const audienceArray = Array.from(audienceMap.values()).sort((a, b) => b.lastActive - a.lastActive);
        setAudiences(audienceArray);
        setAllMessages(messages);
      } catch (err) {
        console.error("Error fetching audiences:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAudiences();
  }, []);

  const filteredAudiences = audiences.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading audiences...</div>;

  if (selectedAudience) {
    const userMessages = allMessages.filter(m => m.chatId === selectedAudience.id || m.sender === selectedAudience.id || m.sender === selectedAudience.name).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);

    return (
      <div style={{ maxWidth: '1000px', animation: 'fadeIn 0.3s ease-out' }}>
        <button 
          onClick={() => setSelectedAudience(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '24px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
          <ChevronLeft size={18} /> Back to Audience List
        </button>

        <div className="table-card" style={{ padding: '32px', marginBottom: '24px', display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, #10b981, #3b82f6)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: 'white', fontSize: '2rem', fontWeight: '700', flexShrink: 0 
          }}>
            {selectedAudience.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '4px' }}>{selectedAudience.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>User ID: {selectedAudience.id}</p>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
             <div style={{ textAlign: 'center', padding: '12px 24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
               <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>{selectedAudience.totalMessages}</div>
               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={14}/> Interactions</div>
             </div>
          </div>
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="var(--accent-color)" /> Recent Activity Log
        </h3>
        <div className="table-card">
          {userMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No historical messages found.</div>
          ) : (
            <div style={{ padding: '0 24px' }}>
              {userMessages.map((msg, idx) => {
                const isAI = msg.sender === 'AI Agent';
                const isAdmin = msg.sender === 'admin';
                const isAudience = !isAI && !isAdmin;
                
                return (
                  <div key={msg._id || idx} style={{ 
                    display: 'flex', gap: '16px', padding: '20px 0', 
                    borderBottom: idx !== userMessages.length - 1 ? '1px solid var(--border-subtle)' : 'none' 
                  }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: isAI ? '#e0e7ff' : (isAdmin ? '#d1fae5' : '#f1f5f9'),
                      color: isAI ? '#4f46e5' : (isAdmin ? '#059669' : '#475569'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.8rem'
                    }}>
                      {isAI ? 'AI' : (isAdmin ? 'ME' : 'U')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: isAI ? '#4f46e5' : 'var(--text-main)' }}>
                          {isAI ? 'AI Auto-Reply' : (isAdmin ? 'You (Admin)' : msg.sender)}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.5' }}>{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Audience Manager</h2>
          <p style={{ color: 'var(--text-muted)' }}>People who have interacted with your AI Agent.</p>
        </div>
      </div>

      <div className="table-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search audience by Name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '8px', outline: 'none' }}
          />
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Contact Name / ID</th>
              <th>Total Messages</th>
              <th>Last Active</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAudiences.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No audience members found.</td></tr>
            ) : filteredAudiences.map((aud) => (
              <tr 
                key={aud.id} 
                onClick={() => setSelectedAudience(aud)}
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #10b981, #3b82f6)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: 'white', fontWeight: '600' 
                      }}>
                       {aud.name.charAt(0).toUpperCase()}
                     </div>
                     <div>
                       <div style={{ fontWeight: '600', color: 'var(--accent-color)' }}>{aud.name}</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {aud.id}</div>
                     </div>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{aud.totalMessages}</span>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>
                  {aud.lastActive.toLocaleDateString()} {aud.lastActive.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </td>
                <td>
                  <span className="status-badge status-success">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
