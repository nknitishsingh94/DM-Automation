import React, { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, Power, MessageCircle, AlertCircle, CheckCircle, Video, Link as LinkIcon, History, X, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../App';

export default function Campaigns() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notify } = useNotification();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formStep, setFormStep] = useState(1);
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
      if (res.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setCampaigns(data);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setCampaigns([]);
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
      if (res.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setFlows(data);
      } else {
        setFlows([]);
      }
    } catch (err) {
      console.error("Error fetching flows:", err);
      setFlows([]);
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
        setFormStep(1);
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
                navigate('/upgrade');
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
            onClick={() => {
              if (showAdd) setFormStep(1);
              setShowAdd(!showAdd);
            }}
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
                       navigate('/upgrade');
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
        <div className="table-card" style={{ padding: '32px', marginBottom: '32px', animation: 'fadeIn 0.3s ease-out', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(90deg, var(--accent-main), #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              Configure Smart Automation
            </h3>
            
            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: formStep >= 1 ? 'var(--accent-main)' : '#e2e8f0', color: formStep >= 1 ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.3s' }}>1</div>
                <span style={{ fontSize: '0.85rem', fontWeight: formStep >= 1 ? '700' : '600', color: formStep >= 1 ? 'var(--text-main)' : '#64748b' }}>Basics</span>
              </div>
              <div style={{ width: '24px', height: '2px', background: formStep >= 2 ? 'var(--accent-main)' : '#e2e8f0', transition: 'all 0.3s' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: formStep >= 2 ? 'var(--accent-main)' : '#e2e8f0', color: formStep >= 2 ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.3s' }}>2</div>
                <span style={{ fontSize: '0.85rem', fontWeight: formStep >= 2 ? '700' : '600', color: formStep >= 2 ? 'var(--text-main)' : '#64748b' }}>Rules</span>
              </div>
              <div style={{ width: '24px', height: '2px', background: formStep >= 3 ? 'var(--accent-main)' : '#e2e8f0', transition: 'all 0.3s' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: formStep >= 3 ? 'var(--accent-main)' : '#e2e8f0', color: formStep >= 3 ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.3s' }}>3</div>
                <span style={{ fontSize: '0.85rem', fontWeight: formStep >= 3 ? '700' : '600', color: formStep >= 3 ? 'var(--text-main)' : '#64748b' }}>Action</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddSubmit}>
            
            {/* STEP 1: BASICS */}
            {formStep === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', animation: 'fadeIn 0.3s' }}>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600' }}>Campaign Name</label>
                  <input 
                    type="text" 
                    required
                    value={newCamp.name}
                    onChange={(e) => setNewCamp({...newCamp, name: e.target.value})}
                    placeholder="e.g. Sales Inquiry Welcome"
                    style={{ width: '100%', padding: '14px', background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '10px', outline: 'none', transition: 'border 0.2s', fontSize: '1rem' }}
                  />
                </div>
                
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600' }}>Platform</label>
                  <select 
                    required
                    value={newCamp.platform}
                    onChange={(e) => setNewCamp({...newCamp, platform: e.target.value})}
                    style={{ width: '100%', padding: '14px', background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '10px', outline: 'none', fontSize: '1rem' }}
                  >
                    <option value="all">All Platforms</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook Messenger</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600' }}>Trigger Source</label>
                  <select 
                    required
                    value={newCamp.triggerSource}
                    onChange={(e) => setNewCamp({...newCamp, triggerSource: e.target.value})}
                    style={{ width: '100%', padding: '14px', background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '10px', outline: 'none', fontSize: '1rem' }}
                  >
                    <option value="dm">Direct Chat Message</option>
                    <option value="comment">Comments on Post/Reel</option>
                    <option value="story_mention">Story Mention (Instagram)</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: TRIGGER RULES */}
            {formStep === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', animation: 'fadeIn 0.3s' }}>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600' }}>Trigger Keyword <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(What should the user type?)</span></label>
                  <input 
                    type="text" 
                    required
                    value={newCamp.trigger}
                    onChange={(e) => setNewCamp({...newCamp, trigger: e.target.value})}
                    placeholder="e.g. SEND LINK"
                    style={{ width: '100%', padding: '14px', background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '10px', outline: 'none', fontSize: '1rem' }}
                  />
                </div>

                <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: newCamp.requireFollow ? 'rgba(139, 92, 246, 0.05)' : '#f8fafc', borderRadius: '10px', border: newCamp.requireFollow ? '1px solid var(--accent-main)' : '1px solid var(--border-subtle)', transition: 'all 0.3s' }}>
                  <input 
                    type="checkbox" 
                    id="requireFollow"
                    checked={newCamp.requireFollow}
                    onChange={(e) => setNewCamp({...newCamp, requireFollow: e.target.checked})}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
                  />
                  <div>
                    <label htmlFor="requireFollow" style={{ fontSize: '1rem', fontWeight: '700', cursor: 'pointer', display: 'block' }}>Require Follow to Unlock</label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Only send the final action to users who follow your page.</span>
                  </div>
                </div>

                {newCamp.requireFollow && (
                  <div className="input-group" style={{ animation: 'fadeIn 0.2s ease-in' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '700' }}>Gating Message (Non-Followers)</label>
                    <textarea 
                      required
                      value={newCamp.unfollowedResponse}
                      onChange={(e) => setNewCamp({...newCamp, unfollowedResponse: e.target.value})}
                      placeholder="Hi! Please follow our page first to receive this content..."
                      style={{ width: '100%', padding: '14px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--accent-light)', borderRadius: '10px', height: '100px', outline: 'none', resize: 'vertical', fontSize: '0.95rem', lineHeight: '1.5' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: ACTION / RESPONSE */}
            {formStep === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', animation: 'fadeIn 0.3s' }}>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600' }}>Target Response <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(What arrives after they send the keyword?)</span></label>
                  <textarea 
                    required
                    value={newCamp.response}
                    onChange={(e) => setNewCamp({...newCamp, response: e.target.value})}
                    placeholder="Here is the link you requested: [LINK]. Let us know if..."
                    style={{ width: '100%', padding: '14px', background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '10px', height: '120px', outline: 'none', resize: 'vertical', fontSize: '0.95rem', lineHeight: '1.5' }}
                  />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '700' }}>Bonus Attachment (Image/Video/Link)</label>
                    <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
                      <button 
                        type="button" 
                        onClick={() => setMediaMode('link')}
                        style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', background: mediaMode === 'link' ? 'white' : 'transparent', color: mediaMode === 'link' ? 'var(--accent-color)' : '#475569', fontWeight: '700', cursor: 'pointer', boxShadow: mediaMode === 'link' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                      >
                        Use Link
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setMediaMode('upload')}
                        style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', background: mediaMode === 'upload' ? 'white' : 'transparent', color: mediaMode === 'upload' ? 'var(--accent-color)' : '#475569', fontWeight: '700', cursor: 'pointer', boxShadow: mediaMode === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                      >
                        Upload File
                      </button>
                    </div>
                  </div>
                  
                  {mediaMode === 'link' ? (
                    <div style={{ position: 'relative' }}>
                      <LinkIcon size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        value={newCamp.videoUrl}
                        onChange={(e) => setNewCamp({...newCamp, videoUrl: e.target.value})}
                        placeholder="Paste image or video direct URL here..."
                        style={{ width: '100%', padding: '14px 14px 14px 44px', background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '10px', outline: 'none', fontSize: '0.95rem' }}
                      />
                    </div>
                  ) : (
                    <div style={{ border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '30px 20px', textAlign: 'center', position: 'relative', background: '#f8fafc', cursor: 'pointer', transition: 'border 0.2s' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'} onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}>
                      {uploading ? (
                        <div style={{ color: 'var(--accent-color)', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <div className="loader" style={{ width: '20px', height: '20px', border: '3px solid #e2e8f0', borderTopColor: 'var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                          Uploading Media...
                        </div>
                      ) : (
                        <>
                          <input 
                            type="file" 
                            onChange={handleFileUpload}
                            style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 5 }}
                          />
                          <div style={{ color: '#475569', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            {newCamp.videoUrl ? (
                              <>
                                <CheckCircle size={32} color="#10b981" />
                                <span style={{ color: '#10b981', fontWeight: '600' }}>Media Selected ({newCamp.videoUrl.split('/').pop().substring(0, 20)})</span>
                              </>
                            ) : (
                              <>
                                <Video size={32} color="#94a3b8" />
                                <span>Click or drag to attach media (Max 50MB)</span>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NAVIGATION BUTTONS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
              <button 
                type="button" 
                onClick={() => setFormStep(prev => Math.max(1, prev - 1))}
                style={{ 
                  background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', 
                  padding: '12px 24px', borderRadius: '8px', fontWeight: '600', cursor: formStep === 1 ? 'not-allowed' : 'pointer',
                  opacity: formStep === 1 ? 0 : 1, transition: 'all 0.2s', visibility: formStep === 1 ? 'hidden' : 'visible'
                }}>
                Back
              </button>
              
              {formStep < 3 ? (
                <button 
                  type="button" 
                  onClick={() => {
                    if (formStep === 1 && (!newCamp.name || !newCamp.platform)) return notify("Please fill all basic details", "error");
                    if (formStep === 2 && !newCamp.trigger) return notify("Please enter a trigger keyword", "error");
                    setFormStep(prev => Math.min(3, prev + 1));
                  }}
                  style={{ 
                    background: 'var(--text-main)', color: 'white', border: 'none',
                    padding: '12px 32px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                  Continue Next →
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={submitting}
                  style={{ 
                    background: submitting ? 'var(--text-muted)' : 'var(--accent-color)', color: 'white', border: 'none',
                    padding: '12px 32px', borderRadius: '8px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                  {submitting ? 'Deploying...' : <><Zap size={18} /> Launch Campaign</>}
                </button>
              )}
            </div>
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
