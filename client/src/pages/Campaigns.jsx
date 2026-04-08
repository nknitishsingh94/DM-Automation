import { useEffect, useState } from 'react';
import { Zap, Plus, Trash2, Power, MessageCircle, AlertCircle, CheckCircle, Video, Link as LinkIcon } from 'lucide-react';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCamp, setNewCamp] = useState({ name: '', trigger: '', response: '', platform: 'all', videoUrl: '', linkUrl: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchCampaigns = async () => {
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch('http://localhost:5000/api/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch('http://localhost:5000/api/campaigns', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCamp)
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Campaign created successfully!' });
        setNewCamp({ name: '', trigger: '', response: '', platform: 'all', videoUrl: '', linkUrl: '' });
        setShowAdd(false);
        fetchCampaigns();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Something went wrong.' });
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`http://localhost:5000/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchCampaigns();
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`http://localhost:5000/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchCampaigns();
    } catch (err) {
      console.error("Error deleting campaign:", err);
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading campaigns...</div>;

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Automation Campaigns</h2>
          <p style={{ color: 'var(--text-muted)' }}>Active triggers for your AI Agent in Instagram DMs.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          style={{ 
            background: 'var(--accent-color)', 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '8px', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
          <Plus size={20} /> {showAdd ? 'Cancel' : 'New Campaign'}
        </button>
      </div>

      {showAdd && (
        <div className="table-card" style={{ padding: '24px', marginBottom: '32px', animation: 'fadeIn 0.3s ease-out' }}>
          <h3 style={{ marginBottom: '20px' }}>Add New Trigger</h3>
          <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Campaign Name</label>
              <input 
                type="text" 
                required
                value={newCamp.name}
                onChange={(e) => setNewCamp({...newCamp, name: e.target.value})}
                placeholder="e.g. Sales Inquiry"
                style={{ width: '100%', padding: '12px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Trigger Keyword</label>
              <input 
                type="text" 
                required
                value={newCamp.trigger}
                onChange={(e) => setNewCamp({...newCamp, trigger: e.target.value})}
                placeholder="e.g. PRICE"
                style={{ width: '100%', padding: '12px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Platform</label>
              <select 
                required
                value={newCamp.platform}
                onChange={(e) => setNewCamp({...newCamp, platform: e.target.value})}
                style={{ width: '100%', padding: '12px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '8px', outline: 'none' }}
              >
                <option value="all">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook Messenger</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Auto-Send Video (URL)</label>
              <div style={{ position: 'relative' }}>
                <Video size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={newCamp.videoUrl}
                  onChange={(e) => setNewCamp({...newCamp, videoUrl: e.target.value})}
                  placeholder="e.g. https://youtu.be/..."
                  style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '8px', outline: 'none' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Auto-Send Link (URL)</label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={newCamp.linkUrl}
                  onChange={(e) => setNewCamp({...newCamp, linkUrl: e.target.value})}
                  placeholder="e.g. https://my-product.com"
                  style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '8px', outline: 'none' }}
                />
              </div>
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>AI Response Message</label>
              <textarea 
                required
                value={newCamp.response}
                onChange={(e) => setNewCamp({...newCamp, response: e.target.value})}
                placeholder="What should the AI say when this keyword is sent?"
                style={{ width: '100%', padding: '12px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '8px', height: '100px', outline: 'none', resize: 'none' }}
              />
            </div>
            <button type="submit" style={{ gridColumn: 'span 2', background: 'var(--accent-color)', color: 'white', padding: '14px', borderRadius: '8px', fontWeight: '600' }}>
              Create Campaign
            </button>
          </form>
        </div>
      )}

      {message.text && (
        <div style={{ padding: '12px', background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? '#34d399' : '#f87171', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Platform</th>
              <th>Keyword Trigger</th>
              <th>Media</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No campaigns found. Create your first trigger!</td></tr>
            ) : campaigns.map((camp) => (
              <tr key={camp._id}>
                <td>
                  <div style={{ fontWeight: '600' }}>{camp.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {camp._id.slice(-6)}</div>
                </td>
                <td>
                  <span style={{ 
                    background: camp.platform === 'whatsapp' ? '#dcfce7' : (camp.platform === 'facebook' ? '#dbeafe' : (camp.platform === 'instagram' ? '#fce7f3' : '#f1f5f9')), 
                    color: camp.platform === 'whatsapp' ? '#166534' : (camp.platform === 'facebook' ? '#1e40af' : (camp.platform === 'instagram' ? '#9d174d' : '#475569')), 
                    padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'capitalize' 
                  }}>
                    {camp.platform || 'all'}
                  </span>
                </td>
                <td>
                  <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-color)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500' }}>
                    "{camp.trigger}"
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {camp.videoUrl && <Video size={16} title="Includes Video" style={{ color: '#8b5cf6' }} />}
                    {camp.linkUrl && <LinkIcon size={16} title="Includes Link" style={{ color: '#3b82f6' }} />}
                    {!camp.videoUrl && !camp.linkUrl && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${camp.status === 'Active' ? 'status-success' : 'status-pending'}`}>
                    {camp.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => toggleStatus(camp._id, camp.status)}
                      title={camp.status === 'Active' ? 'Pause' : 'Activate'}
                      className="action-btn"
                      style={{ color: camp.status === 'Active' ? '#f59e0b' : '#10b981' }}
                    >
                      <Power size={18} />
                    </button>
                    <button 
                      onClick={() => deleteCampaign(camp._id)}
                      title="Delete"
                      className="action-btn"
                      style={{ color: '#f87171' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
