import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Instagram, MessageCircle, Phone, ArrowLeft, Bot, Youtube, ArrowRight } from 'lucide-react';
import Campaigns from './Campaigns';
import YoutubeDashboard from './YoutubeDashboard';

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

  if (platformId === 'youtube') {
    return <YoutubeDashboard />;
  }

  if (platformId === 'threads') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
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
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0,0,0,0.08)', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10H12Z" />
              <path d="M12 12a4 4 0 1 0 4 4h-4Z" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>Threads Workspace</h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Manage automations specifically for Threads</p>
          </div>
        </div>

        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: '1px solid #fee2e2',
            padding: '32px',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
              Threads Not Connected
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '20px' }}>
              Your Threads account is not connected. Please connect your Threads account to manage posts and automations.
            </p>
            <button 
              onClick={() => navigate('/settings')}
              style={{
                padding: '12px 24px',
                background: '#000000',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Connect Threads
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

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
