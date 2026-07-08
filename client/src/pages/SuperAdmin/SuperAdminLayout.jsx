import React from 'react';
import { Construction } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardTab from './DashboardTab';
import UsersTab from './UsersTab';
import WorkspacesTab from './WorkspacesTab';
import SubscriptionsTab from './SubscriptionsTab';
import SocialAccountsTab from './SocialAccountsTab';
import AutomationsTab from './AutomationsTab';
import ScheduledPostsTab from './ScheduledPostsTab';
import SupportTab from './SupportTab';
import AIUsageTab from './AIUsageTab';
import PaymentsTab from './PaymentsTab';
import PlatformSettingsTab from './PlatformSettingsTab';
import AnalyticsTab from './AnalyticsTab';

export default function SuperAdminLayout() {
  const { user } = useAuth();
  const { tab } = useParams();

  // Extra security: Kick out anyone who isn't the founder even if they guess the URL
  if (user?.email !== 'nknitishsingh94@gmail.com') {
    return <Navigate to="/dashboard" replace />;
  }

  const activeTab = tab || 'dashboard';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'users':
        return <UsersTab />;
      case 'workspaces':
        return <WorkspacesTab />;
      case 'subscriptions':
        return <SubscriptionsTab />;
      case 'social-accounts':
        return <SocialAccountsTab />;
      case 'automations':
        return <AutomationsTab />;
      case 'scheduled-posts':
        return <ScheduledPostsTab />;
      case 'support':
        return <SupportTab />;
      case 'ai-usage':
        return <AIUsageTab />;
      case 'payments':
        return <PaymentsTab />;
      case 'platform-settings':
        return <PlatformSettingsTab />;
      case 'analytics':
        return <AnalyticsTab />;
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
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', height: '100%' }}>
      {renderContent()}
    </div>
  );
}
