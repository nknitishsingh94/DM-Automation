import React, { useState, useEffect } from 'react';
import { Sparkles, Star, MessageSquare, Image as ImageIcon, Instagram, Facebook, MessageCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL } from '../config';

const WriteReview = () => {
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(
    localStorage.getItem('smart10x_reviewed') === 'true'
  );

  useEffect(() => {
    const checkReviewStatus = async () => {
      try {
        const token = localStorage.getItem('insta_agent_token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/user-feedback/check`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.exists) {
            setAlreadyReviewed(true);
            localStorage.setItem('smart10x_reviewed', 'true');
          } else {
            setAlreadyReviewed(false);
            localStorage.removeItem('smart10x_reviewed');
          }
        }
      } catch (err) {
        console.error("Failed to check review status from server:", err);
      }
    };

    checkReviewStatus();
  }, []);
  
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
      
      const response = await fetch(`${API_BASE_URL}/api/user-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newReview)
      });
      
      if (response.ok) {
        toast.success('Review submitted successfully! Thank you.');
        localStorage.setItem('smart10x_reviewed', 'true');
        setAlreadyReviewed(true);
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
    <div style={{ minHeight: '100%', padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <Toaster position="bottom-right" />
      
      <div style={{ 
        background: '#ffffff', 
        width: '100%', 
        maxWidth: '650px', 
        borderRadius: '24px', 
        padding: '40px', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)', 
        border: '1px solid rgba(226, 232, 240, 0.8)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Top Gradient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #7c3aed, #ec4899, #3b82f6)' }}></div>
        
        <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
          <div style={{ 
            display: 'inline-flex', padding: '16px', 
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))', 
            borderRadius: '20px', color: '#7c3aed', marginBottom: '20px',
            boxShadow: 'inset 0 0 0 1px rgba(124,58,237,0.1)'
          }}>
            <Sparkles size={32} />
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px' }}>
            We'd love your feedback!
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '450px', margin: '0 auto', lineHeight: '1.6' }}>
            Share your smart10X experience to help other creators and brands discover the power of DM automation.
          </p>
        </div>

        {alreadyReviewed ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', color: '#22c55e', marginBottom: '20px' }}>
              <Star size={32} fill="#22c55e" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
              Thank You for Your Review!
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
              We really appreciate you taking the time to share your experience with smart10X. Your review helps us grow!
            </p>
          </div>
        ) : (
          <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Your Name <span style={{color: '#ef4444'}}>*</span></label>
              <input 
                type="text" 
                required
                value={newReview.name}
                onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                placeholder="e.g. Alex Johnson"
                style={{ padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontSize: '1rem', transition: 'all 0.2s', focus: { borderColor: '#7c3aed', background: '#fff' } }}
                onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Social Handle</label>
              <input 
                type="text" 
                value={newReview.handle}
                onChange={(e) => setNewReview({...newReview, handle: e.target.value})}
                placeholder="e.g. @alex_creates"
                style={{ padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontSize: '1rem', transition: 'all 0.2s' }}
                onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Role / Company</label>
              <input 
                type="text" 
                value={newReview.role}
                onChange={(e) => setNewReview({...newReview, role: e.target.value})}
                placeholder="e.g. Fitness Coach"
                style={{ padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontSize: '1rem', transition: 'all 0.2s' }}
                onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Rating</label>
              <div style={{ display: 'flex', gap: '6px', padding: '10px 0' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({...newReview, rating: star})}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'transform 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Star 
                      size={32} 
                      fill={star <= newReview.rating ? "#fbbf24" : "none"} 
                      stroke={star <= newReview.rating ? "none" : "#cbd5e1"} 
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Profile Picture</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed #cbd5e1', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                {newReview.avatarUrl ? (
                  <img src={newReview.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon size={28} color="#94a3b8" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  accept="image/*" 
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="avatar-upload" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#ffffff', color: '#475569', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', border: '1px solid #cbd5e1', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#7c3aed'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569'; }}
                >
                  {uploadingAvatar ? (
                    <><div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%' }}></div> Uploading...</>
                  ) : (
                    <><ImageIcon size={16} /> Choose Image</>
                  )}
                </label>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px', margin: 0 }}>Square images work best (JPG, PNG)</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Which platform do you use the most?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {['instagram', 'facebook', 'whatsapp'].map(platform => (
                <div 
                  key={platform}
                  onClick={() => setNewReview({...newReview, platform})}
                  style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 12px', 
                    borderRadius: '16px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', textTransform: 'capitalize',
                    border: `2px solid ${newReview.platform === platform ? '#7c3aed' : '#e2e8f0'}`, 
                    background: newReview.platform === platform ? 'rgba(124,58,237,0.04)' : '#ffffff', 
                    color: newReview.platform === platform ? '#7c3aed' : '#64748b',
                    transition: 'all 0.2s',
                    boxShadow: newReview.platform === platform ? '0 4px 12px rgba(124,58,237,0.1)' : 'none'
                  }}
                  onMouseOver={(e) => { if(newReview.platform !== platform) e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  onMouseOut={(e) => { if(newReview.platform !== platform) e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  {platform === 'instagram' && <Instagram size={24} />}
                  {platform === 'facebook' && <Facebook size={24} />}
                  {platform === 'whatsapp' && <MessageCircle size={24} />}
                  {platform}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Your Review <span style={{color: '#ef4444'}}>*</span></label>
            <textarea 
              required
              value={newReview.text}
              onChange={(e) => setNewReview({...newReview, text: e.target.value})}
              placeholder="How has smart10X helped you save time or grow your business?"
              rows={5}
              style={{ padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontSize: '1rem', resize: 'vertical', transition: 'all 0.2s', lineHeight: '1.5' }}
              onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            style={{ 
              marginTop: '16px', width: '100%', padding: '18px', 
              background: 'linear-gradient(135deg, #7c3aed, #db2777)', 
              color: 'white', borderRadius: '16px', fontWeight: '800', fontSize: '1.1rem', 
              border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', 
              opacity: submitting ? 0.8 : 1, 
              boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
            onMouseOver={(e) => { if(!submitting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(124, 58, 237, 0.4)'; } }}
            onMouseOut={(e) => { if(!submitting) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(124, 58, 237, 0.3)'; } }}
          >
            {submitting ? (
              <><div className="animate-spin" style={{ width: '20px', height: '20px', border: '3px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }}></div> Submitting...</>
            ) : (
              <><MessageSquare size={20} /> Submit Review</>
            )}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

export default WriteReview;

