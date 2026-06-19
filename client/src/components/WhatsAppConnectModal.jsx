import React, { useState } from 'react';
import { X, CheckCircle, ExternalLink, AlertTriangle, Key, Phone, Briefcase, HelpCircle, Loader2, Copy, Check } from 'lucide-react';

const WhatsAppConnectModal = ({ onClose, onSuccess, API_BASE_URL, token }) => {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [copiedId, setCopiedId] = useState(null);

  // Hardcode or generate a webhook URL and verification token for instructions
  const webhookUrl = `https://dm-automation-w9a4.vercel.app/api/webhooks/meta`;
  const webhookToken = `10x_smart_agent_webhook_secret`;

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumberId || !businessAccountId || !accessToken) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/whatsapp/connect-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          whatsappPhoneNumberId: phoneNumberId.trim(),
          whatsappBusinessAccountId: businessAccountId.trim(),
          whatsappToken: accessToken.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify WhatsApp credentials');
      }

      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={onClose}
      />
      
      <div 
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={20} color="#0284c7" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>Connect WhatsApp API</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Link your official WhatsApp Business Cloud API</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#64748b', borderRadius: '8px' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#ef4444', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>1</div>
              Meta Developer Setup
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '12px', lineHeight: '1.5' }}>
              Go to the <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>Meta for Developers portal</a>, create an App, and add the WhatsApp product. Inside your App Dashboard, go to <b>WhatsApp &gt; API Setup</b>.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>2</div>
                API Credentials
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '32px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Phone Number ID</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <Phone size={16} />
                    </div>
                    <input 
                      type="text" 
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      placeholder="e.g. 102938475619283"
                      style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>WhatsApp Business Account ID</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <Briefcase size={16} />
                    </div>
                    <input 
                      type="text" 
                      value={businessAccountId}
                      onChange={(e) => setBusinessAccountId(e.target.value)}
                      placeholder="e.g. 109283746510293"
                      style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Permanent Access Token</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <Key size={16} />
                    </div>
                    <input 
                      type="text" 
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="EAALxxxxxxxxxxxxxx"
                      style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                      required
                    />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>Ensure you generate a Permanent System User token, not a 24-hour test token.</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>3</div>
                Configure Webhooks
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '16px', lineHeight: '1.5' }}>
                Go to <b>WhatsApp &gt; Configuration</b> in your Meta App and click "Edit" under Webhook. Paste the following URL and Verify Token, then subscribe to the <b>messages</b> field.
              </p>
              
              <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Callback URL</span>
                    <span style={{ fontSize: '0.85rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', fontFamily: 'monospace' }}>{webhookUrl}</span>
                  </div>
                  <button type="button" onClick={() => copyToClipboard(webhookUrl, 'url')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === 'url' ? '#10b981' : '#64748b', padding: '4px' }}>
                    {copiedId === 'url' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>Verify Token</span>
                    <span style={{ fontSize: '0.85rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', fontFamily: 'monospace' }}>{webhookToken}</span>
                  </div>
                  <button type="button" onClick={() => copyToClipboard(webhookToken, 'token')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === 'token' ? '#10b981' : '#64748b', padding: '4px' }}>
                    {copiedId === 'token' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <button 
                type="button" 
                onClick={onClose}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                style={{ flex: 2, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #25d366, #128c7e)', color: 'white', fontWeight: '600', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : <><CheckCircle size={18} /> Test & Connect</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default WhatsAppConnectModal;
