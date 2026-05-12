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
  Crown
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
  const [anyKeyword, setAnyKeyword] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [message, setMessage] = useState('');
  const [openingMessage, setOpeningMessage] = useState(false);
  const [openingMessageText, setOpeningMessageText] = useState("Hey there! I'm so happy you're here! 😊\n\nClick below and I'll send you the link! 🚀");
  const [openingMessageButton, setOpeningMessageButton] = useState("Send me the link");
  const [requireFollow, setRequireFollow] = useState(true);
  const [unfollowedMessage, setUnfollowedMessage] = useState("Hey! Please follow our account first to get the link! 😊");
  const [publicReplyText, setPublicReplyText] = useState("Check your DMs! 🚀 I've sent you the info.");
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(`${template === 'stories' ? 'Story' : 'DM'} Automation #${Math.floor(Math.random() * 1000)}`);
  const [connectedSettings, setConnectedSettings] = useState(null);
  const [buttons, setButtons] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState(null);
  const [tempLinkTitle, setTempLinkTitle] = useState('Open Link');
  const [tempLinkUrl, setTempLinkUrl] = useState('https://example.com');

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
    setTempLinkTitle('Open Link');
    setTempLinkUrl('https://example.com');
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
          platform: channel,
          requireFollow: requireFollow,
          unfollowedResponse: unfollowedMessage,
          openingMessage: openingMessage,
          openingMessageText: openingMessageText,
          openingMessageButton: openingMessageButton,
          triggerOnDms: anyKeyword ? true : (template === 'all_dms'),
          triggerOnComments: anyKeyword ? true : (template === 'comments'),
          triggerOnStories: anyKeyword ? true : (template === 'stories'),
          publicReplyText: publicReplyText,
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
      background: 'white', 
      fontFamily: "'Outfit', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'hidden'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(350px, 450px) 1fr',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Left Side: Preview */}
        <div style={{ 
          background: '#f8fafc', 
          borderRight: '1px solid #f1f5f9', 
          padding: '30px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          overflowY: 'auto'
        }}>
          <div style={{ color: '#94a3b8', fontWeight: '800', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Smartphone size={16} /> Automation Preview
          </div>
          
          {/* iPhone Mockup */}
          <div style={{ 
            width: '280px', 
            height: '570px', 
            background: '#000', 
            borderRadius: '40px', 
            border: '8px solid #1e1b4b',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 30px 60px -12px rgba(0,0,0,0.2)',
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
                                 <div style={{ padding: '10px', textAlign: 'center', color: '#3b82f6', fontSize: '0.75rem', fontWeight: '800' }}>
                                    {openingMessageButton}
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
                        {message && (
                           <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                              <div style={{ background: '#262626', borderRadius: '14px 14px 14px 2px', overflow: 'hidden' }}>
                                 <div style={{ padding: '10px 12px', borderBottom: buttons.length > 0 ? '1px solid #333' : 'none' }}>
                                    <div style={{ color: 'white', fontSize: '0.75rem', lineHeight: '1.4' }}>{message}</div>
                                 </div>
                                 {buttons.map((btn, idx) => (
                                    <div key={idx} style={{ padding: '10px', textAlign: 'center', borderBottom: idx === buttons.length - 1 ? 'none' : '1px solid #333', color: '#3b82f6', fontSize: '0.75rem', fontWeight: '800' }}>
                                       {btn.text}
                                    </div>
                                 ))}
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
        <div style={{ padding: '48px 64px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '36px' }}>
           
           {/* Section -1: Navigation & Name */}
           <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
              <button onClick={() => navigate(-1)} style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <ArrowLeft size={20} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <input 
                   type="text" 
                   value={name} 
                   onChange={(e) => setName(e.target.value)} 
                   placeholder="Automation Name"
                   style={{ fontSize: '1.6rem', fontWeight: '900', color: '#1e1b4b', border: 'none', outline: 'none', background: 'transparent', padding: 0, width: 'auto' }} 
                 />
                 <Pencil size={18} color="#cbd5e1" />
              </div>

                {/* Step 1: Follower Growth Gating */}
           <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900' }}>1</div>
                 <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Follower Growth Gating</h3>
              </div>
              <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '32px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', fontWeight: '500' }}>Only respond to users who follow you.</p>
                    <div onClick={() => setRequireFollow(!requireFollow)} style={{ width: '48px', height: '24px', borderRadius: '12px', background: requireFollow ? '#10b981' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                       <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: requireFollow ? '27px' : '3px', transition: '0.3s' }}></div>
                    </div>
                 </div>
                 {requireFollow && (
                    <div style={{ padding: '20px', background: '#ecfdf5', borderRadius: '16px', border: '1.5px solid #d1fae5' }}>
                       <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '900', color: '#059669', marginBottom: '8px', textTransform: 'uppercase' }}>Unfollowed Message</label>
                       <textarea value={unfollowedMessage} onChange={(e) => setUnfollowedMessage(e.target.value)} style={{ width: '100%', height: '80px', background: 'transparent', border: 'none', outline: 'none', color: '#065f46', fontSize: '0.95rem', fontWeight: '600', resize: 'none' }} />
                    </div>
                 )}
              </div>
           </div>

           {/* Step 2: Trigger Settings */}
           <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900' }}>2</div>
                 <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Trigger Settings</h3>
              </div>
              <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '32px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', fontWeight: '500' }}>{template === 'stories' ? 'Trigger on Story Replies' : 'Trigger on specific keywords'}</p>
                    <div onClick={() => setAnyKeyword(!anyKeyword)} style={{ width: '48px', height: '24px', borderRadius: '12px', background: anyKeyword ? '#7c3aed' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                       <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: anyKeyword ? '27px' : '3px', transition: '0.3s' }}></div>
                    </div>
                 </div>
                 {!anyKeyword && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                       {keywords.map((k, i) => (
                          <span key={i} style={{ padding: '8px 16px', background: '#f5f3ff', color: '#7c3aed', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', border: '1.5px solid #ddd6fe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                             {k} <X size={14} style={{ cursor: 'pointer' }} onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))} />
                          </span>
                       ))}
                       <input value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (setKeywords([...keywords, keywordInput]), setKeywordInput(''))} placeholder="Type keyword..." style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: '700', fontSize: '0.9rem', color: '#7c3aed', width: '120px' }} />
                    </div>
                 )}
                 {anyKeyword && <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontWeight: '700', fontSize: '0.9rem' }}>Responding to ANY message</div>}
              </div>
           </div>

           {/* Step 3: Advanced Automations (Opening Message) */}
           <div style={{ 
             background: 'white', 
             border: '2px solid #f1f5f9', 
             borderRadius: '24px', 
             padding: '24px 32px'
           }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900' }}>3</div>
                    <div>
                       <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Advanced: Opening Message</h3>
                       <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '2px 0 0 0', fontWeight: '500' }}>Send a greeting button before the final response.</p>
                    </div>
                 </div>
                 <div onClick={() => setOpeningMessage(!openingMessage)} style={{ width: '52px', height: '28px', borderRadius: '14px', background: openingMessage ? '#3b82f6' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                   <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: openingMessage ? '27px' : '3px', transition: '0.3s' }}></div>
                 </div>
              </div>

              {openingMessage && (
                <div style={{ marginTop: '24px', padding: '24px', borderRadius: '20px', background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                   <textarea 
                     value={openingMessageText} 
                     onChange={(e) => setOpeningMessageText(e.target.value)} 
                     style={{ width: '100%', height: '80px', padding: '16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', resize: 'none', marginBottom: '20px', background: 'white', fontWeight: '500' }}
                   />
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></div>
                      </div>
                      <input 
                        value={openingMessageButton} 
                        onChange={(e) => setOpeningMessageButton(e.target.value)} 
                        style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontWeight: '700', background: 'white' }} 
                      />
                   </div>
                </div>
              )}
           </div>

           {/* Step 4: Automated DM Response */}
           <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900' }}>4</div>
                 <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Automated DM Response</h3>
              </div>

              <div style={{ 
                background: 'white', 
                border: '2px solid #f1f5f9', 
                borderRadius: '24px', 
                padding: '32px'
              }}>
                 <textarea 
                   placeholder="Write the DM content here..." 
                   value={message} 
                   onChange={(e) => setMessage(e.target.value)} 
                   style={{ width: '100%', height: '100px', padding: '24px', borderRadius: '20px', border: 'none', background: '#f8fafc', outline: 'none', fontSize: '1.1rem', resize: 'none', marginBottom: '24px', fontWeight: '500', color: '#1e1b4b' }}
                 />
                 
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                    <div style={{ fontWeight: '800', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Links & Buttons</div>
                    <button onClick={openAddLinkModal} style={{ background: '#f5f3ff', color: '#7c3aed', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LinkIcon size={18} /> Add Link
                    </button>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    {buttons.map((btn, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                        <span style={{ fontWeight: '800', color: '#1e1b4b' }}>{btn.text}</span>
                        <Trash2 size={18} onClick={() => setButtons(buttons.filter((_, i) => i !== idx))} style={{ cursor: 'pointer', color: '#ef4444' }} />
                      </div>
                    ))}
                 </div>
              </div>
           </div>


           {/* Final Launch Button at Bottom */}
           <div style={{ marginTop: '20px' }}>
              <button 
                onClick={handleCreate} 
                disabled={submitting} 
                style={{ 
                  width: '100%', 
                  padding: '20px', 
                  borderRadius: '20px', 
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: '900', 
                  fontSize: '1.2rem',
                  cursor: 'pointer', 
                  boxShadow: '0 15px 30px rgba(124, 58, 237, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
              >
                {submitting ? (
                  'Creating...'
                ) : (
                  <>
                    <Zap size={24} fill="white" /> Create Automation
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
