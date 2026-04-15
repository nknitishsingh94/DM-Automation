import { useEffect, useState } from 'react';
import { MessageCircle, Zap, Users, ChevronRight, Activity, Calendar, Sparkles, Bot, ChevronDown, Crown, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    sentMessages: 0, 
    receivedMessages: 0, 
    newFollowers: 0,
    plan: 'free',
    contactCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [openItem, setOpenItem] = useState(0); // which checklist item is open

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('insta_agent_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const statsRes = await fetch(`${API_BASE_URL}/api/stats`, { headers });
        const statsData = await statsRes.json();
        setStats(prev => ({ ...prev, ...statsData }));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const checklistItems = [
    {
      title: 'Launch your first automation',
      desc: 'Automate conversations and watch your DMs do the work for you',
      cta: 'Create Automation',
      link: '/campaigns'
    },
    {
      title: 'Get a follow before DM',
      desc: 'Require users to follow your account before receiving automated DMs',
      cta: 'Setup Follow Gate',
      link: '/settings'
    },
    {
      title: 'Answer all your FAQs',
      desc: 'Set up AI-powered responses to handle common questions automatically',
      cta: 'Create FAQ Bot',
      link: '/ai-studio'
    },
    {
      title: 'Collect data with forms',
      desc: 'Build custom forms to capture leads and data directly through DMs',
      cta: 'Create Form',
      link: '/forms'
    },
    {
      title: 'Refer & Earn',
      desc: 'Invite friends to ZenXchat and earn rewards for every referral',
      cta: 'Start Referring',
      link: '/refer'
    }
  ];

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading dashboard...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px', padding: '0 40px 40px' }}>
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="stat-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
             <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #e2e8f0' }}></div>
             <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>Get setup</h2>
          </div>

          <div className="checklist-container">
            {checklistItems.map((item, index) => (
              <div 
                key={index} 
                className="checklist-item" 
                style={{ 
                  cursor: 'pointer', 
                  borderBottom: index < checklistItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                  paddingBottom: index < checklistItems.length - 1 ? '8px' : '0'
                }}
                onClick={() => setOpenItem(openItem === index ? -1 : index)}
              >
                <div className="checklist-circle"></div>
                <div className="checklist-content" style={{ flex: 1 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {item.title}
                    <ChevronDown 
                      size={18} 
                      color="#94a3b8" 
                      style={{ 
                        transition: 'transform 0.3s ease',
                        transform: openItem === index ? 'rotate(180deg)' : 'rotate(0deg)',
                        flexShrink: 0
                      }} 
                    />
                  </h4>
                  {openItem === index && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                      <p>{item.desc}</p>
                      <Link 
                        to={item.link} 
                        className="landing-cta" 
                        style={{ 
                          background: '#0f172a', 
                          padding: '10px 24px', 
                          fontSize: '14px', 
                          borderRadius: '12px', 
                          marginTop: '12px', 
                          display: 'inline-flex' 
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.cta}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="stat-card funnel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed' }}>
              <Zap size={20} />
              <span style={{ fontWeight: '700', fontSize: '14px' }}>Conversion Funnel</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
               <Calendar size={14} color="#64748b" />
               <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Last 7 days</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '8px' }}>Messages</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{stats.sentMessages}</div>
            </div>
            <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '8px' }}>Seen</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>0</div>
            </div>
            <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '8px' }}>Pressed</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>0</div>
            </div>
          </div>
          
          <div style={{ marginTop: '24px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <div style={{ width: '100%', height: '100%', borderRadius: '16px', background: 'linear-gradient(180deg, rgba(34, 211, 238, 0.05), rgba(34, 211, 238, 0.2))' }}></div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed' }}>
              <Activity size={20} />
              <span style={{ fontWeight: '700', fontSize: '14px' }}>Analytics</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
               <Calendar size={14} color="#64748b" />
               <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Last 7 days</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                  <Users size={14} /> New Followers
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{stats.newFollowers || 0}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Followers gained through Zorcha ?</div>
              </div>
              <div style={{ width: '200px', height: '100px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>
                No follower data available
              </div>
            </div>

             <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                  <MessageCircle size={14} /> Messages
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>0</div>
              </div>
              <div style={{ width: '200px', height: '100px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>
                No message data available
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
