import React, { useState } from 'react';
import { Shield, LayoutDashboard, Users, Construction } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardTab from './DashboardTab';
import UsersTab from './UsersTab';

export default function SuperAdminLayout() {
  const { user } = useAuth();
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
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '16px 24px', background: 'var(--primary)', color: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
            <Shield size={24} />
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>Super Admin</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Founder Access</div>
            </div>
          </div>

          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '12px',
                background: activeTab === tab.id ? 'var(--sidebar-bg)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? '700' : '500',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.2s', textAlign: 'left', fontSize: '0.95rem'
              }}
              onMouseOver={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = 'var(--bg-card)' }}
              onMouseOut={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent' }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-main)', borderRadius: '24px' }}>
          {renderContent()}
        </div>

      </div>
    </div>
  );
}
