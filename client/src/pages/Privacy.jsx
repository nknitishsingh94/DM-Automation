import React, { useState } from 'react';
import { Shield, Lock, Eye, Mail, ArrowLeft, CheckCircle, FileText, Info, Globe, ShieldAlert, Users, Database, ChevronDown, Bot, Megaphone, CreditCard, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  {
    id: 'collect', num: '1', icon: <Database size={20} color="#0ea5e9" />, bg: '#f0f9ff',
    title: 'How We Collect Personal Data',
    content: [
      { head: 'Account Registration', text: 'When you create a Smart100X account, we collect your name, email address, and password. If you sign up via Google or Meta OAuth, we receive your profile information from those providers.' },
      { head: 'Meta / Instagram / Facebook Connection', text: 'When you connect your Meta account via OAuth, we receive and securely store your Meta access token, Facebook Page ID, Instagram Business Account ID, page name, and profile picture. This is required to operate automations on your behalf.' },
      { head: 'WhatsApp & Telegram Integration', text: 'When you connect WhatsApp or Telegram accounts, we receive account identifiers and access credentials necessary to send and receive messages through those platforms.' },
      { head: 'Instagram Inbox & DMs', text: 'To power the Inbox feature, we read incoming Direct Messages and comments from your connected Instagram account via the Meta API. Message content is processed to enable automation and AI-generated replies.' },
      { head: 'Forms & Lead Capture', text: 'When your visitors submit our embeddable Forms, we collect the data fields you configure (name, email, phone, custom fields) on behalf of your business. You are the data controller for this information.' },
      { head: 'Audiences & Contacts', text: 'When subscribers interact with your automations or are imported by you, we store contact records including Instagram usernames, phone numbers, email addresses, tags, and conversation history in our Audiences database.' },
      { head: 'Broadcasts', text: 'When you send Broadcast messages to your subscriber list, we log the send activity, delivery status, open rates, and click-through data associated with each broadcast campaign.' },
      { head: 'Payments & Billing', text: 'When you purchase a subscription plan, billing information (card last 4 digits, billing address, payment history) is processed by our payment processor (Stripe). Smart100X does not store your full card details.' },
      { head: 'Usage & Analytics', text: 'We automatically collect IP address, browser type, device type, pages visited, features used, session duration, and error logs to improve performance and security.' },
      { head: 'Communications', text: 'When you contact our support team via email or the Help Center, we store your messages and contact details to resolve your inquiry.' },
    ]
  },
  {
    id: 'types', num: '2', icon: <FileText size={20} color="#8b5cf6" />, bg: '#f5f3ff',
    title: 'What Types of Personal Data We Process',
    content: [
      { head: 'Identity & Account Data', text: 'Name, email address, profile photo, account ID, subscription plan, account status, and registration date.' },
      { head: 'Meta Platform Data', text: 'Facebook Page IDs, Instagram Business Account IDs, Meta OAuth access tokens, page names, follower counts, and connected account details.' },
      { head: 'Messaging Platform Data', text: 'WhatsApp account identifiers, Telegram bot tokens and chat IDs, and associated messaging credentials when those integrations are enabled.' },
      { head: 'Automation & Flow Data', text: 'Campaign configurations, automation triggers, keyword rules, DM flow templates, AI Studio prompts, and Flow Builder node layouts created by you.' },
      { head: 'Contact / Audience Data', text: 'Instagram usernames, phone numbers, email addresses, custom field values, tags, subscription status, and conversation history of your subscribers.' },
      { head: 'Broadcast & Campaign Data', text: 'Message content, scheduled send times, target audience segments, delivery reports, open rates, and link click data.' },
      { head: 'Form Submission Data', text: 'Responses submitted by your website visitors through Smart100X embeddable Forms — fields, values, submission timestamps, and source page URLs.' },
      { head: 'Financial Data', text: 'Subscription plan, billing cycle, payment history, invoice records, and last 4 digits of payment card (processed by Stripe).' },
      { head: 'Usage & Technical Data', text: 'IP address, browser type, operating system, feature usage frequency, error logs, and session data.' },
      { head: 'Advertising & Analytics Data', text: 'Ad campaign performance data, hashed identifiers for ad measurement, referral tracking IDs, and conversion event data used to measure effectiveness of our own marketing.' },
    ]
  },
  {
    id: 'purposes', num: '3', icon: <CheckCircle size={20} color="#10b981" />, bg: '#ecfdf5',
    title: 'For Which Purposes We Use Personal Data',
    content: [
      { head: 'Providing Core Services', text: 'To authenticate your account, connect your Meta/Instagram/WhatsApp/Telegram accounts, run your automation campaigns, operate the Inbox, deliver Broadcasts, and store your Audiences and Forms data.' },
      { head: 'AI Studio Processing', text: 'Message content from your Instagram Inbox may be processed by our AI engine to generate automated reply suggestions. This processing is done on your behalf and under your instructions.' },
      { head: 'Campaign & Automation Execution', text: 'To trigger automations based on keywords, comments, or DM events, execute your configured Flow Builder sequences, and deliver responses via Meta API.' },
      { head: 'Billing & Payments', text: 'To process subscription payments, issue invoices, manage plan upgrades/downgrades, and handle refund requests through Stripe.' },
      { head: 'Analytics & Improvement', text: 'To measure platform usage, identify bugs, improve features, and understand which automations and templates are most effective.' },
      { head: 'Advertising Measurement', text: 'To measure the effectiveness of our own advertising campaigns using anonymized and hashed identifiers. We do not use your subscriber data for advertising.' },
      { head: 'Security & Fraud Prevention', text: 'To detect unauthorized access, prevent abuse of automation features, monitor for policy violations, and protect the integrity of the platform.' },
      { head: 'Legal Compliance', text: 'To comply with applicable laws, respond to lawful requests from authorities, and enforce our Terms of Service.' },
      { head: 'Communications', text: 'To send service notifications, product updates, security alerts, and (where you have opted in) marketing emails about new features.' },
      { head: 'Referral Program', text: 'To track referral links, attribute successful referrals, and credit rewards to your account under our Referral Program.' },
    ]
  },
  {
    id: 'share', num: '4', icon: <Users size={20} color="#f59e0b" />, bg: '#fffbeb',
    title: 'How We Share Personal Data',
    content: [
      { head: 'We Do Not Sell Your Data', text: 'Smart100X does not sell, rent, or trade your personal data or your subscribers\' data to third parties for their commercial or advertising purposes.' },
      { head: 'Meta Platforms', text: 'To execute automations, we send data to the Meta API (Facebook/Instagram). This includes message content, automation responses, and account actions performed on your behalf.' },
      { head: 'WhatsApp & Telegram', text: 'When these integrations are enabled, relevant message data is transmitted to/from WhatsApp Business API and Telegram Bot API to deliver your automations.' },
      { head: 'Payment Processor (Stripe)', text: 'Billing information is shared with Stripe to process subscription payments. Stripe is PCI-DSS compliant. We do not receive or store your full card number.' },
      { head: 'Cloud Infrastructure', text: 'Our platform is hosted on secure cloud infrastructure (e.g., AWS, Render, Supabase). Your data is stored on encrypted servers in secure data centers.' },
      { head: 'AI Processing', text: 'When you use AI Studio, message content may be processed by our AI provider to generate reply suggestions. This is done under strict data processing agreements.' },
      { head: 'Analytics Providers', text: 'We use analytics tools (e.g., Google Analytics) to understand platform usage. These tools receive anonymized usage data and do not receive your personal account details.' },
      { head: 'Advertising Measurement Partners', text: 'We may share hashed identifiers (not personal data) with advertising platforms to measure the effectiveness of our own marketing campaigns.' },
      { head: 'Legal Authorities', text: 'We may disclose data when required by applicable law, court order, or government authority, or to protect the rights and safety of our users and platform.' },
      { head: 'Business Transfers', text: 'If Smart100X is acquired, merged, or undergoes a corporate restructuring, your data may be transferred to the acquiring entity subject to equivalent privacy protections.' },
    ]
  },
  {
    id: 'rights', num: '5', icon: <Shield size={20} color="#3b82f6" />, bg: '#eff6ff',
    title: 'Your Data Protection Rights & Choices',
    content: [
      { head: 'Access', text: 'You have the right to request a copy of the personal data we hold about you. Contact us at smart100x.support@gmail.com to make a data access request.' },
      { head: 'Rectification', text: 'You can update your account information directly from your Profile and Settings pages. If you need help correcting specific data, contact us.' },
      { head: 'Erasure (Right to be Forgotten)', text: 'You can permanently delete your account from Settings → Danger Zone. This will delete your account, all campaigns, audiences, contacts, flows, and associated data from our systems.' },
      { head: 'Data Portability', text: 'You may request an export of your data in a structured, machine-readable format. Contact smart100x.support@gmail.com to submit a portability request.' },
      { head: 'Withdraw Consent / Disconnect Meta', text: 'You can disconnect your Meta/Instagram account at any time from Settings. This will revoke our access to your Meta data. Existing automation campaigns will be paused.' },
      { head: 'Opt Out of Marketing Emails', text: 'You can unsubscribe from marketing emails at any time using the unsubscribe link in any email or by contacting us.' },
      { head: 'Subscriber Rights (Your Contacts)', text: 'If your subscribers wish to exercise their data rights (access, deletion, opt-out), they should contact you directly as you are the data controller for your audience data.' },
      { head: 'EEA / UK / Brazil Users', text: 'If you are located in the European Economic Area, United Kingdom, Switzerland, or Brazil, you have additional rights under GDPR, UK GDPR, or LGPD. Contact us to exercise these rights.' },
    ]
  },
  {
    id: 'meta-deletion', num: '5A', icon: <Trash2 size={20} color="#ef4444" />, bg: '#fef2f2',
    title: 'Facebook/Instagram Data Deletion Instructions',
    content: [
      { head: 'How to Delete Your Data', text: 'Smart100X provides multiple ways to delete your data. You can disconnect your Facebook/Instagram accounts from our platform at any time. To delete your specific Meta-related data, you can (1) Disconnect your Meta account from our Settings page, or (2) Permanently delete your entire Smart100X account from the "Danger Zone" in Settings.' },
      { head: 'Automatic Deletion', text: 'Upon account deletion or Meta account disconnection, we immediately revoke and delete your OAuth access tokens and stop receiving any data from the Meta API. All associated Instagram DM history, campaign logs, and contact data are permanently removed from our active databases within 30 days.' },
      { head: 'Meta Platform Tool', text: 'Alternatively, you can remove the Smart100X App via your Facebook/Instagram Profile by going to "Settings & Privacy" > "Apps and Websites" and clicking "Remove" on Smart100X. This will trigger our data deletion callback.' },
    ]
  },
  {
    id: 'retain', num: '6', icon: <Lock size={20} color="#64748b" />, bg: 'var(--sidebar-bg)',
    title: 'For How Long We Retain Personal Data',
    content: [
      { head: 'Active Account Data', text: 'We retain your account data, campaigns, audiences, flows, and settings for as long as your account is active.' },
      { head: 'After Account Deletion', text: 'When you permanently delete your account, we delete all associated data (campaigns, contacts, flows, inbox history, broadcast logs) within 30 days. Backups are purged within 90 days.' },
      { head: 'Billing Records', text: 'Payment and invoice records are retained for 7 years as required by financial regulations.' },
      { head: 'Meta Access Tokens', text: 'OAuth access tokens are deleted immediately upon account deletion or Meta account disconnection.' },
      { head: 'Usage Logs & Analytics', text: 'Anonymized usage logs are retained for up to 2 years for performance analysis and security monitoring.' },
      { head: 'Inactive Accounts', text: 'If your account has no activity (login, campaign activity, payment) for 18 consecutive months, we will notify you and may close the account and delete all data.' },
    ]
  },
  {
    id: 'international', num: '7', icon: <Globe size={20} color="#06b6d4" />, bg: '#ecfeff',
    title: 'International Data Transfers',
    content: [
      { head: 'Where We Process Data', text: 'Smart100X is operated primarily from the United States. Your data may be transferred to and processed in the US and other countries where our cloud infrastructure providers operate.' },
      { head: 'Safeguards for EEA/UK Users', text: 'If you are located in the EEA or UK, we ensure that international transfers of your personal data are protected by appropriate safeguards such as Standard Contractual Clauses (SCCs) approved by the European Commission.' },
      { head: 'Meta API Data Flows', text: 'Data exchanged with Meta (Facebook/Instagram) platforms is subject to Meta\'s own data transfer mechanisms and privacy policies.' },
      { head: 'Your Consent', text: 'By using Smart100X and connecting your social media accounts, you acknowledge that your data will be transferred to and processed in these jurisdictions.' },
    ]
  },
  {
    id: 'children', num: '8', icon: <Users size={20} color="#ec4899" />, bg: '#fdf2f8',
    title: "Children's Information",
    content: [
      { head: 'Minimum Age', text: 'Smart100X is not directed to children under the age of 13 (or 16 in the EEA). We do not knowingly collect personal data from children.' },
      { head: 'If We Discover Child Data', text: 'If we become aware that a child under 13 has provided us with personal data without parental consent, we will delete such information from our systems promptly.' },
      { head: 'Parental Concerns', text: 'If you are a parent or guardian and believe your child has provided us with personal data, please contact us at smart100x.support@gmail.com.' },
    ]
  },
  {
    id: 'security', num: '9', icon: <ShieldAlert size={20} color="#ef4444" />, bg: '#fef2f2',
    title: 'How We Protect Your Data (Security)',
    content: [
      { head: '🔐 AES-256 Encryption at Rest', text: 'All sensitive data stored on our servers — including Meta OAuth access tokens, Instagram credentials, and user account data — is encrypted using industry-standard AES-256 encryption. Even if someone gained unauthorized physical access to our servers, the data would be completely unreadable without the decryption keys.' },
      { head: '🔒 HTTPS / TLS Encryption in Transit', text: 'Every communication between your browser and Smart100X servers is encrypted using HTTPS with TLS (Transport Layer Security). Your data cannot be intercepted, modified, or read while being transmitted over the internet.' },
      { head: '🛡️ Brute-Force & Rate Limiting Protection', text: 'Our API enforces strict rate limits on login and signup attempts. After 20 failed login attempts in 15 minutes, the IP address is temporarily blocked. General API usage is capped at 120 requests per minute per user to prevent automated abuse and denial-of-service attacks.' },
      { head: '💉 NoSQL Injection Prevention', text: 'All incoming request data is automatically sanitized using server-side middleware that strips malicious database operators (such as MongoDB "$gt", "$where" operators). This prevents attackers from manipulating database queries to access or destroy other users data.' },
      { head: '🧹 XSS (Cross-Site Scripting) Protection', text: 'Every text input submitted through the platform is sanitized to strip malicious HTML and JavaScript before it is stored or displayed. This prevents cross-site scripting attacks where an attacker injects scripts to steal your session token or personal data.' },
      { head: '🔑 Secure JWT Authentication', text: 'Your login session is protected by a JSON Web Token (JWT) signed with a strong cryptographic secret. Tokens expire after 30 days. The server refuses to start without a properly configured secret — there is no weak default fallback.' },
      { head: '🚫 CORS Whitelist (Origin Protection)', text: 'Our API only accepts requests from authorized, whitelisted origins (Smart100X official domains). Requests originating from unknown or malicious websites are automatically rejected, preventing cross-origin attacks.' },
      { head: '📤 File Upload Safety', text: 'The file upload system only accepts safe file types (JPEG, PNG, GIF, WebP images; MP4, WebM videos; MP3, OGG audio). Files are limited to 10MB. Executable files, scripts, and all potentially dangerous file types are rejected immediately.' },
      { head: '🕵️ HTTP Parameter Pollution Prevention', text: 'Our server detects and rejects duplicate or conflicting query parameters that attackers use to confuse validation logic and bypass security checks. Every request is parsed and normalized before processing.' },
      { head: '📦 Payload Size Limits (Anti-DDoS)', text: 'All API requests are limited to a maximum body size of 2MB. This protects against payload bomb and denial-of-service attacks that attempt to overwhelm our servers with extremely large requests.' },
      { head: '🔏 Meta OAuth Token Security', text: 'Instagram and Facebook OAuth tokens are stored encrypted and are never exposed in browser-side code, API responses, or logs. Tokens are immediately and permanently deleted when you disconnect your account or delete your Smart100X account.' },
      { head: '🧱 HTTP Security Headers', text: 'Our server sends strict security headers on every response: Content-Security-Policy (blocks unauthorized scripts and frames), X-Frame-Options (prevents clickjacking), X-Content-Type-Options (prevents MIME sniffing), and Referrer-Policy (controls referrer information sharing).' },
      { head: '🚨 Safe Error Handling', text: 'In production, server errors return generic messages — never internal code, stack traces, or database details. Login failure messages use identical wording for wrong email or wrong password, preventing attackers from discovering which accounts exist on our platform (user enumeration protection).' },
      { head: '🔍 Strict Access Controls', text: 'Every API endpoint verifies your JWT before processing any request. User IDs are always taken from the verified token — never from request body parameters — preventing account impersonation attacks where one user modifies another users data.' },
      { head: '🔔 Breach Notification Policy', text: 'In the unlikely event of a data breach affecting your personal data, we will notify you and relevant data protection authorities as required by applicable law without undue delay and within the legally required timeframe (72 hours under GDPR).' },
      { head: '👤 Your Account Security Responsibility', text: 'You are responsible for keeping your Smart100X credentials confidential. We recommend a strong, unique password (minimum 12 characters, mixed case, numbers, symbols). Never share your account credentials. If you suspect unauthorized access, change your password immediately and contact us at smart100x.support@gmail.com.' },
    ]
  },
];


export default function Privacy() {
  const [open, setOpen] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '60px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '40px', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.1)', padding: '60px', marginBottom: '28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '280px', height: '280px', background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', zIndex: 0 }} />
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '40px', fontWeight: '700', fontSize: '15px', position: 'relative', zIndex: 1 }}>
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '88px', height: '88px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 12px 28px rgba(37,99,235,0.25)' }}>
              <Shield size={44} color="white" />
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '12px', letterSpacing: '-2px' }}>Privacy Policy</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '16px', lineHeight: '1.6' }}>
              At <strong>Smart100X</strong>, we consider the privacy and security of personal data to be extremely important.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--sidebar-bg)', padding: '8px 20px', borderRadius: '100px', color: 'var(--text-muted)', fontWeight: '700', fontSize: '14px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }} />
              Effective Date: May 5, 2026
            </div>
          </div>
        </div>

        {/* Intro */}
        <div style={{ background: 'var(--text-main)', color: 'white', borderRadius: '24px', padding: '32px 40px', marginBottom: '28px', lineHeight: '1.75', fontSize: '0.95rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
            We process personal data to provide Smart100X services including Instagram DM Automation, AI Studio, Broadcasts, Audiences, Forms, Flow Builder, WhatsApp & Telegram integrations, and Billing. This Privacy Policy explains what data we collect, why, and how we protect it in accordance with applicable data protection laws including <strong style={{ color: '#60a5fa' }}>GDPR, UK GDPR, and LGPD</strong>.
          </p>
        </div>

        {/* Security Trust Badges */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '28px 32px', marginBottom: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>Platform Security — Built Into Every Layer</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Your data is protected by multiple independent security systems</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '🔐', label: 'AES-256 Encryption', sub: 'Data encrypted at rest' },
              { icon: '🔒', label: 'HTTPS / TLS', sub: 'Encrypted in transit' },
              { icon: '🛡️', label: 'Rate Limiting', sub: 'Brute-force blocked' },
              { icon: '💉', label: 'Injection Safe', sub: 'NoSQL attacks blocked' },
              { icon: '🧹', label: 'XSS Protected', sub: 'Script injection blocked' },
              { icon: '🔑', label: 'Secure JWT Auth', sub: 'Session token protected' },
              { icon: '🚫', label: 'CORS Whitelist', sub: 'Unauthorized origins blocked' },
              { icon: '📤', label: 'Safe File Uploads', sub: 'Only safe file types allowed' },
              { icon: '📦', label: 'Payload Limits', sub: 'DDoS attacks mitigated' },
              { icon: '🧱', label: 'Security Headers', sub: 'Clickjacking prevented' },
              { icon: '🚨', label: 'Error Hiding', sub: 'No data leaked in errors' },
              { icon: '🔔', label: 'GDPR Breach Notice', sub: '72hr notification policy' },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--sidebar-bg)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)' }}>{b.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table of Contents */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '32px', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={18} color="#3b82f6" /> Table of Contents
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => { setOpen(s.id); setTimeout(() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); }}
                style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', flexShrink: 0 }}>{s.num}</span>
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          {sections.map(s => (
            <div key={s.id} id={s.id} style={{ background: 'var(--bg-card)', borderRadius: '20px', border: `1px solid ${open === s.id ? '#bfdbfe' : 'var(--border-subtle)'}`, boxShadow: open === s.id ? '0 8px 24px rgba(59,130,246,0.07)' : 'none', overflow: 'hidden', transition: 'all 0.3s' }}>
              <button onClick={() => setOpen(open === s.id ? null : s.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: open === s.id ? s.bg : 'var(--bg-card)', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.3s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: open === s.id ? 'var(--bg-card)' : s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{s.num}. {s.title}</span>
                </div>
                <ChevronDown size={18} color="#94a3b8" style={{ transform: open === s.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s', flexShrink: 0 }} />
              </button>
              {open === s.id && (
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--border-subtle)', background: s.bg }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '20px' }}>
                    {s.content.map((item, i) => (
                      <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(0,0,0,0.04)' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '14px', marginBottom: '6px' }}>{item.head}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.7' }}>{item.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '28px', border: '1px solid var(--border-subtle)', padding: '48px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>Questions About Your Privacy?</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '0.95rem' }}>Our dedicated privacy team is happy to help you with any data-related requests.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>
            <a href="mailto:smart100x.support@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', boxShadow: '0 8px 20px rgba(37,99,235,0.2)' }}>
              <Mail size={18} /> smart100x.support@gmail.com
            </a>
            <Link to="/help" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'var(--sidebar-bg)', color: 'var(--text-main)', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', border: '1px solid var(--border-subtle)' }}>
              Help Center
            </Link>
            <Link to="/cookies" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'var(--sidebar-bg)', color: 'var(--text-main)', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', border: '1px solid var(--border-subtle)' }}>
              Cookie Statement
            </Link>
            <button 
              onClick={() => { setOpen('meta-deletion'); setTimeout(() => document.getElementById('meta-deletion')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#fff1f2', color: '#e11d48', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', border: '1px solid #fecdd3', cursor: 'pointer' }}>
              <Trash2 size={18} /> Request Data Deletion
            </button>
          </div>
        </div>

        <footer style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>
          © 2026 Smart100X AI. All rights reserved. ·{' '}
          <Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</Link>
          {' · '}
          <Link to="/cookies" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Cookie Statement</Link>
        </footer>
      </div>
    </div>
  );
}
