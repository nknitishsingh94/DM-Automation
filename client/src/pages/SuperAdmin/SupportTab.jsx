import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Star, Trash2, MessageSquare, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

export default function SupportTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('insta_agent_token');
      await axios.delete(`${API_BASE_URL}/api/admin/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Review deleted successfully');
      setReviews(reviews.filter(r => (r.id || r._id) !== id));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const filtered = (Array.isArray(reviews) ? reviews : []).filter(r => 
    (r.userId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.author || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={14} 
          fill={i <= (rating || 5) ? "#fbbf24" : "none"} 
          color={i <= (rating || 5) ? "#fbbf24" : "var(--border-subtle)"} 
        />
      );
    }
    return stars;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 25px rgba(0,0,0,0.02)', border: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Support & Reviews</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Monitor user feedback and support queries.</p>
        </div>
        
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} color="var(--primary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search by author or message..." 
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
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Details</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: '40%' }}>Message</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <MessageSquare size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p>No reviews or support queries found matching "{searchTerm}"</p>
                  </td>
                </tr>
              ) : (
                filtered.map((rev) => (
                  <tr key={rev.id || rev._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UserCircle size={32} color="var(--primary)" style={{ opacity: 0.8 }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{rev.author || 'Anonymous'}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{rev.userId || 'Unknown ID'}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {renderStars(rev.rating)}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                        {rev.message || rev.reviewText || 'No message provided.'}
                      </p>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>
                        {new Date(rev.created_at || rev.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(rev.id || rev._id)}
                        style={{
                          background: 'transparent', border: 'none', color: '#ef4444',
                          cursor: 'pointer', padding: '8px', borderRadius: '8px',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        title="Delete Review"
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
