import React from 'react';
import { Shield, Lock, Eye, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: '60px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', background: 'white', padding: '60px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)', zIndex: 0 }}></div>
        
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '40px', fontWeight: '700', fontSize: '15px', transition: 'color 0.2s', position: 'relative', zIndex: 1 }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '64px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.2)' }}>
            <Shield size={40} color="white" />
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#0f172a', marginBottom: '12px', letterSpacing: '-1.5px' }}>Privacy Policy</h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b', fontWeight: '600' }}>
            <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
            Last Updated: May 5, 2026
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: '#f0f9ff', borderRadius: '12px' }}><Eye size={22} color="#0ea5e9" /></div>
              1. Information We Collect
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.7', fontSize: '1.05rem', marginBottom: '20px' }}>
              At <strong>smart10X</strong>, we prioritize the security of your data. We only collect information that is strictly necessary to provide our advanced Instagram and Meta automation services:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              {[
                { title: 'Account Data', desc: 'Name, email address, and profile photo when you authenticate via Google or Email.' },
                { title: 'Connected Tokens', desc: 'Encrypted Meta Access Tokens and Page IDs required for API communication.' },
                { title: 'Automation Logic', desc: 'Your custom trigger keywords, message templates, and workflow configurations.' }
              ].map((item, i) => (
                <div key={i} style={{ padding: '24px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                  <h4 style={{ fontWeight: '800', marginBottom: '10px', color: '#1e293b' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: '#ecfdf5', borderRadius: '12px' }}><Lock size={22} color="#10b981" /></div>
              2. How We Use Data
            </h2>
            <div style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.03)', borderLeft: '4px solid #10b981', borderRadius: '4px 20px 20px 4px' }}>
              <p style={{ color: '#334155', lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
                Your data is used <strong>exclusively</strong> to power the AI automations you configure. smart10X does not sell, trade, or share your personal information or the content of your messages with third parties. We interact with Meta APIs (Instagram, Facebook, Messenger) strictly in accordance with their <a href="https://developers.facebook.com/policy/" target="_blank" rel="noreferrer" style={{ color: '#10b981', fontWeight: '700', textDecoration: 'none' }}>Developer Policies</a>.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: '#fef2f2', borderRadius: '12px' }}><Shield size={22} color="#ef4444" /></div>
              3. Data Security & Your Rights
            </h2>
            <ul style={{ color: '#475569', lineHeight: '2', fontSize: '1.05rem', paddingLeft: '20px' }}>
              <li><strong>Encryption:</strong> All access tokens are encrypted using AES-256 at rest.</li>
              <li><strong>Right to Deletion:</strong> You can permanently delete your entire smart10X account and all associated data from the "Danger Zone" in Settings.</li>
              <li><strong>API Revocation:</strong> You can revoke smart10X's access from your Facebook App Settings at any time.</li>
            </ul>
          </section>

          <div style={{ marginTop: '64px', padding: '40px', background: '#0f172a', borderRadius: '28px', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Mail size={24} color="white" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Privacy Concerns?</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '500px', marginBottom: '24px' }}>
              Our dedicated privacy team is here to help you understand how your data is handled.
            </p>
            <a href="mailto:support@smart10x.com" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#3b82f6', textDecoration: 'none', background: 'white', padding: '12px 32px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              support@smart10x.com
            </a>
          </div>
        </div>
      </div>

      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
        &copy; 2026 smart10X AI. All rights reserved.
      </footer>
    </div>
  );
}

