import React, { useEffect, useState } from 'react';
import { Search, Trash2, MoreVertical, Shield, UserX, History, ArrowLeft, Activity, Zap, Building, FileText, CheckCircle, Clock, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id, email) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${email}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('insta_agent_token');
      await axios.delete(`${API_BASE_URL}/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      setUsers(users.filter(u => u.id !== id));
      if (selectedUserId === id) setSelectedUserId(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleViewHistory = async (id) => {
    setSelectedUserId(id);
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/users/${id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUserData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user history');
      setSelectedUserId(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
    </div>
  );

  if (selectedUserId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-base)', padding: '24px 24px 12px 24px', margin: '-24px -24px 24px -24px', borderRadius: '0 0 16px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '52px' }}>
            {/* Left Side: User Info or Loader */}
            {loadingHistory ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
                <span style={{ color: 'var(--text-muted)' }}>Loading user history...</span>
              </div>
            ) : selectedUserData ? (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>{selectedUserData.user.username || 'Anonymous'}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{selectedUserData.user.email}</span>
                  <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>{selectedUserData.user.plan}</span>
                </div>
              </div>
            ) : <div />}

            {/* Right Side: Back Button */}
            <button 
              onClick={() => setSelectedUserId(null)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', 
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', 
                color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem', 
                fontWeight: '600', padding: '10px 16px', borderRadius: '12px',
                transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-base)'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-main)'; }}
            >
              <ArrowLeft size={16} /> Back to Users
            </button>
          </div>
        </div>

        {selectedUserData && !loadingHistory && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Workspaces Card */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                  <Building size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Workspaces ({selectedUserData.workspaces.length})</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(selectedUserData.workspaces || []).map(ws => (
                  <div key={ws.id || ws._id || Math.random()} style={{ padding: '12px', background: 'var(--bg-base)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>{ws.name || 'Unnamed Workspace'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Created: {new Date(ws.created_at || ws.createdAt || Date.now()).toLocaleDateString()}</div>
                  </div>
                ))}
                {!(selectedUserData.workspaces?.length > 0) && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No workspaces found.</div>}
              </div>
            </div>

            {/* Automations Card */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '10px', borderRadius: '12px' }}>
                  <Zap size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Automations ({(selectedUserData.automations || []).length})</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(selectedUserData.automations || []).map(flow => (
                  <div key={flow.id || flow._id || Math.random()} style={{ padding: '12px', background: 'var(--bg-base)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>{flow.name || 'Unnamed Flow'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                      <span style={{ color: flow.isActive ? '#10b981' : 'var(--text-muted)' }}>{flow.isActive ? 'Active' : 'Draft'}</span>
                      • <span>Trigger: {flow.triggerType || 'Unknown'}</span>
                    </div>
                  </div>
                ))}
                {!(selectedUserData.automations?.length > 0) && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No automations found.</div>}
              </div>
            </div>

            {/* Activity / Posts Card */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-subtle)', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '10px', borderRadius: '12px' }}>
                  <Activity size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Scheduled Posts & Logs ({(selectedUserData.scheduledPosts || []).length + (selectedUserData.postLogs || []).length})</h3>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>Type</th>
                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>Content Snippet</th>
                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>Platform</th>
                    <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>Date/Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(selectedUserData.scheduledPosts || []), ...(selectedUserData.postLogs || [])]
                    .sort((a, b) => new Date(b.createdAt || b.created_at || b.scheduledFor || 0) - new Date(a.createdAt || a.created_at || a.scheduledFor || 0))
                    .map(item => {
                      const isLog = item.status === 'success' || item.status === 'failed';
                      return (
                        <tr key={item.id || item._id || Math.random()} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: '0.8rem', background: isLog ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: isLog ? '#10b981' : '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                              {isLog ? 'Published Log' : 'Scheduled'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-main)', fontSize: '0.9rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.caption || item.content || 'No content'}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-main)', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                            {item.platform || (Array.isArray(item.platforms) ? item.platforms.join(', ') : 'Unknown')}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {new Date(item.scheduledFor || item.created_at || item.createdAt || Date.now()).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                    {((selectedUserData.scheduledPosts || []).length + (selectedUserData.postLogs || []).length) === 0 && (
                      <tr>
                        <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No posting activity found.</td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ position: 'sticky', top:  0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-base)', padding: '24px 24px 12px 24px', margin: '-24px -24px 24px -24px', borderRadius: '0 0 16px 16px', boxShadow: '0 4px 25px rgba(0,0,0,0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>User Management</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>View and manage all registered accounts on the platform.</p>
        </div>
        
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} color="var(--primary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search users by email or name..." 
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
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joined Date</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <UserX size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p>No users found matching "{searchTerm}"</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{user.username || 'Anonymous'}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {user.email === 'nknitishsingh94@gmail.com' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef08a', color: '#854d0e', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                          <Shield size={12} /> Founder
                        </span>
                      ) : (
                        <span style={{ background: 'var(--sidebar-bg)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>
                          User
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {(user.created_at || user.createdAt) ? new Date(user.created_at || user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          onClick={() => handleViewHistory(user.id || user._id)}
                          style={{
                            background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--primary)',
                            cursor: 'pointer', padding: '6px 12px', borderRadius: '8px',
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <History size={14} /> View History
                        </button>
                        {user.email !== 'nknitishsingh94@gmail.com' && (
                          <button 
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            style={{
                              background: 'transparent', border: 'none', color: '#ef4444',
                              cursor: 'pointer', padding: '8px', borderRadius: '8px',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            title="Delete User"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
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
