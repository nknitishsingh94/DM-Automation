import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, TrendingUp, Users, Settings2, CheckCircle2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

export default function PaymentsTab() {
  const [revenue, setRevenue] = useState(null);
  const [pricing, setPricing] = useState({ pro_price: 29, enterprise_price: 99 });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      
      const [revRes, priceRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/revenue`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/admin/pricing`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setRevenue(revRes.data);
      setPricing({
        pro_price: priceRes.data.pro_price || 29,
        enterprise_price: priceRes.data.enterprise_price || 99
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSavePricing = async () => {
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('insta_agent_token');
      await axios.put(`${API_BASE_URL}/api/admin/pricing`, pricing, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaveStatus('saved');
      toast.success('Pricing updated successfully!');
      fetchData(); // Refresh revenue based on new pricing
    } catch (err) {
      console.error(err);
      setSaveStatus('failed');
      toast.error('Failed to update pricing');
    } finally {
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ position: 'sticky', top:  0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-base)', padding: '24px 24px 12px 24px', margin: '0 -24px 24px -24px', borderRadius: '0 0 16px 16px', boxShadow: '0 4px 25px rgba(0,0,0,0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Payments & Revenue</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Track platform MRR, transactions, and manage dynamic pricing.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
              <TrendingUp size={20} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Monthly Recurring Revenue</span>
          </div>
          <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>${revenue?.mrr?.toLocaleString() || 0}</h3>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', color: '#22c55e' }}>
              <DollarSign size={20} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Total Revenue (All Time)</span>
          </div>
          <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>${revenue?.totalRevenue?.toLocaleString() || 0}</h3>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', color: '#a855f7' }}>
              <Users size={20} />
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Active Paid Subscribers</span>
          </div>
          <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>{revenue?.activeSubscribers || 0}</h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Dynamic Pricing Config */}
        <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--primary)', boxShadow: '0 10px 40px rgba(99, 102, 241, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Settings2 size={24} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>Platform Pricing Engine</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Change the monthly subscription price for the platform. This updates immediately across all pricing tables.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.9rem' }}>Pro Plan Price ($/mo)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="number" 
                  value={pricing.pro_price}
                  onChange={(e) => setPricing({...pricing, pro_price: parseInt(e.target.value) || 0})}
                  style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: '600' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.9rem' }}>Enterprise Plan Price ($/mo)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="number" 
                  value={pricing.enterprise_price}
                  onChange={(e) => setPricing({...pricing, enterprise_price: parseInt(e.target.value) || 0})}
                  style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: '600' }}
                />
              </div>
            </div>
            <button 
              onClick={handleSavePricing}
              disabled={saveStatus === 'saving'}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', 
                background: saveStatus === 'saved' ? '#10b981' : saveStatus === 'failed' ? '#ef4444' : '#3b82f6', 
                color: 'white', border: 'none', fontWeight: '700', fontSize: '0.95rem', 
                cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px',
                opacity: saveStatus === 'saving' ? 0.7 : 1, transition: 'background 0.3s'
              }}
            >
              <CheckCircle2 size={18} />
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'failed' ? 'Failed!' : 'Update Platform Pricing'}
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>Recent Transactions</h3>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
              <Download size={16} /> Export CSV
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(99, 102, 241, 0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {revenue?.recentTransactions?.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>{tx.user}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(tx.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>${tx.amount}</span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase' }}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!revenue?.recentTransactions?.length && (
                <tr>
                  <td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent transactions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
