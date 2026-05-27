import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Zap, MessageSquare, Instagram, Loader2, PauseCircle, PlayCircle, Trash2, Edit2, CheckCircle, Power } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../App';

export default function UniversalTriggers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();
  
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        // Only keep universal triggers
        setCampaigns(data.filter(c => c.isUniversal));
      }
    } catch (err) {
      console.error(err);
      notify("Failed to load universal triggers", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setCampaigns(campaigns.map(c => c._id === id ? { ...c, status: newStatus } : c));
        notify(`Trigger ${newStatus === 'Active' ? 'activated' : 'paused'} successfully`, 'success');
      }
    } catch (err) {
      notify("Failed to update status", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this universal trigger?")) return;
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCampaigns(campaigns.filter(c => c._id !== id));
        notify("Trigger deleted", "success");
      }
    } catch (err) {
      notify("Failed to delete trigger", "error");
    }
  };

  const templates = [
    { 
      id: 'dm', 
      title: 'DM Automation', 
      desc: 'Trigger DMs from Keywords anywhere', 
      icon: <Zap size={28} />, 
      color: '#4f46e5', 
      bg: 'rgba(79, 70, 229, 0.1)', 
      path: `/dm-automation-editor?template=all_dms&isUniversal=true` 
    },
    { 
      id: 'comment', 
      title: 'Comment Reply', 
      desc: 'Auto-DM on all Comments', 
      icon: <MessageSquare size={28} />, 
      color: '#0ea5e9', 
      bg: 'rgba(14, 165, 233, 0.1)', 
      path: `/automation-editor?template=comments&isUniversal=true` 
    },
    { 
      id: 'story', 
      title: 'Story Trigger', 
      desc: 'Reply to all Story Mentions', 
      icon: <Instagram size={28} />, 
      color: '#ec4899', 
      bg: 'rgba(236, 72, 153, 0.1)', 
      path: `/automation-editor?template=stories&isUniversal=true` 
    }
  ];

  return (
    <div style={{ padding: '30px 40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.3)' }}>
            <Globe size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#1e1b4b', margin: 0, letterSpacing: '-0.02em' }}>Universal Triggers</h1>
            <p style={{ color: '#64748b', fontSize: '1rem', margin: '4px 0 0 0', fontWeight: '500' }}>Run powerful automations across all your posts, reels, and stories automatically.</p>
          </div>
        </div>
      </div>

      {/* Templates Section */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={20} color="#f59e0b" /> Create New Universal Trigger
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        {templates.map(item => (
          <div 
            key={item.id}
            onClick={() => navigate(item.path)}
            style={{ 
              background: 'white', padding: '32px', borderRadius: '24px', border: '1.5px solid #f1f5f9', 
              cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column', gap: '20px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden'
            }}
            onMouseOver={e => { 
              e.currentTarget.style.transform = 'translateY(-6px)'; 
              e.currentTarget.style.boxShadow = `0 20px 25px -5px ${item.bg}`; 
              e.currentTarget.style.borderColor = item.color; 
            }}
            onMouseOut={e => { 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; 
              e.currentTarget.style.borderColor = '#f1f5f9'; 
            }}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: item.bg, opacity: 0.5, filter: 'blur(20px)' }}></div>
            
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.icon}
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>{item.desc}</p>
            </div>
            
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', color: item.color, fontWeight: '700', fontSize: '0.9rem', gap: '6px' }}>
              Create Trigger <ArrowRightIcon size={16} />
            </div>
          </div>
        ))}
      </div>

      {/* Active Campaigns Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e1b4b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={20} color="#10b981" /> Your Active Triggers
        </h2>
        <div style={{ background: '#f1f5f9', color: '#475569', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '800' }}>
          {campaigns.length} Total
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#94a3b8' }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : campaigns.length === 0 ? (
        <div style={{ background: 'white', border: '2px dashed #e2e8f0', borderRadius: '24px', padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <Globe size={40} color="#cbd5e1" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '8px' }}>No universal triggers yet</h3>
          <p style={{ color: '#64748b', maxWidth: '400px', lineHeight: '1.5' }}>Create your first universal automation using the templates above to instantly engage with your audience everywhere.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {campaigns.map((c) => (
            <div key={c._id} style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', transition: 'transform 0.2s', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: c.status === 'Active' ? '#10b981' : '#cbd5e1' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '6px' }}>{c.name || 'Untitled Trigger'}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Globe size={12} /> Universal
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: c.status === 'Active' ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.status === 'Active' ? '#10b981' : '#cbd5e1' }}></div>
                      {c.status}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleToggleStatus(c._id, c.status)} style={{ background: c.status === 'Active' ? '#fef2f2' : '#ecfdf5', color: c.status === 'Active' ? '#ef4444' : '#10b981', border: 'none', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}>
                    <Power size={18} />
                  </button>
                  <button onClick={() => handleDelete(c._id)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Keyword</div>
                <div style={{ fontWeight: '800', color: '#7c3aed', fontSize: '0.95rem' }}>{c.trigger === '*' ? 'Any message/comment' : c.trigger}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Small helper icon component
function ArrowRightIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}
