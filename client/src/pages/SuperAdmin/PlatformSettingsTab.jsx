import React, { useState } from 'react';
import { Settings, Mail, Key, Shield, HardDrive, CheckCircle2 } from 'lucide-react';
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.85rem' }}>SMTP Host</label>
              <input type="text" defaultValue="smtp.sendgrid.net" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.85rem' }}>SMTP Port</label>
              <input type="text" defaultValue="587" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.85rem' }}>SMTP API Key / Password</label>
              <input type="password" defaultValue="************************" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.85rem' }}>OpenAI Global API Key</label>
              <input type="password" defaultValue="sk-***************************" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.85rem' }}>Stripe Secret Key</label>
              <input type="password" defaultValue="rk_live_***************************" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
