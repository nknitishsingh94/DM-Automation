import React from 'react';
import { Shield, Lock, Eye, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '32px', fontWeight: '600', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={32} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Privacy Policy</h1>
          <p style={{ color: '#64748b' }}>Last Updated: April 18, 2026</p>
        </div>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Eye size={20} color="#3b82f6" /> 1. Information We Collect
          </h2>
          <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '12px' }}>
            We only collect information that is necessary to provide our automation services:
          </p>
          <ul style={{ color: '#475569', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong>Account Information:</strong> Name, email address, and profile photo when you sign up using Google or email.</li>
            <li><strong>Connected Accounts:</strong> When you link Instagram, Facebook, or WhatsApp, we store the necessary access tokens and Page/Account IDs provided by Meta APIs.</li>
            <li><strong>Automation Data:</strong> The keywords and message templates you create for your automated responses.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={20} color="#3b82f6" /> 2. How We Use Data
          </h2>
          <p style={{ color: '#475569', lineHeight: '1.6' }}>
            Your data is used exclusively to power the automations you configure. We do not sell your personal information or the content of your messages to third parties. We use Meta APIs strictly in accordance with their developer policies to provide DM management and automation services.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>3. Data Storage and Security</h2>
          <p style={{ color: '#475569', lineHeight: '1.6' }}>
            We use industry-standard encryption to protect your access tokens. All data is stored securely in encrypted databases. You can disconnect your accounts or delete your profile at any time from the Settings menu.
          </p>
        </section>

        <div style={{ marginTop: '48px', padding: '24px', background: '#f1f5f9', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} color="#3b82f6" /> Contact Us
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
            If you have any questions about this Privacy Policy, please contact our support team at:<br />
            <strong style={{ color: '#1e293b' }}>support@yourdomain.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
