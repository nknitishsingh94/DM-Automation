import React from 'react';
import { Shield, Lock, Eye, Mail, ArrowLeft, CheckCircle, FileText, Info, Globe, ShieldAlert, Users, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  const sections = [
    { id: 'collect', title: '1. How We Collect Personal Data', icon: <Database size={20} color="#3b82f6" /> },
    { id: 'types', title: '2. What Types of Personal Data We Process', icon: <FileText size={20} color="#3b82f6" /> },
    { id: 'purposes', title: '3. For Which Purposes We Use Personal Data', icon: <CheckCircle size={20} color="#3b82f6" /> },
    { id: 'share', title: '4. How We Share Personal Data', icon: <Users size={20} color="#3b82f6" /> },
    { id: 'rights', title: '5. Your Data Protection Rights & Choices', icon: <Shield size={20} color="#3b82f6" /> },
    { id: 'retain', title: '6. For How Long We Retain Personal Data', icon: <Lock size={20} color="#3b82f6" /> },
    { id: 'international', title: '7. International Data Transfers', icon: <Globe size={20} color="#3b82f6" /> },
    { id: 'children', title: '8. Children\'s Information', icon: <Users size={20} color="#3b82f6" /> },
    { id: 'security', title: '9. Security', icon: <Shield size={20} color="#3b82f6" /> }
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '60px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', background: 'white', padding: '60px', borderRadius: '40px', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Background Gradient Orbs */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)', zIndex: 0 }}></div>

        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '40px', fontWeight: '700', fontSize: '15px', transition: 'color 0.2s', position: 'relative', zIndex: 1 }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '64px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.2)' }}>
            <Shield size={40} color="white" />
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#0f172a', marginBottom: '16px', letterSpacing: '-1.5px' }}>Privacy Policy</h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '700px', margin: '0 auto 24px', lineHeight: '1.6' }}>
            At <strong>smart10X</strong>, we consider the privacy and the security of personal data to be extremely important.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b', fontWeight: '700', background: '#f8fafc', padding: '8px 20px', borderRadius: '100px', width: 'fit-content', margin: '0 auto' }}>
            <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
            Effective Date: May 5, 2026
          </div>
        </div>

        {/* Table of Contents */}
        <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', marginBottom: '64px', border: '1px solid #e2e8f0', position: 'relative', zIndex: 1 }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={20} color="#3b82f6" /> Table of Contents
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
            {sections.map(s => (
              <div 
                key={s.id} 
                onClick={() => scrollToSection(s.id)}
                style={{ cursor: 'pointer', fontSize: '14px', color: '#475569', fontWeight: '600', padding: '8px 12px', borderRadius: '8px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                {s.title}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, color: '#334155', lineHeight: '1.8', fontSize: '1.05rem' }}>
          <p style={{ marginBottom: '32px' }}>
            We process personal data for (1) our own purposes and (2) under instructions of our customers who use <strong>smart10X</strong> service (the “Service”, any product or service provided by smart10X), upload and keep certain information in it in accordance with the applicable data protection laws and regulations.
          </p>

          <section id="collect" style={{ marginBottom: '56px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#f0f9ff', borderRadius: '14px' }}><Database size={24} color="#0ea5e9" /></div>
              1. How We Collect Personal Data
            </h2>
            <p style={{ marginBottom: '16px' }}>What personal data we collect depends largely on the interaction that takes place between you and smart10X:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li><strong>Usage of Service:</strong> When you use smart10X Service, we store all the content you provide. We gather this from you directly or from linked integrations (Facebook, Instagram, etc.).</li>
              <li><strong>Communications:</strong> When you send us emails or message us, we store the content and your contact details.</li>
              <li><strong>Website Forms:</strong> When you submit forms on <a href="https://www.smart10x.com" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}>www.smart10x.com</a>, we collect your details.</li>
              <li><strong>Social Communities:</strong> When you join our groups on Facebook or Instagram, we process data from your profile and comments.</li>
            </ul>
          </section>

          <section id="types" style={{ marginBottom: '56px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#f5f3ff', borderRadius: '14px' }}><FileText size={24} color="#8b5cf6" /></div>
              2. What Types of Personal Data We Process
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {[
                { title: 'Account Details', desc: 'ID, name, email, status, linked pages, location, and gender.' },
                { title: 'Financial Info', desc: 'Credit card details (last 4 digits), account details, and payment history.' },
                { title: 'Usage Data', desc: 'IP address, browser type, settings, and frequency of feature use.' },
                { title: 'Customer Content', desc: 'Personal data imported from your users or contacts for automation.' }
              ].map((item, i) => (
                <div key={i} style={{ padding: '24px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                  <h4 style={{ fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.95rem', color: '#64748b' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="purposes" style={{ marginBottom: '56px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '14px' }}><CheckCircle size={24} color="#10b981" /></div>
              3. For Which Purposes We Use Personal Data
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'To operate and maintain your account in the Service.',
                'To communicate regarding technical notices, updates, and security alerts.',
                'To provide automation services on your behalf (Customer Content).',
                'To comply with legal obligations, including tax and accounting.',
                'To protect against fraudulent or illegal activity.'
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px' }}>
                  <CheckCircle size={16} color="#10b981" />
                  <span style={{ fontWeight: '500' }}>{text}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="share" style={{ marginBottom: '56px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#fffbeb', borderRadius: '14px' }}><Users size={24} color="#f59e0b" /></div>
              4. How We Share Personal Data
            </h2>
            <p style={{ marginBottom: '20px' }}>We do not sell your data to third parties for commercial or advertising purposes. We share it only with:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><strong>Service Providers:</strong> For payments, CRM, and cloud storage.</li>
              <li><strong>Advertising Partners:</strong> To measure ad effectiveness (hashed identifiers only).</li>
              <li><strong>Legal Authorities:</strong> When required by law or binding subpoenas.</li>
              <li><strong>Corporate Affiliates:</strong> To streamline operations within our group.</li>
            </ul>
          </section>

          <section id="security" style={{ marginBottom: '64px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#fef2f2', borderRadius: '14px' }}><ShieldAlert size={24} color="#ef4444" /></div>
              9. Security
            </h2>
            <div style={{ padding: '32px', background: '#0f172a', borderRadius: '32px', color: 'white', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '20px', opacity: 0.1 }}><Lock size={120} color="white" /></div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>Safeguarding Your Information</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0' }}>
                We use industry-standard AES-256 encryption and secure access controls. While we strive to protect your data, no internet transmission is 100% secure. We will notify you without delay in the event of any security breach.
              </p>
            </div>
          </section>

          <div style={{ marginTop: '80px', padding: '40px', background: '#f1f5f9', borderRadius: '32px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>Questions or Suggestions?</h3>
            <p style={{ color: '#64748b', marginBottom: '32px' }}>If you have any questions concerning our privacy practices, please reach out to our dedicated team.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
              <a href="mailto:privacy@smart10x.com" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#3b82f6', color: 'white', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)' }}>
                <Mail size={20} /> privacy@smart10x.com
              </a>
              <Link to="/help" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', color: '#1e293b', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', border: '1px solid #e2e8f0' }}>
                Support Center
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
        &copy; 2026 smart10X AI. All rights reserved.
      </footer>
    </div>
  );
}


