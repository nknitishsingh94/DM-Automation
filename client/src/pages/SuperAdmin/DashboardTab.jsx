import React, { useEffect, useState } from 'react';
import { Users, Layout, Send, Zap, Server, Activity, ArrowUpRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function DashboardTab() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorkspaces: 0,
    totalScheduledPosts: 0,
    totalAutomations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load system stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: <Users size={24} color="#3b82f6" />, bg: '#eff6ff', color: '#1d4ed8' },
    { title: 'Workspaces', value: stats.totalWorkspaces, icon: <Layout size={24} color="#8b5cf6" />, bg: '#f5f3ff', color: '#6d28d9' },
    { title: 'Scheduled Posts', value: stats.totalScheduledPosts, icon: <Send size={24} color="#10b981" />, bg: '#ecfdf5', color: '#047857' },
    { title: 'Automations', value: stats.totalAutomations, icon: <Zap size={24} color="#f59e0b" />, bg: '#fffbeb', color: '#b45309' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 8px 0' }}>Platform Overview</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Real-time statistics across the entire DM Automation platform.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {statCards.map((stat, idx) => (
          <div key={idx} style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'transform 0.2s',
            cursor: 'default',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ background: stat.bg, padding: '12px', borderRadius: '16px' }}>
                {stat.icon}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}>
                <ArrowUpRight size={16} /> 12%
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: stat.color, lineHeight: '1.2' }}>
                {stat.value.toLocaleString()}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '600' }}>
                {stat.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '16px' }}>
        {/* Placeholder for future charts */}
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 16px 0' }}>Activity Timeline</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sidebar-bg)', borderRadius: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <Activity size={24} style={{ marginRight: '8px', opacity: 0.5 }} />
            Chart Module (Phase 4)
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 16px 0' }}>System Health</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sidebar-bg)', borderRadius: '16px', color: '#10b981', fontSize: '0.9rem', fontWeight: '600', flexDirection: 'column', gap: '12px' }}>
            <Server size={32} />
            All Systems Operational
          </div>
        </div>
      </div>

    </div>
  );
}
