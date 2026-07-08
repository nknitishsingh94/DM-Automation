import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

export default function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscriptions(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleUpdatePlan = async (userId, newPlan) => {
    if (!window.confirm(`Are you sure you want to change this user's plan to ${newPlan.toUpperCase()}?`)) {
      return;
    }
    
    setUpdating(userId);
    try {
      const token = localStorage.getItem('insta_agent_token');
      await axios.put(`${API_BASE_URL}/api/admin/subscriptions/${userId}`, { plan: newPlan }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Plan updated to ${newPlan.toUpperCase()}`);
      
      setSubscriptions(subs => subs.map(sub => 
        sub.userId === userId ? { ...sub, plan: newPlan } : sub
      ));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update plan');
    } finally {
      setUpdating(null);
    }
  };

  const filteredSubs = (Array.isArray(subscriptions) ? subscriptions : []).filter(s => 
    (s.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ position: 'sticky', top:  0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-base)', padding: '24px 24px 12px 24px', margin: '-24px -24px 24px -24px', borderRadius: '0 0 16px 16px', boxShadow: '0 4px 25px rgba(0,0,0,0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Subscription Management</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>View and manage billing plans for all users.</p>
        </div>
        
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} color="var(--primary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search by user email..." 
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
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Plan</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Update Plan</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <CreditCard size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p>No subscriptions found matching "{searchTerm}"</p>
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.userId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{sub.email}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>ID: {sub.userId}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {sub.status === 'active' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                          <AlertCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '4px 12px', 
                        borderRadius: '6px', 
                        fontSize: '0.85rem', 
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        background: sub.plan === 'pro' ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : sub.plan === 'enterprise' ? '#111827' : 'var(--sidebar-bg)',
                        color: sub.plan === 'pro' || sub.plan === 'enterprise' ? 'white' : 'var(--text-muted)'
                      }}>
                        {sub.plan}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <select 
                        value={sub.plan}
                        onChange={(e) => handleUpdatePlan(sub.userId, e.target.value)}
                        disabled={updating === sub.userId}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          outline: 'none',
                          cursor: updating === sub.userId ? 'not-allowed' : 'pointer',
                          opacity: updating === sub.userId ? 0.5 : 1
                        }}
                      >
                        <option value="free">Free Plan</option>
                        <option value="pro">Pro Plan</option>
                        <option value="enterprise">Enterprise Plan</option>
                      </select>
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
