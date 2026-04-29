import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, ShoppingBag, Store, Building2, ArrowRight } from 'lucide-react';
import promoImg from '../assets/promo.png';

export default function PersonaSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPersona, setSelectedPersona] = useState('');

  const personas = [
    { 
      id: 'creator', 
      name: 'Creator', 
      icon: <Camera size={28} />, 
      color: '#ec4899',
      desc: 'Influencers and content creators looking to grow their audience.'
    },
    { 
      id: 'ecommerce', 
      name: 'E-commerce', 
      icon: <ShoppingBag size={28} />, 
      color: '#3b82f6',
      desc: 'Online stores focused on driving sales and managing orders.'
    },
    { 
      id: 'local_business', 
      name: 'Local Business', 
      icon: <Store size={28} />, 
      color: '#10b981',
      desc: 'Physical shops wanting to connect with local customers.'
    },
    { 
      id: 'agency', 
      name: 'Agency', 
      icon: <Building2 size={28} />, 
      color: '#f59e0b',
      desc: 'Professional teams managing multiple client accounts.'
    }
  ];

  const handleNext = () => {
    if (!selectedPersona) return;
    const params = new URLSearchParams(location.search);
    const channel = params.get('channel');
    navigate(`/campaign-builder/new?channel=${channel}&persona=${selectedPersona}`);
  };

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
        <div style={{ maxWidth: '550px' }}>
          <h1 style={{ 
            fontSize: '3.2rem', 
            fontWeight: '800', 
            lineHeight: '1.1', 
            marginBottom: '16px',
            color: '#1e1b4b' 
          }}>
            What <span style={{ color: '#7c3aed' }}>best</span><br />
            describes <span style={{ color: '#7c3aed' }}>you?</span>
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#64748b', 
            marginBottom: '48px'
          }}>
            Select your professional profile to unlock<br />
            tailored automation features.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {personas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '24px',
                  borderRadius: '16px',
                  border: `2px solid ${selectedPersona === persona.id ? '#7c3aed' : '#f1f5f9'}`,
                  background: selectedPersona === persona.id ? '#f5f3ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textAlign: 'left',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (selectedPersona !== persona.id) {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPersona !== persona.id) {
                    e.currentTarget.style.borderColor = '#f1f5f9';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <div style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${persona.color}15`,
                  color: persona.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {persona.icon}
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e1b4b' }}>{persona.name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>{persona.desc}</div>
                </div>
                {selectedPersona === persona.id && (
                  <div style={{
                    position: 'absolute',
                    right: '24px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={!selectedPersona}
            style={{
              marginTop: '48px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '18px 48px',
              borderRadius: '16px',
              background: selectedPersona ? '#1e293b' : '#cbd5e1',
              color: 'white',
              border: 'none',
              cursor: selectedPersona ? 'pointer' : 'not-allowed',
              fontWeight: '800',
              fontSize: '1.1rem',
              transition: 'all 0.3s',
              boxShadow: selectedPersona ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            Continue <ArrowRight size={20} />
          </button>
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
        <img 
          src={promoImg} 
          alt="Onboarding" 
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
