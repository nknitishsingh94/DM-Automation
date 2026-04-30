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
  Loader2,
  Pencil,
  Trash2
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
  const [openingMessageText, setOpeningMessageText] = useState("Hey there! I'm so happy you're here, thanks so much for your interest 😊\n\nClick below and I'll send you the link in just a sec 🚀");
  const [openingMessageButton, setOpeningMessageButton] = useState("Send me the link");
  const [requireFollow, setRequireFollow] = useState(true);
  const [unfollowedMessage, setUnfollowedMessage] = useState("Hey! Please follow our account first to get the link! 😊");
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(`${template === 'stories' ? 'Story' : (template === 'dms' ? 'DM' : 'Comment')} Automation #${Math.floor(Math.random() * 1000)}`);
  const [connectedSettings, setConnectedSettings] = useState(null);
  const [realMedia, setRealMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [buttons, setButtons] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState(null);
  const [tempLinkTitle, setTempLinkTitle] = useState('Open Link');
  const [tempLinkUrl, setTempLinkUrl] = useState('https://example.com');
  const [publicReply, setPublicReply] = useState("Check your DMs! 🚀 I've sent you the info.");
  const [triggerOnDms, setTriggerOnDms] = useState(template === 'dms' || template === 'stories');
  const [triggerOnComments, setTriggerOnComments] = useState(template === 'comments');
  const [triggerOnStories, setTriggerOnStories] = useState(template === 'stories');

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const fetchRealMedia = async () => {
    setLoadingMedia(true);
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/instagram/media?type=${template === 'stories' ? 'stories' : 'media'}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRealMedia(data);
      }
    } catch (err) {
      console.error("Failed to fetch IG media:", err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const selectedMedia = realMedia.find(m => m.id === selectedContentId);

  React.useEffect(() => {
    if (!anyStory) {
      fetchRealMedia();
    }
  }, [anyStory, template]);

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

    if (!anyStory && !selectedContentId) {
      notify(`Please select a specific ${template === 'stories' ? 'story' : 'post'} to continue`, 'error');
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
          postId: selectedContentId || '',
          isAnyPost: anyStory,
          platform: channel || 'instagram',
          requireFollow: requireFollow,
          unfollowedResponse: unfollowedMessage,
          openingMessage: openingMessage,
          openingMessageText: openingMessageText,
          openingMessageButton: openingMessageButton,
          publicReplyText: publicReply,
          triggerOnDms,
          triggerOnComments,
          triggerOnStories,
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

            {/* Chat Area */}
            <div style={{ 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              height: '400px',
              overflowY: 'auto'
            }}>
              {/* Selected Media Preview (Dynamic) */}
              {selectedMedia && (
                <div style={{ 
                  width: '100%', 
                  aspectRatio: template === 'stories' ? '9/16' : '1/1',
                  borderRadius: '15px',
                  overflow: 'hidden',
                  marginBottom: '10px',
                  border: '1.5px solid #262626',
                  position: 'relative',
                  flexShrink: 0
                }}>
                  <img 
                    src={selectedMedia.thumbnail_url || selectedMedia.media_url} 
                    alt="Selected Post" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div style={{ 
                    position: 'absolute', bottom: '10px', left: '10px', 
                    background: 'rgba(0,0,0,0.5)', padding: '4px 8px', 
                    borderRadius: '4px', fontSize: '0.6rem', color: 'white', fontWeight: '700' 
                  }}>
                    {template === 'stories' ? 'STORY PREVIEW' : 'POST PREVIEW'}
                  </div>
                </div>
              )}

              {/* User Trigger Bubble */}
              <div style={{ 
                alignSelf: 'flex-end', 
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', 
                color: 'white', 
                padding: '10px 16px', 
                borderRadius: '18px 18px 4px 18px',
                fontSize: '0.8rem',
                fontWeight: '500',
                maxWidth: '85%',
                boxShadow: '0 4px 10px rgba(124, 58, 237, 0.2)'
              }}>
                {keywords.length > 0 ? keywords[0] : 'Set a keyword'}
              </div>

              {/* AI Opening Message Bubble (Matching Photo) */}
              {openingMessage && (
                <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                  <div style={{ 
                    background: '#262626', 
                    color: 'white', 
                    padding: '12px 16px', 
                    borderRadius: '18px 18px 18px 4px',
                    fontSize: '0.8rem',
                    lineHeight: '1.4',
                    marginBottom: '8px',
                    border: '1px solid #333'
                  }}>
                    {openingMessageText}
                    
                    {/* Interactive Button inside Bubble */}
                    <div style={{ 
                      marginTop: '12px',
                      padding: '10px',
                      background: '#333',
                      borderRadius: '10px',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: 'white',
                      border: '1px solid #444'
                    }}>
                      {openingMessageButton}
                    </div>
                  </div>
                </div>
              )}

              {/* Final AI Response Bubble */}
              {message && (
                <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                  <div style={{ 
                    background: '#262626', 
                    color: 'white', 
                    padding: '10px 16px', 
                    borderRadius: '18px 18px 18px 4px',
                    fontSize: '0.8rem',
                    border: '1px solid #333',
                    overflow: 'hidden'
                  }}>
                    {message}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                    {buttons.map((btn, idx) => (
                      <div key={idx} style={{ width: '100%' }}>
                        <div style={{ 
                          padding: '8px 20px', 
                          background: 'white', 
                          border: '1px solid #333', 
                          borderRadius: '20px', 
                          color: '#7c3aed', 
                          fontSize: '0.8rem', 
                          fontWeight: '700',
                          textAlign: 'center'
                        }}>
                          {btn.text || "Visit Link"}
                        </div>
                      </div>
                    ))}
                  </div>
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
            {/* Step 1: Follower Growth Gating (NEW PRIORITY) */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>1</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1b4b' }}>Follower Growth Gating</h3>
              </div>
              
              <div style={{ 
                padding: '24px', 
                borderRadius: '16px', 
                background: '#ecfdf5', 
                border: '1px solid #10b981',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontWeight: '800', color: '#065f46', fontSize: '0.95rem' }}>Require Follow to Trigger</div>
                  <div 
                    onClick={() => setRequireFollow(!requireFollow)}
                    style={{ 
                      width: '44px', height: '24px', borderRadius: '12px', background: requireFollow ? '#10b981' : '#cbd5e1', 
                      position: 'relative', cursor: 'pointer', transition: 'all 0.3s' 
                    }}
                  >
                    <div style={{ 
                      width: '18px', height: '18px', borderRadius: '50%', background: 'white', 
                      position: 'absolute', top: '3px', left: requireFollow ? '23px' : '3px', transition: 'all 0.3s' 
                    }}></div>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#047857', marginBottom: '20px', lineHeight: '1.4' }}>
                  Only people who follow you will receive your link. Non-followers will get a request to follow you first. 🚀
                </p>
                
                {requireFollow && (
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#065f46', marginBottom: '8px' }}>Follow Request Message</div>
                    <textarea 
                      value={unfollowedMessage}
                      onChange={(e) => setUnfollowedMessage(e.target.value)}
                      placeholder="E.g. Please follow us first!"
                      style={{ 
                        width: '100%', height: '70px', padding: '12px', borderRadius: '10px', border: '1px solid #10b981', 
                        outline: 'none', fontSize: '0.85rem', resize: 'none', lineHeight: '1.5', background: 'white'
                      }}
                    ></textarea>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Post Selection Cards */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div 
                  onClick={() => setAnyStory(true)}
                  style={{ 
                    padding: '24px',
                    borderRadius: '20px',
                    background: anyStory ? '#fef2f2' : 'white',
                    border: anyStory ? '2px solid #ef4444' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '12px', 
                    background: anyStory ? '#ef4444' : '#f1f5f9', 
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <Zap size={24} fill={anyStory ? 'white' : 'none'} color={anyStory ? 'white' : '#64748b'} />
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: anyStory ? '#991b1b' : '#64748b' }}>
                    Next Post<br/>or Reel
                  </div>
                </div>

                <div 
                  onClick={() => setAnyStory(false)}
                  style={{ 
                    padding: '24px',
                    borderRadius: '20px',
                    background: !anyStory ? '#fef2f2' : 'white',
                    border: !anyStory ? '2px solid #ef4444' : '1px dashed #cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '12px', 
                    background: !anyStory ? '#ef4444' : 'transparent', 
                    color: !anyStory ? 'white' : '#cbd5e1', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: !anyStory ? 'none' : '2px dashed #cbd5e1'
                  }}>
                    <ImageIcon size={24} color={!anyStory ? 'white' : '#cbd5e1'} />
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: !anyStory ? '#991b1b' : '#cbd5e1' }}>
                    Specific<br/>Content
                  </div>
                </div>
              </div>

              {!anyStory && (
                <div style={{ marginTop: '20px', padding: '20px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  {loadingMedia ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                      <Loader2 className="animate-spin" style={{ margin: '0 auto 8px' }} />
                      Fetching your content...
                    </div>
                  ) : realMedia.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.85rem' }}>
                      No posts found.
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '12px'
                    }}>
                      {realMedia.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedContentId(item.id)}
                          style={{ 
                            aspectRatio: template === 'stories' ? '9/16' : '1/1',
                            background: '#e2e8f0',
                            borderRadius: '12px',
                            border: selectedContentId === item.id ? '3px solid #ef4444' : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            overflow: 'hidden',
                            position: 'relative'
                          }}
                        >
                          <img 
                            src={item.thumbnail_url || item.media_url} 
                            alt="IG Media" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                          {selectedContentId === item.id && (
                            <div style={{ 
                              position: 'absolute', top: '4px', right: '4px', 
                              background: '#ef4444', borderRadius: '50%', padding: '2px' 
                            }}>
                              <CheckCircle2 size={12} color="white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Trigger Sources Selection */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div 
                  onClick={() => setTriggerOnDms(!triggerOnDms)}
                  style={{ 
                    padding: '10px 16px', borderRadius: '10px', border: triggerOnDms ? '2px solid #ef4444' : '1.5px solid #e2e8f0',
                    background: triggerOnDms ? '#fef2f2' : 'white', color: triggerOnDms ? '#ef4444' : '#64748b',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <Send size={14} /> DMs
                </div>
                <div 
                  onClick={() => setTriggerOnComments(!triggerOnComments)}
                  style={{ 
                    padding: '10px 16px', borderRadius: '10px', border: triggerOnComments ? '2px solid #ef4444' : '1.5px solid #e2e8f0',
                    background: triggerOnComments ? '#fef2f2' : 'white', color: triggerOnComments ? '#ef4444' : '#64748b',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <ImageIcon size={14} /> Comments
                </div>
                <div 
                  onClick={() => setTriggerOnStories(!triggerOnStories)}
                  style={{ 
                    padding: '10px 16px', borderRadius: '10px', border: triggerOnStories ? '2px solid #ef4444' : '1.5px solid #e2e8f0',
                    background: triggerOnStories ? '#fef2f2' : 'white', color: triggerOnStories ? '#ef4444' : '#64748b',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <Zap size={14} /> Story Mentions
                </div>
              </div>
            </div>

            {/* Step 2: Keywords */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#1e1b4b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>2</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1b4b' }}>Setup Keywords</h3>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>Any keyword</span>
                <div 
                  onClick={() => setAnyKeyword(!anyKeyword)}
                  style={{ 
                    width: '40px', height: '22px', borderRadius: '11px', background: anyKeyword ? '#ef4444' : '#cbd5e1', 
                    position: 'relative', cursor: 'pointer', transition: 'all 0.3s' 
                  }}
                >
                  <div style={{ 
                    width: '16px', height: '16px', borderRadius: '50%', background: 'white', 
                    position: 'absolute', top: '3px', left: anyKeyword ? '21px' : '3px', transition: 'all 0.3s' 
                  }}></div>
                </div>
              </div>

              {!anyKeyword && (
                <div>
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <input 
                      type="text" 
                      placeholder="Type & Hit ↵ Enter to add Keyword"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleAddKeyword}
                      style={{ 
                        width: '100%', padding: '14px 45px 14px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', 
                        outline: 'none', fontSize: '0.9rem', fontWeight: '500'
                      }}
                    />
                    <div style={{ 
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      width: '28px', height: '28px', borderRadius: '8px', background: '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
                    }}>
                      <Plus size={16} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {keywords.map(kw => (
                      <span key={kw} style={{ 
                        background: '#f1f5f9', color: '#475569', padding: '6px 12px', 
                        borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', 
                        display: 'flex', alignItems: 'center', gap: '8px' 
                      }}>
                        {kw} <X size={14} onClick={() => removeKeyword(kw)} style={{ cursor: 'pointer', color: '#94a3b8' }} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Send a DM */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#1e1b4b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}>3</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e1b4b' }}>Send a DM</h3>
              </div>
              
              <div style={{ 
                padding: '24px', 
                borderRadius: '16px', 
                background: 'white', 
                border: '1px solid #7c3aed',
                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#4338ca', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Send size={14} /> DM Response Text
                </div>
                <textarea 
                  placeholder="Enter your final message here... (e.g. Here is your link!)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ 
                    width: '100%', height: '110px', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', 
                    outline: 'none', fontSize: '0.9rem', resize: 'none', marginBottom: '8px', lineHeight: '1.5',
                    background: '#fcfaff'
                  }}
                ></textarea>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'right', marginBottom: '20px' }}>{message.length}/1000 characters</div>

                {/* Link Section Inside Box */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#4338ca', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LinkIcon size={14} /> Link & Call to Action
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {buttons.map((btn, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <LinkIcon size={16} color="#7c3aed" />
                          <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e1b4b' }}>{btn.text}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <Pencil size={16} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => openEditLinkModal(idx)} />
                          <Trash2 size={16} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => removeLink(idx)} />
                        </div>
                      </div>
                    ))}

                    {buttons.length < 3 && (
                      <button 
                        onClick={openAddLinkModal}
                        style={{ 
                          width: '100%',
                          padding: '12px',
                          background: 'white',
                          border: '1.5px dashed #cbd5e1',
                          borderRadius: '12px',
                          color: '#64748b',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                      >
                        <Plus size={18} /> Add Link
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Automations (Matching Photo) */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px', paddingBottom: '60px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e1b4b' }}>Advanced Automations</h4>
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
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '20px' }}>Grow your audience faster — with smart, hands-free engagement.</p>
              
              {openingMessage && (
                <div style={{ 
                  padding: '20px', 
                  borderRadius: '16px', 
                  background: 'white', 
                  border: '1px solid #7c3aed',
                  boxShadow: '0 4px 20px rgba(124, 58, 237, 0.05)',
                  marginBottom: '24px'
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '12px' }}>Opening Message</div>
                  <textarea 
                    value={openingMessageText}
                    onChange={(e) => setOpeningMessageText(e.target.value)}
                    placeholder="Enter opening message..."
                    style={{ 
                      width: '100%', height: '120px', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', 
                      outline: 'none', fontSize: '0.85rem', resize: 'none', marginBottom: '16px', lineHeight: '1.5'
                    }}
                  ></textarea>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      value={openingMessageButton}
                      onChange={(e) => setOpeningMessageButton(e.target.value)}
                      placeholder="Button Label (e.g. Send me the link)"
                      style={{ 
                        width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', 
                        outline: 'none', fontSize: '0.85rem', fontWeight: '700'
                      }}
                    />
                    <CheckCircle2 size={18} color="#7c3aed" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
              )}


              {/* Public Comment Reply (Now shown if triggerOnComments is true) */}
              {triggerOnComments && (
                <div style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e1b4b' }}>Public Comment Reply</h4>
                    <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800' }}>RECOMMENDED</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>This message will be posted publicly on the user's comment.</p>
                  
                  <div style={{ 
                    padding: '16px', 
                    borderRadius: '12px', 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0'
                  }}>
                    <input 
                      type="text" 
                      value={publicReply}
                      onChange={(e) => setPublicReply(e.target.value)}
                      placeholder="Check your DMs! 🚀"
                      style={{ 
                        width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', 
                        outline: 'none', fontSize: '0.85rem', background: 'white'
                      }}
                    />
                  </div>
                </div>
              )}
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

      {/* Add/Edit Link Modal */}
      {showLinkModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            width: '90%',
            maxWidth: '450px',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowLinkModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '24px' }}>Add Link</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={14} /> Enter Title
                </div>
                <input 
                  type="text"
                  value={tempLinkTitle}
                  onChange={(e) => setTempLinkTitle(e.target.value)}
                  placeholder="e.g. Open Link"
                  style={{ 
                    width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', 
                    outline: 'none', fontSize: '0.95rem', fontWeight: '600'
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LinkIcon size={14} /> Enter Link
                </div>
                <input 
                  type="text"
                  value={tempLinkUrl}
                  onChange={(e) => setTempLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  style={{ 
                    width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', 
                    outline: 'none', fontSize: '0.95rem', fontWeight: '600'
                  }}
                />
              </div>

              <button 
                onClick={handleSaveLink}
                style={{ 
                  marginTop: '10px',
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  color: 'white',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.3)'
                }}
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
