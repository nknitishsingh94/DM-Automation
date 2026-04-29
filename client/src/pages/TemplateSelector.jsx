import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, MessageSquare, Instagram, Zap, Sparkles, X } from 'lucide-react';

export default function TemplateSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const channel = params.get('channel');

  const templates = [
    {
      id: 'faqs',
      title: 'Answer all your FAQs',
      desc: 'AI will reply to questions you get asked all the time',
      tags: ['Instant', 'AI'],
      isBeta: true
    },
    {
      id: 'comments',
      title: 'DM from Comments',
      desc: 'Send links instantly when people comment on your post or reel',
      tags: ['Instant']
    },
    {
      id: 'stories',
      title: 'DM from Stories',
      desc: 'Send links instantly when users react or reply to your Stories',
      tags: ['Instant']
    },
    {
      id: 'all_dms',
      title: 'Respond to all DMs',
      desc: 'Auto-send customized replies when people DM you',
      tags: ['Instant']
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f1f5f9', 
      padding: '40px 20px',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px' 
        }}>
          <button 
            onClick={() => navigate('/select-channel')}
            style={{ 
              background: 'white', 
              border: '1px solid #e2e8f0', 
              padding: '8px', 
              borderRadius: '8px', 
              cursor: 'pointer' 
            }}
          >
            <X size={20} color="#64748b" />
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '24px' 
        }}>
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => {
                if (template.id === 'faqs') {
                  navigate('/ai-studio');
                } else {
                  navigate(`/automation-editor?channel=${channel}&template=${template.id}`);
                }
              }}
              style={{
                background: 'white',
                padding: '32px',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#7c3aed';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {template.tags.map(tag => (
                  <span key={tag} style={{ 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    textTransform: 'uppercase', 
                    padding: '4px 10px', 
                    borderRadius: '6px',
                    background: tag === 'Instant' ? '#f1f5f9' : '#f5f3ff',
                    color: tag === 'Instant' ? '#64748b' : '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {tag === 'Instant' ? <Zap size={10} /> : <Sparkles size={10} />}
                    {tag}
                  </span>
                ))}
                {template.isBeta && (
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    background: '#dcfce7', 
                    color: '#166534', 
                    padding: '4px 10px', 
                    borderRadius: '6px',
                    marginLeft: 'auto'
                  }}>BETA</span>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '8px' }}>
                  {template.title}
                </h3>
                <p style={{ color: '#64748b', lineHeight: '1.5', fontSize: '1rem' }}>
                  {template.desc}
                </p>
              </div>

              <div style={{ 
                marginTop: 'auto', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                color: '#7c3aed', 
                fontWeight: '700',
                fontSize: '0.9rem' 
              }}>
                Setup Automation <Zap size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
