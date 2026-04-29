import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronLeft, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Plus, 
  X, 
  Zap, 
  Smartphone,
  CheckCircle2,
  Send,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../App';
import { API_BASE_URL } from '../config';

export default function AutomationEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useNotification();
  const { user } = useAuth();
  const params = new URLSearchParams(location.search);
  const template = params.get('template');
  const channel = params.get('channel');

  // State
  const [anyStory, setAnyStory] = useState(true);
  const [anyKeyword, setAnyKeyword] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [message, setMessage] = useState('');
  const [openingMessage, setOpeningMessage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(`${template === 'stories' ? 'Story' : 'Comment'} Automation #${Math.floor(Math.random() * 1000)}`);

  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      if (!keywords.includes(keywordInput.trim())) {
        setKeywords([...keywords, keywordInput.trim()]);
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleCreate = async () => {
    if (!anyKeyword && keywords.length === 0) {
      notify('Please add at least one keyword or select "Any keyword"', 'error');
      return;
    }
    if (!message.trim()) {
      notify('Please enter a response message', 'error');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('insta_agent_token');
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name,
          trigger: anyKeyword ? '*' : keywords.join(', '),
          triggerSource: template === 'stories' ? 'story_mention' : 'comment',
          response: message,
          platform: channel || 'instagram',
          status: 'Active'
        })
      });

      if (res.ok) {
        notify('✅ Automation created successfully!', 'success');
        navigate('/campaigns');
      } else {
        const data = await res.json();
        notify(data.error || 'Failed to create automation', 'error');
      }
    } catch (err) {
      notify('Connection error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc', 
      fontFamily: "'Outfit', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Side: Preview (Fixed) */}
        <div style={{ 
          width: '450px', 
          background: '#f1f5f9', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          borderRight: '1px solid #e2e8f0',
          position: 'sticky',
          top: '0',
          height: '100vh'
        }}>
          <div style={{ color: '#64748b', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <Smartphone size={18} /> Preview Automation
          </div>
          
          {/* Phone Frame - Scaled down for better fit */}
          <div style={{ 
            width: '280px', 
            height: '580px', 
            background: '#000', 
            borderRadius: '40px', 
            border: '8px solid #1e1b4b',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)',
            transform: 'scale(0.95)'
          }}>
            {/* Realistic Notch (Dynamic Island) */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '18px',
              background: '#000',
              borderRadius: '20px',
              zIndex: 10
            }}></div>

            {/* Status Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 24px 0',
              fontSize: '0.65rem',
              color: 'white',
              fontWeight: '600'
            }}>
              <span>9:41</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <Zap size={10} fill="white" />
                <div style={{ width: '12px', height: '6px', border: '1px solid white', borderRadius: '2px' }}></div>
              </div>
            </div>

            {/* Instagram Header */}
            <div style={{ padding: '20px 20px 10px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1a1a1a' }}>
              <ArrowLeft size={18} color="white" />
              <div style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '50%', 
                background: user?.profilePhoto ? `url(${user.profilePhoto})` : '#333',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid #333'
              }}></div>
              <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700' }}>
                {user?.username || 'user_name'}
              </div>
            </div>

            {/* Chat Area */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {keywords.length > 0 && (
                <div style={{ 
                  alignSelf: 'flex-end', 
                  background: '#7c3aed', 
                  color: 'white', 
                  padding: '10px 16px', 
                  borderRadius: '18px 18px 4px 18px',
                  fontSize: '0.85rem',
                  maxWidth: '80%',
                  boxShadow: '0 4px 10px rgba(124, 58, 237, 0.3)'
                }}>
                  {keywords[0]}
                </div>
              )}
              {message && (
                <div style={{ 
                  alignSelf: 'flex-start', 
                  background: '#262626', 
                  color: 'white', 
                  padding: '10px 16px', 
                  borderRadius: '18px 18px 18px 4px',
                  fontSize: '0.85rem',
                  maxWidth: '80%'
                }}>
                  {message}
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, padding: '0 20px' }}>
              <div style={{ 
                background: '#1a1a1a', 
                borderRadius: '25px', 
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid #333'
              }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={12} color="#666" />
                </div>
                <div style={{ flex: 1, color: '#666', fontSize: '0.8rem' }}>Message...</div>
                <Send size={16} color="#666" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Configuration (Scrollable) */}
        <div 
          className="config-panel"
          style={{ 
            flex: 1, 
            background: 'white', 
            padding: '40px 60px', 
            overflowY: 'auto',
            maxHeight: '100vh'
          }}
        >
          <div style={{ maxWidth: '500px', margin: '0 0' }}>
            
            {/* Automation Name */}
            <div style={{ marginBottom: '32px' }}>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your automation..."
                style={{
                  fontSize: '1.8rem',
                  fontWeight: '800',
                  color: '#1e1b4b',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  background: 'transparent',
                  padding: 0
                }}
              />
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>Click to rename your automation</p>
            </div>

            {/* Step 1 */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#1e1b4b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>1</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1b4b' }}>{template === 'stories' ? 'Select a Story' : 'Select a Post'}</h3>
              </div>
              <div style={{ padding: '20px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontWeight: '700', color: '#475569' }}>Any {template === 'stories' ? 'story' : 'post'}</span>
                  <div 
                    onClick={() => setAnyStory(!anyStory)}
                    style={{ 
                      width: '44px', height: '24px', borderRadius: '12px', background: anyStory ? '#7c3aed' : '#cbd5e1', 
                      position: 'relative', cursor: 'pointer', transition: 'all 0.3s' 
                    }}
                  >
                    <div style={{ 
                      width: '18px', height: '18px', borderRadius: '50%', background: 'white', 
                      position: 'absolute', top: '3px', left: anyStory ? '23px' : '3px', transition: 'all 0.3s' 
                    }}></div>
                  </div>
                </div>
                {!anyStory && (
                  <div style={{ 
                    marginTop: '20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px'
                  }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} style={{ 
                        aspectRatio: template === 'stories' ? '9/16' : '1/1',
                        background: '#e2e8f0',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        border: '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                      >
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.1))' }}></div>
                        {template === 'stories' ? 'Story' : 'Post'} {i}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#1e1b4b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>2</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1b4b' }}>Setup Keywords</h3>
              </div>
              <div style={{ padding: '20px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontWeight: '700', color: '#475569' }}>Any keyword</span>
                  <div 
                    onClick={() => setAnyKeyword(!anyKeyword)}
                    style={{ 
                      width: '44px', height: '24px', borderRadius: '12px', background: anyKeyword ? '#7c3aed' : '#cbd5e1', 
                      position: 'relative', cursor: 'pointer', transition: 'all 0.3s' 
                    }}
                  >
                    <div style={{ 
                      width: '18px', height: '18px', borderRadius: '50%', background: 'white', 
                      position: 'absolute', top: '3px', left: anyKeyword ? '23px' : '3px', transition: 'all 0.3s' 
                    }}></div>
                  </div>
                </div>
                {!anyKeyword && (
                  <div>
                    <input 
                      type="text" 
                      placeholder="Type & Hit Enter"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleAddKeyword}
                      style={{ 
                        width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', 
                        outline: 'none', fontSize: '0.85rem', marginBottom: '12px' 
                      }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {keywords.map(kw => (
                        <span key={kw} style={{ background: '#7c3aed', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {kw} <X size={12} onClick={() => removeKeyword(kw)} style={{ cursor: 'pointer' }} />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#1e1b4b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>3</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1b4b' }}>Send a DM</h3>
              </div>
              <div style={{ padding: '20px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ 
                  height: '80px', border: '1px dashed #e2e8f0', borderRadius: '10px', background: 'white',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                  color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', marginBottom: '12px', transition: 'all 0.2s'
                }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7c3aed'}>
                  <ImageIcon size={20} style={{ marginBottom: '4px' }} />
                  Select Image
                </div>
                
                <textarea 
                  placeholder="Enter message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ 
                    width: '100%', height: '100px', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', 
                    outline: 'none', fontSize: '0.9rem', resize: 'none', marginBottom: '12px' 
                  }}
                ></textarea>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{message.length}/1000</div>
                   <button style={{ 
                     background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px',
                     fontSize: '0.8rem', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px'
                   }}>
                     <Plus size={14} /> Link
                   </button>
                </div>
              </div>
            </div>

            {/* Advanced Automations */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px', paddingBottom: '60px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '4px' }}>Advanced</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>Hands-free engagement.</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#475569', fontSize: '0.85rem' }}>Opening Message</span>
                <div 
                  onClick={() => setOpeningMessage(!openingMessage)}
                  style={{ 
                    width: '40px', height: '22px', borderRadius: '11px', background: openingMessage ? '#7c3aed' : '#cbd5e1', 
                    position: 'relative', cursor: 'pointer', transition: 'all 0.3s' 
                  }}
                >
                  <div style={{ 
                    width: '16px', height: '16px', borderRadius: '50%', background: 'white', 
                    position: 'absolute', top: '3px', left: openingMessage ? '21px' : '3px', transition: 'all 0.3s' 
                  }}></div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: '16px',
                background: '#7c3aed',
                color: 'white',
                border: 'none',
                fontWeight: '800',
                fontSize: '1.1rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '10px',
                boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.3)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                if (!submitting) e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                if (!submitting) e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {submitting ? <Loader2 className="animate-spin" size={24} /> : <><Zap size={24} fill="white" /> Create Automation</>}
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        .config-panel::-webkit-scrollbar {
          width: 6px;
        }
        .config-panel::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .config-panel::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .config-panel::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
