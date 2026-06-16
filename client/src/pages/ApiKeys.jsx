import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Key, Copy, Trash2, Plus, Terminal, Check, HelpCircle, Eye, EyeOff, X } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';

export default function ApiKeys() {
  const { notify } = useNotification();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [permission, setPermission] = useState('Read & Write');
  const [fullAccess, setFullAccess] = useState(true);
  
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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
    <div style={{ width: '100%', padding: '40px 40px 100px 40px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header & Create Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>API Keys</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Authentication tokens for the programmatic API</p>
        </div>
        {!showGenerateForm && (
          <button
            onClick={() => { setShowGenerateForm(true); setNewlyCreatedKey(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: '#e04f32', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(224, 79, 50, 0.25)' }}
          >
            <Plus size={18} /> Create key
          </button>
        )}
      </div>

      {/* Display newly created key ONCE */}
      {newlyCreatedKey && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '16px', marginBottom: '32px' }}>
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

      {/* Table UI */}
      <div style={{ width: '100%', overflowX: 'auto', borderTop: '1px solid #cbd5e1' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '16px 16px', fontSize: '0.85rem', fontWeight: '600', color: '#475569', borderBottom: '1px solid #cbd5e1', width: '20%', borderTopLeftRadius: '8px' }}>Name</th>
              <th style={{ padding: '16px 8px', fontSize: '0.85rem', fontWeight: '600', color: '#475569', borderBottom: '1px solid #cbd5e1', width: '25%' }}>Key</th>
              <th style={{ padding: '16px 8px', fontSize: '0.85rem', fontWeight: '600', color: '#475569', borderBottom: '1px solid #cbd5e1', width: '15%' }}>Scope</th>
              <th style={{ padding: '16px 8px', fontSize: '0.85rem', fontWeight: '600', color: '#475569', borderBottom: '1px solid #cbd5e1', width: '15%' }}>Status</th>
              <th style={{ padding: '16px 8px', fontSize: '0.85rem', fontWeight: '600', color: '#475569', borderBottom: '1px solid #cbd5e1', width: '20%' }}>Permission</th>
              <th style={{ padding: '16px 16px', borderBottom: '1px solid #cbd5e1', width: '5%', borderTopRightRadius: '8px' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>No active API keys found.</p>
                </td>
              </tr>
            ) : (
              keys.map(k => (
                <tr key={k.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '16px 16px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>{k.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{new Date(k.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ fontSize: '0.85rem', color: '#475569', fontFamily: 'monospace' }}>{k.maskedKey || k.key}</code>
                      <button
                        onClick={() => handleCopy(k.key, k.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8', transition: 'color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Copy API Key"
                        onMouseOver={(e) => e.currentTarget.style.color = '#3b82f6'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                      >
                        {copiedId === k.id ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>All profiles</span>
                  </td>
                  <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                    <span style={{ display: 'inline-flex', padding: '2px 8px', background: '#dcfce7', color: '#059669', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                      active
                    </span>
                  </td>
                  <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                    <span style={{ display: 'inline-flex', padding: '4px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#059669', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                      Read & Write
                    </span>
                  </td>
                  <td style={{ padding: '16px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                    <button
                      onClick={() => handleRevokeKey(k.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }}
                      title="Revoke Key"
                      onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
                  <button 
                    type="button" 
                    onClick={() => setPermission('Read & Write')}
                    style={{ flex: 1, padding: '10px', background: permission === 'Read & Write' ? '#dcfce7' : 'white', color: permission === 'Read & Write' ? '#166534' : '#64748b', border: `1px solid ${permission === 'Read & Write' ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    Read & Write
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPermission('Read Only')}
                    style={{ flex: 1, padding: '10px', background: permission === 'Read Only' ? '#dcfce7' : 'white', color: permission === 'Read Only' ? '#166534' : '#64748b', border: `1px solid ${permission === 'Read Only' ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    Read Only
                  </button>
                </div>
              </div>

              {/* Profile Access */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Profile Access</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    onClick={() => setFullAccess(!fullAccess)}
                    style={{ width: '44px', height: '24px', background: fullAccess ? '#3b82f6' : '#cbd5e1', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}
                  >
                    <div style={{ position: 'absolute', top: '2px', left: fullAccess ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'left 0.3s' }}></div>
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
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#e04f32', color: 'white', fontSize: '0.95rem', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px rgba(224, 79, 50, 0.25)' }}
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
