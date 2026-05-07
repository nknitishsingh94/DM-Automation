import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Image as ImageIcon, Send, Sparkles, CheckCircle, AlertCircle, X } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';

export default function Scheduling() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
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
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/scheduling`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        console.warn("Expected array for scheduling, got:", data);
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
    setSubmitting(true);
    try {
      const token = localStorage.getItem('insta_agent_token');
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
        setShowAdd(false);
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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '8px' }}>AI Content Scheduler</h1>
          <p style={{ color: '#64748b', fontWeight: '500' }}>Schedule posts and pre-configure Auto DM triggers</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', 
            borderRadius: '14px', background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', 
            color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 20px rgba(124, 58, 237, 0.2)'
          }}
        >
          <Plus size={20} /> Schedule New Post
        </button>
      </div>

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', background: 'white', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
          <Calendar size={48} color="#cbd5e1" style={{ marginBottom: '20px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '12px' }}>Your schedule is empty</h3>
          <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
            Plan your content ahead of time and let smart10X handle the posting and the DM responses automatically.
          </p>
          <button onClick={() => setShowAdd(true)} style={{ background: '#f5f3ff', color: '#7c3aed', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
            Create Your First Scheduled Post
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {posts.map(post => (
            <div key={post._id} style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ height: '200px', background: '#f8fafc', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {post.mediaUrl ? (
                  <img src={post.mediaUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon size={40} color="#cbd5e1" />
                )}
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: 'white', padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: '700' }}>
                  {new Date(post.scheduledFor).toLocaleDateString()}
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <p style={{ fontSize: '0.9rem', color: '#1e293b', marginBottom: '16px', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.caption}
                </p>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                     <Sparkles size={12} /> Auto DM Active
                   </div>
                   <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                     Keyword: <strong style={{ color: '#1e293b' }}>{post.triggerKeyword}</strong>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => deletePost(post._id)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #fee2e2', background: 'white', color: '#ef4444', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Trash2 size={16} /> Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Schedule New Post</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Caption</label>
                <textarea 
                  value={newPost.caption} onChange={e => setNewPost({...newPost, caption: e.target.value})}
                  placeholder="Write your Instagram caption here..."
                  style={{ width: '100%', height: '100px', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', resize: 'none' }} required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Schedule For</label>
                  <input 
                    type="datetime-local" value={newPost.scheduledFor} onChange={e => setNewPost({...newPost, scheduledFor: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Media URL (Image/Video)</label>
                  <input 
                    type="url" value={newPost.mediaUrl} onChange={e => setNewPost({...newPost, mediaUrl: e.target.value})}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                </div>
              </div>

              <div style={{ padding: '24px', background: '#f5f3ff', borderRadius: '16px', border: '1px solid #7c3aed' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: '900', fontSize: '0.9rem', marginBottom: '16px' }}>
                  <Sparkles size={18} /> Configure Auto DM
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#5b21b6', marginBottom: '6px' }}>Trigger Keyword</label>
                    <input 
                      type="text" value={newPost.triggerKeyword} onChange={e => setNewPost({...newPost, triggerKeyword: e.target.value})}
                      placeholder="e.g. SHOP, LINK, GET"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#5b21b6', marginBottom: '6px' }}>Auto Response</label>
                    <textarea 
                      value={newPost.autoResponse} onChange={e => setNewPost({...newPost, autoResponse: e.target.value})}
                      placeholder="What should the bot reply?"
                      style={{ width: '100%', height: '60px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', resize: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" disabled={submitting}
                style={{ width: '100%', padding: '16px', borderRadius: '14px', background: '#0f172a', color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}
              >
                {submitting ? 'Scheduling...' : 'Confirm Schedule'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
