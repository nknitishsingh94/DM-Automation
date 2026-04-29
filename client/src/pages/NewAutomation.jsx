import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Sparkles, X } from 'lucide-react';

export default function NewAutomation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [automationName, setAutomationName] = useState('');
  
  const params = new URLSearchParams(location.search);
  const channel = params.get('channel');
  const template = params.get('template');

  const handleCreate = () => {
    if (!automationName.trim()) return;
    // Navigate to the final builder with the name and other data
    navigate(`/campaign-builder/new?channel=${channel}&template=${template}&name=${encodeURIComponent(automationName)}`);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '600px', 
        background: 'white', 
        padding: '48px', 
        borderRadius: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
        border: '1px solid #f1f5f9',
        position: 'relative'
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ 
            position: 'absolute', 
            top: '32px', 
            right: '32px', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            color: '#94a3b8'
          }}
        >
          <X size={24} />
        </button>

        <div style={{ 
          width: '64px', 
          height: '64px', 
          background: '#f5f3ff', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <Sparkles size={32} color="#7c3aed" />
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '8px' }}>
          New Automation
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '40px' }}>
          Give your automation a recognizable name to keep your workspace organized.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ position: 'relative' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.9rem', 
              fontWeight: '700', 
              color: '#475569', 
              marginBottom: '10px' 
            }}>
              Automation Name
            </label>
            <input 
              type="text" 
              placeholder="Name your Automation"
              value={automationName}
              onChange={(e) => setAutomationName(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '18px 24px', 
                background: '#f8fafc', 
                border: '2px solid #f1f5f9', 
                borderRadius: '16px',
                fontSize: '1.1rem',
                outline: 'none',
                transition: 'all 0.2s',
                color: '#1e1b4b'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#7c3aed';
                e.target.style.background = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#f1f5f9';
                e.target.style.background = '#f8fafc';
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              onClick={handleCreate}
              disabled={!automationName.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 36px',
                borderRadius: '14px',
                background: automationName.trim() ? '#1e293b' : '#cbd5e1',
                color: 'white',
                border: 'none',
                cursor: automationName.trim() ? 'pointer' : 'not-allowed',
                fontWeight: '800',
                fontSize: '1.1rem',
                transition: 'all 0.3s',
                boxShadow: automationName.trim() ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (automationName.trim()) e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                if (automationName.trim()) e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Create Automation <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
