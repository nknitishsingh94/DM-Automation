import React, { useEffect, useState } from 'react';
import { Users, Layout, Send, Zap, Server, Activity, ArrowUpRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

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
        const res = await axios.get(`${API_BASE_URL}/api/admin/stats`, {
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        {statCards.map((stat, idx) => (
          <div key={idx} style={{
            background: 'var(--bg-card)',
            padding: '28px',
            borderRadius: '24px',
            boxShadow: '0 4px 25px rgba(0,0,0,0.04)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'default',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = stat.color;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 25px rgba(0,0,0,0.04)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
          >
            {/* Background Glow */}
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px',
              width: '100px', height: '100px', background: stat.color,
              filter: 'blur(50px)', opacity: 0.1, borderRadius: '50%'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ background: stat.bg, padding: '14px', borderRadius: '18px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}>
                {stat.icon}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#047857', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)' }}>
                <ArrowUpRight size={14} /> +12%
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: stat.color, lineHeight: '1.2' }}>
                {(stat.value || 0).toLocaleString()}
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
        <div style={{ 
          background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', 
          border: '1px solid var(--border-subtle)', minHeight: '300px', 
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 4px 25px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Activity Timeline</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 24px 0', fontSize: '0.95rem' }}>Platform usage over the last 30 days.</p>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '16px', color: 'var(--primary)', fontSize: '0.95rem', fontWeight: '600', border: '1px dashed rgba(99, 102, 241, 0.2)' }}>
            <Activity size={24} style={{ marginRight: '8px', opacity: 0.8 }} />
            Chart Module Unlocking in Phase 4
          </div>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
          padding: '32px', borderRadius: '24px', 
          minHeight: '300px', display: 'flex', flexDirection: 'column', color: 'white',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>System Status</h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '0.95rem', opacity: 0.9 }}>Real-time server monitoring.</p>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '1.1rem', fontWeight: '700', flexDirection: 'column', gap: '16px', backdropFilter: 'blur(10px)' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
               <Server size={32} />
               <div style={{ position: 'absolute', top: 0, right: 0, width: '14px', height: '14px', background: '#34d399', borderRadius: '50%', border: '2px solid #059669' }} />
            </div>
            All Systems Operational
          </div>
        </div>
      </div>

    </div>
  );
}
