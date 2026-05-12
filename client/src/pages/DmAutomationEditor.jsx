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
          triggerOnDms: anyKeyword ? true : (template !== 'stories'),
          triggerOnComments: anyKeyword ? true : false,
          triggerOnStories: anyKeyword ? true : (template === 'stories'),
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
      {/* Dynamic Header integrated with Layout */}
      <div style={{ 
        padding: '24px 40px', 
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
           <button onClick={() => navigate(-1)} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px', cursor: 'pointer', color: '#64748b' }}>
              <ArrowLeft size={20} />
           </button>
           <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e1b4b', border: 'none', outline: 'none', background: 'transparent', padding: 0, width: 'auto' }} 
                />
                <Pencil size={18} color="#cbd5e1" />
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0, fontWeight: '600' }}>
                {template === 'comments' ? 'Comment Automation' : 'Direct Messages Automation'}
              </p>
           </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
           <button onClick={() => navigate('/campaigns')} style={{ padding: '12px 24px', borderRadius: '12px', background: '#f8fafc', color: '#64748b', border: '1.5px solid #e2e8f0', fontWeight: '800', cursor: 'pointer' }}>Discard</button>
           <button 
             onClick={handleCreate} 
             disabled={submitting} 
             style={{ padding: '12px 32px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px rgba(124, 58, 237, 0.2)' }}
           >
             {submitting ? 'Saving...' : 'Launch Automation'}
           </button>
        </div>
      </div>

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
          padding: '40px 20px', 
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
                    {connectedSettings?.connectedInstagramName || user?.username || 'monster_pk_8795'}
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
                        <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: '#0095f6', color: 'white', padding: '8px 12px', borderRadius: '14px 14px 2px 14px', fontSize: '0.75rem' }}>
                           {anyKeyword ? 'Hey! I saw your post.' : (keywords[0] || 'Type Keyword')}
                        </div>

                        {(openingMessage || message) && (
                           <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                              <div style={{ background: '#262626', borderRadius: '14px 14px 14px 2px', overflow: 'hidden' }}>
                                 <div style={{ padding: '10px 12px', borderBottom: '1px solid #333' }}>
                                    <div style={{ color: 'white', fontSize: '0.75rem', lineHeight: '1.4' }}>{openingMessage ? openingMessageText : message}</div>
                                 </div>
                                 {(openingMessage || buttons.length > 0) && (
                                    <div style={{ padding: '10px', textAlign: 'center', color: '#3b82f6', fontSize: '0.75rem', fontWeight: '800' }}>
                                       {openingMessage ? openingMessageButton : (buttons[0]?.text || 'Open Link')}
                                    </div>
                                 )}
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
        <div style={{ padding: '48px 64px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
           
           {/* Section 1: Follower Growth Gating */}
           <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                 <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '900' }}>1</div>
                 <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Follower Growth Gating</h3>
              </div>

              <div style={{ 
                background: '#fff', 
                border: '2px solid #10b981', 
                borderRadius: '24px', 
                padding: '32px',
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.05)'
              }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontWeight: '800', color: '#1e1b4b', fontSize: '1.1rem' }}>Require Follow to Trigger</div>
                    <div onClick={() => setRequireFollow(!requireFollow)} style={{ width: '52px', height: '28px', borderRadius: '14px', background: requireFollow ? '#10b981' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: requireFollow ? '27px' : '3px', transition: '0.3s' }}></div>
                    </div>
                 </div>
                 <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6', marginBottom: '24px', maxWidth: '500px' }}>
                    Only people who follow you will receive your link. Non-followers will get a request to follow you first. 🚀
                 </p>
                 
                 <div style={{ background: '#f0fdf4', borderRadius: '20px', padding: '20px', border: '1px solid #d1fae5' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: '#10b981', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Follow Request Message</label>
                    <textarea 
                      value={unfollowedMessage} 
                      onChange={(e) => setUnfollowedMessage(e.target.value)} 
                      placeholder="Hey! Please follow our account first..."
                      style={{ width: '100%', height: '80px', padding: '16px', borderRadius: '12px', border: 'none', outline: 'none', fontSize: '0.95rem', resize: 'none', background: 'white', color: '#1e1b4b', fontWeight: '600' }}
                    />
                 </div>
              </div>
           </div>

           {/* Section 2: Trigger Settings */}
           <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                 <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '900' }}>2</div>
                 <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Message / Keyword</h3>
              </div>

              <div style={{ 
                background: 'white', 
                border: '2px solid #f1f5f9', 
                borderRadius: '24px', 
                padding: '32px'
              }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                       <span style={{ fontWeight: '800', color: '#1e1b4b', display: 'block', fontSize: '1.1rem' }}>Any Message / Keyword</span>
                       <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '500' }}>Trigger on ANY incoming interaction</span>
                    </div>
                    <div onClick={() => setAnyKeyword(!anyKeyword)} style={{ width: '52px', height: '28px', borderRadius: '14px', background: anyKeyword ? '#4f46e5' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                       <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: anyKeyword ? '27px' : '3px', transition: '0.3s' }}></div>
                    </div>
                 </div>

                 {!anyKeyword && (
                    <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '24px' }}>
                       <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: '#4f46e5', marginBottom: '10px', textTransform: 'uppercase' }}>Type Keyword</label>
                       <input 
                         type="text" 
                         placeholder="Type Keyword & Hit Enter ↵" 
                         value={keywordInput} 
                         onChange={(e) => setKeywordInput(e.target.value)} 
                         onKeyDown={handleAddKeyword} 
                         style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }} 
                       />
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                         {keywords.map(kw => (
                           <span key={kw} style={{ background: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '800', color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '8px', border: '1.5px solid #e2e8f0' }}>
                             {kw} <X size={16} onClick={() => removeKeyword(kw)} style={{ cursor: 'pointer', color: '#ef4444' }} />
                           </span>
                         ))}
                       </div>
                    </div>
                 )}
              </div>
           </div>

           {/* Section 3: Automated Response */}
           <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                 <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '900' }}>3</div>
                 <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Automated Response</h3>
              </div>

              <div style={{ 
                background: 'white', 
                border: '2px solid #f1f5f9', 
                borderRadius: '24px', 
                padding: '32px'
              }}>
                 <textarea 
                   placeholder="Write your response here..." 
                   value={message} 
                   onChange={(e) => setMessage(e.target.value)} 
                   style={{ width: '100%', height: '150px', padding: '24px', borderRadius: '20px', border: 'none', background: '#f8fafc', outline: 'none', fontSize: '1.1rem', resize: 'none', marginBottom: '24px', fontWeight: '500', color: '#1e1b4b' }}
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

           <div style={{ height: '80px' }}></div>
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
