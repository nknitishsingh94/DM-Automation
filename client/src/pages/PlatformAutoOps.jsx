import React, { useState, useEffect } from 'react';
import { MessageCircle, Settings, Layers, Megaphone, Plus, LayoutTemplate, List, Phone, ExternalLink, Send, MessageSquare } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function PlatformAutoOps() {
  const navigate = useNavigate();
  const { platform } = useParams();
  const [activeTab, setActiveTab] = useState('flows');

  const platformConfig = {
    whatsapp: {
      name: 'WhatsApp',
      icon: MessageCircle,
      primaryColor: '#10b981',
      darkColor: '#059669',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      lightBg: '#ecfdf5',
      features: ['flows', 'templates', 'broadcasts', 'interactive']
    },
    telegram: {
      name: 'Telegram',
      icon: Send,
      primaryColor: '#3b82f6',
      darkColor: '#2563eb',
      bgGradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
      lightBg: '#eff6ff',
      features: ['flows', 'broadcasts']
    },
    discord: {
      name: 'Discord',
      icon: MessageSquare,
      primaryColor: '#8b5cf6',
      darkColor: '#6d28d9',
      bgGradient: 'linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%)',
      lightBg: '#f5f3ff',
      features: ['flows', 'broadcasts']
    }
  };

  const currentPlatform = platformConfig[platform] || platformConfig['whatsapp'];
  const PlatformIcon = currentPlatform.icon;

  useEffect(() => {
    if (!currentPlatform.features.includes(activeTab)) {
      setActiveTab('flows');
    }
  }, [platform, activeTab, currentPlatform.features]);

  const allTabs = [
    { id: 'flows', label: 'Keyword Flows', icon: Layers, desc: 'Auto-reply to specific keywords' },
    { id: 'templates', label: 'Message Templates', icon: LayoutTemplate, desc: 'Pre-approved 24h messages' },
    { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone, desc: 'Bulk messaging campaigns' },
    { id: 'interactive', label: 'Interactive Builder', icon: List, desc: 'Buttons & List messages' }
  ];

  const visibleTabs = allTabs.filter(tab => currentPlatform.features.includes(tab.id));

  return (
    <div style={{
      padding: '32px',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '100vh',
      background: 'var(--bg-card)',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      {/* Header Section */}
      <div style={{
        background: currentPlatform.bgGradient,
        borderRadius: '24px',
        padding: '40px',
        color: 'white',
        marginBottom: '32px',
        boxShadow: `0 20px 25px -5px ${currentPlatform.primaryColor}33, 0 10px 10px -5px ${currentPlatform.primaryColor}1a`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.4s ease'
      }}>
        {/* Background decorative circles */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-80px', right: '100px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlatformIcon size={32} color={currentPlatform.darkColor} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>{currentPlatform.name} AutoOps</h1>
              <span style={{ fontSize: '1rem', opacity: 0.9, fontWeight: '500' }}>Dedicated automation suite for {currentPlatform.name}</span>
            </div>
          </div>
          <p style={{ margin: '16px 0 0 0', maxWidth: '600px', fontSize: '1.05rem', lineHeight: '1.6', opacity: 0.85 }}>
            Build powerful conversation flows and send bulk broadcasts directly to your {currentPlatform.name} audience.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button style={{
            background: 'var(--bg-card)', color: currentPlatform.darkColor, border: 'none', padding: '14px 24px',
            borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
          onClick={() => navigate('/automation-editor')}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <Plus size={20} /> Create New Flow
          </button>
          <button style={{
            background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)',
            padding: '12px 24px', borderRadius: '12px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', backdropFilter: 'blur(10px)'
          }}
          onClick={() => navigate('/connections')}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
            <Settings size={18} /> API Settings
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
        
        {/* Sidebar Navigation for Platform AutoOps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '12px' }}>
            Modules
          </h3>
          {visibleTabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
                border: `1px solid ${activeTab === tab.id ? 'var(--border-subtle)' : 'transparent'}`,
                boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: activeTab === tab.id ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseOver={e => {
                if (activeTab !== tab.id) e.currentTarget.style.background = 'var(--bg-dark)';
              }}
              onMouseOut={e => {
                if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ 
                background: activeTab === tab.id ? currentPlatform.lightBg : 'var(--sidebar-bg)', 
                color: activeTab === tab.id ? currentPlatform.primaryColor : 'var(--text-muted)',
                padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s'
              }}>
                <tab.icon size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '1rem', fontWeight: '700', color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {tab.label}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {tab.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ 
          background: 'var(--bg-card)', 
          borderRadius: '24px', 
          border: '1px solid var(--border-subtle)', 
          padding: '40px',
          minHeight: '500px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
        }}>
          
          {activeTab === 'flows' && (
            <div className="tab-pane animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0' }}>Keyword Flows</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Create automated responses triggered by specific keywords sent by users on {currentPlatform.name}.</p>
                </div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--sidebar-bg)', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                <Layers size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>No {currentPlatform.name} Flows Yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
                  Set up your first automation rule. For example, when someone says "Pricing", send them your rate card.
                </p>
                <button 
                  onClick={() => navigate('/automation-editor')}
                  style={{ background: currentPlatform.primaryColor, color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} /> Create Workflow
                </button>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="tab-pane animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0' }}>Message Templates</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Draft and submit templates to Meta for approval. Required to message users after 24 hours.</p>
                </div>
                <button style={{ background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', padding: '10px 16px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ExternalLink size={16} /> Sync from Meta
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '24px', border: '1px solid var(--border-subtle)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px' }}>APPROVED</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Marketing</span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>welcome_offer_01</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', background: 'var(--sidebar-bg)', padding: '12px', borderRadius: '8px', lineHeight: '1.5' }}>
                    Hi {'{{1}}'}! 👋 Welcome to Smart100X. Use code {'{{2}}'} to get 20% off your first purchase!
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button style={{ flex: 1, padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#3b82f6', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>Use in Flow</button>
                    <button style={{ flex: 1, padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>Edit</button>
                  </div>
                </div>
                
                <div 
                  onClick={() => alert('WhatsApp Template Editor coming soon. For now, please create templates directly in Meta Business Manager.')}
                  style={{ padding: '24px', border: '2px dashed #cbd5e1', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'var(--sidebar-bg)', cursor: 'pointer', transition: 'border-color 0.2s' }} 
                  onMouseOver={e => e.currentTarget.style.borderColor = currentPlatform.primaryColor} 
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                  <div style={{ width: '48px', height: '48px', background: 'var(--bg-card)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <Plus size={24} color={currentPlatform.primaryColor} />
                  </div>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Create New Template</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'broadcasts' && (
            <div className="tab-pane animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0' }}>Bulk Broadcasts</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Send mass campaigns to your uploaded audience lists.</p>
                </div>
                <button 
                  onClick={() => navigate('/broadcasts')}
                  style={{ background: currentPlatform.primaryColor, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Megaphone size={16} /> New Broadcast
                </button>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '16px', padding: '16px 24px', background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border-subtle)', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  <div>Campaign Name</div>
                  <div>Audience</div>
                  <div>Status</div>
                  <div>Sent Date</div>
                </div>
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  No previous broadcast history found. Start your first campaign!
                </div>
              </div>
            </div>
          )}

          {activeTab === 'interactive' && (
            <div className="tab-pane animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0' }}>Interactive Builder</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Design rich interactive messages with reply buttons and selection lists.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '32px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = currentPlatform.primaryColor} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                      <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '12px' }}>
                        <Phone size={24} color="#3b82f6" />
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>Quick Reply Buttons</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Send up to 3 buttons for users to click.</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = currentPlatform.primaryColor} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                      <div style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: '12px' }}>
                        <List size={24} color="#8b5cf6" />
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>List Messages</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Send a menu with up to 10 options.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Phone Frame */}
                <div style={{ width: '300px', flexShrink: 0, background: 'var(--border-subtle)', padding: '12px', borderRadius: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <div style={{ background: '#ece5dd', height: '500px', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <div style={{ background: '#075e54', color: 'white', padding: '16px 12px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', background: 'var(--bg-card)', borderRadius: '50%' }}></div>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Your Business</div>
                    </div>
                    
                    <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '0 12px 12px 12px', fontSize: '0.9rem', color: 'var(--text-main)', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', maxWidth: '85%' }}>
                        Please choose an option below:
                        <div style={{ height: '1px', background: '#eee', margin: '8px 0' }}></div>
                        <div style={{ color: '#0ea5e9', fontWeight: '600', textAlign: 'center', padding: '4px 0' }}>View Products</div>
                        <div style={{ height: '1px', background: '#eee', margin: '8px 0' }}></div>
                        <div style={{ color: '#0ea5e9', fontWeight: '600', textAlign: 'center', padding: '4px 0' }}>Contact Support</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
