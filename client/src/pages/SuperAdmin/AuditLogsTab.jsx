import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ShieldAlert, Search, RefreshCw, UserX, Link, Unlink } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AuditLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/permanent-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch permanent logs:', err);
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (log.userId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.accountDetails || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilter = filterAction === 'ALL' || log.actionType === filterAction;
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'USER_DELETED': return <UserX size={16} color="#ef4444" />;
      case 'ACCOUNT_CONNECTED': return <Link size={16} color="#10b981" />;
      case 'ACCOUNT_DISCONNECTED': return <Unlink size={16} color="#f59e0b" />;
      default: return <ShieldAlert size={16} color="#6366f1" />;
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'USER_DELETED': return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' };
      case 'ACCOUNT_CONNECTED': return { bg: 'rgba(16,185,129,0.1)', color: '#10b981' };
      case 'ACCOUNT_DISCONNECTED': return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' };
      default: return { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-base)', padding: '24px 24px 12px 24px', margin: '-24px -24px 24px -24px', borderRadius: '0 0 16px 16px', boxShadow: '0 4px 25px rgba(0,0,0,0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={24} color="#ef4444" />
            Audit Logs & Fraud Prevention
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Permanent record of deleted accounts and critical user actions.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
          >
            <option value="ALL">All Actions</option>
            <option value="USER_DELETED">Deleted Accounts</option>
            <option value="ACCOUNT_CONNECTED">Connected Socials</option>
            <option value="ACCOUNT_DISCONNECTED">Disconnected Socials</option>
          </select>
          
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={18} color="var(--primary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search email, ID, details..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px',
                border: '1px solid var(--border)', background: 'var(--bg-card)',
                color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none'
              }}
            />
          </div>
          <button 
            onClick={fetchLogs} 
            disabled={loading}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Details</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <div className="animate-spin" style={{ margin: '0 auto', width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ShieldAlert size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>No audit logs found</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>Try adjusting your search filters.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const actionStyle = getActionColor(log.actionType);
                  return (
                    <tr key={log.id || log._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: actionStyle.bg, color: actionStyle.color, padding: '6px 12px', borderRadius: '8px', width: 'fit-content', fontWeight: '600', fontSize: '0.85rem' }}>
                          {getActionIcon(log.actionType)}
                          {(log.actionType || 'UNKNOWN_ACTION').replace('_', ' ')}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{log.userEmail || 'Unknown Email'}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>ID: {log.userId}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ fontWeight: '500', color: 'var(--text-main)', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                          {log.platform || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px' }}>
                        {log.accountDetails || '-'}
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(log.created_at || log.createdAt || Date.now()).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditLogsTab;
