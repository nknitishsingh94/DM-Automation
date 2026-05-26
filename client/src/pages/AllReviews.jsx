import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Instagram, Facebook, MessageCircle, Check, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config';
import Footer from '../components/Footer';

export default function AllReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchAllReviews = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/reviews?t=${new Date().getTime()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setReviews(data);
          }
        }
      } catch (err) {
        console.error("Failed to load all reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllReviews();
  }, []);

  return (
    <div className="all-reviews-page" style={{ 
      minHeight: '100vh', 
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Navigation Top Bar */}
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#64748b',
            fontWeight: '600',
            fontSize: '0.95rem',
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#7c3aed'}
          onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
          >
            <ArrowLeft size={18} /> Back to Home
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/zenxchat-logo.png" alt="Logo" style={{ height: '24px' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem', letterSpacing: '-0.3px' }}>smart10X</span>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <header style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '80px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 70% 80%, rgba(124, 58, 237, 0.15) 0%, transparent 60%)',
          zIndex: 1
        }}></div>

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 16px',
            background: 'rgba(124, 58, 237, 0.2)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            color: '#c084fc',
            borderRadius: '50px',
            fontSize: '0.8rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '24px'
          }}>
            <Sparkles size={14} /> Creator Testimonials
          </div>
          
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '900',
            marginBottom: '16px',
            letterSpacing: '-1px',
            lineHeight: '1.2'
          }}>
            Real Results from <span style={{ background: 'linear-gradient(90deg, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Real Creators</span>
          </h1>
          
          <p style={{
            fontSize: '1.2rem',
            color: '#94a3b8',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            See what coaches, business owners, and digital creators have to say about automations built with smart10X.
          </p>
        </div>
      </header>

      {/* Main Reviews Container */}
      <main style={{
        flex: 1,
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '60px 24px'
      }}>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3.5px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%' }} className="animate-spin"></div>
            <p style={{ color: '#64748b', fontWeight: '600' }}>Loading testimonials...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: '500' }}>No reviews submitted yet. Be the first to share your experience!</p>
            <Link to="/write-review" style={{
              marginTop: '16px',
              display: 'inline-flex',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              color: 'white',
              borderRadius: '12px',
              fontWeight: '700',
              textDecoration: 'none'
            }}>
              Write a Review
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '30px'
          }}>
            {reviews.map((review) => (
              <div 
                key={review.id || review._id || Math.random()} 
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '24px',
                  padding: '32px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '260px',
                  transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'default'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.18)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(124, 58, 237, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.015)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '3px', color: '#fbbf24' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={i < review.rating ? "#fbbf24" : "none"}
                          stroke={i < review.rating ? "none" : "#fbbf24"}
                        />
                      ))}
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '50px',
                      textTransform: 'capitalize',
                      background: review.platform === 'instagram' ? 'rgba(225, 48, 108, 0.08)' : review.platform === 'facebook' ? 'rgba(24, 119, 242, 0.08)' : 'rgba(37, 211, 102, 0.08)',
                      color: review.platform === 'instagram' ? '#e1306c' : review.platform === 'facebook' ? '#1877f2' : '#25d366'
                    }}>
                      {review.platform === 'instagram' && <Instagram size={12} style={{ marginRight: '4px' }} />}
                      {review.platform === 'facebook' && <Facebook size={12} style={{ marginRight: '4px' }} />}
                      {review.platform === 'whatsapp' && <MessageCircle size={12} style={{ marginRight: '4px' }} />}
                      {review.platform}
                    </span>
                  </div>
                  
                  <p style={{
                    fontSize: '1rem',
                    color: '#334155',
                    lineHeight: '1.6',
                    fontStyle: 'italic',
                    marginBottom: '24px',
                    margin: '0 0 24px 0'
                  }}>
                    "{review.text}"
                  </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    {review.avatarUrl ? (
                      <img src={review.avatarUrl} alt={review.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
                        {(review.name || 'U').split(/\s+/).filter(Boolean).map(n => n[0]).join('').toUpperCase()}
                      </div>
                    )}
                    {review.verified && (
                      <span style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        background: '#22c55e',
                        color: 'white',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid #fff'
                      }} title="Verified User">
                        <Check size={8} strokeWidth={4} />
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>{review.name}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{review.handle || `@${review.name.toLowerCase().replace(/\s+/g, '')}`}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
