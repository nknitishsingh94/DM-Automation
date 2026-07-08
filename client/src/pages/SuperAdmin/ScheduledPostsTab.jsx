import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Calendar, Trash2, Globe, Clock, MessageCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

export default function ScheduledPostsTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/scheduled-posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load scheduled posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this scheduled post?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('insta_agent_token');
      await axios.delete(`${API_BASE_URL}/api/admin/scheduled-posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Post deleted successfully');
      setPosts(posts.filter(p => (p.id || p._id) !== id));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const filtered = (Array.isArray(posts) ? posts : []).filter(p => 
    (p.userId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.platform || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.caption || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'published':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}><Globe size={12} /> Published</span>;
      case 'failed':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}><AlertCircle size={12} /> Failed</span>;
      default:
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef08a', color: '#854d0e', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}><Clock size={12} /> Scheduled</span>;
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ position: 'sticky', top:  0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-base)', padding: '24px 24px 12px 24px', margin: '0 -24px 24px -24px', borderRadius: '0 0 16px 16px', boxShadow: '0 4px 25px rgba(0,0,0,0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Scheduled Posts</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Monitor all scheduled and published social media content.</p>
        </div>
        
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} color="var(--primary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search by caption, platform, or user..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px 14px 44px', borderRadius: '16px',
              border: '2px solid transparent', background: 'rgba(99, 102, 241, 0.05)',
              color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontWeight: '500'
            }}
            onFocus={(e) => {
              e.target.style.background = 'var(--bg-card)';
              e.target.style.borderColor = 'var(--primary)';
              e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'rgba(99, 102, 241, 0.05)';
              e.target.style.borderColor = 'transparent';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(99, 102, 241, 0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Content Preview</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner / Date</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Calendar size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p>No scheduled posts found matching "{searchTerm}"</p>
                  </td>
                </tr>
              ) : (
                filtered.map((post) => (
                  <tr key={post.id || post._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 24px', maxWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', textAlign: 'center', lineHeight: '1.1' }}>
                            {post.type ? post.type : (post.mediaUrl ? 'MEDIA' : 'TEXT')}
                          </span>
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {post.caption || 'No caption provided'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                        {post.platform || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                       <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontFamily: 'monospace' }}>{post.userId}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {new Date(post.scheduledTime || post.scheduledAt || Date.now()).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {getStatusBadge(post.status)}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(post.id || post._id)}
                        style={{
                          background: 'transparent', border: 'none', color: '#ef4444',
                          cursor: 'pointer', padding: '8px', borderRadius: '8px',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        title="Delete Post"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
