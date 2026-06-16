import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Key, Copy, Trash2, Plus, Terminal, Check, HelpCircle, Eye, EyeOff, X } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';

export default function DeveloperSettings() {
  const { notify } = useNotification();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('topbar-actions-portal'));
  }, []);

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch API keys');
      const data = await res.json();
      setKeys(data);
    } catch (err) {
      console.error(err);
      notify('Error loading API keys', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newKeyName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate API Key');

      // Set the newly created raw key to show the user once
      setNewlyCreatedKey(data.key);
      setNewKeyName('');
      setShowGenerateForm(false);
      notify('API Key generated successfully!', 'success');
      fetchKeys();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeKey = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this API Key? Any application using it will lose access immediately.')) {
      return;
    }
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/api-keys/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to revoke API key');
      notify('API Key revoked successfully', 'success');
      
      // Clear newlyCreatedKey if it was revoked
      setNewlyCreatedKey(null);
      fetchKeys();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    notify('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };



  return (
    <div style={{ maxWidth: '1100px', width: '100%', display: 'flex', flexDirection: 'column', gap: '28px', padding: '24px 16px 100px 16px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', animation: 'fadeIn 0.5s ease-out' }}>
      {/* Render Create button into Topbar */}
      {portalTarget && createPortal(
        !showGenerateForm && (
          <button
            onClick={() => { setShowGenerateForm(true); setNewlyCreatedKey(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(139, 92, 246, 0.25)' }}
          >
            <Plus size={16} /> Create
          </button>
        ),
        portalTarget
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', maxWidth: '700px', alignItems: 'start' }}>
        
        {/* Left Side: Keys Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Key List Card */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>



            {/* Display newly created key ONCE */}
            {newlyCreatedKey && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', fontWeight: '700', color: '#065f46' }}>Copy your API Key now!</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#047857', lineHeight: '1.4' }}>
                  For security reasons, this key will only be shown to you this one time. If you leave this page, you won't be able to recover it.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', gap: '8px' }}>
                  <code style={{ fontSize: '0.82rem', color: '#0f172a', wordBreak: 'break-all', flex: 1, fontFamily: 'monospace' }}>{newlyCreatedKey}</code>
                  <button
                    onClick={() => handleCopy(newlyCreatedKey, 'new')}
                    style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Copy API Key"
                  >
                    {copiedId === 'new' ? <Check size={14} color="#059669" /> : <Copy size={14} color="#64748b" />}
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              </div>
            ) : keys.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                <Key size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>No active API keys found.</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Generate one above to start automating programmatically.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {keys.map(k => (
                  <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.name}</span>
                      <code style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>{k.key}</code>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => handleRevokeKey(k.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#ef4444', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Revoke Key"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>



      </div>

      {showGenerateForm && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end', fontFamily: 'Inter, sans-serif' }}>
          {/* Overlay */}
          <div 
            onClick={() => setShowGenerateForm(false)} 
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', animation: 'fadeInOverlay 0.3s ease-out' }} 
          />
          
          {/* Drawer */}
          <div style={{ position: 'relative', width: '450px', background: 'white', height: '100%', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '-10px 0 25px rgba(0,0,0,0.1)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '32px 32px 16px 32px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>Create New API Key</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: '1.4' }}>Configure permissions and profile access for your new key.</p>
              </div>
              <button onClick={() => setShowGenerateForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <form id="create-api-key-form" onSubmit={handleGenerateKey} style={{ flex: 1, padding: '16px 32px', display: 'flex', flexDirection: 'column', gap: '28px', overflowY: 'auto' }}>
              
              {/* Key Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Production API Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #f97316', outline: 'none', fontSize: '0.95rem', background: '#fffaf5' }}
                />
              </div>

              {/* Permission */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Permission</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" style={{ flex: 1, padding: '10px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>
                    Read & Write
                  </button>
                  <button type="button" style={{ flex: 1, padding: '10px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>
                    Read Only
                  </button>
                </div>
              </div>

              {/* Profile Access */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Profile Access</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '24px', background: '#334155', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', top: '2px', right: '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%' }}></div>
                  </div>
                  <span style={{ fontSize: '0.95rem', color: '#475569' }}>Full access (all profiles)</span>
                </div>
              </div>

            </form>

            {/* Footer Buttons */}
            <div style={{ padding: '24px 32px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                form="create-api-key-form"
                disabled={submitting}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f97316', color: 'white', fontSize: '0.95rem', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Generating...' : 'Create key'}
              </button>
              <button
                type="button"
                onClick={() => setShowGenerateForm(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#64748b', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
