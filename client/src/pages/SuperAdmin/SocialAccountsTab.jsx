import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Link2, Unplug, RefreshCw, Facebook, Instagram, Youtube, Twitter, Linkedin } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

export default function SocialAccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/social-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load social accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDisconnect = async (id, platform, displayName) => {
    if (!window.confirm(`Are you sure you want to forcibly disconnect the ${platform} account "${displayName}"?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/admin/social-accounts/${id}/${platform}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${platform} account disconnected`);
      setAccounts(accounts.filter(a => !(a.id === id && a.platform === platform)));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to disconnect account');
    }
  };

  const getPlatformIcon = (platform) => {
    switch(platform.toLowerCase()) {
      case 'instagram': return <Instagram size={20} color="#e1306c" />;
      case 'facebook': return <Facebook size={20} color="#1877f2" />;
      case 'youtube': return <Youtube size={20} color="#ff0000" />;
      case 'twitter': return <Twitter size={20} color="#1da1f2" />;
      case 'linkedin': return <Linkedin size={20} color="#0a66c2" />;
      case 'pinterest': return <div style={{ color: '#E60023', fontWeight: 'bold' }}>P</div>;
      default: return <Link2 size={20} />;
    }
  };

  const filteredAccounts = (Array.isArray(accounts) ? accounts : []).filter(a => 
    (a.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.platform || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 25px rgba(0,0,0,0.02)', border: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Social Account Management</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Monitor all connected social profiles across the platform.</p>
        </div>
        
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} color="var(--primary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search by account name or platform..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px 14px 44px', borderRadius: '16px',
              border: '2px solid transparent', background: 'rgba(99, 102, 241, 0.05)',
              color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontWeight: '500'
            }}
            onFocus={(e) => {
              e.target.style.background = 'var(--bg-card)';
              e.target.style.borderColor = 'var(--primary)';
              e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'rgba(99, 102, 241, 0.05)';
              e.target.style.borderColor = 'transparent';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(99, 102, 241, 0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Name</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workspace ID</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Link2 size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p>No connected accounts found matching "{searchTerm}"</p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={`${account.id}-${account.platform}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getPlatformIcon(account.platform)}
                        </div>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem', textTransform: 'capitalize' }}>
                          {account.platform}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{account.displayName}</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>{account.workspaceId}</span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          onClick={() => toast('Token refresh requires OAuth flow (coming soon).', { icon: '🚧' })}
                          style={{
                            background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)',
                            cursor: 'pointer', padding: '6px 12px', borderRadius: '8px',
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                          title="Refresh Tokens"
                        >
                          <RefreshCw size={14} /> Refresh
                        </button>
                        <button 
                          onClick={() => handleDisconnect(account.id, account.platform, account.displayName)}
                          style={{
                            background: 'transparent', border: 'none', color: '#ef4444',
                            cursor: 'pointer', padding: '8px', borderRadius: '8px',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                          title="Disconnect Account"
                        >
                          <Unplug size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
