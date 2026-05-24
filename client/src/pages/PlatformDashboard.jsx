import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Instagram, MessageCircle, Phone, ArrowLeft, Bot } from 'lucide-react';
import Campaigns from './Campaigns';

const PlatformDashboard = () => {
  const { platformId } = useParams();
  const navigate = useNavigate();

  const getPlatformDetails = () => {
    switch (platformId) {
      case 'instagram':
        return { name: 'Instagram', icon: <Instagram size={28} />, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' };
      case 'facebook':
        return { name: 'Facebook Messenger', icon: <MessageCircle size={28} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
      case 'whatsapp':
        return { name: 'WhatsApp', icon: <Phone size={28} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      default:
        return { name: 'AI Studio', icon: <Bot size={28} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
    }
  };

  const details = getPlatformDetails();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      
      {/* Platform Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => navigate('/hub')}
          style={{ 
            background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '10px', 
            cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          <ArrowLeft size={20} />
        </button>
        
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: details.bg, color: details.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {details.icon}
        </div>
        
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>{details.name} Workspace</h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Manage automations specifically for {details.name}</p>
        </div>
      </div>

      {/* Embedded Campaigns Dashboard */}
      <div style={{ flex: 1 }}>
        <Campaigns platformFilter={platformId} />
      </div>

    </div>
  );
};

export default PlatformDashboard;
