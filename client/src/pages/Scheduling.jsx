import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Calendar, Clock, Video, Image as ImageIcon, Send, X, Check, ChevronLeft, ChevronRight, 
  Trash2, Globe, Lock, AlertCircle, Info, Sparkles, Volume2, VolumeX, Zap,
  ArrowLeft, Heart, MessageCircle, Home, Layout, Instagram, Target, ArrowRight, Film, Copy,
  Save, Layers, UploadCloud, Eye, FileText, Loader2, Bookmark, MessageSquare, Key, Smartphone,
  Link as LinkIcon, Pencil
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';
import { useAuth } from '../context/AuthContext';

export default function Scheduling() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false); // Modal state
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useNotification();
  const [settings, setSettings] = useState(null);

  // Caption State
  const [savedCaptions, setSavedCaptions] = useState([]);
  const [showCaptionsModal, setShowCaptionsModal] = useState(false);

  // New Post State
  const [postType, setPostType] = useState('image'); 
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const [newPost, setNewPost] = useState({
    caption: '',
    scheduledFor: '',
    mediaUrl: '',
    triggerKeyword: '',
    autoResponse: '',
    coverUrl: '',
    // Advanced Automation Fields
    requireFollow: true,
    unfollowedResponse: "Hey! Please follow our account first to get the link! 😊",
    openingMessage: false,
    openingMessageText: "Hey there! I'm so happy you're here, thanks so much for your interest 😊\n\nClick below and I'll send you the link in just a sec 🚀",
    openingMessageButton: "Send me the link",
    buttons: [],
    anyKeyword: false,
    publicReply: "Check your DMs! 🚀 I've sent you the info."
  });

  useEffect(() => {
    fetchPosts();
    fetchCaptions();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data) setSettings(data);
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const fetchPosts = async () => {
    const token = localStorage.getItem('insta_agent_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/scheduling`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error("Error fetching scheduled posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaptions = async () => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/captions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setSavedCaptions(data);
    } catch (err) {
      console.error("Error fetching captions:", err);
    }
  };

  const handleSaveCaption = async () => {
    if (!newPost.caption.trim()) return;
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/captions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newPost.caption.substring(0, 20) + '...',
          content: newPost.caption
        })
      });
      if (res.ok) {
        notify("Caption saved!", "success");
        fetchCaptions();
      }
    } catch (err) {
      notify("Failed to save caption", "error");
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 10 files for carousel
    const totalFiles = [...selectedFiles, ...files].slice(0, 10);
    
    // Create previews ONLY for the NEW files to avoid re-generating existing ones
    const newPreviews = [...previews];
    files.forEach(file => {
      if (newPreviews.length < 10) {
        newPreviews.push(URL.createObjectURL(file));
      }
    });

    setSelectedFiles(totalFiles);
    setPreviews(newPreviews);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    
    // Revoke the URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index]);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('insta_agent_token');
    if (!token) {
      notify("Session expired. Please log in again.", "error");
      return;
    }

    if (!newPost.scheduledFor) {
      notify("Please select a date and time", "error");
      return;
    }

    setSubmitting(true);
    
    const formData = new FormData();
    formData.append('caption', newPost.caption);
    formData.append('scheduledFor', newPost.scheduledFor);
    formData.append('triggerKeyword', newPost.triggerKeyword);
    formData.append('autoResponse', newPost.autoResponse);
    formData.append('type', postType);
    
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/scheduling`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        // 1. Close creation modal first
        setShowCreate(false);
        
        // 2. Update list immediately (Manual Prepend)
        setPosts(prev => [data, ...prev]);

        // 3. Set created post for the success modal
        setCreatedPost({
          ...data,
          anyKeyword: data.triggerKeyword === '*'
        });

        // 4. Trigger Success Flow with a tiny delay to ensure UI has settled
        setTimeout(() => {
          setShowSuccess(true);
          fetchPosts(); // Background sync to be 100% sure
        }, 100);
        
        // 5. Clear form (keeping previews for modal)
        setNewPost({ caption: '', scheduledFor: '', mediaUrl: '', triggerKeyword: '', autoResponse: '', coverUrl: '' });
        setSelectedFiles([]);
      } else {
        notify("Failed to schedule post", "error");
      }
    } catch (err) {
      notify("Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPost, setCreatedPost] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isPreviewMuted, setIsPreviewMuted] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState(null);
  const [tempLinkTitle, setTempLinkTitle] = useState('Open Link');
  const [tempLinkUrl, setTempLinkUrl] = useState('https://example.com');
  const [keywordInput, setKeywordInput] = useState('');
  const [previewMode, setPreviewMode] = useState('dm'); // 'dm' or 'post'

  const openAddLinkModal = () => {
    setEditingLinkIndex(null);
    setTempLinkTitle('Open Link');
    setTempLinkUrl('https://example.com');
    setShowLinkModal(true);
  };

  const openEditLinkModal = (index) => {
    setEditingLinkIndex(index);
    setTempLinkTitle(createdPost.buttons[index].text);
    setTempLinkUrl(createdPost.buttons[index].url);
    setShowLinkModal(true);
  };

  const handleSaveLink = () => {
    if (!tempLinkTitle.trim() || !tempLinkUrl.trim()) return;
    const newButtons = [...(createdPost.buttons || [])];
    if (editingLinkIndex !== null) {
      newButtons[editingLinkIndex] = { text: tempLinkTitle, url: tempLinkUrl };
    } else {
      if (newButtons.length >= 3) return;
      newButtons.push({ text: tempLinkTitle, url: tempLinkUrl });
    }
    setCreatedPost({ ...createdPost, buttons: newButtons });
    setShowLinkModal(false);
  };

  const removeLink = (index) => {
    const newButtons = (createdPost.buttons || []).filter((_, i) => i !== index);
    setCreatedPost({ ...createdPost, buttons: newButtons });
  };

  const toggleAutomationStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      // Optimistic Update
      setPosts(prev => prev.map(p => p._id === id ? { ...p, automationStatus: newStatus } : p));
      
      const res = await fetch(`${API_BASE_URL}/api/scheduling/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ automationStatus: newStatus })
      });
      if (!res.ok) {
        fetchPosts(); // Rollback
        notify("Failed to update status", "error");
      }
    } catch (err) {
      fetchPosts();
      notify("Network error", "error");
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled post?")) return;
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/scheduling/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        notify("Post cancelled", "success");
        fetchPosts();
      }
    } catch (err) {
      notify("Error deleting post", "error");
    }
  };

  const handleAIGenerate = async (field, prompt) => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const originalValue = createdPost[field];
      setCreatedPost(prev => ({ ...prev, [field]: "🤖 AI is thinking..." }));
      
      const res = await fetch(`${API_BASE_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.response) {
        setCreatedPost(prev => ({ ...prev, [field]: data.response }));
        notify("AI content generated!", "success");
      } else {
        setCreatedPost(prev => ({ ...prev, [field]: originalValue }));
        notify("AI failed to generate", "error");
      }
    } catch (err) {
      notify("Network error", "error");
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading your schedule...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '12px', letterSpacing: '-0.5px' }}>
            Content <span style={{ color: '#7c3aed' }}>Scheduler</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', fontWeight: '500' }}>
            Plan, Manage and Automate your Instagram content effortlessly.
          </p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '100px 40px', 
          background: 'white', 
          borderRadius: '32px', 
          border: '2px dashed #e2e8f0',
          animation: 'slideUp 0.6s ease-out'
        }}>
          <div style={{ width: '80px', height: '80px', background: '#f5f3ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
            <Calendar size={40} color="#7c3aed" />
          </div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '12px' }}>No content in the queue</h3>
          <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px auto' }}>Plan your marketing strategy ahead of time. Schedule your first post now!</p>
          <button 
            onClick={() => setShowCreate(true)} 
            style={{ 
              background: '#0f172a', color: 'white', padding: '16px 40px', borderRadius: '16px', 
              fontWeight: '800', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' 
            }}
          >
            Start Scheduling
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {posts.map(post => {
            // Smart Media Parser
            let mediaData = { type: 'image', mediaUrl: post.mediaUrl };
            try {
               if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
                 mediaData = JSON.parse(post.mediaUrl);
               }
            } catch (e) {}

            const finalMediaUrl = mediaData.mediaUrl && mediaData.mediaUrl.startsWith('http') 
              ? mediaData.mediaUrl 
              : (mediaData.mediaUrl ? `${API_BASE_URL}${mediaData.mediaUrl}` : '/placeholder-ig.png');

            return (
            <div 
              key={post._id} 
              className="scheduling-card" 
              style={{ 
                background: 'white', borderRadius: '28px', overflow: 'hidden', 
                border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              {/* Image Preview */}
              <div style={{ height: '220px', background: '#f8fafc', position: 'relative' }}>
                {mediaData.type === 'reel' || (finalMediaUrl && finalMediaUrl.match(/\.(mp4|mov|webm)$/i)) ? (
                   <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <video 
                      src={finalMediaUrl} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                       <Film size={40} color="white" />
                    </div>
                  </div>
                ) : (
                  <img 
                    src={finalMediaUrl} 
                    alt="Preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                )}
                
                {/* Status Badge */}
                <div style={{ 
                  position: 'absolute', top: '16px', left: '16px', 
                  background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)',
                  padding: '6px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: post.status === 'Posted' ? '#10b981' : '#7c3aed' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1e1b4b' }}>
                    {post.status || 'SCHEDULED'}
                  </span>
                  {/* Automation Status Mini-Toggle */}
                  {(post.autoResponse || post.triggerKeyword) && (
                    <div 
                      onClick={(e) => {
                         e.stopPropagation();
                         const newStatus = post.automationStatus === 'Paused' ? 'Active' : 'Paused';
                         toggleAutomationStatus(post._id, newStatus);
                      }}
                      style={{ 
                        width: '24px', height: '12px', borderRadius: '6px', 
                        background: post.automationStatus === 'Paused' ? '#cbd5e1' : '#10b981',
                        position: 'relative', cursor: 'pointer', marginLeft: '4px'
                      }}>
                       <div style={{ 
                         width: '10px', height: '10px', borderRadius: '50%', background: 'white',
                         position: 'absolute', top: '1px', left: post.automationStatus === 'Paused' ? '1px' : '13px',
                         transition: '0.2s'
                       }}></div>
                    </div>
                  )}
                </div>

                <div style={{ 
                  position: 'absolute', top: '16px', right: '16px', 
                  background: 'rgba(30, 27, 75, 0.7)', backdropFilter: 'blur(4px)',
                  color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '800' 
                }}>
                   {(post.type || 'IMAGE').toUpperCase()}
                </div>
              </div>

              {/* Card Details */}
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#64748b' }}>
                  <Calendar size={14} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                    {new Date(post.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <Clock size={14} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                    {new Date(post.scheduledFor).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p style={{ 
                  fontSize: '0.95rem', fontWeight: '600', color: '#1e293b', marginBottom: '20px',
                  display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.8rem'
                }}>
                  {post.caption || 'No caption provided.'}
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => deletePost(post._id)} 
                    style={{ 
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '12px', borderRadius: '14px', border: '1.5px solid #fee2e2', 
                      background: 'white', color: '#ef4444', fontWeight: '800', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#fef2f2'}
                    onMouseOut={(e) => e.target.style.background = 'white'}
                  >
                    <Trash2 size={16} /> Cancel
                  </button>
                   <button 
                    onClick={() => {
                      setCreatedPost({
                        ...post,
                        anyKeyword: post.triggerKeyword === '*',
                        automationStatus: post.automationStatus || 'Active'
                      });
                      setShowAdvanced(true);
                    }}
                    style={{ 
                      flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '12px', borderRadius: '14px', border: '1.5px solid #f5f3ff', 
                      background: '#f5f3ff', color: '#7c3aed', fontWeight: '800', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Zap size={16} /> Automation
                  </button>
                  <button 
                    style={{ 
                      padding: '12px', borderRadius: '14px', border: '1.5px solid #e2e8f0', 
                      background: 'white', color: '#64748b', cursor: 'pointer'
                    }}
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* --- CREATE MODAL (NEW) --- */}
      {showCreate && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' 
        }}>
          <div style={{ 
            background: '#f8fafc', borderRadius: '32px', width: '100%', maxWidth: '1200px', height: '90vh', 
            overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 50px 100px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '24px 32px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>New Schedule</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setShowCreate(false)}
                  style={{ padding: '10px 20px', borderRadius: '12px', background: '#f1f5f9', border: 'none', color: '#64748b', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddSubmit}
                  disabled={submitting}
                  style={{ padding: '10px 32px', borderRadius: '12px', background: '#7c3aed', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Schedule'}
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
                {/* Left Side: Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Post Type Selector */}
                  <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', marginBottom: '16px' }}>Post Type</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {[
                        { id: 'image', label: 'Image', icon: <ImageIcon size={18} /> },
                        { id: 'carousel', label: 'Carousel', icon: <Layers size={18} /> },
                        { id: 'reel', label: 'Reel', icon: <Film size={18} /> },
                        { id: 'story', label: 'Story', icon: <Zap size={18} /> }
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => { setPostType(type.id); setSelectedFiles([]); setPreviews([]); }}
                          style={{ 
                            flex: 1, padding: '12px', borderRadius: '12px', border: postType === type.id ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                            background: postType === type.id ? '#f5f3ff' : 'white',
                            color: postType === type.id ? '#7c3aed' : '#64748b',
                            fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
                          }}
                        >
                          {type.icon} {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Story Info Box */}
                  {postType === 'story' && (
                    <div style={{ background: '#ecf9ff', padding: '20px', borderRadius: '20px', border: '1px solid #bae6fd', display: 'flex', gap: '16px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertCircle size={16} />
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: '800', color: '#0369a1' }}>Story Upload</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#0369a1', lineHeight: '1.5' }}>
                          Upload an image or video for your story. No caption needed. Stickers and links are not supported via scheduling platforms.
                        </p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', fontWeight: '700', color: '#0369a1' }}>
                          💡 Quick Tip: Use <a href="https://www.canva.com/templates/" target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Canva</a> to add music, stickers, and text to your stories before uploading!
                        </p>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                    {/* Schedule Time */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', marginBottom: '12px' }}>* Schedule Time</label>
                      <input 
                        type="datetime-local" 
                        value={newPost.scheduledFor} 
                        onChange={e => setNewPost({...newPost, scheduledFor: e.target.value})}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', fontWeight: '600' }} 
                        required
                      />
                    </div>
                  </div>

                  {/* Caption Section (Hidden for Story) */}
                  {postType !== 'story' && (
                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b' }}>Caption</label>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <button onClick={() => setShowCaptionsModal(true)} type="button" style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer' }}>
                            Saved Captions
                          </button>
                        </div>
                      </div>
                      <textarea 
                        value={newPost.caption} 
                        onChange={e => setNewPost({...newPost, caption: e.target.value})}
                        placeholder="Write your caption..."
                        style={{ width: '100%', height: '100px', padding: '16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', resize: 'none' }}
                        required
                      />
                    </div>
                  )}

                  {/* Upload Area */}
                  <div style={{ 
                    background: 'white', padding: previews.length > 0 ? '12px' : '40px', borderRadius: '24px', border: '2px dashed #e2e8f0', 
                    textAlign: 'center', cursor: previews.length > 0 ? 'default' : 'pointer', minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }} 
                  onClick={() => previews.length === 0 && fileInputRef.current.click()}>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple={postType === 'carousel'} accept={postType === 'reel' ? 'video/*' : 'image/*,video/*'} onChange={handleFileChange} />
                    
                    {previews.length > 0 ? (
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', padding: '8px' }}>
                          {previews.map((src, idx) => (
                            <div key={idx} style={{ aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f1f5f9', position: 'relative' }}>
                               {selectedFiles[idx]?.type.startsWith('video') ? (
                                 <video src={src} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                               ) : (
                                 <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                               )}
                               <button 
                                 onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                 style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                               >
                                 <X size={12} />
                               </button>
                            </div>
                          ))}
                          
                          {/* Add More Button for Carousel */}
                          {postType === 'carousel' && previews.length < 10 && (
                            <div 
                              onClick={() => fileInputRef.current.click()}
                              style={{ 
                                aspectRatio: '1/1', borderRadius: '12px', border: '2px dashed #7c3aed', 
                                background: '#f5f3ff', display: 'flex', flexDirection: 'column', 
                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                color: '#7c3aed', gap: '4px', transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#ede9fe'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#f5f3ff'}
                            >
                              <Plus size={20} strokeWidth={3} />
                              <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>ADD MORE</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={32} color="#7c3aed" style={{ marginBottom: '12px' }} />
                        <p style={{ fontSize: '0.9rem', fontWeight: '700' }}>
                          {postType === 'story' ? 'Click or drag to upload image or video for story' : 'Click to upload media'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Side: Preview */}
                <div style={{ position: 'sticky', top: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', marginBottom: '16px' }}>Live Preview</label>
                    <div style={{ 
                      width: '100%', 
                      maxWidth: '300px', 
                      height: '600px', 
                      background: '#000', 
                      borderRadius: '42px', 
                      border: '10px solid #1e1b4b',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)',
                      margin: '0 auto'
                    }}>
                      {/* Realistic Notch (Dynamic Island) */}
                      <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: '90px', height: '22px', background: '#000', borderRadius: '20px', zIndex: 10 }}></div>

                      {/* Status Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 28px 0', fontSize: '0.7rem', color: 'white', fontWeight: '600' }}>
                        <span>9:41</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <Zap size={10} fill="white" />
                          <div style={{ width: '14px', height: '8px', border: '1px solid white', borderRadius: '2px' }}></div>
                        </div>
                      </div>

                      {/* Instagram Header */}
                      <div style={{ padding: '20px 20px 10px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1a1a1a', background: '#000' }}>
                        <ArrowLeft size={18} color="white" />
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', 
                          background: user?.profilePhoto ? `url(${user.profilePhoto})` : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                          backgroundSize: 'cover', border: '1px solid #1a1a1a', flexShrink: 0 
                        }}></div>
                        <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700' }}>
                          {settings?.connectedInstagramName || user?.username || 'instagram_user'}
                        </div>
                      </div>

                      {/* Main Media Display */}
                      <div style={{ width: '100%', height: '320px', background: '#000', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {previews.length > 0 ? (
                          <>
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                              {previews[currentPreviewIndex] ? (
                                (selectedFiles[currentPreviewIndex]?.type?.startsWith('video') || (typeof previews[currentPreviewIndex] === 'string' && (previews[currentPreviewIndex].includes('.mp4') || previews[currentPreviewIndex].includes('.mov') || previews[currentPreviewIndex].includes('.webm')))) ? (
                                  <>
                                    <video 
                                      key={previews[currentPreviewIndex]} 
                                      src={previews[currentPreviewIndex]} 
                                      autoPlay 
                                      muted={isPreviewMuted}
                                      loop 
                                      playsInline
                                      style={{ width: '100%', height: '100%', objectFit: (postType === 'reel' || postType === 'story') ? 'cover' : 'cover', background: '#000' }} 
                                    />
                                    <button 
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsPreviewMuted(!isPreviewMuted); }}
                                      style={{ position: 'absolute', bottom: '12px', right: '12px', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20, color: 'white' }}
                                    >
                                      {isPreviewMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                    </button>
                                  </>
                                ) : (
                                  <img key={previews[currentPreviewIndex]} src={previews[currentPreviewIndex]} style={{ width: '100%', height: '100%', objectFit: (postType === 'reel' || postType === 'story') ? 'cover' : 'cover', background: '#000' }} />
                                )
                              ) : (
                                <div style={{ textAlign: 'center', color: '#333' }}>
                                   <ImageIcon size={48} />
                                   <p style={{ fontSize: '0.7rem', marginTop: '8px', fontWeight: '700' }}>Select {postType} to preview</p>
                                </div>
                              )}
                            </div>

                            {previews.length > 1 && (
                              <>
                                <button onClick={() => setCurrentPreviewIndex(prev => (prev === 0 ? previews.length - 1 : prev - 1))} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}><ChevronLeft size={16} /></button>
                                <button onClick={() => setCurrentPreviewIndex(prev => (prev === previews.length - 1 ? 0 : prev + 1))} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}><ChevronRight size={16} /></button>
                                <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
                                  {previews.map((_, i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: i === currentPreviewIndex ? '#7c3aed' : 'rgba(255,255,255,0.5)' }} />)}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <ImageIcon size={48} color="#333" />
                        )}
                      </div>

                      {/* Instagram Post Footer */}
                      <div style={{ padding: '12px 16px', background: '#000' }}>
                        <div style={{ display: 'flex', gap: '14px', marginBottom: '8px' }}>
                           <Heart size={20} color="white" />
                           <MessageCircle size={20} color="white" />
                           <Send size={20} color="white" />
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'white', marginBottom: '4px' }}>1,234 likes</div>
                        <div style={{ fontSize: '0.75rem', color: 'white', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>
                          <span style={{ fontWeight: '800', marginRight: '6px' }}>{user?.username || 'user'}</span>
                          {newPost.caption || '...'}
                        </div>
                      </div>

                      {/* Bottom Tab Bar Mockup */}
                      <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '44px', background: '#000', borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: '12px' }}>
                         <Home size={18} color="white" />
                         <ImageIcon size={18} color="white" />
                         <Plus size={18} color="white" />
                         <Zap size={18} color="white" />
                         <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#333' }}></div>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Captions Modal */}
      {showCaptionsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Saved Captions</h3>
                <button onClick={() => setShowCaptionsModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                {savedCaptions.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center' }}>No saved captions found.</p> : savedCaptions.map(cap => (
                  <div 
                    key={cap._id} 
                    onClick={() => { setNewPost({...newPost, caption: cap.content}); setShowCaptionsModal(false); }}
                    style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', cursor: 'pointer' }}
                  >
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>{cap.title}</div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{cap.content}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* --- SUCCESS MODAL WITH ADVANCED AUTOMATION LINK --- */}
      {showSuccess && createdPost && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '16px' 
        }}>
          <div style={{ 
            background: 'white', borderRadius: '28px', width: '95%', maxWidth: '400px', 
            maxHeight: '90vh', overflowY: 'auto',
            padding: '32px 24px', textAlign: 'center', boxShadow: '0 40px 80px rgba(0,0,0,0.2)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '8px' }}>Post Scheduled!</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500', marginBottom: '24px' }}>
              Your content is ready to go live on Instagram. Now, set up your marketing automation!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => { setShowSuccess(false); setPreviews([]); }}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#7c3aed', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)' }}
              >
                Close
              </button>
              
              <button 
                onClick={() => { setShowSuccess(false); setShowAdvanced(true); }}
                style={{ 
                  width: '100%', padding: '14px', borderRadius: '14px', background: '#f5f3ff', 
                  color: '#7c3aed', border: 'none', fontWeight: '800', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <Zap size={16} /> Advanced Automation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADVANCED AUTOMATION EDITOR (SIDE DRAWER/MODAL) --- */}
      {showAdvanced && createdPost && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000,
          padding: '20px'
        }}>
          <div style={{ 
            background: 'white', width: '96%', maxWidth: '1440px', height: '90vh', borderRadius: '40px', 
            display: 'grid', gridTemplateColumns: '480px 1fr', overflow: 'hidden', position: 'relative',
            animation: 'modalSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
             {/* Left side: Chat Preview (Premium) */}
             <div style={{ background: '#f8fafc', borderRight: '1.5px solid #e2e8f0', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
                 <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#64748b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      <Smartphone size={18} /> Chat Preview
                    </div>
                    {/* View Toggle */}
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                       <button 
                         onClick={() => setPreviewMode('post')}
                         style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: previewMode === 'post' ? 'white' : 'transparent', color: previewMode === 'post' ? '#1e1b4b' : '#64748b', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', boxShadow: previewMode === 'post' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
                         Post View
                       </button>
                       <button 
                         onClick={() => setPreviewMode('dm')}
                         style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: previewMode === 'dm' ? 'white' : 'transparent', color: previewMode === 'dm' ? '#1e1b4b' : '#64748b', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', boxShadow: previewMode === 'dm' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
                         DM View
                       </button>
                    </div>
                 </div>
                
                {/* iPhone Mockup */}
                <div style={{ 
                  width: '280px', height: '580px', background: '#000', borderRadius: '40px', border: '8px solid #1e1b4b',
                  position: 'relative', overflow: 'hidden', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)'
                }}>
                   <div style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '18px', background: '#000', borderRadius: '20px', zIndex: 10 }}></div>
                   
                   <div style={{ height: '100%', background: 'linear-gradient(to bottom, #000000, #1a1a1a)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      {/* IG Header (Small) */}
                      <div style={{ padding: '30px 20px 10px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 5 }}>
                        <ArrowLeft size={16} color="white" />
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: '800', color: 'white' }}>
                          {(settings?.connectedInstagramName || user?.username || 'IG').substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: '700' }}>
                          {settings?.connectedInstagramName || user?.username || 'Instagram Account'}
                        </div>
                      </div>

                      {/* Dynamic View Content */}
                      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                         {previewMode === 'post' ? (
                            /* SIMULATED POST VIEW */
                            <div style={{ height: '100%', background: '#000', display: 'flex', flexDirection: 'column' }}>
                               <div style={{ flex: 1, position: 'relative', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {(() => {
                                      // Reuse media parsing logic
                                      let mUrl = createdPost?.mediaUrl;
                                      let mediaData = typeof mUrl === 'string' && mUrl.trim().startsWith('{') ? JSON.parse(mUrl) : (typeof mUrl === 'object' ? mUrl : { mediaUrl: mUrl });
                                      let rawUrl = mediaData.mediaUrl || mediaData.url || (typeof mUrl === 'string' ? mUrl : '');
                                      const base = (API_BASE_URL && API_BASE_URL !== '/') ? API_BASE_URL : window.location.origin;
                                      const finalUrl = rawUrl?.startsWith('http') ? rawUrl : `${base}${rawUrl?.startsWith('/') ? '' : '/'}${rawUrl}`;
                                      
                                      return <img src={finalUrl || '/placeholder-ig.png'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                                  })()}

                                  {/* Comments Overlay */}
                                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: '#121212', borderRadius: '20px 20px 0 0', padding: '16px', boxShadow: '0 -10px 30px rgba(0,0,0,0.5)', zIndex: 10 }}>
                                     <div style={{ width: '32px', height: '4px', background: '#333', borderRadius: '2px', margin: '0 auto 12px' }}></div>
                                     <div style={{ color: 'white', fontSize: '0.75rem', fontWeight: '800', textAlign: 'center', marginBottom: '16px' }}>Comments</div>
                                     <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}></div>
                                        <div>
                                           <div style={{ color: 'white', fontSize: '0.7rem', fontWeight: '800' }}>instagram_user <span style={{ color: '#64748b', fontWeight: '500' }}>2m</span></div>
                                           <div style={{ color: '#e2e8f0', fontSize: '0.75rem', marginTop: '4px' }}>
                                              {createdPost.triggerKeyword && createdPost.triggerKeyword !== '*' ? createdPost.triggerKeyword.split(',')[0].trim() : 'I need the link! 🔥'}
                                           </div>
                                           <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
                                              <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: '800' }}>Reply</span>
                                           </div>
                                        </div>
                                     </div>
                                     {createdPost.publicReply && (
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', marginLeft: '40px' }}>
                                           <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}></div>
                                           <div>
                                              <div style={{ color: 'white', fontSize: '0.7rem', fontWeight: '800' }}>{user?.username || 'you'} <span style={{ color: '#64748b', fontWeight: '500' }}>just now</span></div>
                                              <div style={{ color: '#7c3aed', fontSize: '0.75rem', marginTop: '2px', fontWeight: '600' }}>
                                                 {createdPost.publicReply}
                                              </div>
                                           </div>
                                        </div>
                                     )}
                                  </div>
                               </div>
                            </div>
                         ) : (
                            /* SIMULATED DM VIEW */
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', overflowY: 'auto' }}>
                               {/* Incoming Keyword */}
                               {(createdPost.triggerKeyword || createdPost.anyKeyword) && (
                                  <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: '#262626', color: 'white', padding: '10px 14px', borderRadius: '18px 18px 4px 18px', fontSize: '0.8rem', fontWeight: '500' }}>
                                     {createdPost.anyKeyword ? "Hey, I saw your post!" : createdPost.triggerKeyword.split(',')[0]}
                                  </div>
                               )}

                               {/* Follow Request (Gated) */}
                               {createdPost.requireFollow && createdPost.unfollowedResponse && (
                                  <div style={{ alignSelf: 'flex-start', maxWidth: '85%', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                     <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', flexShrink: 0 }}></div>
                                     <div style={{ background: '#262626', color: 'white', padding: '10px 14px', borderRadius: '18px 18px 18px 4px', fontSize: '0.8rem', fontWeight: '500', border: '1px solid #10b981' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: '800', marginBottom: '4px' }}>FOLLOW REQUEST</div>
                                        {createdPost.unfollowedResponse}
                                     </div>
                                  </div>
                               )}

                               {/* Automation Response */}
                               {createdPost.autoResponse && (
                                  <div style={{ alignSelf: 'flex-start', maxWidth: '85%', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                     <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', flexShrink: 0 }}></div>
                                     <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', padding: '10px 14px', borderRadius: '18px 18px 18px 4px', fontSize: '0.8rem', fontWeight: '500', lineHeight: '1.4' }}>
                                        {createdPost.autoResponse}
                                     </div>
                                  </div>
                               )}

                               {/* CTA Buttons */}
                               {(createdPost.buttons || []).map((btn, i) => (
                                  <div key={i} style={{ marginLeft: '32px', background: '#1a1a1a', border: '1px solid #333', color: '#3b82f6', padding: '10px', borderRadius: '12px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '800' }}>
                                     {btn.text || 'Button'}
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>

                      {/* Bottom Bar Mockup */}
                      <div style={{ padding: '12px 16px 20px', display: 'flex', gap: '10px', borderTop: '1px solid #1a1a1a', background: '#000' }}>
                         <div style={{ flex: 1, height: '34px', background: '#1a1a1a', borderRadius: '17px', border: '1px solid #333', display: 'flex', alignItems: 'center', padding: '0 12px', color: '#64748b', fontSize: '0.75rem' }}>
                            Message...
                         </div>
                         <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#1a1a1a', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={16} color="#64748b" />
                         </div>
                      </div>

                      {/* Bottom Bar Mockup */}
                      <div style={{ padding: '12px 16px 20px', display: 'flex', gap: '10px', borderTop: '1px solid #1a1a1a', background: '#000' }}>
                         <div style={{ flex: 1, height: '34px', background: '#1a1a1a', borderRadius: '17px', border: '1px solid #333' }}></div>
                         <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#1a1a1a', border: '1px solid #333' }}></div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Right side: Config Steps (Premium Builder) */}
             <div style={{ padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Advanced <span style={{ color: '#7c3aed' }}>Automation</span></h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                         <div 
                           onClick={() => setCreatedPost({...createdPost, automationStatus: createdPost.automationStatus === 'Active' ? 'Paused' : 'Active'})}
                           style={{ 
                             width: '40px', height: '20px', borderRadius: '10px', 
                             background: createdPost.automationStatus === 'Active' ? '#10b981' : '#cbd5e1', 
                             position: 'relative', cursor: 'pointer', transition: '0.3s' 
                           }}
                         >
                            <div style={{ 
                               width: '16px', height: '16px', borderRadius: '50%', background: 'white', 
                               position: 'absolute', top: '2px', left: createdPost.automationStatus === 'Active' ? '22px' : '2px', 
                               transition: '0.3s' 
                            }}></div>
                         </div>
                         <span style={{ fontSize: '0.8rem', fontWeight: '800', color: createdPost.automationStatus === 'Active' ? '#10b981' : '#64748b' }}>
                            Automation {createdPost.automationStatus === 'Active' ? 'Enabled' : 'Disabled'}
                         </span>
                      </div>
                   </div>
                   <button onClick={() => setShowAdvanced(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: '#64748b' }}>
                      <X size={20} />
                   </button>
                </div>

                {/* 1. Follower Growth Gating */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #10b981' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>1</div>
                      <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Follower Growth Gating</h4>
                   </div>
                   
                   <div style={{ border: '1.5px solid #d1fae5', borderRadius: '20px', padding: '20px', background: '#f0fdf4' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ fontWeight: '800', color: '#065f46', fontSize: '0.95rem' }}>Require Follow to Trigger</div>
                        <div 
                          onClick={() => setCreatedPost({...createdPost, requireFollow: !createdPost.requireFollow})}
                          style={{ width: '44px', height: '24px', borderRadius: '12px', background: createdPost.requireFollow ? '#10b981' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: createdPost.requireFollow ? '23px' : '3px', transition: '0.3s' }}></div>
                        </div>
                     </div>
                     <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#059669', lineHeight: '1.5' }}>
                       Only people who follow you will receive your link. Non-followers will get a request to follow you first. 🚀
                     </p>
                     
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#059669' }}>Follow Request Message</label>
                        <button 
                          onClick={() => handleAIGenerate('unfollowedResponse', `Write a polite Instagram DM asking someone to follow me before I can send them the link they requested. Keep it short.`)}
                          style={{ background: 'none', border: 'none', color: '#059669', fontWeight: '800', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                           <Sparkles size={12} /> AI Write
                        </button>
                     </div>
                     <textarea 
                       value={createdPost.unfollowedResponse} 
                       onChange={(e) => setCreatedPost({...createdPost, unfollowedResponse: e.target.value})}
                       style={{ width: '100%', height: '80px', padding: '16px', borderRadius: '16px', border: '1.5px solid #10b981', outline: 'none', fontSize: '0.9rem', resize: 'none', background: 'white' }}
                     />
                   </div>
                </div>

                {/* 2. Select a Post */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>2</div>
                      <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Select a Post</h4>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: '800', color: '#475569', fontSize: '0.9rem' }}>Any post</div>
                      <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: '#cbd5e1', position: 'relative', cursor: 'not-allowed' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: '3px' }}></div>
                      </div>
                   </div>
                </div>

                {/* 3. Comment Trigger */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#1e1b4b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>3</div>
                      <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Comment Trigger</h4>
                   </div>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ fontWeight: '800', color: '#475569', fontSize: '0.9rem' }}>Any keyword</div>
                      <div 
                        onClick={() => setCreatedPost({...createdPost, anyKeyword: !createdPost.anyKeyword})}
                        style={{ width: '44px', height: '24px', borderRadius: '12px', background: createdPost.anyKeyword ? '#3b82f6' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: createdPost.anyKeyword ? '23px' : '3px', transition: '0.3s' }}></div>
                      </div>
                   </div>

                   {!createdPost.anyKeyword && (
                     <>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="text" 
                            placeholder="Type & Hit ↵ Enter to add Keyword" 
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                 e.preventDefault();
                                 if (keywordInput.trim()) {
                                   const kws = (createdPost.triggerKeyword || '').split(',').map(s=>s.trim()).filter(k => k);
                                   if (!kws.includes(keywordInput.trim())) kws.push(keywordInput.trim());
                                   setCreatedPost({...createdPost, triggerKeyword: kws.join(', ')});
                                   setKeywordInput('');
                                 }
                              }
                            }}
                            style={{ width: '100%', padding: '14px 50px 14px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontWeight: '600' }}
                          />
                          <button 
                            onClick={() => {
                              if (keywordInput.trim()) {
                                 const kws = (createdPost.triggerKeyword || '').split(',').map(s=>s.trim()).filter(k => k);
                                 if (!kws.includes(keywordInput.trim())) kws.push(keywordInput.trim());
                                 setCreatedPost({...createdPost, triggerKeyword: kws.join(', ')});
                                 setKeywordInput('');
                              }
                            }}
                            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Plus size={18} />
                          </button>
                        </div>
                        
                        {createdPost.triggerKeyword && createdPost.triggerKeyword !== '*' && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                            {createdPost.triggerKeyword.split(',').filter(k => k.trim()).map((kw, i) => (
                              <div key={i} style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #dbeafe' }}>
                                {kw.trim()}
                                <X 
                                  size={14} 
                                  style={{ cursor: 'pointer' }} 
                                  onClick={() => {
                                    const kws = createdPost.triggerKeyword.split(',').map(s=>s.trim()).filter((_, idx) => idx !== i);
                                    setCreatedPost({...createdPost, triggerKeyword: kws.join(', ')});
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                   )}
                </div>

                {/* 4. Send a DM */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>4</div>
                      <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Send a DM</h4>
                   </div>

                   <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                           <Send size={14} /> <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>DM Response Text</span>
                         </div>
                         <button 
                           onClick={() => handleAIGenerate('autoResponse', `Write a high-converting Instagram DM response for my automation. It should be exciting and mention that the link is below. Use emojis.`)}
                           style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                         >
                            <Sparkles size={14} /> AI Write
                         </button>
                      </div>
                      <textarea 
                        value={createdPost.autoResponse || ''}
                        onChange={(e) => setCreatedPost({...createdPost, autoResponse: e.target.value})}
                        placeholder="Enter your final message here... (e.g. Here is your link!)" 
                        style={{ width: '100%', height: '120px', padding: '16px', borderRadius: '16px', border: 'none', background: '#f8fafc', outline: 'none', fontSize: '0.95rem', resize: 'none' }}
                      />
                     
                     <div style={{ marginTop: '20px', borderTop: '1.5px solid #f1f5f9', paddingTop: '20px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                             <LinkIcon size={14} /> <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>Link & Call to Action</span>
                          </div>
                          <button onClick={openAddLinkModal} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            + Add Link
                          </button>
                       </div>

                       {/* Added Buttons List */}
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                          {(createdPost.buttons || []).map((btn, idx) => (
                             <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                   <LinkIcon size={14} color="#3b82f6" />
                                   <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>{btn.text}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                   <Pencil size={16} onClick={() => openEditLinkModal(idx)} style={{ cursor: 'pointer', color: '#64748b' }} />
                                   <Trash2 size={16} onClick={() => removeLink(idx)} style={{ cursor: 'pointer', color: '#ef4444' }} />
                                </div>
                             </div>
                          ))}
                          {(createdPost.buttons || []).length === 0 && (
                             <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                No buttons added yet.
                             </div>
                          )}
                       </div>
                     </div>
                   </div>
                </div>

                {/* Advanced Automations: Public Comment Reply */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Advanced Automations</h4>
                      <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: '#3b82f6', position: 'relative' }}>
                         <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', right: '3px' }}></div>
                      </div>
                   </div>
                   <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '24px' }}>Grow your audience faster — with smart, hands-free engagement.</p>

                   <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '20px', padding: '24px', marginTop: '20px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: '900', color: '#7c3aed', textTransform: 'uppercase' }}>PUBLIC COMMENT REPLY (RECOMMENDED)</label>
                          <button 
                            onClick={() => handleAIGenerate('publicReply', `Write a short, friendly Instagram comment reply to someone who commented on my post. Mention that I've sent them a DM with the details. Use emojis.`)}
                            style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                             <Sparkles size={14} /> AI Write
                          </button>
                       </div>
                       <div style={{ position: 'relative' }}>
                          <input 
                            type="text" 
                            value={createdPost.publicReply || ''}
                            onChange={(e) => setCreatedPost({...createdPost, publicReply: e.target.value})}
                            placeholder="e.g. Check your DMs! 🚀"
                            style={{ width: '100%', padding: '16px 50px 16px 16px', borderRadius: '16px', border: '1.5px solid #ddd6fe', outline: 'none', fontSize: '0.95rem', fontWeight: '600', background: 'white' }}
                          />
                       </div>
                    </div>
                
                {/* Sticky Action Button Container */}
                <div style={{ 
                  position: 'sticky', 
                  bottom: '-40px', 
                  left: 0, 
                  right: 0, 
                  background: 'white', 
                  padding: '24px 0 0 0', 
                  borderTop: '1.5px solid #f1f5f9',
                  marginTop: '20px',
                  zIndex: 10
                }}>
                   <button 
                     onClick={async () => {
                       try {
                         const token = localStorage.getItem('insta_agent_token');
                         const targetId = createdPost._id || createdPost.id;
                         if (!targetId) {
                           notify("Error: Post ID not found", "error");
                           return;
                         }
                         
                         const res = await fetch(`${API_BASE_URL}/api/scheduling/${targetId}`, {
                           method: 'PUT',
                           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                           body: JSON.stringify({
                              ...createdPost,
                              triggerKeyword: createdPost.anyKeyword ? '*' : createdPost.triggerKeyword,
                               automationStatus: createdPost.automationStatus || 'Active'
                           })
                         });
                         if (res.ok) {
                           notify("✅ Automation created successfully!", "success");
                           setShowAdvanced(false);
                           fetchPosts();
                         } else {
                           const errData = await res.json();
                           notify(errData.error || "Failed to save", "error");
                         }
                       } catch (err) { notify("Network error while saving", "error"); }
                     }}
                     style={{ width: '100%', padding: '18px', borderRadius: '20px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 10px 25px rgba(124, 58, 237, 0.3)' }}
                   >
                     <Zap size={24} fill="white" /> Create Automation
                   </button>
                </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- LINK MODAL --- */}
      {showLinkModal && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: '20px' 
        }}>
          <div style={{ 
            background: 'white', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '450px', 
            boxShadow: '0 30px 70px rgba(0,0,0,0.3)', animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
               <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>{editingLinkIndex !== null ? 'Edit Button' : 'Add Link Button'}</h3>
               <button onClick={() => setShowLinkModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
               </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
               <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>BUTTON TEXT</label>
               <input 
                 value={tempLinkTitle} 
                 onChange={(e) => setTempLinkTitle(e.target.value)} 
                 placeholder="e.g. Visit Website" 
                 style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: '600' }} 
               />
            </div>

            <div style={{ marginBottom: '32px' }}>
               <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>URL LINK</label>
               <input 
                 value={tempLinkUrl} 
                 onChange={(e) => setTempLinkUrl(e.target.value)} 
                 placeholder="https://..." 
                 style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: '600', color: '#7c3aed' }} 
               />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleSaveLink} 
                style={{ flex: 1.5, padding: '16px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(124, 58, 237, 0.2)' }}
              >
                Save Button
              </button>
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
