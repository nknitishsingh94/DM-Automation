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
  Zap
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
          triggerOnDms: template !== 'stories',
          triggerOnComments: false,
          triggerOnStories: template === 'stories',
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
            <Smartphone size={18} /> {template === 'stories' ? 'Preview Story Reply' : 'Preview DM Automation'}
          </div>
          
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
                width: '30px', 
                height: '30px', 
                borderRadius: '50%', 
                background: user?.profilePhoto 
                  ? (user.profilePhoto.startsWith('http') ? `url(${user.profilePhoto})` : `url(${API_BASE_URL}/${user.profilePhoto})`)
                  : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid #1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: '800',
                color: 'white',
                flexShrink: 0
              }}>
                {!user?.profilePhoto && user?.username?.charAt(0).toUpperCase()}
              </div>
              <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700' }}>
                {channel === 'facebook' 
                  ? (connectedSettings?.connectedFacebookName || 'Facebook Page')
                  : (connectedSettings?.connectedInstagramName || user?.username || 'Instagram Account')
                }
              </div>
            </div>

            {/* Chat Area Wrapper */}
            <div style={{ position: 'relative', height: '480px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                background: 'linear-gradient(to bottom, #000000, #1a1a1a)', 
                display: 'flex', 
                flexDirection: 'column' 
              }}>


                {/* Chat Messages */}
                <div style={{ 
                  flex: 1, 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  overflowY: 'auto'
                }}>
                  {/* User Keyword Message */}
                  {(keywords.length > 0 || anyKeyword) && (
                    <div style={{ 
                      alignSelf: 'flex-end', 
                      maxWidth: '75%', 
                      background: '#0095f6', 
                      color: 'white', 
                      padding: '10px 16px', 
                      borderRadius: '18px 18px 4px 18px', 
                      fontSize: '0.85rem', 
                      lineHeight: '1.4' 
                    }}>
                      {template === 'stories' 
                        ? (anyKeyword ? 'Replied to your story' : `Replied to your story: ${keywords[0]}`) 
                        : (anyKeyword ? "Hey, I saw your post!" : keywords[0])}
                    </div>
                  )}

                  {/* Opening Message Flow */}
                  {openingMessage && (
                    <>
                      <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                        <div style={{ background: '#262626', borderRadius: '18px 18px 18px 4px', overflow: 'hidden' }}>
                          <div style={{ padding: '12px 16px', borderBottom: '1px solid #333' }}>
                            <span style={{ whiteSpace: 'pre-line', color: 'white', fontSize: '0.8rem', lineHeight: '1.4' }}>{openingMessageText}</span>
                          </div>
                          <div style={{ padding: '12px', textAlign: 'center', color: '#3b82f6', fontSize: '0.8rem', fontWeight: '800' }}>
                            {openingMessageButton}
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        alignSelf: 'flex-end', 
                        maxWidth: '75%', 
                        background: '#0095f6', 
                        color: 'white', 
                        padding: '10px 16px', 
                        borderRadius: '18px 18px 4px 18px', 
                        fontSize: '0.85rem', 
                        lineHeight: '1.4' 
                      }}>
                        {openingMessageButton}
                      </div>
                    </>
                  )}

                  {/* AI Response Card (Generic Template) */}
              {message && (
                <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                  <div style={{ background: '#262626', borderRadius: '18px 18px 18px 4px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: buttons.length > 0 ? '1px solid #333' : 'none' }}>
                      <div style={{ color: 'white', fontSize: '0.8rem', lineHeight: '1.4' }}>{message}</div>
                    </div>
                    {buttons.map((btn, idx) => (
                      <div key={idx} style={{ padding: '12px', textAlign: 'center', borderBottom: idx === buttons.length - 1 ? 'none' : '1px solid #333', color: '#3b82f6', fontSize: '0.8rem', fontWeight: '800' }}>
                        {btn.text || "Visit Link"}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

                {/* DM Bottom Bar */}
                <div style={{ 
                  padding: '12px 16px 30px', 
                  background: '#000', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  borderTop: '1px solid #1a1a1a'
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0095f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={18} color="white" />
                  </div>
                  <div style={{ flex: 1, background: '#121212', border: '1px solid #333', borderRadius: '20px', padding: '8px 16px', color: '#8e8e8e', fontSize: '0.85rem' }}>
                    Message...
                  </div>
                  <ImageIcon size={20} color="white" />
                  <Mic size={20} color="white" />
                  <PlusCircle size={20} color="white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Configuration */}
        <div className="config-panel" style={{ flex: 1, background: 'white', padding: '40px 60px', overflowY: 'auto', maxHeight: '100vh' }}>
          <div style={{ maxWidth: '500px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px', fontWeight: '600' }}>
              <ArrowLeft size={18} /> Back
            </button>

            <div style={{ marginBottom: '32px' }}>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name your automation..." style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e1b4b', border: 'none', outline: 'none', width: '100%', padding: 0 }} />
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>{template === 'stories' ? 'Story Reply Template' : 'Response to all DMs Template'}</p>
            </div>

            {/* Step 1: Follower Gating */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>1</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1b4b' }}>Follower Growth Gating</h3>
              </div>
              <div style={{ padding: '24px', borderRadius: '16px', background: '#ecfdf5', border: '1px solid #10b981', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontWeight: '800', color: '#065f46', fontSize: '0.95rem' }}>Require Follow to Trigger</div>
                  <div onClick={() => setRequireFollow(!requireFollow)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: requireFollow ? '#10b981' : '#cbd5e1', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: requireFollow ? '23px' : '3px', transition: '0.3s' }}></div>
                  </div>
                </div>
                {requireFollow && (
                  <textarea value={unfollowedMessage} onChange={(e) => setUnfollowedMessage(e.target.value)} placeholder="Follow request message..." style={{ width: '100%', height: '70px', padding: '12px', borderRadius: '10px', border: '1px solid #10b981', outline: 'none', fontSize: '0.85rem', resize: 'none' }}></textarea>
                )}
              </div>
            </div>

            {/* Step 2: Keywords */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#1e1b4b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>2</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1b4b' }}>Setup Keywords</h3>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: '700', color: '#475569' }}>Any keyword</span>
                <div onClick={() => setAnyKeyword(!anyKeyword)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: anyKeyword ? '#ef4444' : '#cbd5e1', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: anyKeyword ? '21px' : '3px', transition: '0.3s' }}></div>
                </div>
              </div>
              {!anyKeyword && (
                <div>
                  <input type="text" placeholder="Add Keyword & Press Enter" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyDown={handleAddKeyword} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', outline: 'none', marginBottom: '12px' }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {keywords.map(kw => (
                      <span key={kw} style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {kw} <X size={14} onClick={() => removeKeyword(kw)} style={{ cursor: 'pointer' }} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Response */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#1e1b4b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>3</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1b4b' }}>Send a DM</h3>
              </div>
              <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid #7c3aed', background: 'white' }}>
                <textarea placeholder="Final message..." value={message} onChange={(e) => setMessage(e.target.value)} style={{ width: '100%', height: '110px', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', marginBottom: '20px' }}></textarea>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {buttons.map((btn, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px' }}>
                      <span style={{ fontWeight: '700' }}>{btn.text}</span>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Pencil size={16} onClick={() => openEditLinkModal(idx)} style={{ cursor: 'pointer' }} />
                        <Trash2 size={16} onClick={() => removeLink(idx)} style={{ cursor: 'pointer' }} />
                      </div>
                    </div>
                  ))}
                  {buttons.length < 3 && <button onClick={openAddLinkModal} style={{ padding: '12px', background: 'white', border: '1.5px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer' }}>+ Add Link</button>}
                </div>
              </div>
            </div>

            {/* Advanced: Opening Message */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontWeight: '800' }}>Opening Message</h4>
                <div onClick={() => setOpeningMessage(!openingMessage)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: openingMessage ? '#7c3aed' : '#cbd5e1', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: openingMessage ? '21px' : '3px', transition: '0.3s' }}></div>
                </div>
              </div>
              {openingMessage && (
                <div style={{ padding: '20px', borderRadius: '16px', background: 'white', border: '1px solid #7c3aed' }}>
                  <textarea value={openingMessageText} onChange={(e) => setOpeningMessageText(e.target.value)} style={{ width: '100%', height: '100px', marginBottom: '12px' }}></textarea>
                  <input value={openingMessageButton} onChange={(e) => setOpeningMessageButton(e.target.value)} placeholder="Button Label" style={{ width: '100%', padding: '12px' }} />
                </div>
              )}
            </div>

            <button onClick={handleCreate} disabled={submitting} style={{ width: '100%', padding: '18px', borderRadius: '16px', background: '#7c3aed', color: 'white', border: 'none', fontWeight: '800', marginTop: '30px', cursor: 'pointer' }}>
              {submitting ? 'Creating...' : (template === 'stories' ? 'Create Story Automation' : 'Create DM Automation')}
            </button>
          </div>
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '400px' }}>
            <h3>{editingLinkIndex !== null ? 'Edit Link' : 'Add Link'}</h3>
            <input value={tempLinkTitle} onChange={(e) => setTempLinkTitle(e.target.value)} placeholder="Button Title" style={{ width: '100%', padding: '12px', marginBottom: '12px' }} />
            <input value={tempLinkUrl} onChange={(e) => setTempLinkUrl(e.target.value)} placeholder="URL" style={{ width: '100%', padding: '12px', marginBottom: '20px' }} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleSaveLink} style={{ flex: 1, padding: '12px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px' }}>Save</button>
              <button onClick={() => setShowLinkModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
