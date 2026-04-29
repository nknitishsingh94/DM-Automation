import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Camera, 
  ShoppingBag, 
  Store, 
  Building2, 
  MousePointer2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Database, 
  MessageSquareQuote,
  ArrowRight 
} from 'lucide-react';
import promoImg from '../assets/promo.png';

export default function OnboardingStep2() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPersona, setSelectedPersona] = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [showError, setShowError] = useState(false);

  const personas = [
    { id: 'creator', name: 'Creator', icon: <Camera size={20} /> },
    { id: 'ecommerce', name: 'E-commerce', icon: <ShoppingBag size={20} /> },
    { id: 'local_business', name: 'Local business', icon: <Store size={20} /> },
    { id: 'agency', name: 'Agency', icon: <Building2 size={20} /> }
  ];

  const goals = [
    { id: 'clicks', name: 'More Clicks', icon: <MousePointer2 size={20} /> },
    { id: 'engagement', name: 'Boost Engagement', icon: <TrendingUp size={20} /> },
    { id: 'followers', name: 'Gain Followers', icon: <Users size={20} /> },
    { id: 'sales', name: 'Drive Sales', icon: <DollarSign size={20} /> },
    { id: 'data', name: 'Collect Data', icon: <Database size={20} /> },
    { id: 'faqs', name: 'Answer FAQs', icon: <MessageSquareQuote size={20} /> }
  ];

  const toggleGoal = (id) => {
    if (selectedGoals.includes(id)) {
      setSelectedGoals(selectedGoals.filter(g => g !== id));
    } else {
      setSelectedGoals([...selectedGoals, id]);
    }
    setShowError(false);
  };

  const handleNext = () => {
    if (selectedGoals.length === 0) {
      setShowError(true);
      return;
    }
    // Navigate to builder with all collected data
    const params = new URLSearchParams(location.search);
    const channel = params.get('channel');
    navigate(`/campaign-builder/new?channel=${channel}&persona=${selectedPersona}&goals=${selectedGoals.join(',')}`);
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
        padding: '40px 80px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center' 
      }}>
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '800', 
            lineHeight: '1.1', 
            marginBottom: '12px',
            color: '#1e1b4b' 
          }}>
            What <span style={{ color: '#7c3aed' }}>best</span><br />
            describes <span style={{ color: '#7c3aed' }}>you?</span>
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#64748b', 
            marginBottom: '40px'
          }}>
            Tell us a little about yourself, so we can<br />
            personalize your experience.
          </p>

          {/* Persona Selection */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px',
            marginBottom: '32px'
          }}>
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: `2px solid ${selectedPersona === p.id ? '#7c3aed' : '#f1f5f9'}`,
                  background: selectedPersona === p.id ? '#f5f3ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: selectedPersona === p.id ? '#7c3aed' : '#64748b',
                  fontWeight: '700',
                  fontSize: '1rem',
                  textAlign: 'left'
                }}
              >
                <div style={{ color: selectedPersona === p.id ? '#7c3aed' : '#94a3b8' }}>{p.icon}</div>
                {p.name}
              </button>
            ))}
          </div>

          <div style={{ height: '1px', background: '#f1f5f9', marginBottom: '32px' }}></div>

          {/* Goal Selection */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px',
            marginBottom: '12px'
          }}>
            {goals.map((g) => (
              <button
                key={g.id}
                onClick={() => toggleGoal(g.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: `2px solid ${selectedGoals.includes(g.id) ? '#7c3aed' : '#f1f5f9'}`,
                  background: selectedGoals.includes(g.id) ? '#f5f3ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: selectedGoals.includes(g.id) ? '#7c3aed' : '#64748b',
                  fontWeight: '700',
                  fontSize: '1rem',
                  textAlign: 'left'
                }}
              >
                <div style={{ color: selectedGoals.includes(g.id) ? '#7c3aed' : '#94a3b8' }}>{g.icon}</div>
                {g.name}
              </button>
            ))}
          </div>

          {showError && (
            <p style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '700', marginBottom: '24px' }}>
              Select at least one goal
            </p>
          )}

          <button
            onClick={handleNext}
            style={{
              marginTop: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 32px',
              borderRadius: '12px',
              background: '#1e293b',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: '1.1rem',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#0f172a'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#1e293b'}
          >
            Next <ArrowRight size={20} />
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
