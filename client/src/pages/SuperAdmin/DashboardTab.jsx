import React, { useEffect, useState } from 'react';
import { Users, Layout, Send, Zap, Server, Activity, ArrowUpRight, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

const mockUserGrowth = [
  { name: 'Jan', users: 400 },
  { name: 'Feb', users: 800 },
  { name: 'Mar', users: 1200 },
  { name: 'Apr', users: 1800 },
  { name: 'May', users: 2400 },
  { name: 'Jun', users: 3100 },
];

const mockActivity = [
  { name: 'Mon', automations: 4000, posts: 2400 },
  { name: 'Tue', automations: 3000, posts: 1398 },
  { name: 'Wed', automations: 2000, posts: 9800 },
  { name: 'Thu', automations: 2780, posts: 3908 },
  { name: 'Fri', automations: 1890, posts: 4800 },
  { name: 'Sat', automations: 2390, posts: 3800 },
  { name: 'Sun', automations: 3490, posts: 4300 },
];

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
        const token = localStorage.getItem('insta_agent_token');
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '16px' }}>
        
        {/* User Growth Chart */}
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Users size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>User Growth (YTD)</h3>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockUserGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} 
                  itemStyle={{ color: 'var(--primary)', fontWeight: '700' }}
                />
                <Line type="monotone" dataKey="users" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--bg-card)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Activity Chart */}
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Activity size={20} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>Weekly Platform Activity</h3>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--sidebar-bg)' }}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} 
                />
                <Bar dataKey="automations" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="posts" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
