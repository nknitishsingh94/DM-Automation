import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronLeft, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Plus, 
  X, 
  Smartphone,
  CheckCircle2,
  Send,
  Pencil,
  Trash2,
  Camera,
  Mic,
  PlusCircle,
  Zap,
  Globe,
  Settings,
  Sparkles,
  Heart,
  MessageCircle,
  Home
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
  const [openingMessageText, setOpeningMessageText] = useState("Hey there! I'm so happy you're here, thanks so much for your interest 😊\n\nClick below and I'll send you the link in just a sec 🚀");
  const [openingMessageButton, setOpeningMessageButton] = useState("Send me the link");
  const [requireFollow, setRequireFollow] = useState(true);
  const [unfollowedMessage, setUnfollowedMessage] = useState("Hey! Please follow our account first to get the link! 😊");
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

  React.useEffect(() => {
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

  const openEditLinkModal = (index) => {
    setEditingLinkIndex(index);
    setTempLinkTitle(buttons[index].text);
    setTempLinkUrl(buttons[index].url);
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

  const removeLink = (index) => {
    setButtons(buttons.filter((_, i) => i !== index));
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
          triggerOnDms: anyKeyword ? true : (template !== 'stories'),
          triggerOnComments: anyKeyword ? true : false,
          triggerOnStories: anyKeyword ? true : (template === 'stories'),
          status: 'Active'
        })
      });

      if (res.ok) {
        notify('✅ DM Automation created successfully!', 'success');
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
      background: 'white', 
      fontFamily: "'Outfit', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(350px, 450px) 1fr',
        height: 'calc(100vh - 0px)',
        overflow: 'hidden'
      }}>
        {/* Left Side: Chat Preview (Premium Style) */}
        <div style={{ 
          background: '#f8fafc', 
          borderRight: '1.5px solid #e2e8f0', 
          padding: '40px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          overflowY: 'auto'
        }}>
          <div style={{ color: '#64748b', fontWeight: '800', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <Smartphone size={18} /> {template === 'stories' ? 'Story Preview' : 'Automation Preview'}
          </div>
          
          {/* iPhone Mockup */}
          <div style={{ 
            width: '280px', 
            height: '580px', 
            background: '#000', 
            borderRadius: '40px', 
            border: '8px solid #1e1b4b',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)',
            flexShrink: 0
          }}>
             {/* Realistic Notch */}
             <div style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '18px', background: '#000', borderRadius: '20px', zIndex: 10 }}></div>
             
             <div style={{ height: '100%', background: 'linear-gradient(to bottom, #000000, #1a1a1a)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* IG Header (Small) */}
                <div style={{ padding: '30px 20px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ArrowLeft size={16} color="white" />
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: '800', color: 'white' }}>
                    {(connectedSettings?.connectedInstagramName || user?.username || 'IG').substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: '700' }}>
                    {connectedSettings?.connectedInstagramName || user?.username || 'Instagram Account'}
                  </div>
                </div>

                {/* Central Lightning Icon (if empty) or Chat */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflowY: 'auto' }}>
                   {(!anyKeyword && keywords.length === 0 && !message) ? (
                     <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)', marginBottom: '20px' }}>
                           <Zap size={40} color="white" fill="white" />
                        </div>
                        <div style={{ color: 'white', fontWeight: '800', fontSize: '0.9rem', opacity: 0.6 }}>Previewing...</div>
                     </div>
                   ) : (
                     <>
                        {/* Trigger Message */}
                        <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: '#0095f6', color: 'white', padding: '8px 12px', borderRadius: '14px 14px 2px 14px', fontSize: '0.75rem' }}>
                           {anyKeyword ? 'Hey! I saw your post.' : (keywords[0] || 'Trigger Word')}
                        </div>

                        {/* Opening Message if enabled */}
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

                        {/* Main Response Message */}
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

                {/* Bottom Bar Mockup */}
                <div style={{ padding: '12px 16px 20px', display: 'flex', gap: '10px', borderTop: '1px solid #1a1a1a' }}>
                   <div style={{ flex: 1, height: '34px', background: '#1a1a1a', borderRadius: '17px', border: '1px solid #333' }}></div>
                   <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#1a1a1a', border: '1px solid #333' }}></div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Side: Builder (Premium Configuration) */}
        <div style={{ padding: '40px 60px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end',
            position: 'sticky',
            top: '-40px',
            background: 'white',
            zIndex: 20,
            padding: '40px 0 20px 0',
            marginBottom: '20px',
            borderBottom: '1.5px solid #f1f5f9'
          }}>
             <div>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginBottom: '12px', fontWeight: '900', fontSize: '0.9rem' }}>
                  <ArrowLeft size={16} /> BACK TO AI STUDIO
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <input 
                     type="text" 
                     value={name} 
                     onChange={(e) => setName(e.target.value)} 
                     style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1e1b4b', border: 'none', outline: 'none', background: 'transparent', padding: 0, width: 'auto' }} 
                   />
                   <Pencil size={20} color="#cbd5e1" />
                </div>
                <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '4px', fontWeight: '500' }}>{template === 'stories' ? 'Respond to Story Mentions & Replies' : 'Respond to all Direct Messages'}</p>
             </div>
             
             <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ padding: '12px 24px', borderRadius: '12px', background: '#f8fafc', color: '#64748b', border: '1.5px solid #e2e8f0', fontWeight: '800', cursor: 'pointer' }}>Discard</button>
                <button 
                  onClick={handleCreate} 
                  disabled={submitting} 
                  style={{ padding: '12px 32px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px rgba(124, 58, 237, 0.2)' }}
                >
                  {submitting ? 'Creating...' : 'Launch Automation'}
                </button>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
             {/* 1. Follower Gating Section */}
             <div style={{ background: 'white', padding: '32px', borderRadius: '32px', border: '1.5px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900' }}>1</div>
                   <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Follower Growth Gating</h3>
                </div>

                <div style={{ background: '#f0fdf4', border: '1.5px solid #d1fae5', borderRadius: '24px', padding: '24px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontWeight: '800', color: '#065f46', fontSize: '1rem' }}>Require Follow to Trigger</div>
                      <div onClick={() => setRequireFollow(!requireFollow)} style={{ width: '48px', height: '26px', borderRadius: '13px', background: requireFollow ? '#10b981' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: requireFollow ? '25px' : '3px', transition: '0.3s' }}></div>
                      </div>
                   </div>
                   <p style={{ fontSize: '0.85rem', color: '#059669', lineHeight: '1.5', marginBottom: '20px' }}>Only people who follow you will receive your link. Non-followers will get a request to follow you first. 🚀</p>
                   
                   <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: '#059669', marginBottom: '8px', textTransform: 'uppercase' }}>Follow Request Message</label>
                   <textarea 
                     value={unfollowedMessage} 
                     onChange={(e) => setUnfollowedMessage(e.target.value)} 
                     style={{ width: '100%', height: '80px', padding: '16px', borderRadius: '16px', border: '1.5px solid #10b981', outline: 'none', fontSize: '0.9rem', resize: 'none', background: 'white' }}
                   />
                </div>
             </div>

             {/* 2. Trigger Configuration */}
             <div style={{ background: 'white', padding: '32px', borderRadius: '32px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#1e1b4b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900' }}>2</div>
                   <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Trigger Settings</h3>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 8px' }}>
                   <div>
                      <span style={{ fontWeight: '800', color: '#475569', display: 'block', fontSize: '1rem' }}>Any Message / Keyword</span>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Trigger on ANY incoming interaction</span>
                   </div>
                   <div onClick={() => setAnyKeyword(!anyKeyword)} style={{ width: '48px', height: '26px', borderRadius: '13px', background: anyKeyword ? '#7c3aed' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: anyKeyword ? '25px' : '3px', transition: '0.3s' }}></div>
                   </div>
                </div>

                {!anyKeyword && (
                   <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        placeholder="Type Keyword & Hit Enter ↵" 
                        value={keywordInput} 
                        onChange={(e) => setKeywordInput(e.target.value)} 
                        onKeyDown={handleAddKeyword} 
                        style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', fontWeight: '600', marginBottom: '16px' }} 
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {keywords.map(kw => (
                          <span key={kw} style={{ background: '#f1f5f9', padding: '8px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800', color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0' }}>
                            {kw} <X size={14} onClick={() => removeKeyword(kw)} style={{ cursor: 'pointer', color: '#ef4444' }} />
                          </span>
                        ))}
                      </div>
                   </div>
                )}
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
             {/* 3. Response Builder */}
             <div style={{ background: 'white', padding: '32px', borderRadius: '32px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900' }}>3</div>
                   <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Automated Response</h3>
                </div>

                <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '900', color: '#7c3aed', marginBottom: '12px', textTransform: 'uppercase' }}>
                      <Send size={14} /> Message Content
                   </label>
                   <textarea 
                     placeholder="Enter the DM content here..." 
                     value={message} 
                     onChange={(e) => setMessage(e.target.value)} 
                     style={{ width: '100%', height: '120px', padding: '16px', borderRadius: '16px', border: 'none', background: '#f8fafc', outline: 'none', fontSize: '1rem', resize: 'none', marginBottom: '24px' }}
                   />
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderTop: '1.5px solid #f1f5f9', paddingTop: '20px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#64748b' }}>CTA BUTTONS</label>
                      <button onClick={openAddLinkModal} style={{ background: '#f5f3ff', color: '#7c3aed', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={16} /> ADD LINK
                      </button>
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {buttons.map((btn, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'white', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                             <LinkIcon size={16} color="#7c3aed" />
                             <span style={{ fontWeight: '800', color: '#1e1b4b', fontSize: '0.9rem' }}>{btn.text}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <Pencil size={16} onClick={() => openEditLinkModal(idx)} style={{ cursor: 'pointer', color: '#64748b' }} />
                            <Trash2 size={16} onClick={() => removeLink(idx)} style={{ cursor: 'pointer', color: '#ef4444' }} />
                          </div>
                        </div>
                      ))}
                      {buttons.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1.5px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' }}>
                          No buttons added yet. Click "+ Add Link" to create Call-to-Actions.
                        </div>
                      )}
                   </div>
                </div>
             </div>

             {/* 4. Advanced: Opening Message */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ background: 'white', padding: '32px', borderRadius: '32px', border: '1.5px solid #e2e8f0' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h4 style={{ fontWeight: '900', color: '#1e1b4b', margin: 0, fontSize: '1.1rem' }}>Advanced: Opening Message</h4>
                      <div onClick={() => setOpeningMessage(!openingMessage)} style={{ width: '48px', height: '26px', borderRadius: '13px', background: openingMessage ? '#7c3aed' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: openingMessage ? '25px' : '3px', transition: '0.3s' }}></div>
                      </div>
                   </div>
                   <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>Send a quick greeting button BEFORE the final link to boost engagement.</p>
                   
                   {openingMessage && (
                     <div style={{ padding: '24px', borderRadius: '24px', background: '#f5f3ff', border: '1.5px solid #ddd6fe' }}>
                       <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: '#7c3aed', marginBottom: '8px' }}>GREETING TEXT</label>
                       <textarea value={openingMessageText} onChange={(e) => setOpeningMessageText(e.target.value)} style={{ width: '100%', height: '100px', padding: '16px', borderRadius: '16px', border: '1.5px solid #ddd6fe', outline: 'none', fontSize: '0.9rem', resize: 'none', marginBottom: '20px', background: 'white' }}></textarea>
                       <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: '#7c3aed', marginBottom: '8px' }}>BUTTON LABEL</label>
                       <input value={openingMessageButton} onChange={(e) => setOpeningMessageButton(e.target.value)} placeholder="Button Label" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #ddd6fe', outline: 'none', fontSize: '0.9rem', fontWeight: '700', background: 'white' }} />
                     </div>
                   )}
                </div>

                <div style={{ background: '#0f172a', padding: '32px', borderRadius: '32px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%' }}></div>
                   <Sparkles size={24} color="#3b82f6" style={{ marginBottom: '16px' }} />
                   <h4 style={{ fontSize: '1rem', fontWeight: '900', marginBottom: '8px' }}>Pro Tip: Keywords</h4>
                   <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6' }}>Use shorter, high-intent keywords like "INFO" or "LINK" to increase your conversion rates by up to 40%.</p>
                </div>
             </div>
          </div>
          
          {/* Spacer for bottom scroll */}
          <div style={{ height: '60px' }}></div>
        </div>
      </div>

      {/* Link Modal (Premium Styling) */}
      {showLinkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '450px', boxShadow: '0 30px 70px rgba(0,0,0,0.3)', animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
               <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>{editingLinkIndex !== null ? 'Edit Button' : 'Add Link Button'}</h3>
               <button onClick={() => setShowLinkModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
               </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
               <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>BUTTON TEXT</label>
               <input value={tempLinkTitle} onChange={(e) => setTempLinkTitle(e.target.value)} placeholder="e.g. Visit Website" style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: '600' }} />
            </div>

            <div style={{ marginBottom: '32px' }}>
               <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>URL LINK</label>
               <input value={tempLinkUrl} onChange={(e) => setTempLinkUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: '600', color: '#7c3aed' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleSaveLink} style={{ flex: 1.5, padding: '16px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(124, 58, 237, 0.2)' }}>Save Button</button>
              <button onClick={() => setShowLinkModal(false)} style={{ flex: 1, padding: '16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
