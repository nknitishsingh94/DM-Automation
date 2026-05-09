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
  ArrowRight
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';

export default function Scheduling() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useNotification();

  const [newPost, setNewPost] = useState({
    caption: '',
    scheduledFor: '',
    mediaUrl: '',
    triggerKeyword: '',
    autoResponse: ''
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
        body: JSON.stringify(newPost)
      });
      if (res.ok) {
        notify("Post scheduled successfully!", "success");
        setNewPost({ caption: '', scheduledFor: '', mediaUrl: '', triggerKeyword: '', autoResponse: '' });
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <button 
            onClick={() => setView('list')}
            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Create Scheduled Post</h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>Plan your content and automation in one place</p>
          </div>
        </div>

        <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          {/* Left Column: Post Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0f9ff', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={18} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e1b4b', margin: 0 }}>Post Content</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Instagram Caption</label>
                  <textarea 
                    value={newPost.caption} 
                    onChange={e => setNewPost({...newPost, caption: e.target.value})}
                    placeholder="Write a compelling caption..."
                    style={{ width: '100%', height: '140px', padding: '16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', resize: 'none', transition: 'border-color 0.2s' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Media Link (Direct URL)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="url" 
                      value={newPost.mediaUrl} 
                      onChange={e => setNewPost({...newPost, mediaUrl: e.target.value})}
                      placeholder="https://images.unsplash.com/..."
                      style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.95rem' }}
                    />
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <Layout size={18} />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>Upload feature coming soon. Use a public image link for now.</p>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e1b4b', margin: 0 }}>Schedule Details</h3>
              </div>
              <input 
                type="datetime-local" 
                value={newPost.scheduledFor} 
                onChange={e => setNewPost({...newPost, scheduledFor: e.target.value})}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', fontWeight: '600', color: '#1e1b4b' }} 
                required
              />
            </div>
          </div>

          {/* Right Column: AutoDM Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', padding: '32px', borderRadius: '24px', color: 'white', boxShadow: '0 20px 40px rgba(124, 58, 237, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Auto DM Automation</h3>
              </div>
              
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '24px', lineHeight: '1.5' }}>
                Configure an automatic reply that will trigger whenever someone comments on this post after it's published.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: '8px' }}>Trigger Keyword</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      value={newPost.triggerKeyword} 
                      onChange={e => setNewPost({...newPost, triggerKeyword: e.target.value})}
                      placeholder="e.g. SHOP, INFO, LINK"
                      style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: '0.95rem', fontWeight: '700' }}
                    />
                    <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }}>
                      <Target size={18} />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: '8px' }}>Auto Response Message</label>
                  <textarea 
                    value={newPost.autoResponse} 
                    onChange={e => setNewPost({...newPost, autoResponse: e.target.value})}
                    placeholder="Hey! Thanks for your interest. Here is your link..."
                    style={{ width: '100%', height: '100px', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: '0.95rem', resize: 'none', transition: 'border-color 0.2s' }}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              style={{ 
                width: '100%', 
                padding: '20px', 
                borderRadius: '18px', 
                background: '#1e1b4b', 
                color: 'white', 
                fontWeight: '800', 
                fontSize: '1.1rem',
                border: 'none', 
                cursor: 'pointer', 
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
              }}
            >
              {submitting ? (
                <>Processing...</>
              ) : (
                <>Confirm & Schedule <ArrowRight size={20} /></>
              )}
            </button>
          </div>
        </form>
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
            Post automation that drives engagement while you sleep.
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
          <Plus size={20} /> New Post
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
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '12px' }}>Start your schedule</h3>
          <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: '450px', lineHeight: '1.6' }}>
            Plan your content ahead of time and let smart10X handle the posting and the DM responses automatically.
          </p>
          <button 
            onClick={() => setView('create')} 
            style={{ background: '#0f172a', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' }}
          >
            Create Your First Post
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
                
                {/* Badge for Status */}
                <div style={{ 
                  position: 'absolute', top: '16px', left: '16px', 
                  background: post.status === 'Posted' ? '#d1fae5' : '#fff',
                  color: post.status === 'Posted' ? '#065f46' : '#1e1b4b',
                  padding: '6px 14px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: '800',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: post.status === 'Posted' ? '#10b981' : '#f59e0b' }}></div>
                  {post.status || 'Scheduled'}
                </div>

                <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white', padding: '6px 14px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
                  {new Date(post.scheduledFor).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                <p style={{ fontSize: '0.95rem', color: '#1e293b', marginBottom: '20px', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                  {post.caption}
                </p>
                
                <div style={{ padding: '16px', background: '#f5f3ff', borderRadius: '16px', marginBottom: '24px', border: '1px solid #ede9fe' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                     <Zap size={14} fill="#7c3aed" /> Auto DM Active
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Keyword:</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e1b4b', background: 'white', padding: '2px 8px', borderRadius: '6px', border: '1px solid #ddd' }}>{post.triggerKeyword}</span>
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
