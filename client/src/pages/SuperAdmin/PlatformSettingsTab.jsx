import React, { useState } from 'react';
import { Settings, Mail, Key, Shield, HardDrive, CheckCircle2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

export default function PlatformSettingsTab() {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Global platform settings updated');
    }, 1000);
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
              <div style={{ position: 'relative' }}>
                <input type="text" defaultValue="smtp.sendgrid.net" style={inputStyle} id="smtp-host" />
                <button style={copyBtnStyle} onClick={() => handleCopy(document.getElementById('smtp-host').value, 'SMTP Host')} title="Copy">
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.85rem' }}>SMTP Port</label>
              <div style={{ position: 'relative' }}>
                <input type="text" defaultValue="587" style={inputStyle} id="smtp-port" />
                <button style={copyBtnStyle} onClick={() => handleCopy(document.getElementById('smtp-port').value, 'SMTP Port')} title="Copy">
                  <Copy size={16} />
                </button>
              </div>
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
    </div>
  );
}
