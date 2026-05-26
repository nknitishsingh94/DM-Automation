import React, { useState } from 'react';
import { Sparkles, Star, MessageSquare, Image as ImageIcon, Instagram, Facebook, MessageCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL } from '../config';

const WriteReview = () => {
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [newReview, setNewReview] = useState({
    name: '',
    handle: '',
    role: '',
    rating: 5,
    text: '',
    platform: 'instagram',
    avatarUrl: ''
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('insta_agent_token');
      const response = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (response.ok && data.url) {
        setNewReview(prev => ({ ...prev, avatarUrl: data.url }));
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Failed to upload image. You must be logged in.');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('Connection error while uploading.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.text) {
      toast.error('Please provide at least your name and review text.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('insta_agent_token') || '';
      
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newReview)
      });
      
      if (response.ok) {
        toast.success('Review submitted successfully! Thank you.');
        // Reset form
        setNewReview({
          name: '',
          handle: '',
          role: '',
          rating: 5,
          text: '',
          platform: 'instagram',
          avatarUrl: ''
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('Failed to connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Toaster position="bottom-right" />
      <div style={{ background: '#ffffff', width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(14,165,233,0.1))', borderRadius: '50%', color: '#7c3aed', marginBottom: '16px' }}>
            <MessageSquare size={32} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Share Your Experience</h1>
          <p style={{ color: '#64748b' }}>Your feedback helps us improve and helps others make the right choice.</p>
        </div>

        <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Your Name *</label>
              <input 
                type="text" 
                required
                value={newReview.name}
                onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                placeholder="John Doe"
                style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', outline: 'none' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Social Handle (Optional)</label>
              <input 
                type="text" 
                value={newReview.handle}
                onChange={(e) => setNewReview({...newReview, handle: e.target.value})}
                placeholder="@johndoe"
                style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Profile Picture (Optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                {newReview.avatarUrl ? (
                  <img src={newReview.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon size={24} color="#94a3b8" />
                )}
              </div>
              <div>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  accept="image/*" 
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="avatar-upload" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f1f5f9', color: '#475569', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}
                >
                  {uploadingAvatar ? 'Uploading...' : 'Upload Image'}
                </label>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>JPG, PNG under 2MB</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Your Role / Company (Optional)</label>
            <input 
              type="text" 
              value={newReview.role}
              onChange={(e) => setNewReview({...newReview, role: e.target.value})}
              placeholder="e.g. Content Creator"
              style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Rating</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({...newReview, rating: star})}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <Star 
                    size={28} 
                    fill={star <= newReview.rating ? "#fbbf24" : "none"} 
                    stroke={star <= newReview.rating ? "none" : "#cbd5e1"} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Primary Platform</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div 
                onClick={() => setNewReview({...newReview, platform: 'instagram'})}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px', borderRadius: '12px', border: `2px solid ${newReview.platform === 'instagram' ? '#7c3aed' : '#cbd5e1'}`, background: newReview.platform === 'instagram' ? 'rgba(124,58,237,0.05)' : '#fafafa', cursor: 'pointer', fontWeight: '600', color: newReview.platform === 'instagram' ? '#7c3aed' : '#64748b' }}
              >
                <Instagram size={20} /> Instagram
              </div>
              <div 
                onClick={() => setNewReview({...newReview, platform: 'facebook'})}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px', borderRadius: '12px', border: `2px solid ${newReview.platform === 'facebook' ? '#7c3aed' : '#cbd5e1'}`, background: newReview.platform === 'facebook' ? 'rgba(124,58,237,0.05)' : '#fafafa', cursor: 'pointer', fontWeight: '600', color: newReview.platform === 'facebook' ? '#7c3aed' : '#64748b' }}
              >
                <Facebook size={20} /> Facebook
              </div>
              <div 
                onClick={() => setNewReview({...newReview, platform: 'whatsapp'})}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px', borderRadius: '12px', border: `2px solid ${newReview.platform === 'whatsapp' ? '#7c3aed' : '#cbd5e1'}`, background: newReview.platform === 'whatsapp' ? 'rgba(124,58,237,0.05)' : '#fafafa', cursor: 'pointer', fontWeight: '600', color: newReview.platform === 'whatsapp' ? '#7c3aed' : '#64748b' }}
              >
                <MessageCircle size={20} /> WhatsApp
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Your Review *</label>
            <textarea 
              required
              value={newReview.text}
              onChange={(e) => setNewReview({...newReview, text: e.target.value})}
              placeholder="How has smart10X helped you?"
              rows={4}
              style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            style={{ marginTop: '10px', width: '100%', padding: '16px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', borderRadius: '12px', fontWeight: '800', fontSize: '1.05rem', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)' }}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WriteReview;
