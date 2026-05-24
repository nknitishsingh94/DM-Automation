import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronLeft,
  Smartphone,
  Pencil,
  Zap,
  Send,
  Link as LinkIcon,
  Trash2,
  X,
  Globe,
  Settings,
  Sparkles,
  MessageCircle,
  Crown,
  Brain
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../App';
import { API_BASE_URL } from '../config';

export default function DmAutomationEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useNotification();
  const { user } = useAuth();
  const params = new URLSearchParams(location.search);
  const channel = params.get('channel') || 'instagram';
  const template = params.get('template') || 'all_dms';

  // State
  const [selectedPlatform, setSelectedPlatform] = useState(channel);
  const [anyKeyword, setAnyKeyword] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [message, setMessage] = useState('');
  const [openingMessage, setOpeningMessage] = useState(false);
  const [openingMessageText, setOpeningMessageText] = useState("Hey there! Thanks for your interest. 👇");
  const [openingMessageButton, setOpeningMessageButton] = useState("Send me the link!");
  const [requireFollow, setRequireFollow] = useState(true);
  const [unfollowedMessage, setUnfollowedMessage] = useState("Hey! To get the link, please follow our page first! 😊");
  const [publicReplyText, setPublicReplyText] = useState("Check your DMs! 🚀 I've sent you the info.");
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(`${template === 'stories' ? 'Story' : 'DM'} Automation #${Math.floor(Math.random() * 1000)}`);
  const [connectedSettings, setConnectedSettings] = useState(null);
  const [buttons, setButtons] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState(null);
  const [tempLinkTitle, setTempLinkTitle] = useState('');
  const [tempLinkUrl, setTempLinkUrl] = useState('https://');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isAI, setIsAI] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('insta_agent_token');
        const res = await fetch(`${API_BASE_URL}/api/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setConnectedSettings(data);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    fetchSettings();
  }, []);

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

  const openAddLinkModal = () => {
    setEditingLinkIndex(null);
    setTempLinkTitle('');
    setTempLinkUrl('https://');
    setShowLinkModal(true);
  };

  const handleSaveLink = () => {
    if (!tempLinkTitle.trim() || !tempLinkUrl.trim()) {
      notify('Please enter both title and link', 'error');
      return;
    }
    if (!isValidUrl(tempLinkUrl)) {
      notify('Please enter a valid URL', 'error');
      return;
    }

    if (editingLinkIndex !== null) {
      const newButtons = [...buttons];
      newButtons[editingLinkIndex] = { text: tempLinkTitle, url: tempLinkUrl };
      setButtons(newButtons);
    } else {
      if (buttons.length >= 3) {
        notify('Maximum 3 links allowed', 'error');
        return;
      }
      setButtons([...buttons, { text: tempLinkTitle, url: tempLinkUrl }]);
    }
    setShowLinkModal(false);
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
          response: message,
          buttons: buttons,
          postId: '',
          isAnyPost: true,
          platform: selectedPlatform,
          requireFollow: requireFollow,
          unfollowedResponse: unfollowedMessage,
          openingMessage: openingMessage,
          openingMessageText: openingMessageText,
          openingMessageButton: openingMessageButton,
          triggerOnDms: true,
          triggerOnComments: false,
          triggerOnStories: false,
          publicReplyText: publicReplyText,
          isAI: isAI,
          status: 'Active'
        })
      });

      if (res.ok) {
        notify('âœ… Automation created successfully!', 'success');
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

      <div className="editor-layout">
        {/* Left Side: Preview */}
        <div className="editor-preview" style={{ background: '#f8fafc' }}>
          <div style={{ color: '#64748b', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <Smartphone size={18} /> Preview Automation
          </div>
          
          {/* iPhone Mockup */}
          <div style={{ 
            width: '340px', 
            height: '680px', 
            background: '#000', 
            borderRadius: '40px', 
            border: '8px solid #1e1b4b',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)',
            transform: 'scale(1)',
            margin: '0 auto',
            flexShrink: 0
          }}>
             <div style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '18px', background: '#000', borderRadius: '20px', zIndex: 10 }}></div>
             
             <div style={{ height: '100%', background: '#000', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ padding: '30px 20px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ChevronLeft size={20} color="white" />
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: '800', color: 'white' }}>
                    {(connectedSettings?.connectedInstagramName || user?.username || 'IG').substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: '700' }}>
                    {connectedSettings?.connectedInstagramName || user?.username || 'Instagram Account'}
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflowY: 'auto' }}>
                   {(!anyKeyword && keywords.length === 0 && !message) ? (
                     <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)', marginBottom: '16px' }}>
                           <Zap size={30} color="white" fill="white" />
                        </div>
                        <div style={{ color: 'white', fontWeight: '800', fontSize: '0.8rem', opacity: 0.5 }}>Previewing...</div>
                     </div>
                   ) : (
                     <>
                        {/* Trigger Message */}
                        <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: '#0095f6', color: 'white', padding: '8px 12px', borderRadius: '14px 14px 2px 14px', fontSize: '0.75rem' }}>
                           {anyKeyword ? 'hi' : (keywords[0] || 'hi')}
                        </div>

                        {/* Opening Message (Step 1) */}
                        {openingMessage && (
                           <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                              <div style={{ background: '#262626', borderRadius: '14px 14px 14px 2px', overflow: 'hidden' }}>
                                 <div style={{ padding: '10px 12px', borderBottom: '1px solid #333' }}>
                                    <div style={{ color: 'white', fontSize: '0.75rem', lineHeight: '1.4' }}>{openingMessageText}</div>
                                 </div>
                                  <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'center' }}>
                                     <div style={{ 
                                       background: 'rgba(59, 130, 246, 0.12)', 
                                       color: '#3b82f6', 
                                       padding: '6px 16px', 
                                       borderRadius: '16px', 
                                       fontSize: '0.72rem', 
                                       fontWeight: '800',
                                       display: 'inline-block',
                                       textAlign: 'center',
                                       maxWidth: '85%',
                                       overflow: 'hidden',
                                       textOverflow: 'ellipsis',
                                       whiteSpace: 'nowrap'
                                     }}>
                                        {openingMessageButton}
                                     </div>
                                  </div>
                              </div>
                           </div>
                        )}

                        {/* User Clicks Button (Visual Hint) */}
                        {openingMessage && (
                           <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: '#0095f6', color: 'white', padding: '8px 12px', borderRadius: '14px 14px 2px 14px', fontSize: '0.75rem' }}>
                              {openingMessageButton}
                           </div>
                        )}

                        {/* Final Response (Step 2) */}
                        {isAI ? (
                            <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                               <div style={{ 
                                  background: 'linear-gradient(135deg, #1e1b4b, #2e1065)', 
                                  border: '1.5px solid #c084fc',
                                  borderRadius: '14px 14px 14px 2px', 
                                  overflow: 'hidden',
                                  boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)'
                               }}>
                                  <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: buttons.length > 0 ? '1px solid rgba(192, 132, 252, 0.2)' : 'none' }}>
                                     <Sparkles size={12} color="#c084fc" className="animate-pulse" />
                                     <span style={{ color: '#c084fc', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Neural Reply</span>
                                  </div>
                                  <div style={{ padding: '10px 12px', color: 'white', fontSize: '0.75rem', lineHeight: '1.4' }}>
                                     {message && message !== "[AI Agent will generate a custom neural reply here]" ? message : "Generates premium custom response using your custom business AI knowledge base profile..."}
                                  </div>
                                  <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', borderTop: buttons.length > 0 ? '1px solid rgba(192, 132, 252, 0.2)' : 'none' }}>
                                     {buttons.map((btn, idx) => (
                                        <div key={idx} style={{ 
                                          background: 'rgba(192, 132, 252, 0.15)', 
                                          color: '#c084fc', 
                                          padding: '6px 16px', 
                                          borderRadius: '16px', 
                                          fontSize: '0.7rem', 
                                          fontWeight: '800',
                                          textAlign: 'center',
                                          width: 'fit-content',
                                          maxWidth: '90%',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}>
                                           {btn.text}
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         ) : message && (
                           <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                              <div style={{ background: '#262626', borderRadius: '14px 14px 14px 2px', overflow: 'hidden' }}>
                                 <div style={{ padding: '10px 12px', borderBottom: buttons.length > 0 ? '1px solid #333' : 'none' }}>
                                    <div style={{ color: 'white', fontSize: '0.75rem', lineHeight: '1.4' }}>{message}</div>
                                 </div>
                                  <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', borderTop: buttons.length > 0 ? '1px solid #333' : 'none' }}>
                                     {buttons.map((btn, idx) => (
                                        <div key={idx} style={{ 
                                          background: 'rgba(59, 130, 246, 0.12)', 
                                          color: '#3b82f6', 
                                          padding: '6px 16px', 
                                          borderRadius: '16px', 
                                          fontSize: '0.7rem', 
                                          fontWeight: '800',
                                          textAlign: 'center',
                                          width: 'fit-content',
                                          maxWidth: '90%',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}>
                                           {btn.text}
                                        </div>
                                     ))}
                                  </div>
                              </div>
                           </div>
                        )}
                     </>
                   )}
                </div>

                <div style={{ padding: '12px 16px 20px', display: 'flex', gap: '10px', borderTop: '1px solid #1a1a1a' }}>
                   <div style={{ flex: 1, height: '34px', background: '#1a1a1a', borderRadius: '17px', border: '1px solid #333' }}></div>
                   <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#1a1a1a', border: '1px solid #333' }}></div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Side: Configuration */}
        <div className="editor-config" style={{ 
           background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
           position: 'relative',
           boxSizing: 'border-box',
           display: 'flex', 
           flexDirection: 'column', 
           gap: '24px'
         }}>
           
           {/* Vertical Flow Line */}
           <div style={{ 
             position: 'absolute', 
             top: '120px', 
             left: '80px', 
             width: '2px', 
             height: 'calc(100% - 300px)', 
             background: 'linear-gradient(to bottom, #10b981, #7c3aed, #3b82f6, #7c3aed)', 
             opacity: 0.2,
             zIndex: 0
           }}></div>

           {/* Section -1: Navigation & Name */}
           <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '10px', position: 'relative', zIndex: 1 }}>
              <button 
                onClick={() => navigate(-1)} 
                onMouseEnter={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.transform = 'translateX(-4px)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.transform = 'translateX(0)'; }}
                style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '12px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
              >
                 <ArrowLeft size={22} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Automation Name"
                      style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e1b4b', border: 'none', outline: 'none', background: 'transparent', padding: 0, width: 'auto', letterSpacing: '-0.02em' }} 
                    />
                    <div style={{ position: 'absolute', bottom: -4, left: 0, width: '40px', height: '3px', background: '#7c3aed', borderRadius: '2px' }}></div>
                 </div>
                 <Pencil size={18} color="#cbd5e1" style={{ marginTop: '8px' }} />
              </div>
           </div>

           {/* Step 0: Target Platform */}
           <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900', boxShadow: '0 4px 8px rgba(245, 158, 11, 0.15)' }}>0</div>
                 <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Target Platform</h3>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '18px 22px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' }}>
                 <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      outline: 'none',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      color: '#1e1b4b',
                      background: '#f8fafc',
                      cursor: 'pointer'
                    }}
                 >
                    <option value="all">🌐 All Connected Platforms</option>
                    {connectedSettings && (connectedSettings.isAccountConnected || (connectedSettings.instagramAccessToken && connectedSettings.businessAccountId)) && (
                      <option value="instagram">📸 Instagram</option>
                    )}
                    {connectedSettings && (connectedSettings.isFacebookConnected || (connectedSettings.facebookAccessToken && connectedSettings.facebookPageId)) && (
                      <option value="facebook">💬 Facebook Messenger</option>
                    )}
                    {connectedSettings && (connectedSettings.isWhatsAppConnected || (connectedSettings.whatsappToken && connectedSettings.whatsappPhoneNumberId)) && (
                      <option value="whatsapp">🟩 WhatsApp</option>
                    )}
                 </select>
                 <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.8rem', fontWeight: '500' }}>Only connected platforms are shown here.</p>
              </div>
           </div>

           {/* Step 1: Follower Growth Gating */}
           <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900', boxShadow: '0 4px 8px rgba(16, 185, 129, 0.15)' }}>1</div>
                 <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Follower Growth Gating</h3>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '18px 22px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: requireFollow ? '14px' : '0' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Only respond to users who follow you.</p>
                    <div onClick={() => setRequireFollow(!requireFollow)} style={{ width: '50px', height: '24px', borderRadius: '12px', background: requireFollow ? '#10b981' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                       <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: requireFollow ? '29px' : '3px', transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}></div>
                    </div>
                 </div>
                 {requireFollow && (
                    <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)', borderRadius: '14px', border: '1.5px solid #d1fae5' }}>
                       <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '900', color: '#059669', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unfollowed Message</label>
                       <textarea 
                         value={unfollowedMessage} 
                         onChange={(e) => setUnfollowedMessage(e.target.value)} 
                         style={{ width: '100%', height: '56px', background: 'transparent', border: 'none', outline: 'none', color: '#065f46', fontSize: '0.95rem', fontWeight: '600', resize: 'none', lineHeight: '1.4' }} 
                       />
                    </div>
                 )}
              </div>
           </div>

           {/* Step 2: Trigger Settings */}
           <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900', boxShadow: '0 4px 8px rgba(124, 58, 237, 0.15)' }}>2</div>
                 <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Trigger Settings</h3>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '18px 22px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: !anyKeyword ? '14px' : '0' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>{template === 'stories' ? 'Trigger on Story Replies' : 'Trigger on specific keywords'}</p>
                    <div onClick={() => setAnyKeyword(!anyKeyword)} style={{ width: '50px', height: '24px', borderRadius: '12px', background: anyKeyword ? '#7c3aed' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                       <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: anyKeyword ? '29px' : '3px', transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}></div>
                    </div>
                 </div>
                 {!anyKeyword && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: '#f8fafc', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}>
                       {keywords.map((k, i) => (
                          <span key={i} style={{ padding: '6px 12px', background: 'white', color: '#7c3aed', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem', border: '1.5px solid #ddd6fe', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px -1px rgba(124, 58, 237, 0.05)' }}>
                             {k} <X size={14} style={{ cursor: 'pointer', color: '#ec4899' }} onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))} />
                          </span>
                       ))}
                       <input 
                         value={keywordInput} 
                         onChange={(e) => setKeywordInput(e.target.value)} 
                         onKeyPress={(e) => e.key === 'Enter' && (setKeywords([...keywords, keywordInput]), setKeywordInput(''))} 
                         placeholder="Add keyword..." 
                         style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: '700', fontSize: '0.9rem', color: '#1e1b4b', width: '120px' }} 
                       />
                    </div>
                 )}
                 {anyKeyword && <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', borderRadius: '14px', border: '1.5px dashed #7c3aed', textAlign: 'center', color: '#7c3aed', fontWeight: '800', fontSize: '0.9rem' }}>âš¡ Responding to ANY incoming message</div>}
              </div>
           </div>

           {/* Step 3: Advanced Automations (Opening Message) */}
           <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.8)', 
                backdropFilter: 'blur(10px)',
                border: '1.5px solid #e2e8f0', 
                borderRadius: '20px', 
                padding: '18px 22px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)'
              }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900', boxShadow: '0 4px 8px rgba(59, 130, 246, 0.15)' }}>3</div>
                       <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Advanced: Opening Message</h3>
                          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '2px 0 0 0', fontWeight: '500' }}>Send a greeting button before the final response.</p>
                       </div>
                    </div>
                    <div onClick={() => setOpeningMessage(!openingMessage)} style={{ width: '50px', height: '24px', borderRadius: '12px', background: openingMessage ? '#3b82f6' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: openingMessage ? '29px' : '3px', transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}></div>
                    </div>
                 </div>

                 {openingMessage && (
                   <div style={{ marginTop: '16px', padding: '16px 20px', borderRadius: '14px', background: 'white', border: '1.5px solid #f1f5f9', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '900', color: '#3b82f6', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GREETING TEXT</label>
                      <textarea 
                        value={openingMessageText} 
                        onChange={(e) => setOpeningMessageText(e.target.value)} 
                        style={{ width: '100%', height: '60px', padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', resize: 'none', marginBottom: '14px', background: '#f8fafc', fontWeight: '500', color: '#1e1b4b' }}
                      />
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '900', color: '#3b82f6', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BUTTON TEXT</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
                         </div>
                         <input 
                           value={openingMessageButton} 
                           onChange={(e) => setOpeningMessageButton(e.target.value)} 
                           style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontWeight: '800', background: '#f8fafc', color: '#1e1b4b' }} 
                         />
                      </div>
                   </div>
                 )}
              </div>
           </div>

           {/* Step 4: Automated DM Response */}
           <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900', boxShadow: '0 4px 8px rgba(124, 58, 237, 0.15)' }}>4</div>
                 <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Automated DM Response</h3>
              </div>

              <div style={{ 
                background: 'rgba(255, 255, 255, 0.8)', 
                backdropFilter: 'blur(10px)',
                border: '1.5px solid #e2e8f0', 
                borderRadius: '20px', 
                padding: '20px 24px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)'
              }}>
                 {/* AI Toggle Section */}
                 <div style={{ 
                   display: 'flex', 
                   justifyContent: 'space-between', 
                   alignItems: 'center', 
                   marginBottom: '18px', 
                   paddingBottom: '14px', 
                   borderBottom: '1.5px solid #f1f5f9' 
                 }}>
                   <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#7c3aed', fontSize: '0.95rem' }}>
                       <Sparkles size={14} style={{ color: '#7c3aed' }} />
                       <span>AI Neural Studio Reply</span>
                     </div>
                     <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Let our AI Agent reply dynamically to DMs</span>
                   </div>
                   <div 
                     onClick={() => {
                       const nextIsAi = !isAI;
                       setIsAI(nextIsAi);
                       if (nextIsAi && !message) {
                         setMessage("[AI Agent will generate a custom neural reply here]");
                       } else if (!nextIsAi && message === "[AI Agent will generate a custom neural reply here]") {
                         setMessage("");
                       }
                     }}
                     style={{ 
                       width: '40px', height: '22px', borderRadius: '11px', background: isAI ? 'linear-gradient(135deg, #7c3aed, #0ea5e9)' : '#cbd5e1', 
                       position: 'relative', cursor: 'pointer', transition: 'all 0.3s' 
                     }}
                   >
                     <div style={{ 
                       width: '16px', height: '16px', borderRadius: '50%', background: 'white', 
                       position: 'absolute', top: '3px', left: isAI ? '21px' : '3px', transition: 'all 0.3s' 
                     }}></div>
                   </div>
                 </div>

                 {!isAI ? (
                    <textarea 
                      placeholder="Type your final message here..." 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      style={{ width: '100%', height: '80px', padding: '14px 18px', borderRadius: '14px', border: 'none', background: '#f8fafc', outline: 'none', fontSize: '0.95rem', resize: 'none', marginBottom: '16px', fontWeight: '500', color: '#1e1b4b', lineHeight: '1.5' }}
                    />
                 ) : (
                    <div style={{ 
                      padding: '14px', 
                      borderRadius: '14px', 
                      background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.04), rgba(14, 165, 233, 0.04))', 
                      border: '1.5px dashed #7c3aed', 
                      marginBottom: '16px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Brain size={16} color="#7c3aed" />
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#7c3aed' }}>AI Neural Responder Active</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                        The AI Agent will use your AI Neural Studio profile/knowledge base to reply dynamically. 
                        If AI is offline, it will fall back to:
                      </p>
                      <textarea 
                        placeholder="Enter fallback message..."
                        value={message === "[AI Agent will generate a custom neural reply here]" ? "" : message}
                        onChange={(e) => setMessage(e.target.value || "[AI Agent will generate a custom neural reply here]")}
                        style={{ 
                          width: '100%', height: '60px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', 
                          outline: 'none', fontSize: '0.85rem', resize: 'none', marginTop: '8px', lineHeight: '1.4', background: 'white'
                        }}
                      ></textarea>
                    </div>
                 )}
                 
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <div style={{ fontWeight: '900', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interactive Elements</div>
                    <button 
                      onClick={openAddLinkModal} 
                      onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 10px -3px rgba(124, 58, 237, 0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
                      style={{ background: '#f5f3ff', color: '#7c3aed', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s', fontSize: '0.85rem' }}
                    >
                      <LinkIcon size={16} /> Add Call to Action
                    </button>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                    {buttons.map((btn, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'white', borderRadius: '12px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.02)' }}>
                        <span style={{ fontWeight: '800', color: '#1e1b4b', fontSize: '0.9rem' }}>{btn.text}</span>
                        <Trash2 size={16} onClick={() => setButtons(buttons.filter((_, i) => i !== idx))} style={{ cursor: 'pointer', color: '#ef4444', transition: '0.3s' }} />
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Final Launch Button at Bottom */}
           <div style={{ marginTop: '20px', position: 'relative', zIndex: 1 }}>
              <button 
                onClick={handleCreate} 
                disabled={submitting} 
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 40px -8px rgba(124, 58, 237, 0.45)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(124, 58, 237, 0.25)'; }}
                style={{ 
                  width: '100%', 
                  padding: '16px 24px',
                   borderRadius: '18px',
                   background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                   color: 'white',
                   border: 'none',
                   fontWeight: '800',
                   fontSize: '1rem',
                   cursor: 'pointer',
                   boxShadow: '0 10px 20px rgba(124, 58, 237, 0.25)',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   gap: '10px',
                   transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                   letterSpacing: '0.02em'
                }}
              >
                {submitting ? (
                  'Launching...'
                ) : (
                  <>
                    <Zap size={20} fill="white" /> Launch Automation
                  </>
                )}
              </button>
           </div>
           
           <div style={{ height: '100px' }}></div>
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '24px' }}>Add Link Button</h3>
            <input value={tempLinkTitle} onChange={(e) => setTempLinkTitle(e.target.value)} placeholder="Button Text" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginBottom: '16px', outline: 'none', fontWeight: '700' }} />
            <input value={tempLinkUrl} onChange={(e) => setTempLinkUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginBottom: '24px', outline: 'none', color: '#7c3aed', fontWeight: '700' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleSaveLink} style={{ flex: 1, padding: '16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setShowLinkModal(false)} style={{ flex: 1, padding: '16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


