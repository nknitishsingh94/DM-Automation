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
        <div className="stat-card" style={{ padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
             <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #e2e8f0' }}></div>
             <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Get setup</h2>
          </div>

          <div className="checklist-container">
            {checklistItems.map((item, index) => (
              <div 
                key={index} 
                className="checklist-item" 
                style={{ 
                  cursor: 'pointer', 
                  borderBottom: index < checklistItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                  paddingBottom: '16px'
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingLeft: '10px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <Crown size={22} color="#64748b" />
            </div>
            <div style={{ flex: 1 }}>
               <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', marginBottom: '2px' }}>Free Forever</h4>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Upgrade to Unlock your Growth</p>
            </div>
          </div>

          {/* AI Credits Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(253, 244, 255, 0.6) 0%, rgba(243, 232, 255, 0.6) 100%)', 
            borderRadius: '20px', 
            padding: '14px', 
            border: '1px solid rgba(216, 180, 254, 0.4)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: '700', fontSize: '13px' }}>
                <div style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                   <Sparkles size={12} color="white" />
                </div>
                AI Credits
              </div>
              <Link to="/upgrade" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#7c3aed', fontWeight: '800', fontSize: '12px', textDecoration: 'none' }}>
                <Star size={12} fill="#7c3aed" /> Upgrade
              </Link>
            </div>
            
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '700', fontSize: '13px' }}>
                 <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '3px solid #e2e8f0' }}></div>
                 Monthly Limit
               </div>
               <div style={{ color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>
                 15K / 15K
               </div>
            </div>
          </div>

          {/* Features Grid */}
          <div style={{ border: '1px solid #f1f5f9', borderRadius: '20px', overflow: 'hidden', background: '#ffffff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f1f5f9' }}>
               {/* Automations */}
               <div style={{ padding: '16px', borderRight: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '700', fontSize: '13px' }}>
                   <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '3px solid #e2e8f0' }}></div>
                   Automations
                 </div>
                 <div style={{ color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>0 / 3</div>
               </div>
               {/* Forms */}
               <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '700', fontSize: '13px' }}>
                   <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '3px solid #e2e8f0' }}></div>
                   Forms
                 </div>
                 <div style={{ color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>0 / 3</div>
               </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
               {/* Messages */}
               <div style={{ padding: '16px', borderRight: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '700', fontSize: '13px' }}>
                   <MessageCircle size={14} color="#94a3b8" />
                   Messages
                 </div>
                 <div style={{ color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Unlimited</div>
               </div>
               {/* Contacts */}
               <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '700', fontSize: '13px' }}>
                   <Users size={14} color="#94a3b8" />
                   Contacts
                 </div>
                 <div style={{ color: '#94a3b8', fontWeight: '600', fontSize: '13px' }}>Unlimited</div>
               </div>
            </div>
          </div>

          {/* Manage Plan Button */}
          <div>
            <Link to="/upgrade" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px', 
              padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', 
              background: '#ffffff', color: '#1e293b', fontWeight: '700', fontSize: '14px', 
              textDecoration: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'all 0.2s'
            }}>
              <Crown size={16} color="#94a3b8" /> Manage Plan
            </Link>
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
