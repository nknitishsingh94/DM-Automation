import { useState, useEffect } from 'react';
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
  FileText
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

  // New Post State
  const [postType, setPostType] = useState('image'); // 'image', 'carousel', 'reel', 'story'
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
    try {
      const res = await fetch(`${API_BASE_URL}/api/scheduling`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newPost,
          type: postType
        })
      });
      if (res.ok) {
        notify("Post scheduled successfully!", "success");
        setNewPost({ caption: '', scheduledFor: '', mediaUrl: '', triggerKeyword: '', autoResponse: '', coverUrl: '' });
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
      <div style={{ maxWidth: '1300px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
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
               style={{ padding: '10px 32px', borderRadius: '12px', background: '#7c3aed', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)' }}
             >
               {submitting ? 'Processing...' : 'Schedule'}
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
                    onClick={() => setPostType(type.id)}
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
               <div style={{ position: 'relative' }}>
                 <input 
                   type="datetime-local" 
                   value={newPost.scheduledFor} 
                   onChange={e => setNewPost({...newPost, scheduledFor: e.target.value})}
                   style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', fontWeight: '600' }} 
                   required
                 />
               </div>
            </div>

            {/* Caption Section */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b' }}>Caption</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                   <button type="button" style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={14} /> Saved Captions
                   </button>
                   <button type="button" style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
            }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7c3aed'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <UploadCloud size={24} />
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e1b4b', marginBottom: '4px' }}>Click or drag to upload</p>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>JPG, PNG, MP4 supported (Max 10MB)</p>
              
              {/* Fallback URL Input (hidden in a more elegant way if needed, but keeping for functionality) */}
              <input 
                type="url" 
                value={newPost.mediaUrl} 
                onChange={e => setNewPost({...newPost, mediaUrl: e.target.value})}
                placeholder="Or paste media URL here..."
                style={{ marginTop: '20px', width: '100%', maxWidth: '400px', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
              />
            </div>

            {/* Automation Settings (NEW integration into full page) */}
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
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '0.7rem' }}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
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
                {newPost.mediaUrl ? (
                  <img src={newPost.mediaUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px', textTransform: 'uppercase' }}>
                    Just now
                  </div>
                </div>
              )}
            </div>

            {/* Reel Cover Selection (Optional - only for Reels) */}
            {postType === 'reel' && (
              <div style={{ marginTop: '24px', background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', marginBottom: '12px' }}>Cover Photo</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '80px', height: '110px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.6rem', textAlign: 'center', padding: '4px' }}>
                    No thumbnail
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      <UploadCloud size={14} /> Upload Custom
                    </button>
                    <button style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'white', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      <ImageIcon size={14} /> Select from Video
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', marginBottom: '24px' }}>
            <Calendar size={40} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '12px' }}>May 3 - May 9, 2026</h3>
          <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: '450px', lineHeight: '1.6' }}>
            Plan and manage all your upcoming Instagram posts. Click on a new schedule to upload post.
          </p>
          <button 
            onClick={() => setView('create')} 
            style={{ background: '#0f172a', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' }}
          >
            Create Your First Schedule
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {posts.map(post => (
            <div 
              key={post._id} 
              className="scheduling-card"
              style={{ 
                background: 'white', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                border: '1px solid #f1f5f9', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                transition: 'all 0.3s'
              }}
            >
              <div style={{ height: '240px', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                {post.mediaUrl ? (
                  <img src={post.mediaUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(45deg, #f8fafc, #f1f5f9)' }}>
                    <ImageIcon size={48} color="#cbd5e1" />
                  </div>
                )}
                
                {/* Badge for Type */}
                <div style={{ 
                  position: 'absolute', top: '16px', right: '16px', 
                  background: 'rgba(255,255,255,0.9)',
                  color: '#1e1b4b',
                  padding: '6px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '800',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  {post.type === 'reel' ? <Film size={12} /> : (post.type === 'story' ? <Zap size={12} /> : <ImageIcon size={12} />)}
                  {(post.type || 'Image').toUpperCase()}
                </div>

                <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white', padding: '6px 14px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
                  {new Date(post.scheduledFor).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                <p style={{ fontSize: '0.95rem', color: '#1e293b', marginBottom: '20px', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                  {post.caption}
                </p>
                
                <div style={{ padding: '16px', background: '#f5f3ff', borderRadius: '16px', marginBottom: '24px', border: '1px solid #ede9fe' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                     <Sparkles size={14} fill="#7c3aed" /> Auto DM Active
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Keyword:</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e1b4b', background: 'white', padding: '2px 8px', borderRadius: '6px', border: '1px solid #ddd' }}>{post.triggerKeyword || 'None'}</span>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => deletePost(post._id)} 
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #fee2e2', background: 'white', color: '#ef4444', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <Trash2 size={16} /> Cancel Post
                  </button>
                </div>
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
