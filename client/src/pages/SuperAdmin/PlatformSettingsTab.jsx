import React, { useState, useEffect } from 'react';
import { Settings, Mail, Key, Shield, HardDrive, CheckCircle2, Copy, Instagram, Facebook, Youtube, Linkedin, Twitter, MessageCircle, Share2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

export default function PlatformSettingsTab() {
  const { setGlobalPlatforms } = useAuth();
  const [saving, setSaving] = useState(false);
  const [platforms, setPlatforms] = useState({
    instagram: true, facebook: true, youtube: true, linkedin: true,
    twitter: true, googleBusiness: true, pinterest: true, threads: true
  });

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const token = localStorage.getItem('insta_agent_token');
        const res = await fetch(`${API_BASE_URL}/api/admin/global-platforms`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPlatforms(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error('Error fetching platforms:', err);
      }
    };
    fetchPlatforms();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/admin/global-platforms`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(platforms)
      });
      if (res.ok) {
        toast.success('Global platform settings updated');
        if (setGlobalPlatforms) setGlobalPlatforms(platforms);
      } else {
        toast.error('Failed to update platforms');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const togglePlatform = async (key) => {
    const newPlatforms = { ...platforms, [key]: !platforms[key] };
    setPlatforms(newPlatforms);
    
    // Auto-save the toggle change immediately
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/admin/global-platforms`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlatforms)
      });
      if (res.ok) {
        if (setGlobalPlatforms) setGlobalPlatforms(newPlatforms);
        toast.success(`${newPlatforms[key] ? 'Enabled' : 'Disabled'} globally`);
      }
    } catch (err) {
      console.error('Failed to auto-save platform toggle', err);
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const inputStyle = {
    width: '100%', 
    padding: '14px 45px 14px 16px', 
    borderRadius: '12px', 
    border: '2px solid #cbd5e1', 
    background: '#f8fafc', 
    color: '#334155',
    fontWeight: '500',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const copyBtnStyle = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Platform Settings</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Global configuration for SMTP, OAuth apps, and core integrations.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 24px', borderRadius: '12px', background: '#3b82f6', color: 'white',
            border: 'none', fontWeight: '700', fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
        >
          <CheckCircle2 size={18} />
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        {/* Email & SMTP */}
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--primary)' }}>
              <Mail size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>SMTP Email Configuration</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.85rem' }}>SMTP Host</label>
              <input type="text" defaultValue="smtp.sendgrid.net" style={inputStyle} id="smtp-host" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.85rem' }}>SMTP Port</label>
              <input type="text" defaultValue="587" style={inputStyle} id="smtp-port" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.85rem' }}>SMTP API Key / Password</label>
              <div style={{ position: 'relative' }}>
                <input type="password" defaultValue="************************" style={inputStyle} id="smtp-pass" />
                <button style={copyBtnStyle} onClick={() => handleCopy(document.getElementById('smtp-pass').value, 'SMTP Password')} title="Copy">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Global API Keys */}
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ padding: '8px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '10px', color: '#eab308' }}>
              <Key size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>Global API Providers</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.85rem' }}>OpenAI Global API Key</label>
              <div style={{ position: 'relative' }}>
                <input type="password" defaultValue="sk-***************************" style={inputStyle} id="openai-key" />
                <button style={copyBtnStyle} onClick={() => handleCopy(document.getElementById('openai-key').value, 'OpenAI Key')} title="Copy">
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.85rem' }}>Stripe Secret Key</label>
              <div style={{ position: 'relative' }}>
                <input type="password" defaultValue="rk_live_***************************" style={inputStyle} id="stripe-key" />
                <button style={copyBtnStyle} onClick={() => handleCopy(document.getElementById('stripe-key').value, 'Stripe Key')} title="Copy">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Platform Toggles */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', color: '#10b981' }}>
            <Globe size={20} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>Platform Management (Global)</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Toggle platforms on or off. If a platform is disabled, it will be hidden from all users' accounts across the system.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {[
            { id: 'instagram', name: 'Instagram', icon: <Instagram size={20} color="#E4405F" /> },
            { id: 'facebook', name: 'Facebook', icon: <Facebook size={20} color="#1877F2" /> },
            { id: 'youtube', name: 'YouTube', icon: <Youtube size={20} color="#FF0000" /> },
            { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin size={20} color="#0A66C2" /> },
            { id: 'twitter', name: 'Twitter / X', icon: <Twitter size={20} color="#1DA1F2" /> },
            { id: 'googleBusiness', name: 'Google Business', icon: <Globe size={20} color="#4285F4" /> },
            { id: 'pinterest', name: 'Pinterest', icon: <Share2 size={20} color="#E60023" /> },
            { id: 'threads', name: 'Threads', icon: <MessageCircle size={20} color="#000000" /> }
          ].map(platform => (
            <div key={platform.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px', borderRadius: '16px', border: '1px solid var(--border-subtle)',
              background: 'var(--bg-main)', transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex' }}>
                  {platform.icon}
                </div>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{platform.name}</span>
              </div>
              
              <div 
                onClick={() => togglePlatform(platform.id)}
                style={{
                  width: '44px', height: '24px', borderRadius: '24px',
                  background: platforms[platform.id] ? '#10b981' : 'var(--border)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease'
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px', left: platforms[platform.id] ? '22px' : '2px',
                  width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'left 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
