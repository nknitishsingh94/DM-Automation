import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Instagram, Facebook, MessageCircle, ArrowRight } from 'lucide-react';
import promoImg from '../assets/promo.png';

export default function ChannelSelector() {
  const navigate = useNavigate();
  const [settings, setSettings] = React.useState(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('insta_agent_token');
        const res = await fetch(`${API_BASE_URL}/api/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleChannelClick = (channelId) => {
    navigate(`/select-template?channel=${channelId}`);
  };

  const channels = [
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: <Instagram size={28} color="#E4405F" />, 
      color: '#E4405F',
      desc: 'Automate DMs, comments, and story mentions.'
    },
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: <Facebook size={28} color="#1877F2" />, 
      color: '#1877F2',
      desc: 'Manage Messenger conversations and post replies.'
    },
    { 
      id: 'whatsapp', 
      name: 'WhatsApp', 
      icon: <MessageCircle size={28} color="#25D366" />, 
      color: '#25D366',
      desc: 'Scale your reach with official WhatsApp Cloud API.'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      background: 'white',
      fontFamily: "'Outfit', sans-serif" 
    }}>
      {/* Left Content */}
      <div style={{ 
        flex: 1, 
        padding: '60px 80px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center' 
      }}>
        <div style={{ maxWidth: '500px' }}>
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: '800', 
            lineHeight: '1.1', 
            marginBottom: '16px',
            color: '#1e1b4b' 
          }}>
            Let's <span style={{ color: '#7c3aed' }}>Kick</span><br />
            Things <span style={{ color: '#7c3aed' }}>Off!</span>
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#64748b', 
            marginBottom: '48px',
            lineHeight: '1.5'
          }}>
            Start with any channel you like —<br />
            you can connect more later.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelClick(channel.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '20px 24px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'left',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = channel.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${channel.color}10`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {channel.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e1b4b' }}>{channel.name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{channel.desc}</div>
                </div>
                <ArrowRight size={20} color="#94a3b8" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Image */}
      <div style={{ 
        flex: 1, 
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          width: '80%',
          height: '80%',
          background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
          borderRadius: '40px',
          transform: 'rotate(-5deg)',
          opacity: 0.05
        }}></div>
        <img 
          src={promoImg} 
          alt="Kick Things Off" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            zIndex: 1
          }} 
        />
      </div>
    </div>
  );
}
