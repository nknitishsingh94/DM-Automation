import React from 'react';
import { Scale, FileText, Globe, ShieldAlert, ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '60px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', background: 'white', padding: '60px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)' }}>
        
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '40px', fontWeight: '700', fontSize: '15px' }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Scale size={40} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#0f172a', marginBottom: '12px', letterSpacing: '-1.5px' }}>Terms of Service</h1>
          <p style={{ color: '#64748b', fontWeight: '600' }}>Effective Date: May 5, 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <section>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={22} color="#3b82f6" /> 1. Acceptance of Terms
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '1.05rem' }}>
              By accessing or using <strong>smart10X</strong>, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. smart10X provides AI-powered automation tools for Meta platforms, and your use is subject to both our terms and Meta's official policies.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Globe size={22} color="#3b82f6" /> 2. Use of Service & Compliance
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '1.05rem', marginBottom: '16px' }}>
              smart10X is designed to help you manage your social media presence responsibly. When using our automation features:
            </p>
            <ul style={{ color: '#475569', lineHeight: '2', fontSize: '1.05rem', paddingLeft: '20px' }}>
              <li>You must comply with <strong>Meta's Community Standards</strong> and Developer Policies.</li>
              <li>You are prohibited from using smart10X for spamming, harassment, or any illegal activities.</li>
              <li>You are responsible for all content sent through your automated workflows.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldAlert size={22} color="#f59e0b" /> 3. Account Responsibility
            </h2>
            <p style={{ color: '#475569', lineHeight: '1.8', fontSize: '1.05rem' }}>
              You are responsible for maintaining the security of your smart10X account and any connected Meta accounts. smart10X is not liable for any actions taken by Meta (such as account restrictions or shadowbans) resulting from improper use of automation tools or violations of platform policies.
            </p>
          </section>

          <section style={{ padding: '32px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>4. Limitation of Liability</h2>
            <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '0.95rem', margin: 0 }}>
              smart10X and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or use, whether in an action in contract or tort, arising out of or in any way connected with the use of our service.
            </p>
          </section>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Questions about our terms?
            </p>
            <a href="mailto:legal@smart10x.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontWeight: '700', textDecoration: 'none', border: '2px solid #3b82f6', padding: '10px 24px', borderRadius: '12px' }}>
              <Mail size={16} /> Contact Legal Team
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

