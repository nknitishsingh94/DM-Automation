import React from 'react';
import { Scale, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '32px', fontWeight: '600', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Scale size={32} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Terms of Service</h1>
          <p style={{ color: '#64748b' }}>Effective Date: April 18, 2026</p>
        </div>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>1. Use of Service</h2>
          <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '12px' }}>
            By using ZenXchat, you agree to comply with Meta's official policies for Instagram, Facebook, and WhatsApp. You are responsible for ensuring your automations do not violate anti-spam laws or platform-specific community guidelines.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="#10b981" /> 2. Account Responsibility
          </h2>
          <p style={{ color: '#475569', lineHeight: '1.6' }}>
            You are responsible for maintaining the security of your account and access tokens. ZenXchat is not liable for any account restrictions or bans caused by misuse of automation tools that violate Meta's terms of service.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color="#f59e0b" /> 3. Service Limitations
          </h2>
          <p style={{ color: '#475569', lineHeight: '1.6' }}>
            Our tool relies on third-party APIs (Meta Graph API). Service availability may be affected by changes to these APIs, rate limiting, or platform outages. We reserve the right to modify or discontinue features to maintain compliance with provider policies.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>4. Termination</h2>
          <p style={{ color: '#475569', lineHeight: '1.6' }}>
            We reserve the right to suspend or terminate accounts that engage in fraudulent activity, harassment, or mass-spamming using our automation infrastructure.
          </p>
        </section>

        <div style={{ marginTop: '48px', padding: '24px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            © 2026 ZenXchat. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
