import { useEffect, useState } from 'react';
import { MessageCircle, Zap, Users, ChevronRight, Activity, Calendar, Sparkles, Bot, ChevronDown, Crown, Star, BookOpen } from 'lucide-react';
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
  const [timeFilter, setTimeFilter] = useState('7d');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [setupStatus, setSetupStatus] = useState({
    profileDone: true,
    metaDone: false,
    flowDone: false
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('insta_agent_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [statsRes, settingsRes, flowsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/stats?filter=${timeFilter}`, { headers }),
          fetch(`${API_BASE_URL}/api/settings`, { headers }),
          fetch(`${API_BASE_URL}/api/flows`, { headers })
        ]);

        const statsData = await statsRes.json();
        const settingsData = await settingsRes.json();
        const flowsData = await flowsRes.json();

        setStats(statsData);
        
        // Check setup progress
        setSetupStatus({
          profileDone: true, 
          metaDone: settingsData.isAccountConnected || settingsData.isFacebookConnected || settingsData.isWhatsAppConnected,
          flowDone: Array.isArray(flowsData) && flowsData.length > 0
        });

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeFilter]);

  const getSetupProgress = () => {
    const items = [setupStatus.profileDone, setupStatus.metaDone, setupStatus.flowDone];
    const completed = items.filter(Boolean).length;
    return Math.round((completed / items.length) * 100);
  };

  const exploreItems = [
    {
      title: 'Answer all your FAQs',
      desc: 'Set up AI-powered responses to handle common questions automatically',
      cta: 'Create FAQ Bot',
      link: '/ai-studio',
      icon: <Sparkles size={18} color="#8b5cf6" />
    },
    {
      title: 'Collect data with forms',
      desc: 'Build custom forms to capture leads and data directly through DMs',
      cta: 'Create Form',
      link: '/forms',
      icon: <BookOpen size={18} color="#0ea5e9" />
    },
    {
      title: 'Refer & Earn',
      desc: 'Invite friends to ZenXchat and earn rewards for every referral',
      cta: 'Start Referring',
      link: '/refer',
      icon: <Users size={18} color="#f59e0b" />
    }
  ];

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading dashboard...</div>;

  const displayStats = {
    sentMessages: (stats.sentMessages || 0).toLocaleString(),
    opened: (Math.floor((stats.sentMessages || 0) * 0.45)).toLocaleString(), // Simulated open rate
    clicked: (Math.floor((stats.sentMessages || 0) * 0.12)).toLocaleString(), // Simulated click rate
    newFollowers: (stats.newFollowers || 0).toLocaleString(),
    automationsFired: (Math.floor((stats.sentMessages || 0) * 0.8)).toLocaleString() // Simulated fired rate
  };

  const getFilterText = () => {
    if (timeFilter === '30d') return 'Past 30 Days';
    if (timeFilter === 'all') return 'All Time';
    return 'Past 7 Days';
  };

  const toggleDropdown = (name) => {
    if (activeDropdown === name) setActiveDropdown(null);
    else setActiveDropdown(name);
  };

  const selectFilter = (val) => {
    setTimeFilter(val);
    setActiveDropdown(null);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '32px', padding: '0 40px 40px' }}>
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* PEHLE WALA PART (RESTORED TO TOP) */}
        <div className="stat-card" style={{ padding: '24px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
             <div style={{ width: '36px', height: '36px', background: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Sparkles size={18} color="#64748b" />
             </div>
             <div>
               <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Discover Features</h3>
               <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Automate your growth and engagement</p>
             </div>
          </div>

          <div className="checklist-container">
            {exploreItems.map((item, index) => (
              <div 
                key={index} 
                className="checklist-item" 
                style={{ 
                  cursor: 'pointer', 
                  borderBottom: index < exploreItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                  paddingBottom: index < exploreItems.length - 1 ? '16px' : '0',
                  paddingTop: index > 0 ? '16px' : '0'
                }}
                onClick={() => setOpenItem(openItem === (index + 10) ? -1 : (index + 10))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                      {item.title}
                      <ChevronDown 
                        size={16} 
                        color="#94a3b8" 
                        style={{ 
                          transition: 'transform 0.3s ease',
                          transform: openItem === (index + 10) ? 'rotate(180deg)' : 'rotate(0deg)'
                        }} 
                      />
                    </h4>
                    {openItem === (index + 10) && (
                      <div style={{ animation: 'fadeIn 0.3s ease', marginTop: '12px' }}>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>{item.desc}</p>
                        <Link 
                          to={item.link} 
                          className="landing-cta" 
                          style={{ 
                            background: '#0f172a', 
                            padding: '10px 24px', 
                            fontSize: '13px', 
                            borderRadius: '12px', 
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
              </div>
            ))}
          </div>
        </div>

        {/* NAYA SETUP PART (MOVED BELOW) */}
        <div className="stat-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: 'none', color: 'white', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={20} color="#3b82f6" />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Launch Readiness</h2>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Complete setup to unlock full power</p>
                </div>
             </div>
             <div style={{ textAlign: 'right' }}>
               <span style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6' }}>{getSetupProgress()}%</span>
             </div>
          </div>

          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '32px', overflow: 'hidden' }}>
            <div style={{ width: `${getSetupProgress()}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', transition: 'width 0.5s ease' }}></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: setupStatus.profileDone ? '#10b981' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={14} color="white" />
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: setupStatus.profileDone ? 'white' : '#94a3b8' }}>Account Verification</span>
              </div>
              {setupStatus.profileDone && <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>DONE</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: setupStatus.metaDone ? '#10b981' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={14} color="white" />
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: setupStatus.metaDone ? 'white' : '#94a3b8' }}>Connect IG/WhatsApp</span>
              </div>
              {setupStatus.metaDone ? <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>DONE</span> : <Link to="/settings" style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '700', textDecoration: 'none' }}>CONNECT</Link>}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="stat-card funnel-card" style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f3f4f6 100%)', border: '1px solid #e5e7eb', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4f46e5' }}>
              <div style={{ padding: '8px', background: '#e0e7ff', borderRadius: '10px' }}>
                <Activity size={18} />
              </div>
              <span style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>Performance Funnel</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
               <Calendar size={13} color="#64748b" />
               <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Past 7 Days</span>
               <ChevronDown size={14} color="#94a3b8" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Messages Level */}
            <Link to="/campaigns" style={{ textDecoration: 'none' }}>
              <div className="interactive-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(79, 70, 229, 0.08)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }}></div>
                  <div style={{ fontSize: '13px', color: '#4338ca', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sent</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#312e81' }}>{displayStats.sentMessages}</div>
              </div>
            </Link>
            
            {/* Seen Level */}
            <Link to="/campaigns" style={{ textDecoration: 'none' }}>
              <div className="interactive-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(14, 165, 233, 0.08)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(14, 165, 233, 0.1)', marginLeft: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9' }}></div>
                  <div style={{ fontSize: '13px', color: '#0369a1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Opened</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0c4a6e' }}>{displayStats.opened}</div>
              </div>
            </Link>

            {/* action Level */}
            <Link to="/campaigns" style={{ textDecoration: 'none' }}>
              <div className="interactive-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.08)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.1)', marginLeft: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                  <div style={{ fontSize: '13px', color: '#047857', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clicked</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#064e3b' }}>{displayStats.clicked}</div>
              </div>
            </Link>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f3f4f6 100%)', border: '1px solid #e5e7eb', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ec4899' }}>
               <div style={{ padding: '8px', background: '#fce7f3', borderRadius: '10px' }}>
                 <Users size={18} />
               </div>
              <span style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>Audience Growth</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative' }} onClick={() => toggleDropdown('audience')}>
               <Calendar size={13} color="#64748b" />
               <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>{getFilterText()}</span>
               <ChevronDown size={14} color="#94a3b8" />
               {activeDropdown === 'audience' && (
                 <div style={{ position: 'absolute', top: '110%', right: '0', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: '140px', overflow: 'hidden' }}>
                    <div className="profile-hover" onClick={(e) => { e.stopPropagation(); selectFilter('7d'); }} style={{ padding: '10px 14px', fontSize: '12px', fontWeight: '600', color: '#1e293b', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>Past 7 Days</div>
                    <div className="profile-hover" onClick={(e) => { e.stopPropagation(); selectFilter('30d'); }} style={{ padding: '10px 14px', fontSize: '12px', fontWeight: '600', color: '#1e293b', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>Past 30 Days</div>
                    <div className="profile-hover" onClick={(e) => { e.stopPropagation(); selectFilter('all'); }} style={{ padding: '10px 14px', fontSize: '12px', fontWeight: '600', color: '#1e293b', cursor: 'pointer' }}>All Time</div>
                 </div>
               )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* KPI Block 1 */}
            <Link to="/audiences" style={{ textDecoration: 'none' }}>
              <div className="interactive-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>
                  <Users size={16} color="#94a3b8" /> New Followers
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px', letterSpacing: '-0.5px' }}>{displayStats.newFollowers}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10b981', fontWeight: '700', background: '#d1fae5', padding: '4px 8px', borderRadius: '6px', alignSelf: 'flex-start' }}>
                  +14% <span style={{ color: '#047857', fontWeight: '600' }}>vs last period</span>
                </div>
              </div>
            </Link>
            
            {/* KPI Block 2 */}
            <Link to="/campaigns" style={{ textDecoration: 'none' }}>
              <div className="interactive-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>
                  <MessageCircle size={16} color="#94a3b8" /> Automations Fired
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px', letterSpacing: '-0.5px' }}>{displayStats.automationsFired}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10b981', fontWeight: '700', background: '#d1fae5', padding: '4px 8px', borderRadius: '6px', alignSelf: 'flex-start' }}>
                  +24% <span style={{ color: '#047857', fontWeight: '600' }}>vs last period</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
