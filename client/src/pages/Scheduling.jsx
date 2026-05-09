import { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Send, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  X, 
  ChevronLeft,
  ChevronRight,
  Layout,
  Instagram,
  Target,
  Zap,
  ArrowRight,
  Film,
  Copy,
  Save,
  Layers,
  UploadCloud,
  Eye,
  FileText,
  Loader2,
  Bookmark,
  Heart,
  MessageCircle,
  MessageSquare,
  Key,
  Volume2,
  VolumeX
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
    coverUrl: ''
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
        // Clear creation modal
        setShowCreate(false);
        
        // MANUALLY PREPEND TO LIST (Fixes the need for refresh)
        setPosts(prev => [data, ...prev]);

        // Trigger Success Flow
        setCreatedPost(data);
        setShowSuccess(true);
        
        // Reset form but DO NOT clear previews yet so the Success Modal can show them
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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading your schedule...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
      {/* List Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '12px', letterSpacing: '-0.5px' }}>
            Content <span style={{ color: '#7c3aed' }}>Scheduler</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', fontWeight: '500' }}>
            Plan, Manage and Automate your Instagram content effortlessly.
          </p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', 
            borderRadius: '16px', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', 
            color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', 
            boxShadow: '0 12px 24px rgba(124, 58, 237, 0.25)',
            transition: 'transform 0.2s'
          }}
        >
          <Plus size={20} /> New Schedule
        </button>
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

                {/* Automation Preview Removed for clean UI */}

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

                  {/* Automation Builder Removed as per request */}

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
                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
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
                  <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f8fafc' }}>
                      {user?.profilePhoto ? (
                        <img 
                          src={user.profilePhoto} 
                          alt="Profile" 
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }} 
                        />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '0.7rem' }}>
                          {user?.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e1b4b' }}>
                        {settings?.connectedInstagramName || settings?.connectedFacebookName || user?.username || 'instagram_user'}
                      </div>
                    </div>
                    <div style={{ width: '100%', aspectRatio: (postType === 'reel' || postType === 'story') ? '9/16' : '1/1', background: '#f8fafc', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {previews.length > 0 ? (
                        <>
                          {/* Main Media Display */}
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            {previews[currentPreviewIndex] ? (
                              selectedFiles[currentPreviewIndex]?.type?.startsWith('video') ? (
                                <>
                                  <video 
                                    key={previews[currentPreviewIndex]} 
                                    src={previews[currentPreviewIndex]} 
                                    autoPlay 
                                    loop 
                                    muted={isPreviewMuted} 
                                    playsInline
                                    style={{ width: '100%', height: '100%', objectFit: (postType === 'reel' || postType === 'story') ? 'contain' : 'cover', background: '#000' }} 
                                  />
                                  {/* Volume Toggle Icon */}
                                  <button 
                                    onClick={() => setIsPreviewMuted(!isPreviewMuted)}
                                    style={{ position: 'absolute', bottom: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20, color: 'white' }}
                                  >
                                    {isPreviewMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                  </button>
                                </>
                              ) : (
                                <img key={previews[currentPreviewIndex]} src={previews[currentPreviewIndex]} style={{ width: '100%', height: '100%', objectFit: (postType === 'reel' || postType === 'story') ? 'contain' : 'cover', background: '#f8fafc' }} />
                              )
                            ) : (
                               <ImageIcon size={48} color="#cbd5e1" />
                            )}
                          </div>

                          {/* Arrows for Navigation */}
                          {previews.length > 1 && (
                            <>
                              <button 
                                onClick={() => setCurrentPreviewIndex(prev => (prev === 0 ? previews.length - 1 : prev - 1))}
                                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.8)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, color: '#1e1b4b', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                              >
                                <ChevronLeft size={18} />
                              </button>
                              <button 
                                onClick={() => setCurrentPreviewIndex(prev => (prev === previews.length - 1 ? 0 : prev + 1))}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.8)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, color: '#1e1b4b', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                              >
                                <ChevronRight size={18} />
                              </button>

                              {/* Indicator Dots */}
                              <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px', zIndex: 10 }}>
                                {previews.map((_, i) => (
                                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === currentPreviewIndex ? '#7c3aed' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }} />
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <ImageIcon size={48} color="#cbd5e1" />
                      )}
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                         <Heart size={22} color="#1e1b4b" />
                         <MessageCircle size={22} color="#1e1b4b" />
                         <Send size={22} color="#1e1b4b" />
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '6px' }}>1,234 likes</div>
                      <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                        <span style={{ fontWeight: '800', marginRight: '8px' }}>{user?.username || 'user'}</span>
                        <span style={{ color: '#1e1b4b' }}>{newPost.caption || '...'}</span>
                      </div>
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
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' 
        }}>
          <div style={{ 
            background: 'white', borderRadius: '32px', width: '100%', maxWidth: '450px', 
            padding: '40px', textAlign: 'center', boxShadow: '0 50px 100px rgba(0,0,0,0.2)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Check size={40} />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '12px' }}>Post Scheduled!</h2>
            <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500', marginBottom: '32px' }}>
              Your content is ready to go live on Instagram at the set time.
            </p>

            {/* Visual Preview Box */}
            <div style={{ 
              width: '100%', aspectRatio: '1/1', borderRadius: '24px', overflow: 'hidden', 
              background: '#f8fafc', marginBottom: '32px', border: '1px solid #e2e8f0' 
            }}>
               <img 
                 src={previews[0] || '/placeholder-ig.png'} 
                 alt="Scheduled" 
                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
               />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => { setShowSuccess(false); setPreviews([]); }}
                style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#7c3aed', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)' }}
              >
                Done
              </button>
              
              <button 
                onClick={() => { setShowSuccess(false); setShowAdvanced(true); }}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: '16px', background: '#f5f3ff', 
                  color: '#7c3aed', border: 'none', fontWeight: '800', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <Zap size={18} /> Advanced Automation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADVANCED AUTOMATION EDITOR (SIDE DRAWER/MODAL) --- */}
      {showAdvanced && createdPost && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 4000 
        }}>
          <div style={{ 
            background: 'white', width: '100%', maxWidth: '600px', height: '100vh', 
            padding: '40px', boxShadow: '-20px 0 60px rgba(0,0,0,0.1)', overflowY: 'auto',
            animation: 'slideInRight 0.4s ease-out'
          }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#1e1b4b' }}>
                  Advanced <span style={{ color: '#7c3aed' }}>Automation</span>
                </h3>
                <button onClick={() => setShowAdvanced(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={24} />
                </button>
             </div>

             <div style={{ 
                padding: '24px', background: '#f8fafc', borderRadius: '24px', border: '1.5px solid #e2e8f0',
                display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '40px'
             }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '16px', overflow: 'hidden', background: '#e2e8f0', flexShrink: 0 }}>
                   <img src={previews[0] || '/placeholder-ig.png'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                   <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', marginBottom: '4px' }}>Targeting This Post</div>
                   <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e1b4b', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {createdPost.caption || 'Scheduled Content'}
                   </div>
                </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '800', color: '#475569', marginBottom: '12px' }}>Trigger Keywords</label>
                   <input 
                     type="text" 
                     placeholder="e.g. READY, PRICE, LINK (Separate with commas)"
                     value={createdPost.triggerKeyword || ''}
                     onChange={(e) => setCreatedPost({...createdPost, triggerKeyword: e.target.value})}
                     style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '1rem' }}
                   />
                </div>

                <div>
                   <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '800', color: '#475569', marginBottom: '12px' }}>Auto Response Message</label>
                   <textarea 
                     placeholder="What should the bot say when the keyword is detected?"
                     value={createdPost.autoResponse || ''}
                     onChange={(e) => setCreatedPost({...createdPost, autoResponse: e.target.value})}
                     style={{ width: '100%', height: '120px', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '1rem', resize: 'none' }}
                   />
                </div>

                <div style={{ padding: '24px', background: '#f1f5f9', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <div>
                      <div style={{ fontWeight: '800', color: '#1e1b4b', marginBottom: '4px' }}>Follower Check</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Only reply if they follow you</div>
                   </div>
                   <div 
                    onClick={() => setCreatedPost({...createdPost, requireFollow: !createdPost.requireFollow})}
                    style={{ 
                      width: '50px', height: '26px', borderRadius: '13px', background: createdPost.requireFollow ? '#7c3aed' : '#cbd5e1', 
                      position: 'relative', cursor: 'pointer', transition: 'all 0.3s' 
                    }}>
                      <div style={{ 
                        position: 'absolute', top: '3px', left: createdPost.requireFollow ? '27px' : '3px', 
                        width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'all 0.3s' 
                      }} />
                   </div>
                </div>

                <button 
                  onClick={async () => {
                    // Update the scheduled post with advanced settings
                    const token = localStorage.getItem('insta_agent_token');
                    await fetch(`${API_BASE_URL}/api/scheduling/${createdPost._id || createdPost.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify(createdPost)
                    });
                    setShowAdvanced(false);
                    notify("Advanced Automation Saved!", "success");
                    fetchPosts();
                  }}
                  style={{ width: '100%', padding: '18px', borderRadius: '18px', background: '#1e1b4b', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', marginTop: '20px' }}
                >
                  Save Advanced Settings
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
