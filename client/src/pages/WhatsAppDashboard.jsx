import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageSquare, Plus, Zap, Bot, Phone,
  Trash2, Power, CheckCircle, AlertCircle, Edit2, X,
  Send, Clock, Users, BarChart2, Settings, ChevronRight,
  Sparkles, MessageCircle, Search, Filter, Bell, Link,
  Image, FileText, Video, List, Hash, Globe, Shield
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';


export default function WhatsAppDashboard() {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [activeTab, setActiveTab] = useState('automations');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('insta_agent_token');
    try {
      const [campRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/campaigns`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/settings`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const campData = await campRes.json();
      const settingsData = await settingsRes.json();

      if (Array.isArray(campData)) {
        setCampaigns(campData.filter(c => c.platform === 'whatsapp' || c.platform === 'all'));
      }
      setSettings(settingsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isConnected = settings && (settings.isWhatsAppConnected || (settings.whatsappToken && settings.whatsappPhoneNumberId));

  const handleToggle = async (campaign) => {
    const token = localStorage.getItem('insta_agent_token');
    const newStatus = campaign.status === 'Active' ? 'Paused' : 'Active';
    try {
      await fetch(`${API_BASE_URL}/api/campaigns/${campaign._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setCampaigns(prev => prev.map(c => c._id === campaign._id ? { ...c, status: newStatus } : c));
      notify(`Automation ${newStatus === 'Active' ? 'activated' : 'paused'}!`, 'success');
    } catch (err) {
      notify('Failed to update', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this automation?')) return;
    const token = localStorage.getItem('insta_agent_token');
    try {
      await fetch(`${API_BASE_URL}/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCampaigns(prev => prev.filter(c => c._id !== id));
      notify('Automation deleted!', 'success');
    } catch (err) {
      notify('Failed to delete', 'error');
    }
  };



  const filteredCampaigns = campaigns.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.trigger || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'Active').length,
    paused: campaigns.filter(c => c.status !== 'Active').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0f9ff 100%)', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', height: '64px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: "var(--accent-color)", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={22} color="white" fill="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>WhatsApp Automation</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Keyword triggers, auto-replies & smart flows</p>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isConnected ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: "var(--text-main)", border: `1px solid #bbf7d0`, borderRadius: '20px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '700' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: "var(--accent-color)", display: 'inline-block', boxShadow: '0 0 0 2px rgba(37,211,102,0.3)' }} />
                Connected
              </span>
            ) : (
              <button onClick={() => navigate('/connections')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: '20px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                <AlertCircle size={14} /> Connect WhatsApp
              </button>
            )}
            <button onClick={() => navigate('/dm-automation-editor/new?channel=whatsapp')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: "var(--accent-color)", color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', boxShadow: `0 4px 12px rgba(37,211,102,0.3)` }}>
              <Plus size={18} /> New Automation
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Automations', value: stats.total, icon: <Zap size={20} />, color: '#8b5cf6', bg: '#f5f3ff' },
            { label: 'Active', value: stats.active, icon: <CheckCircle size={20} />, color: "var(--accent-color)", bg: "var(--sidebar-bg)" },
            { label: 'Paused', value: stats.paused, icon: <Clock size={20} />, color: '#f59e0b', bg: '#fffbeb' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-main)', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp Automation Info Banner */}
        {!isConnected && (
          <div style={{ background: 'linear-gradient(135deg, #fff7ed, #fffbeb)', border: '1px solid #fed7aa', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <AlertCircle size={24} color="#ea580c" />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: '700', color: '#9a3412' }}>WhatsApp Business Account Not Connected</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#c2410c' }}>Enter your WhatsApp API Token and Phone Number ID in Settings</p>
            </div>
            <button onClick={() => navigate('/connections')} style={{ background: '#ea580c', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>
              Open Settings →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-dark)', borderRadius: '12px', padding: '4px', marginBottom: '24px', width: 'fit-content' }}>
          {[
            { id: 'automations', label: 'Automations', icon: <Zap size={16} /> },
            { id: 'howto', label: 'How it Works', icon: <Bot size={16} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent', color: activeTab === tab.id ? "var(--text-main)" : 'var(--text-muted)', boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── AUTOMATIONS TAB ── */}
        {activeTab === 'automations' && (
          <div>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Automation search karein..."
                style={{ width: '100%', paddingLeft: '36px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '10px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '0.9rem', background: 'var(--bg-card)', boxSizing: 'border-box' }}
              />
            </div>

            {loading ? (
              <LoadingSpinner minHeight="200px" color={"var(--accent-color)"} />
            ) : filteredCampaigns.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '60px', textAlign: 'center', border: '2px dashed #e2e8f0' }}>
                <div style={{ width: '72px', height: '72px', background: "var(--sidebar-bg)", borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <MessageSquare size={36} color={"var(--accent-color)"} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px' }}>No WhatsApp Automations</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Create your first automation and set up auto-replies on WhatsApp</p>
                <button onClick={() => navigate('/dm-automation-editor/new?channel=whatsapp')} style={{ background: "var(--accent-color)", color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} /> Create Automation
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {filteredCampaigns.map(campaign => (
                  <div key={campaign._id} style={{ background: 'var(--bg-card)', borderRadius: '16px', border: `1px solid ${campaign.status === 'Active' ? '#bbf7d0' : 'var(--border-subtle)'}`, padding: '20px', transition: 'all 0.2s', boxShadow: campaign.status === 'Active' ? '0 4px 12px rgba(37,211,102,0.08)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '40px', background: campaign.status === 'Active' ? "var(--sidebar-bg)" : 'var(--sidebar-bg)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Zap size={20} color={campaign.status === 'Active' ? "var(--accent-color)" : 'var(--text-muted)'} fill={campaign.status === 'Active' ? "var(--accent-color)" : 'none'} />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)', fontSize: '0.95rem' }}>{campaign.name}</p>
                          <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: campaign.status === 'Active' ? "var(--sidebar-bg)" : 'var(--bg-dark)', color: campaign.status === 'Active' ? "var(--text-main)" : 'var(--text-muted)' }}>
                            {campaign.status || 'Active'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleToggle(campaign)} title={campaign.status === 'Active' ? 'Pause' : 'Activate'} style={{ background: campaign.status === 'Active' ? '#f0fdf4' : 'var(--sidebar-bg)', border: `1px solid ${campaign.status === 'Active' ? '#bbf7d0' : 'var(--border-subtle)'}`, borderRadius: '8px', padding: '6px', cursor: 'pointer', color: campaign.status === 'Active' ? "var(--accent-color)" : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                          <Power size={15} />
                        </button>
                        <button onClick={() => navigate(`/dm-automation-editor/${campaign._id}?channel=whatsapp`)} title="Edit" style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(campaign._id)} title="Delete" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div style={{ background: 'var(--sidebar-bg)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Hash size={13} color={"var(--accent-color)"} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trigger</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', background: "var(--sidebar-bg)", padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
                        {campaign.isUniversal || campaign.trigger === '*' ? '⭐ Any Message' : `"${campaign.trigger}"`}
                      </p>
                    </div>

                    <div style={{ background: 'var(--sidebar-bg)', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Send size={13} color={"var(--accent-color)"} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Auto Reply</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {campaign.response || '(No response set)'}
                      </p>
                    </div>
                    
                    {campaign.buttons && campaign.buttons.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {campaign.buttons.map((b, i) => (
                          <span key={i} style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                            {b.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── HOW IT WORKS TAB ── */}
        {activeTab === 'howto' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '28px', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} color={"var(--accent-color)"} /> WhatsApp Automation Flow
              </h3>
              {[
                { step: '1', title: 'Customer Message', desc: 'Customer sends any message or keyword on WhatsApp', icon: <MessageSquare size={18} color={"var(--accent-color)"} /> },
                { step: '2', title: 'Keyword Match', desc: 'The server compares the message with your set triggers', icon: <Hash size={18} color='#8b5cf6' /> },
                { step: '3', title: 'Auto Reply', desc: 'An automated response is instantly sent via WhatsApp Cloud API', icon: <Send size={18} color='#3b82f6' /> },
                { step: '4', title: 'Message Delivered', desc: 'Customer receives a real WhatsApp message ✅', icon: <CheckCircle size={18} color={"var(--accent-color)"} /> },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--sidebar-bg)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: '800', color: 'var(--text-main)', fontSize: '0.9rem' }}>Step {item.step}: {item.title}</p>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '20px', padding: '24px', border: '1px solid #bbf7d0' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: '800', color: "var(--text-main)" }}>🔧 Setup Checklist</h3>
                {[
                  { done: isConnected, text: 'Connect WhatsApp Business API' },
                  { done: isConnected, text: 'Set up Webhook in Meta Developer Console' },
                  { done: stats.total > 0, text: 'Create your first automation/trigger' },
                  { done: stats.active > 0, text: 'Automation is in Active status' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    {item.done ? <CheckCircle size={18} color={"var(--accent-color)"} fill={"var(--sidebar-bg)"} /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid var(--border-subtle)' }} />}
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: item.done ? "var(--text-main)" : '#6b7280', textDecoration: item.done ? 'none' : 'none' }}>{item.text}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>📋 Webhook Configuration</h3>
                {[
                  { label: 'Callback URL', value: `${API_BASE_URL}/api/webhook` },
                  { label: 'Verify Token', value: 'insta_agent_secret_verify_token' },
                  { label: 'Subscribe Field', value: 'messages' },
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</span>
                    <div style={{ background: 'var(--sidebar-bg)', borderRadius: '8px', padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '4px', border: '1px solid var(--border-subtle)', wordBreak: 'break-all' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>



      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
