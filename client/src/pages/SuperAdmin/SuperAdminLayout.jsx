import React, { useState } from 'react';
import { Shield, LayoutDashboard, Users, Construction, ArrowLeft } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardTab from './DashboardTab';
import UsersTab from './UsersTab';

export default function SuperAdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Extra security: Kick out anyone who isn't the founder even if they guess the URL
  if (user?.email !== 'nknitishsingh94@gmail.com') {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
    { id: 'workspaces', label: 'Workspaces', icon: <Construction size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'users':
        return <UsersTab />;
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <Construction size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Module Under Construction</h3>
            <p>This section is planned for Phase 2/3.</p>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-main)' }}>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '24px', gap: '32px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* Admin Sidebar */}
        <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ 
            padding: '20px 24px', 
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
            color: 'white', 
            borderRadius: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            marginBottom: '24px', 
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)' 
          }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
              <Shield size={24} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Founder</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85, fontWeight: '500' }}>Super Admin Panel</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 20px', borderRadius: '16px',
                    background: isActive ? 'var(--bg-card)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: isActive ? '700' : '600',
                    border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    boxShadow: isActive ? '0 4px 15px rgba(0,0,0,0.02)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    textAlign: 'left', 
                    fontSize: '0.95rem'
                  }}
                  onMouseOver={(e) => { 
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                      e.currentTarget.style.color = 'var(--text-main)';
                    }
                  }}
                  onMouseOut={(e) => { 
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <div style={{ 
                    color: isActive ? 'var(--primary)' : 'inherit',
                    transition: 'transform 0.2s',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    {tab.icon}
                  </div>
                  {tab.label}
                  {isActive && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 20px', borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.05)',
                color: '#ef4444',
                fontWeight: '600',
                border: '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.3s', 
                textAlign: 'left', 
                fontSize: '0.95rem',
                width: '100%'
              }}
              onMouseOver={(e) => { 
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseOut={(e) => { 
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
              }}
            >
              <ArrowLeft size={18} />
              Exit to OneView
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-main)', borderRadius: '24px', paddingBottom: '40px' }}>
          {renderContent()}
        </div>

      </div>
    </div>
  );
}
