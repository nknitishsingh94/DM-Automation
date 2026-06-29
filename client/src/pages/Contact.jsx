import React, { useState } from 'react';
import { Mail, Send, CheckCircle, MessageSquare, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { toast } from 'react-hot-toast';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // We save this as a lead/form submission in our DB
      const res = await fetch(`${API_BASE_URL}/api/support/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setSubmitted(true);
        toast.success('Message sent! We will contact you soon.');
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch (err) {
      toast.error('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="contact-page-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', background: 'var(--bg-card)', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '80px', height: '80px', background: '#dcfce7', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
            <CheckCircle size={40} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '16px' }}>Message Received!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '32px' }}>
            Thank you for reaching out. Our support team will get back to you at <strong>{formData.email}</strong> within 24 hours.
          </p>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#7c3aed', color: 'white', padding: '14px 32px', borderRadius: '14px', fontWeight: '800', textDecoration: 'none' }}>
            <ArrowLeft size={20} /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page-container" style={{ minHeight: '100vh', background: 'var(--sidebar-bg)', padding: '80px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px', alignItems: 'start' }}>
        
        {/* Info Column */}
        <div style={{ padding: '20px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '16px', letterSpacing: '-1px' }}>Contact Support</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '40px', lineHeight: '1.6' }}>
            Have questions about your account, billing, or features? Send us a message and we'll help you out.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', background: 'var(--bg-card)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Mail size={24} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '700' }}>EMAIL US</p>
                <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', fontWeight: '600' }}>smart10x.support@gmail.com</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', background: 'var(--bg-card)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <MessageSquare size={24} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '700' }}>INSTAGRAM DM</p>
                <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', fontWeight: '600' }}>@smart10Xchat</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Your Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Subject</label>
              <select 
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', appearance: 'none', background: 'var(--bg-card)' }}
              >
                <option>General Inquiry</option>
                <option>Billing Issue</option>
                <option>Feature Request</option>
                <option>Bug Report</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Message</label>
              <textarea 
                required
                placeholder="Tell us how we can help..."
                rows="5"
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', resize: 'vertical' }}
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              style={{ 
                marginTop: '10px', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', 
                color: 'white', padding: '16px', borderRadius: '16px', fontWeight: '800', 
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                boxShadow: '0 10px 20px rgba(124, 58, 237, 0.2)', transition: 'all 0.3s'
              }}
            >
              {submitting ? 'Sending...' : <><Send size={20} /> Send Message</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
