import { useEffect, useState } from 'react';
import { Activity, MessageCircle, RefreshCw, TrendingUp, Users, Crown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    totalDMs: 0, 
    sentMessages: 0, 
    receivedMessages: 0, 
    campaigns: 0, 
    messages: 0, 
    aiReplyRate: '0%',
    plan: 'free',
    contactCount: 0
  });
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('insta_agent_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const statsRes = await fetch('http://localhost:5000/api/stats', { headers });
        const statsData = await statsRes.json();
        setStats(statsData);

        const campaignsRes = await fetch('http://localhost:5000/api/campaigns', { headers });
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading dashboard data...</div>;

  return (
    <div>
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span>Sent Messages</span>
            <MessageCircle size={20} className="stat-icon" />
          </div>
          <div className="stat-value">{stats.sentMessages?.toLocaleString() || stats.totalDMs?.toLocaleString() || 0}</div>
          <div style={{ color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={16} /> Total Sent
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Received Messages</span>
            <MessageCircle size={20} className="stat-icon" />
          </div>
          <div className="stat-value">{stats.receivedMessages?.toLocaleString() || 0}</div>
          <div style={{ color: '#60a5fa', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={16} /> User Inquiries
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>AI Accuracy</span>
            <RefreshCw size={20} className="stat-icon" />
          </div>
          <div className="stat-value">{stats.aiReplyRate}</div>
          <div style={{ color: '#8b5cf6', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={16} /> Successful Replies
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Active Campaigns</span>
            <Users size={20} className="stat-icon" />
          </div>
          <div className="stat-value">{stats.campaigns}</div>
          <div style={{ color: '#fbbf24', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={16} /> Running
          </div>
        </div>

        <div className="stat-card" style={{ 
          background: stats.plan === 'free' ? 'rgba(168, 85, 247, 0.05)' : 'var(--stat-bg)',
          border: stats.plan === 'free' ? '1px solid rgba(168, 85, 247, 0.2)' : 'none'
        }}>
          <div className="stat-header">
            <span>Contact Usage</span>
            {stats.plan === 'pro' ? <Crown size={20} color="#fbbf24" /> : <Users size={20} className="stat-icon" />}
          </div>
          <div className="stat-value">
            {stats.plan === 'pro' ? stats.contactCount : `${stats.contactCount} / 30`}
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {stats.plan === 'free' && (
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${Math.min((stats.contactCount / 30) * 100, 100)}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #a855f7, #d946ef)',
                  transition: 'width 1s ease-out'
                }}></div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ 
                color: stats.plan === 'pro' ? '#fbbf24' : (stats.contactCount >= 25 ? '#f87171' : 'var(--text-muted)'), 
                fontSize: '0.85rem',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {stats.plan === 'pro' ? 'Unlimited Pro Access' : (stats.contactCount >= 30 ? 'Limit Reached' : `${30 - stats.contactCount} left`)}
              </span>
              {stats.plan === 'free' && (
                <Link to="/upgrade" style={{ fontSize: '0.8rem', color: '#a855f7', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  Upgrade <ChevronRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="table-card" style={{ marginTop: '32px' }}>
        <div className="table-header">
          <h2 className="table-title">Live Automation Campaigns</h2>
          <button style={{ color: 'var(--accent-color)', fontWeight: '500', fontSize: '0.9rem' }}>View All</button>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ minWidth: '600px', width: '100%' }}>
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Trigger Keyword</th>
                <th>DMs Sent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp) => (
                <tr key={camp._id}>
                  <td>{camp.name}</td>
                  <td>"{camp.trigger}"</td>
                  <td>{camp.dmsSent.toLocaleString()}</td>
                  <td><span className={`status-badge ${camp.status === 'Active' ? 'status-success' : 'status-pending'}`}>{camp.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
