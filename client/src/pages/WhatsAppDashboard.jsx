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

const WA_GREEN = '#25d366';
const WA_DARK = '#128C7E';
const WA_LIGHT = '#DCF8C6';
const WA_BG = '#f0fdf4';

export default function WhatsAppDashboard() {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [activeTab, setActiveTab] = useState('automations');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newCamp, setNewCamp] = useState({
    name: '',
    trigger: '',
    triggerType: 'keyword', // keyword | any | welcome
    response: '',
    platform: 'whatsapp',
    triggerSource: 'dm',
    isUniversal: false,
    buttonText: '',
    linkUrl: '',
    replyType: 'text', // text | image | list | buttons
    buttons: [],
    listTitle: '',
    listItems: [],
    welcomeEnabled: false,
    status: 'Active',
  });

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
    if (!window.confirm('Is automation ko delete karna chahte hain?')) return;
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

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('insta_agent_token');
    try {
      const payload = {
        ...newCamp,
        trigger: newCamp.triggerType === 'any' ? '*' : newCamp.trigger,
        isUniversal: newCamp.triggerType === 'any',
        platform: 'whatsapp',
        triggerSource: 'dm',
        triggerOnDms: true,
        status: 'Active'
      };
      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setCampaigns(prev => [data, ...prev]);
        setShowCreate(false);
        setNewCamp({ name: '', trigger: '', triggerType: 'keyword', response: '', platform: 'whatsapp', triggerSource: 'dm', isUniversal: false, buttonText: '', linkUrl: '', replyType: 'text', buttons: [], listTitle: '', listItems: [], status: 'Active' });
        notify('✅ WhatsApp automation created!', 'success');
      } else {
        notify(data.error || 'Failed to create', 'error');
      }
    } catch (err) {
      notify('Network error', 'error');
    }
  };

  const handleGenerateAI = async () => {
    if (!newCamp.trigger && !newCamp.name) {
      notify('Pehle trigger keyword ya campaign name daalo', 'error');
      return;
    }
    setGeneratingAI(true);
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Generate a professional and friendly WhatsApp auto-reply message for keyword: "${newCamp.trigger || newCamp.name}". Keep it under 150 words, conversational, and end with a call-to-action.` })
      });
      const data = await res.json();
      if (data.text) {
        setNewCamp(prev => ({ ...prev, response: data.text }));
        notify('AI response generated!', 'success');
      }
    } catch (err) {
      notify('AI generation failed', 'error');
    } finally {
      setGeneratingAI(false);
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

  // ───── RENDER ─────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0f9ff 100%)', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', height: '64px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: WA_GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={22} color="white" fill="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>WhatsApp Automation</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Keyword triggers, auto-replies & smart flows</p>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isConnected ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: WA_DARK, border: `1px solid #bbf7d0`, borderRadius: '20px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '700' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: WA_GREEN, display: 'inline-block', boxShadow: '0 0 0 2px rgba(37,211,102,0.3)' }} />
                Connected
              </span>
            ) : (
              <button onClick={() => navigate('/settings')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: '20px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                <AlertCircle size={14} /> Connect WhatsApp
              </button>
            )}
            <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: WA_GREEN, color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', boxShadow: `0 4px 12px rgba(37,211,102,0.3)` }}>
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
            { label: 'Active', value: stats.active, icon: <CheckCircle size={20} />, color: WA_GREEN, bg: WA_BG },
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
              <p style={{ margin: 0, fontWeight: '700', color: '#9a3412' }}>WhatsApp Business Account Connect Nahi Hai</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#c2410c' }}>Settings mein WhatsApp API Token aur Phone Number ID daalein</p>
            </div>
            <button onClick={() => navigate('/settings')} style={{ background: '#ea580c', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>
              Settings Kholein →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-dark)', borderRadius: '12px', padding: '4px', marginBottom: '24px', width: 'fit-content' }}>
          {[
            { id: 'automations', label: 'Automations', icon: <Zap size={16} /> },
            { id: 'howto', label: 'Kaise Kaam Karta Hai', icon: <Bot size={16} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent', color: activeTab === tab.id ? WA_DARK : 'var(--text-muted)', boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
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
              <LoadingSpinner minHeight="200px" color={WA_GREEN} />
            ) : filteredCampaigns.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '60px', textAlign: 'center', border: '2px dashed #e2e8f0' }}>
                <div style={{ width: '72px', height: '72px', background: WA_BG, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <MessageSquare size={36} color={WA_GREEN} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px' }}>Koi WhatsApp Automation Nahi</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Pehla automation banayein aur WhatsApp par auto-replies set karein</p>
                <button onClick={() => setShowCreate(true)} style={{ background: WA_GREEN, color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} /> Create Automation
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {filteredCampaigns.map(campaign => (
                  <div key={campaign._id} style={{ background: 'var(--bg-card)', borderRadius: '16px', border: `1px solid ${campaign.status === 'Active' ? '#bbf7d0' : 'var(--border-subtle)'}`, padding: '20px', transition: 'all 0.2s', boxShadow: campaign.status === 'Active' ? '0 4px 12px rgba(37,211,102,0.08)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '40px', background: campaign.status === 'Active' ? WA_BG : 'var(--sidebar-bg)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Zap size={20} color={campaign.status === 'Active' ? WA_GREEN : 'var(--text-muted)'} fill={campaign.status === 'Active' ? WA_GREEN : 'none'} />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)', fontSize: '0.95rem' }}>{campaign.name}</p>
                          <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: campaign.status === 'Active' ? WA_BG : 'var(--bg-dark)', color: campaign.status === 'Active' ? WA_DARK : 'var(--text-muted)' }}>
                            {campaign.status || 'Active'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleToggle(campaign)} title={campaign.status === 'Active' ? 'Pause' : 'Activate'} style={{ background: campaign.status === 'Active' ? '#f0fdf4' : 'var(--sidebar-bg)', border: `1px solid ${campaign.status === 'Active' ? '#bbf7d0' : 'var(--border-subtle)'}`, borderRadius: '8px', padding: '6px', cursor: 'pointer', color: campaign.status === 'Active' ? WA_GREEN : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                          <Power size={15} />
                        </button>
                        <button onClick={() => handleDelete(campaign._id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div style={{ background: 'var(--sidebar-bg)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Hash size={13} color={WA_GREEN} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trigger</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', background: WA_BG, padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
                        {campaign.isUniversal || campaign.trigger === '*' ? '⭐ Any Message' : `"${campaign.trigger}"`}
                      </p>
                    </div>

                    <div style={{ background: 'var(--sidebar-bg)', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Send size={13} color={WA_GREEN} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Auto Reply</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {campaign.response || '(No response set)'}
                      </p>
                    </div>
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
                <Zap size={20} color={WA_GREEN} /> WhatsApp Automation Flow
              </h3>
              {[
                { step: '1', title: 'Customer Message', desc: 'Customer WhatsApp par koi bhi message ya keyword bhejta hai', icon: <MessageSquare size={18} color={WA_GREEN} /> },
                { step: '2', title: 'Keyword Match', desc: 'Server aapke set kiye triggers se compare karta hai', icon: <Hash size={18} color='#8b5cf6' /> },
                { step: '3', title: 'Auto Reply', desc: 'Turant automated response WhatsApp Cloud API se bheja jaata hai', icon: <Send size={18} color='#3b82f6' /> },
                { step: '4', title: 'Message Delivered', desc: 'Customer ko real WhatsApp message milta hai ✅', icon: <CheckCircle size={18} color={WA_GREEN} /> },
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
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: '800', color: WA_DARK }}>🔧 Setup Checklist</h3>
                {[
                  { done: isConnected, text: 'WhatsApp Business API connect karein' },
                  { done: isConnected, text: 'Meta Developer Console mein Webhook set karein' },
                  { done: stats.total > 0, text: 'Pehla automation/trigger create karein' },
                  { done: stats.active > 0, text: 'Automation Active status mein hai' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    {item.done ? <CheckCircle size={18} color={WA_GREEN} fill={WA_BG} /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid var(--border-subtle)' }} />}
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: item.done ? WA_DARK : '#6b7280', textDecoration: item.done ? 'none' : 'none' }}>{item.text}</span>
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

      {/* ── CREATE AUTOMATION MODAL ── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', background: WA_BG, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={22} color={WA_GREEN} fill={WA_GREEN} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)' }}>New WhatsApp Automation</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keyword trigger + auto-reply set karein</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Campaign Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Automation Name *</label>
                <input
                  type="text"
                  required
                  value={newCamp.name}
                  onChange={e => setNewCamp(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Price Inquiry Auto-Reply"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Trigger Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trigger Type *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'keyword', label: '🔑 Keyword', desc: 'Specific word pe reply' },
                    { id: 'any', label: '🌍 Any Message', desc: 'Har message pe reply' },
                    { id: 'welcome', label: '👋 Welcome', desc: 'Pehle message pe' },
                  ].map(type => (
                    <button key={type.id} type="button" onClick={() => setNewCamp(p => ({ ...p, triggerType: type.id }))}
                      style={{ padding: '12px', borderRadius: '10px', border: `2px solid ${newCamp.triggerType === type.id ? WA_GREEN : 'var(--border-subtle)'}`, background: newCamp.triggerType === type.id ? WA_BG : 'var(--bg-card)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '4px' }}>{type.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyword */}
              {newCamp.triggerType === 'keyword' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trigger Keyword *</label>
                  <input
                    type="text"
                    required
                    value={newCamp.trigger}
                    onChange={e => setNewCamp(p => ({ ...p, trigger: e.target.value }))}
                    placeholder='e.g. "price", "info", "hi", "help"'
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  />
                  <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>💡 Customer jab ye word likhega, auto-reply jayega</p>
                </div>
              )}

              {/* Auto Response */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Auto Reply Message *</label>
                  <button type="button" onClick={handleGenerateAI} disabled={generatingAI}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: generatingAI ? 'var(--bg-dark)' : 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: generatingAI ? 'var(--text-muted)' : 'var(--bg-card)', border: 'none', borderRadius: '20px', padding: '5px 14px', fontSize: '0.75rem', fontWeight: '700', cursor: generatingAI ? 'not-allowed' : 'pointer' }}>
                    <Sparkles size={13} /> {generatingAI ? 'Generating...' : 'AI se Generate'}
                  </button>
                </div>
                <textarea
                  required
                  value={newCamp.response}
                  onChange={e => setNewCamp(p => ({ ...p, response: e.target.value }))}
                  placeholder="Namaste! 👋 Humara product/service ke baare mein puchh rahe hain? Hum aapki help karne ke liye taiyaar hain. Kripya apna sawaal poochhein!"
                  rows={5}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.5' }}
                />
                <div style={{ marginTop: '8px', background: WA_BG, borderRadius: '10px', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <MessageSquare size={16} color={WA_GREEN} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: WA_DARK, fontWeight: '700' }}>WhatsApp Formatting Tips:</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                      *Bold* ke liye asterisk | _Italic_ ke liye underscore | ~Strikethrough~ | ```Code``` | Emojis use karein 😊
                    </p>
                  </div>
                </div>
              </div>

              {/* Link (Optional) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Link (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <Globe size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="url"
                    value={newCamp.linkUrl}
                    onChange={e => setNewCamp(p => ({ ...p, linkUrl: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                    style={{ width: '100%', paddingLeft: '36px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: WA_GREEN, color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 4px 12px rgba(37,211,102,0.3)` }}>
                  <Zap size={18} fill="white" /> Create WhatsApp Automation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
