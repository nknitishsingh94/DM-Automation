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
  Bookmark
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';
import { useAuth } from '../context/AuthContext';

export default function Scheduling() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useNotification();

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
  }, []);

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
    setSelectedFiles(files);
    
    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
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
      if (res.ok) {
        notify("Post scheduled successfully!", "success");
        setNewPost({ caption: '', scheduledFor: '', mediaUrl: '', triggerKeyword: '', autoResponse: '', coverUrl: '' });
        setSelectedFiles([]);
        setPreviews([]);
        setView('list');
        fetchPosts();
      } else {
        notify("Failed to schedule post", "error");
      }
    } catch (err) {
      notify("Network error", "error");
    } finally {
      setSubmitting(false);
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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading your schedule...</div>;

  // --- CREATE VIEW ---
  if (view === 'create') {
    return (
      <div style={{ maxWidth: '1300px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out', paddingBottom: '100px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setView('list')}
              style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Schedule Post</h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
             <button 
               onClick={() => setView('list')}
               style={{ padding: '10px 24px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: '700', cursor: 'pointer' }}
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
          {/* Left Column: Form Content */}
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
                    onClick={() => {
                      setPostType(type.id);
                      setSelectedFiles([]);
                      setPreviews([]);
                    }}
                    style={{ 
                      flex: 1, padding: '12px', borderRadius: '12px', border: postType === type.id ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                      background: postType === type.id ? '#f5f3ff' : 'white',
                      color: postType === type.id ? '#7c3aed' : '#64748b',
                      fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

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

            {/* Caption Section */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b' }}>Caption</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                   <button onClick={() => setShowCaptionsModal(true)} type="button" style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={14} /> Saved Captions
                   </button>
                   <button onClick={handleSaveCaption} type="button" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Save size={14} /> Save Caption
                   </button>
                </div>
              </div>
              <textarea 
                value={newPost.caption} 
                onChange={e => setNewPost({...newPost, caption: e.target.value})}
                placeholder="Write your caption..."
                style={{ width: '100%', height: '120px', padding: '16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', resize: 'none' }}
                required
              />
            </div>

            {/* Upload Area */}
            <div style={{ 
              background: 'white', padding: '40px', borderRadius: '24px', border: '2px dashed #e2e8f0', 
              textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s'
            }} 
            onClick={() => fileInputRef.current.click()}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7c3aed'} 
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
              <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple={postType === 'carousel'}
                accept={postType === 'reel' ? 'video/*' : 'image/*,video/*'}
                onChange={handleFileChange}
              />
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <UploadCloud size={24} />
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e1b4b', marginBottom: '4px' }}>
                {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Click or drag to upload'}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {postType === 'reel' ? 'MP4 video supported (Max 10MB)' : 'JPG, PNG, MP4 supported (Max 10MB)'}
              </p>
            </div>

            {/* Automation Settings */}
            <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e1b4b', margin: 0 }}>Configure Auto DM</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Trigger Keyword</label>
                  <input 
                    type="text" 
                    value={newPost.triggerKeyword} 
                    onChange={e => setNewPost({...newPost, triggerKeyword: e.target.value})}
                    placeholder="e.g. PRICE"
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>DM Response</label>
                  <input 
                    type="text" 
                    value={newPost.autoResponse} 
                    onChange={e => setNewPost({...newPost, autoResponse: e.target.value})}
                    placeholder="Hey, here is the price!"
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Preview Area */}
          <div style={{ position: 'sticky', top: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', marginBottom: '16px' }}>Preview</label>
            
            <div style={{ 
              background: 'white', 
              borderRadius: '24px', 
              border: '1px solid #e2e8f0', 
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
            }}>
              {/* Instagram Style Preview Header */}
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: 'white', fontWeight: '800', fontSize: '0.7rem',
                  overflow: 'hidden'
                }}>
                  {user?.profilePhoto ? <img src={user.profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.username?.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{user?.username || 'Your Account'}</div>
              </div>

              {/* Media Preview Area */}
              <div style={{ 
                width: '100%', 
                aspectRatio: (postType === 'reel' || postType === 'story') ? '9/16' : '1/1', 
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1',
                overflow: 'hidden'
              }}>
                {previews.length > 0 ? (
                  postType === 'reel' && selectedFiles[0]?.type.startsWith('video') ? (
                    <video src={previews[0]} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={previews[0]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                      <ImageIcon size={48} />
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Upload media to see preview</p>
                  </div>
                )}
              </div>

              {/* Instagram Style Post Actions */}
              {(postType === 'image' || postType === 'carousel' || postType === 'reel') && (
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                     <Instagram size={20} color="#1e1b4b" />
                     <MessageSquare size={20} color="#1e1b4b" />
                     <Send size={20} color="#1e1b4b" />
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>1,234 likes</div>
                  <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                    <span style={{ fontWeight: '800', marginRight: '8px' }}>{user?.username || 'user'}</span>
                    <span style={{ color: '#1e1b4b', whiteSpace: 'pre-wrap' }}>{newPost.caption || 'Write your caption...'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Saved Captions Modal */}
        {showCaptionsModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
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
                      style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f5f3ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontWeight: '700', marginBottom: '4px' }}>{cap.title}</div>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cap.content}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- LIST VIEW ---
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
        <button 
          onClick={() => setView('create')}
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
          border: '2px dashed #e2e8f0'
        }}>
          <Calendar size={40} color="#7c3aed" style={{ marginBottom: '24px' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '12px' }}>Your schedule is empty</h3>
          <p style={{ color: '#64748b', marginBottom: '32px' }}>Click 'New Schedule' to plan your first post.</p>
          <button onClick={() => setView('create')} style={{ background: '#0f172a', color: 'white', padding: '12px 32px', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer' }}>Create Schedule</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {posts.map(post => (
            <div key={post._id} className="scheduling-card" style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ height: '240px', background: '#f8fafc', position: 'relative' }}>
                <img src={post.mediaUrl.startsWith('http') ? post.mediaUrl : `${API_BASE_URL}${post.mediaUrl}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.9)', color: '#1e1b4b', padding: '6px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '800' }}>
                   {(post.type || 'Image').toUpperCase()}
                </div>
              </div>
              <div style={{ padding: '24px' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: '500', color: '#1e293b', marginBottom: '16px' }}>{post.caption}</p>
                <div style={{ padding: '12px', background: '#f5f3ff', borderRadius: '16px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: '800' }}>KEYWORD: {post.triggerKeyword || 'NONE'}</span>
                </div>
                <button onClick={() => deletePost(post._id)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #fee2e2', background: 'white', color: '#ef4444', fontWeight: '700', cursor: 'pointer' }}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MessageSquare = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);
