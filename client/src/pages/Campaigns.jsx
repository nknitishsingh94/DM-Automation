import React, { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, Power, MessageCircle, AlertCircle, CheckCircle, Video, Link as LinkIcon, History, X, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../App';

export default function Campaigns() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCamp, setNewCamp] = useState({ 
    name: '', 
    trigger: '', 
    triggerSource: 'dm',
    response: '', 
    platform: 'all', 
    videoUrl: '', 
    linkUrl: '',
    requireFollow: false,
    unfollowedResponse: 'Please follow our account first to get a reply!'
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [flows, setFlows] = useState([]);
  const [loadingFlows, setLoadingFlows] = useState(true);
  const [mediaMode, setMediaMode] = useState('link'); // 'link' or 'upload'
  const [uploading, setUploading] = useState(false);

  const fetchCampaigns = async () => {
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
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

  const fetchFlows = async () => {
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/flows`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFlows(data);
    } catch (err) {
      console.error("Error fetching flows:", err);
    } finally {
      setLoadingFlows(false);
    }
  };

  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Client‑side size check (50 MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('❌ File is too large (max 50 MB). Please choose a smaller file.');
      return;
    }
    setUploadError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('media', file);

    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setNewCamp({ ...newCamp, videoUrl: data.url });
        notify('✅ File uploaded successfully!', 'success');
      } else {
        notify(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      notify('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };
  useEffect(() => {
    fetchCampaigns();
    fetchFlows();

    // --- AUTO-OPEN SETUP FLOW ---
    const params = new URLSearchParams(window.location.search);
    if (params.get('setup')) {
      setShowAdd(true);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCamp)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Campaign created successfully!' });
        setNewCamp({ 
          name: '', 
          trigger: '', 
          triggerSource: 'dm',
          response: '', 
          platform: 'all', 
          videoUrl: '', 
          linkUrl: '',
          requireFollow: false,
          unfollowedResponse: 'Please follow our account first to get a reply!'
        });
        setShowAdd(false);
        fetchCampaigns();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create campaign' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    
    // Optimistic Update: Update UI immediately
    setCampaigns(prev => prev.map(c => 
      c._id === id ? { ...c, status: newStatus } : c
    ));

    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        // Rollback on error if needed or fetch fresh
        fetchCampaigns();
      }
    } catch (err) {
      console.error("Error toggling status:", err);
      fetchCampaigns(); // Reset to server state
    }
  };

  const deleteCampaign = async (id) => {
    // Optimistic Update: Remove from UI immediately
    const previousCampaigns = [...campaigns];
    setCampaigns(prev => prev.filter(c => c._id !== id));
    
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Campaign deleted successfully!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to delete campaign' });
        setCampaigns(previousCampaigns); // Rollback
      }
    } catch (err) {
      console.error("Error deleting campaign:", err);
      setMessage({ type: 'error', text: 'Connection error' });
      setCampaigns(previousCampaigns); // Rollback
    }
  };
  const deleteFlow = async (id, e) => {
    e.stopPropagation(); // Prevent navigating to builder
    
    // Optimistic Update
    const previousFlows = [...flows];
    setFlows(prev => prev.filter(f => f._id !== id));
    
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/flows/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        notify("Flow deleted successfully!", "success");
      } else {
        setFlows(previousFlows);
        notify("Failed to delete flow", "error");
      }
    } catch (err) {
      console.error("Error deleting flow:", err);
      setFlows(previousFlows);
    }
  };

  const viewLogs = async (campaign) => {
    setSelectedCampaign(campaign);
    setLoadingLogs(true);
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${campaign._id}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  if (loading || loadingFlows) return <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>Loading automations...</div>;

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Automation Campaigns</h2>
          <p style={{ color: 'var(--text-muted)' }}>Active triggers for your AI Agent in Instagram DMs.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => {
              if (user?.plan === 'pro') {
                navigate('/flow-builder/new');
              } else {
                notify('💎 Advanced Flows require a Pro Subscription. Upgrade to unlock!', 'error');
                navigate('/subscription');
              }
            }}
            style={{ 
              background: 'white', 
              color: 'var(--accent-color)', 
              border: '1px solid var(--accent-color)',
              padding: '12px 24px', 
              borderRadius: '8px', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              position: 'relative'
            }}>
            <Zap size={20} /> Advanced Flow
            {user?.plan !== 'pro' && (
              <span style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--accent-main)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>PRO</span>
            )}
          </button>
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
            <Plus size={20} /> {showAdd ? 'Cancel' : 'Simple Campaign'}
          </button>
        </div>
      </div>

      {/* Advanced Flows Section */}
      {flows.length > 0 && (
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
             <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px' }}>
               <Zap size={20} color="var(--accent-color)" />
             </div>
             <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Visual Automation Flows <span className="sidebar-badge badge-new" style={{ marginLeft: '8px' }}>PRO</span></h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {flows.map(flow => (
              <div key={flow._id} className="table-card" style={{ padding: '24px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative', opacity: user?.plan === 'pro' ? 1 : 0.8 }} 
                   onClick={() => {
                     if (user?.plan === 'pro') {
                       navigate(`/flow-builder/${flow._id}`);
                     } else {
                       notify('💎 Upgrade to PRO to edit this advanced automation.', 'error');
                       navigate('/subscription');
                     }
                   }}
                   onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                   onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                {user?.plan !== 'pro' && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(1px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'inherit', zIndex: 5 }}>
                    <div style={{ background: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid var(--accent-light)', color: 'var(--accent-main)', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <Crown size={14} /> UNLOCK PRO
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-color)', textTransform: 'uppercase' }}>Active Flow</span>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                </div>
                <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: '800' }}>{flow.name}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <Zap size={14} /> Triggers on: <span style={{ color: 'var(--accent-color)', fontWeight: '700' }}>"{flow.triggerKeyword || '*'}"</span>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteFlow(flow._id, e); }}
                    style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    title="Delete Flow"
                  >
                    <Trash2 size={16} />
                  </button>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Edit Flow <History size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {flows.length > 0 && <div style={{ height: '1px', background: 'var(--border-subtle)', marginBottom: '48px' }}></div>}

      {showAdd && (
        <div className="table-card" style={{ padding: '24px', marginBottom: '32px', animation: 'fadeIn 0.3s ease-out' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(90deg, var(--accent-main), #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Configure Smart Automation Path
          </h3>
          <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
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
            
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>Trigger Source</label>
              <select 
                required
                value={newCamp.triggerSource}
                onChange={(e) => setNewCamp({...newCamp, triggerSource: e.target.value})}
                style={{ width: '100%', padding: '12px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '8px', outline: 'none' }}
              >
                <option value="dm">Direct Chat Message</option>
                <option value="comment">Comments on Post/Reel</option>
                <option value="story_mention">Story Mention (Instagram)</option>
              </select>
            </div>
            
            <div className="input-group">
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

            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '700' }}>Media (Image/Video)</label>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px' }}>
                  <button 
                    type="button" 
                    onClick={() => setMediaMode('link')}
                    style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: mediaMode === 'link' ? 'white' : 'transparent', color: mediaMode === 'link' ? 'var(--accent-color)' : '#64748b', fontWeight: '700', cursor: 'pointer', boxShadow: mediaMode === 'link' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                  >
                    Use Link
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setMediaMode('upload')}
                    style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: mediaMode === 'upload' ? 'white' : 'transparent', color: mediaMode === 'upload' ? 'var(--accent-color)' : '#64748b', fontWeight: '700', cursor: 'pointer', boxShadow: mediaMode === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                  >
                    Upload File
                  </button>
                </div>
              </div>
              
              {mediaMode === 'link' ? (
                <div style={{ position: 'relative' }}>
                  <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    value={newCamp.videoUrl}
                    onChange={(e) => setNewCamp({...newCamp, videoUrl: e.target.value})}
                    placeholder="Paste image or video URL here..."
                    style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}
                  />
                </div>
              ) : (
                <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: '10px', padding: '20px', textAlign: 'center', position: 'relative' }}>
                  {uploading ? (
                    <div style={{ color: 'var(--accent-color)', fontWeight: '700' }}>Uploading...</div>
                  ) : (
                    <>
                      <input 
                        type="file" 
                        onChange={handleFileUpload}
                        style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      />
                      <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {newCamp.videoUrl ? (
                          <span style={{ color: '#10b981' }}>✅ {newCamp.videoUrl.split('/').pop()} uploaded</span>
                        ) : (
                          'Click or drag to upload media (max 5MB)'
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '8px', border: '1px dashed var(--accent-light)' }}>
              <input 
                type="checkbox" 
                id="requireFollow"
                checked={newCamp.requireFollow}
                onChange={(e) => setNewCamp({...newCamp, requireFollow: e.target.checked})}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
              />
              <label htmlFor="requireFollow" style={{ fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Only reply if the user follows me (Instagram/Facebook)</label>
            </div>

            {newCamp.requireFollow && (
              <div className="input-group" style={{ gridColumn: 'span 2', animation: 'fadeIn 0.2s ease-in' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '600' }}>Message for Non-Followers</label>
                <textarea 
                  required
                  value={newCamp.unfollowedResponse}
                  onChange={(e) => setNewCamp({...newCamp, unfollowedResponse: e.target.value})}
                  placeholder="Hey! Please follow us first to unlock this info..."
                  style={{ width: '100%', padding: '12px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--accent-light)', borderRadius: '8px', height: '80px', outline: 'none', resize: 'none' }}
                />
              </div>
            )}

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
            <button 
              type="submit" 
              disabled={submitting}
              style={{ 
                gridColumn: 'span 2', 
                background: submitting ? 'var(--text-muted)' : 'var(--accent-color)', 
                color: 'white', 
                padding: '14px', 
                borderRadius: '8px', 
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}>
              {submitting ? 'Creating Campaign...' : 'Create Campaign'}
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

      <div className="table-card" style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Platform</th>
              <th>Trigger Source</th>
              <th>Media</th>
              <th>Follow Check</th>
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
                  <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-color)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', display: 'inline-block', marginBottom: '4px' }}>
                    "{camp.trigger}"
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {camp.triggerSource === 'comment' ? '🗣️ Post Comment' : (camp.triggerSource === 'story_mention' ? '📸 Story Mention' : '💬 Direct Message')}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {camp.videoUrl && <Video size={16} title="Includes Video" style={{ color: '#8b5cf6' }} />}
                    {camp.linkUrl && <LinkIcon size={16} title="Includes Link" style={{ color: '#3b82f6' }} />}
                    {!camp.videoUrl && !camp.linkUrl && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {camp.requireFollow ? (
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                        <CheckCircle size={14} /> Enabled
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Disabled</span>
                    )}
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
                      onClick={() => viewLogs(camp)}
                      title="View History"
                      className="action-btn"
                      style={{ color: 'var(--accent-color)' }}
                    >
                      <History size={18} />
                    </button>
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

      {/* Logs Modal */}
      {selectedCampaign && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setSelectedCampaign(null)}>
          <div className="table-card" style={{ 
            width: '90%', maxWidth: '700px', maxHeight: '85vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Process History: {selectedCampaign.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time logs for keyword: "{selectedCampaign.trigger}"</p>
              </div>
              <button onClick={() => setSelectedCampaign(null)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {loadingLogs ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Fetching latest logs...</div>
              ) : logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No messages processed yet for this campaign.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {logs.map((log) => (
                    <div key={log._id} style={{ 
                      padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)',
                      background: 'rgba(255,255,255,0.3)', position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-color)' }}>{log.platform || 'instagram'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Recipient:</span> {log.chatId}
                      </div>
                      <div style={{ fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>AI Sent:</span> "{log.text}"
                      </div>
                      {log.linkUrl && (
                        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <LinkIcon size={14} /> Attached Link: {log.linkUrl}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
