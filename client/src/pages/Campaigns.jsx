import React, { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, Power, MessageCircle, MessageSquare, Instagram, AlertCircle, CheckCircle, Video, Link as LinkIcon, History, X, Crown, Edit2, Globe, Share2, Sparkles, Brain, Bot } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'universal', 'linked'
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
    unfollowedResponse: 'Please follow our account first to get a reply!',
    isUniversal: false
  });
  
  // Edit State
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', trigger: '', response: '', linkUrl: '', buttonText: '', isUniversal: false });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [flows, setFlows] = useState([]);
  const [loadingFlows, setLoadingFlows] = useState(true);
  const [mediaMode, setMediaMode] = useState('link'); // 'link' or 'upload'
  const [uploading, setUploading] = useState(false);
  const [isMobile] = useState(window.innerWidth < 768);

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
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('❌ File is too large (max 50MB). Please choose a smaller file.');
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

    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('insta_agent_token');
        const res = await fetch(`${API_BASE_URL}/api/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setConnectedSettings(data);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    fetchSettings();

    const params = new URLSearchParams(window.location.search);
    if (params.get('setup')) {
      setShowAdd(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [connectedSettings, setConnectedSettings] = useState(null);

  const handleBuildClick = () => {
    navigate('/campaign-builder/new');
  };

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
          unfollowedResponse: 'Please follow our account first to get a reply!',
          isUniversal: false
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
        fetchCampaigns();
      }
    } catch (err) {
      console.error("Error toggling status:", err);
      fetchCampaigns();
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${editingCampaign._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        notify("Campaign updated successfully!", "success");
        setEditingCampaign(null);
        fetchCampaigns();
      } else {
        notify("Failed to update campaign", "error");
      }
    } catch (err) {
      notify("Connection error during update", "error");
    }
  };

  const deleteCampaign = async (id) => {
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
        setCampaigns(previousCampaigns);
      }
    } catch (err) {
      console.error("Error deleting campaign:", err);
      setMessage({ type: 'error', text: 'Connection error' });
      setCampaigns(previousCampaigns);
    }
  };
  const deleteFlow = async (id, e) => {
    e.stopPropagation();
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

  const filteredCampaigns = campaigns.filter(c => {
    if (activeTab === 'universal') return c.isUniversal;
    if (activeTab === 'linked') return !c.isUniversal;
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '8px', letterSpacing: '-1px' }}>Automations</h1>
          <p style={{ color: '#64748b', fontWeight: '500' }}>Manage your AI-powered social media triggers</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <button 
            onClick={() => {
              setNewCamp({...newCamp, isUniversal: true});
              setShowAdd(true);
            }} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', 
              borderRadius: '14px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', 
              border: '1px solid rgba(14, 165, 233, 0.2)', fontWeight: '800', cursor: 'pointer', transition: 'all 0.3s' 
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.15)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)'}
          >
            <Globe size={18} /> New Universal Trigger
          </button>
          <button 
            onClick={() => {
              setNewCamp({...newCamp, isUniversal: false});
              setShowAdd(true);
            }} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', 
              borderRadius: '14px', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', 
              color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)', transition: 'all 0.3s' 
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={20} /> Create New
          </button>
        </div>
      </div>

      {activeTab === 'all' && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Sparkles size={18} color="#7c3aed" /> Quick Start Templates
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { id: 'dm', title: 'DM Automation', desc: 'Trigger DMs from Keywords', icon: <Zap size={24} />, color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.1)', path: '/dm-automation-editor?template=all_dms' },
              { id: 'comment', title: 'Comment Reply', desc: 'Auto-DM on Comments', icon: <MessageSquare size={24} />, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)', path: '/automation-editor?template=comments' },
              { id: 'story', title: 'Story Trigger', desc: 'Reply to Story Mentions', icon: <Instagram size={24} />, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', path: '/automation-editor?template=stories' },
              { id: 'ai', title: 'AI Neural Studio', desc: 'Train your custom AI', icon: <Bot size={24} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', path: '/ai-studio' }
            ].map(item => (
              <div 
                key={item.id}
                onClick={() => navigate(item.path)}
                style={{ 
                  background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9', 
                  cursor: 'pointer', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', gap: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = item.color; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '4px' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', padding: '6px', background: '#f1f5f9', borderRadius: '16px', width: 'fit-content' }}>
        {[
          { id: 'all', label: 'All Automations', icon: <Zap size={16} /> },
          { id: 'universal', label: 'Universal Triggers', icon: <Globe size={16} /> },
          { id: 'linked', label: 'Linked Posts', icon: <Share2 size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px',
              border: 'none', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#1e1b4b' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {message.text && (
        <div style={{ padding: '12px', background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? '#34d399' : '#f87171', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {filteredCampaigns.length > 0 ? (
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e1b4b' }}>Active Automations</h3>
            <span style={{ padding: '6px 16px', background: '#f5f3ff', color: '#7c3aed', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '700' }}>
              {filteredCampaigns.length} Total
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {filteredCampaigns.map((campaign) => (
              <div key={campaign._id} style={{ 
                background: 'white', 
                borderRadius: '24px', 
                padding: '24px', 
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)';
              }}
              >
                <div style={{ 
                  position: 'absolute', top: '24px', right: '24px',
                  padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '800',
                  background: campaign.triggerSource === 'story_mention' ? '#fdf2f8' : (campaign.triggerSource === 'comment' ? '#f0fdf4' : '#f0f9ff'),
                  color: campaign.triggerSource === 'story_mention' ? '#db2777' : (campaign.triggerSource === 'comment' ? '#16a34a' : '#0369a1'),
                  textTransform: 'uppercase'
                }}>
                  {campaign.triggerSource === 'story_mention' ? 'Story' : (campaign.triggerSource === 'comment' ? 'Comment' : 'DM')}
                </div>

                {campaign.isUniversal && (
                  <div style={{ 
                    position: 'absolute', top: '24px', right: '110px',
                    padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '800',
                    background: 'rgba(14, 165, 233, 0.1)',
                    color: '#0ea5e9',
                    textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    <Globe size={12} /> Universal
                  </div>
                )}

                <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '8px', paddingRight: '60px' }}>
                  {campaign.name}
                </h4>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
                  <MessageCircle size={16} />
                  <span>Trigger: <strong style={{ color: '#1e1b4b' }}>{campaign.trigger === '*' ? 'Any' : campaign.trigger}</strong></span>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>DMs Sent</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e1b4b' }}>{campaign.dmsSent || 0}</div>
                  </div>
                  <div style={{ width: '1px', background: '#e2e8f0' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: campaign.status === 'Active' ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: campaign.status === 'Active' ? '#10b981' : '#94a3b8' }}></div>
                      {campaign.status}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => toggleStatus(campaign._id, campaign.status)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#1e1b4b', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Power size={14} color={campaign.status === 'Active' ? '#10b981' : '#94a3b8'} />
                    {campaign.status === 'Active' ? 'Pause' : 'Activate'}
                  </button>
                  <button onClick={() => { setEditingCampaign(campaign); setEditForm({ name: campaign.name || '', trigger: campaign.trigger || '', response: campaign.response || '', linkUrl: campaign.linkUrl || '', buttonText: campaign.buttonText || '', isUniversal: campaign.isUniversal || false }); }} style={{ padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#3b82f6', cursor: 'pointer' }}>
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => viewLogs(campaign)} style={{ padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer' }}>
                    <History size={18} />
                  </button>
                  <button onClick={() => deleteCampaign(campaign._id)} style={{ padding: '10px', borderRadius: '12px', border: '1px solid #fee2e2', background: 'white', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', background: '#f8fafc', borderRadius: '24px', border: '1px dashed #e2e8f0', marginTop: '32px' }}>
          <Zap size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '8px' }}>No automations found</h3>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>{activeTab === 'universal' ? "No universal triggers created yet." : "No linked post automations found."}</p>
          <button onClick={() => navigate('/campaign-builder/new')} style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Create One Now</button>
        </div>
      )}

      {flows.length > 0 && (
        <div style={{ marginTop: '64px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Zap size={28} color="#d946ef" />
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e1b4b', margin: 0 }}>Visual Flows</h3>
              <span className="sidebar-badge badge-new">PRO</span>
            </div>
            <span style={{ padding: '6px 16px', background: '#fdf4ff', color: '#d946ef', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '700' }}>
              {flows.length} Total
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {flows.map((flow) => (
              <div key={flow._id} style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #fce7f3', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(217,70,239,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; }}>
                <div style={{ position: 'absolute', top: '24px', right: '24px', padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '800', background: '#fdf4ff', color: '#d946ef', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}><Crown size={12} /> Advanced</div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '8px', paddingRight: '100px' }}>{flow.name || 'Untitled Flow'}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}><MessageCircle size={16} /><span>Keyword: <strong style={{ color: '#1e1b4b' }}>{flow.triggerKeyword || 'None'}</strong></span></div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px', background: '#faf5ff', borderRadius: '16px' }}><div style={{ flex: 1 }}><div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#a855f7', textTransform: 'uppercase', marginBottom: '4px' }}>Nodes</div><div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e1b4b' }}>{flow.nodes ? flow.nodes.length : 0}</div></div><div style={{ width: '1px', background: '#e9d5ff' }}></div><div style={{ flex: 1 }}><div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#a855f7', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div><div style={{ fontSize: '0.9rem', fontWeight: '800', color: flow.status === 'Active' ? '#10b981' : '#a855f7', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: flow.status === 'Active' ? '#10b981' : '#a855f7' }}></div>{flow.status || 'Active'}</div></div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><button onClick={() => navigate(`/flow-builder/${flow._id}`)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #d946ef 0%, #a855f7 100%)', color: 'white', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>Edit Flow</button><button onClick={(e) => deleteFlow(flow._id, e)} style={{ padding: '10px', borderRadius: '12px', border: '1px solid #fee2e2', background: 'white', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCampaign && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedCampaign(null)}>
          <div className="table-card" style={{ width: '90%', maxWidth: '700px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Process History: {selectedCampaign.name}</h3><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time logs for keyword: "{selectedCampaign.trigger}"</p></div><button onClick={() => setSelectedCampaign(null)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button></div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>{loadingLogs ? (<div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Fetching latest logs...</div>) : logs.length === 0 ? (<div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No messages processed yet for this campaign.</div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{logs.map((log) => (<div key={log._id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.3)', position: 'relative' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-color)' }}>{log.platform || 'instagram'}</span><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span></div><div style={{ fontSize: '0.9rem', marginBottom: '4px' }}><span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Recipient:</span> {log.chatId}</div><div style={{ fontSize: '0.9rem' }}><span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>AI Sent:</span> "{log.text}"</div>{log.linkUrl && (<div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}><LinkIcon size={14} /> Attached Link: {log.linkUrl}</div>)}</div>))}</div>)}</div>
          </div>
        </div>
      )}

      {editingCampaign && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}><h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: '#1e1b4b' }}>Edit Campaign</h3><button onClick={() => setEditingCampaign(null)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button></div><form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}><div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Campaign Name</label><input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} required /></div><div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Trigger Keyword</label><input type="text" value={editForm.trigger} onChange={e => setEditForm({...editForm, trigger: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} required /></div><div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}><input type="checkbox" id="editIsUniversal" checked={editForm.isUniversal} onChange={e => setEditForm({...editForm, isUniversal: e.target.checked})} /><label htmlFor="editIsUniversal" style={{ fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={16} color="#0ea5e9" /> Make this a Universal Trigger</label></div><div><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Bot Response Message</label><textarea value={editForm.response} onChange={e => setEditForm({...editForm, response: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', minHeight: '100px', resize: 'vertical' }} required /></div><div style={{ display: 'flex', gap: '12px' }}><div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Button Text (Optional)</label><input type="text" value={editForm.buttonText} onChange={e => setEditForm({...editForm, buttonText: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} /></div><div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Link URL (Optional)</label><input type="url" value={editForm.linkUrl} onChange={e => setEditForm({...editForm, linkUrl: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} /></div></div><button type="submit" style={{ marginTop: '16px', padding: '14px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Save Changes</button></form></div></div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: '#1e1b4b' }}>
                {newCamp.isUniversal ? 'New Universal Trigger' : 'New Automation'}
              </h3>
              <button onClick={() => setShowAdd(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Campaign Name</label>
                <input 
                  type="text" value={newCamp.name} onChange={e => setNewCamp({...newCamp, name: e.target.value})}
                  placeholder="e.g. Summer Sale 2024"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Trigger Keyword</label>
                <input 
                  type="text" value={newCamp.trigger} onChange={e => setNewCamp({...newCamp, trigger: e.target.value})}
                  placeholder="e.g. PRICE, DISCOUNT"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: newCamp.isUniversal ? 'rgba(14, 165, 233, 0.05)' : '#f8fafc', borderRadius: '10px', border: newCamp.isUniversal ? '1px solid #0ea5e9' : '1px solid #e2e8f0' }}>
                <input 
                  type="checkbox" 
                  id="isUniversal"
                  checked={newCamp.isUniversal} 
                  onChange={e => setNewCamp({...newCamp, isUniversal: e.target.checked})}
                />
                <label htmlFor="isUniversal" style={{ fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <Globe size={16} color="#0ea5e9" /> Make this a Universal Trigger
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Bot Response Message</label>
                <textarea 
                  value={newCamp.response} onChange={e => setNewCamp({...newCamp, response: e.target.value})}
                  placeholder="What should the bot say?"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', minHeight: '100px', resize: 'vertical' }} required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Button Text</label>
                  <input 
                    type="text" value={newCamp.buttonText} onChange={e => setNewCamp({...newCamp, buttonText: e.target.value})}
                    placeholder="e.g. Shop Now"
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Link URL</label>
                  <input 
                    type="url" value={newCamp.linkUrl} onChange={e => setNewCamp({...newCamp, linkUrl: e.target.value})}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                style={{ 
                  marginTop: '16px', padding: '14px', 
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', 
                  color: 'white', border: 'none', borderRadius: '12px', 
                  fontWeight: '800', cursor: 'pointer', opacity: submitting ? 0.7 : 1 
                }}
              >
                {submitting ? 'Creating...' : 'Create Automation'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
