import { useState, useEffect } from 'react';
import { Key, Copy, Trash2, Plus, Terminal, Check, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';

export default function DeveloperSettings() {
  const { notify } = useNotification();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // State to hold the newly generated raw key (shown only once)
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

  const curlExample = `curl -X POST "${API_BASE_URL}/api/posts" \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "caption": "Programmatic post from Developer API!",
    "mediaUrl": "https://example.com/video.mp4",
    "platforms": ["instagram", "youtube"],
    "type": "video"
  }'`;

  const nodeExample = `fetch("${API_BASE_URL}/api/posts", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk_live_YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    caption: "Programmatic post from Developer API!",
    mediaUrl: "https://example.com/video.mp4",
    platforms: ["instagram", "youtube"],
    type: "video"
  })
})
.then(res => res.json())
.then(data => console.log(data));`;

  return (
    <div style={{ maxWidth: '1100px', width: '100%', display: 'flex', flexDirection: 'column', gap: '28px', padding: '24px 16px 100px 16px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Title Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Terminal size={28} color="#7c3aed" /> Developer API Settings
        </h2>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b' }}>
          Generate API keys to programmatically schedule and automate posts across multiple platforms.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Side: Keys Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Key List Card */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#64748b" /> Active API Keys
              </h3>
              {!showGenerateForm && (
                <button
                  onClick={() => { setShowGenerateForm(true); setNewlyCreatedKey(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(139, 92, 246, 0.25)' }}
                >
                  <Plus size={14} /> Create Key
                </button>
              )}
            </div>

            {showGenerateForm && (
              <form onSubmit={handleGenerateKey} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>Create New API Key</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Key Name (e.g. My Automation Script)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.88rem' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setShowGenerateForm(false)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', fontSize: '0.82rem', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer' }}
                    >
                      {submitting ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                </div>
              </form>
            )}

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

        {/* Right Side: Documentation & Examples */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Endpoint Documentation Card */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} color="#7c3aed" /> Developer API Reference
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ background: '#22c55e', color: 'white', fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', marginRight: '8px' }}>POST</span>
                <code style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>/api/posts</code>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>
                  Create and schedule a post for one or more platforms. The scheduling worker runs in the background to publish your posts.
                </p>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>Headers</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', fontSize: '0.8rem' }}><span style={{ fontWeight: '700', width: '120px', color: '#475569' }}>Authorization</span><span style={{ color: '#64748b' }}>Bearer sk_live_YOUR_API_KEY</span></div>
                  <div style={{ display: 'flex', fontSize: '0.8rem' }}><span style={{ fontWeight: '700', width: '120px', color: '#475569' }}>Content-Type</span><span style={{ color: '#64748b' }}>application/json</span></div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>Request Body (JSON)</h4>
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '6px 0', fontWeight: '700' }}>Parameter</th>
                      <th style={{ padding: '6px 0', fontWeight: '700' }}>Type</th>
                      <th style={{ padding: '6px 0', fontWeight: '700' }}>Req?</th>
                      <th style={{ padding: '6px 0', fontWeight: '700' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', fontFamily: 'monospace', fontWeight: '600' }}>caption</td>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>string</td>
                      <td style={{ padding: '6px 0', color: '#475569' }}>Yes</td>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>Post text content.</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', fontFamily: 'monospace', fontWeight: '600' }}>mediaUrl</td>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>string</td>
                      <td style={{ padding: '6px 0', color: '#475569' }}>No</td>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>Public HTTP link to your image/video.</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', fontFamily: 'monospace', fontWeight: '600' }}>platforms</td>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>array</td>
                      <td style={{ padding: '6px 0', color: '#475569' }}>Yes</td>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>e.g. <code>["instagram", "youtube"]</code>.</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', fontFamily: 'monospace', fontWeight: '600' }}>scheduledFor</td>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>string</td>
                      <td style={{ padding: '6px 0', color: '#475569' }}>No</td>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>ISO 8601 date. Defaults to now.</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 0', fontFamily: 'monospace', fontWeight: '600' }}>type</td>
                      <td style={{ padding: '6px 0', color: '#64748b' }}>string</td>
                      <td style={{ padding: '6px 0', color: '#475569' }}>No</td>
                      <td style={{ padding: '6px 0', color: '#64748b' }}><code>"image"</code> or <code>"video"</code>.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Code Sandbox Card */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} color="#7c3aed" /> Integration Examples
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>cURL (Command Line)</h4>
                <div style={{ position: 'relative' }}>
                  <pre style={{ margin: 0, padding: '12px', background: '#0f172a', color: '#f8fafc', borderRadius: '8px', fontSize: '0.76rem', overflowX: 'auto', fontFamily: 'monospace', whiteSpace: 'pre' }}>
                    {curlExample}
                  </pre>
                  <button
                    onClick={() => handleCopy(curlExample, 'curl')}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {copiedId === 'curl' ? <Check size={12} color="#10b981" /> : <Copy size={12} color="#f8fafc" />}
                  </button>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>JavaScript (Fetch API)</h4>
                <div style={{ position: 'relative' }}>
                  <pre style={{ margin: 0, padding: '12px', background: '#0f172a', color: '#f8fafc', borderRadius: '8px', fontSize: '0.76rem', overflowX: 'auto', fontFamily: 'monospace', whiteSpace: 'pre' }}>
                    {nodeExample}
                  </pre>
                  <button
                    onClick={() => handleCopy(nodeExample, 'node')}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {copiedId === 'node' ? <Check size={12} color="#10b981" /> : <Copy size={12} color="#f8fafc" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
