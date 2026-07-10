import React, { useState } from 'react';
import { Cookie, ArrowLeft, Mail, ChevronDown, Shield, BarChart2, Settings, Zap, Globe, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const cookieCategories = [
  {
    id: 'essential',
    icon: <Shield size={22} color="#10b981" />,
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    title: 'Strictly Necessary Cookies',
    required: true,
    description: 'These cookies are essential for the website to function properly. They enable core functionality such as security, network management, and account authentication. You may disable these by changing your browser settings, but this may affect how the website functions.',
    examples: [
      { name: 'insta_agent_token', purpose: 'Stores your authentication session token to keep you logged in securely.', duration: 'Session' },
      { name: 'insta_agent_user', purpose: 'Stores basic user profile data to personalize your experience.', duration: 'Session' },
      { name: 'insta_agent_connected', purpose: 'Remembers whether your Instagram/Meta account is connected.', duration: '30 days' },
      { name: 'csrf_token', purpose: 'Cross-site request forgery protection to secure form submissions.', duration: 'Session' },
    ]
  },
  {
    id: 'performance',
    icon: <BarChart2 size={22} color="#3b82f6" />,
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    title: 'Performance & Analytics Cookies',
    required: false,
    description: 'These cookies allow us to count visits and traffic sources, so we can measure and improve the performance of our site. They help us know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous.',
    examples: [
      { name: '_ga', purpose: 'Google Analytics — registers a unique ID used to generate statistical data on how visitors use the website.', duration: '2 years' },
      { name: '_gid', purpose: 'Google Analytics — registers a unique ID to generate statistical data on how visitors use the website.', duration: '24 hours' },
      { name: '_gat', purpose: 'Google Analytics — used to throttle request rate.', duration: '1 minute' },
      { name: 'page-has-been-force-refreshed', purpose: 'Tracks whether a page has been force-refreshed to prevent infinite reload loops.', duration: 'Session' },
    ]
  },
  {
    id: 'functional',
    icon: <Settings size={22} color="#8b5cf6" />,
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    title: 'Functional Cookies',
    required: false,
    description: 'These cookies enable the website to provide enhanced functionality and personalisation. They may be set by us or by third-party providers whose services we have added to our pages. If you do not allow these cookies, some or all of these services may not function properly.',
    examples: [
      { name: 'language_pref', purpose: 'Remembers your preferred language settings for the platform.', duration: '1 year' },
      { name: 'sidebar_state', purpose: 'Remembers whether the sidebar is open or collapsed.', duration: '30 days' },
      { name: 'theme_preference', purpose: 'Stores your UI theme preference (light or dark mode).', duration: '1 year' },
      { name: 'active_workspace', purpose: 'Remembers your last active workspace or connected account.', duration: '7 days' },
    ]
  },
  {
    id: 'targeting',
    icon: <Zap size={22} color="#f59e0b" />,
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    title: 'Targeting & Advertising Cookies',
    required: false,
    description: 'These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant advertisements on other sites. They do not store directly personal information, but are based on uniquely identifying your browser and internet device.',
    examples: [
      { name: '_fbp', purpose: 'Facebook Pixel — used to deliver, measure, and improve the relevance of ads on Facebook.', duration: '3 months' },
      { name: 'fr', purpose: 'Facebook — enables ad delivery and measurement on Facebook and Meta platforms.', duration: '3 months' },
      { name: 'ads_session', purpose: 'Tracks ad conversion events from campaigns to measure effectiveness.', duration: 'Session' },
      { name: 'retargeting_id', purpose: 'Enables remarketing campaigns to reach users who have previously visited Smart100X.', duration: '30 days' },
    ]
  },
  {
    id: 'thirdparty',
    icon: <Globe size={22} color="#ec4899" />,
    color: '#ec4899',
    bg: '#fdf2f8',
    border: '#fbcfe8',
    title: 'Third-Party Cookies',
    required: false,
    description: 'Our website integrates with several third-party services that may set their own cookies. These include Meta (Facebook/Instagram), Google Sign-In, and payment processors. These third-party cookies are governed by the respective third-party privacy policies and are outside of our direct control.',
    examples: [
      { name: 'g_state', purpose: 'Google Identity Services — manages the state of the Google Sign-In session.', duration: 'Session' },
      { name: 'VISITOR_INFO1_LIVE', purpose: 'YouTube — tries to estimate the user\'s bandwidth on pages with YouTube videos.', duration: '6 months' },
      { name: 'stripe_mid', purpose: 'Stripe — fraud prevention and secure payment processing.', duration: '1 year' },
      { name: 'intercom-*', purpose: 'Intercom — enables live chat support and customer engagement features.', duration: 'Session' },
    ]
  }
];

const faqs = [
  { q: 'What is a cookie?', a: 'A cookie is a small text file that is placed on your device (computer, smartphone, or tablet) when you visit a website. Cookies help websites remember your preferences, keep you logged in, and understand how you interact with the site.' },
  { q: 'How do we use cookies?', a: 'Smart100X uses cookies to authenticate users, remember your preferences, analyze how our Services are used, and to deliver a secure and personalized experience. Some cookies are strictly necessary for the platform to function, while others are optional and used for analytics or advertising.' },
  { q: 'Can I control cookies?', a: 'Yes. You can control and manage cookies in several ways. Your browser allows you to refuse all or some cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of the Smart100X platform may become inaccessible or not function properly.' },
  { q: 'How do I manage cookies in my browser?', a: 'You can manage cookies through your browser settings. Links to guidance for common browsers: Chrome (Settings > Privacy and Security > Cookies), Firefox (Options > Privacy & Security), Safari (Preferences > Privacy), Edge (Settings > Cookies and site permissions).' },
  { q: 'Do you use cookies for advertising?', a: 'We may use targeting cookies to measure the effectiveness of our advertising campaigns and show relevant content. You can opt-out of advertising cookies without affecting your use of the core Smart100X platform features.' },
  { q: 'Do third parties set cookies through Smart100X?', a: 'Yes. Some of our pages display content from, or are linked to, third-party content providers such as Meta (Facebook/Instagram), Google, and payment processors. These third parties may set their own cookies to track your interaction with their embedded content.' },
  { q: 'How often is this Cookie Statement updated?', a: 'We may update this Cookie Statement from time to time to reflect changes in technology, regulation, or business practice. When we make changes, we will update the "Effective Date" at the top of the page and notify you if required by applicable law.' },
];

export default function Cookies() {
  const [openCategory, setOpenCategory] = useState('essential');
  const [openFaq, setOpenFaq] = useState(null);
  const [consent, setConsent] = useState({ performance: true, functional: true, targeting: false, thirdparty: false });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '60px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* ── Hero Header ── */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '40px', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.1)', padding: '60px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '280px', height: '280px', background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)', zIndex: 0 }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', zIndex: 0 }} />

          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '40px', fontWeight: '700', fontSize: '15px', position: 'relative', zIndex: 1 }}>
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>

          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '88px', height: '88px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 12px 28px rgba(217,119,6,0.3)' }}>
              <Cookie size={44} color="white" />
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: '900', color: 'var(--text-main)', marginBottom: '12px', letterSpacing: '-2px', lineHeight: 1.1 }}>Cookie Statement</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>Smart100X, Inc. — Effective Date: April 1, 2026</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '620px', margin: '0 auto', lineHeight: '1.7' }}>
              This Cookie Statement explains how Smart100X uses cookies and similar tracking technologies when you use our platform. It describes what these technologies are, why we use them, and your rights to control our use of them.
            </p>
          </div>
        </div>

        {/* ── What Are Cookies ── */}
        <div style={{ background: 'var(--text-main)', color: 'white', borderRadius: '24px', padding: '36px 40px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(251,191,36,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Cookie size={24} color="#fbbf24" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px', color: 'white' }}>What Are Cookies?</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: '1.75', fontSize: '0.95rem', marginBottom: '12px' }}>
                Cookies are small text files placed on your device when you visit a website. They serve many purposes — from keeping you logged in to helping us understand how our platform is used. Some cookies are essential for the site to work; others are optional and help us improve your experience.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: '1.75', fontSize: '0.95rem', margin: 0 }}>
                We also use similar technologies such as <strong style={{ color: '#60a5fa' }}>web beacons</strong>, <strong style={{ color: '#60a5fa' }}>pixel tags</strong>, <strong style={{ color: '#60a5fa' }}>local storage</strong>, and <strong style={{ color: '#60a5fa' }}>session storage</strong> that function similarly to cookies and are subject to this same statement.
              </p>
            </div>
          </div>
        </div>

        {/* ── Cookie Categories ── */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '36px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Cookie Categories</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>Click each category to learn more and see which specific cookies we use.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cookieCategories.map(cat => (
              <div key={cat.id} style={{ border: `1px solid ${openCategory === cat.id ? cat.border : 'var(--border-subtle)'}`, borderRadius: '18px', overflow: 'hidden', transition: 'all 0.3s', boxShadow: openCategory === cat.id ? `0 8px 24px ${cat.color}18` : 'none' }}>
                <button onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: openCategory === cat.id ? cat.bg : 'var(--bg-card)', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.3s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: openCategory === cat.id ? 'var(--bg-card)' : cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0 }}>
                      {cat.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{cat.title}</span>
                        {cat.required && (
                          <span style={{ fontSize: '11px', fontWeight: '700', background: '#dcfce7', color: '#15803d', padding: '2px 10px', borderRadius: '100px', border: '1px solid #bbf7d0' }}>Always Active</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {!cat.required && (
                      <div onClick={e => { e.stopPropagation(); setConsent(prev => ({ ...prev, [cat.id]: !prev[cat.id] })); }}
                        style={{ width: '44px', height: '24px', borderRadius: '12px', background: consent[cat.id] ? cat.color : 'var(--border-subtle)', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
                        <div style={{ width: '18px', height: '18px', background: 'var(--bg-card)', borderRadius: '50%', position: 'absolute', top: '3px', left: consent[cat.id] ? '23px' : '3px', transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                      </div>
                    )}
                    <ChevronDown size={18} color="#94a3b8" style={{ transform: openCategory === cat.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s', flexShrink: 0 }} />
                  </div>
                </button>

                {openCategory === cat.id && (
                  <div style={{ padding: '0 24px 24px', background: cat.bg, borderTop: `1px solid ${cat.border}` }}>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.75', fontSize: '0.93rem', padding: '20px 0 16px', margin: 0 }}>{cat.description}</p>
                    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: `1px solid ${cat.border}`, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 100px', gap: '0', background: cat.bg, padding: '10px 20px', borderBottom: `1px solid ${cat.border}` }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Cookie Name</span>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Purpose</span>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Duration</span>
                      </div>
                      {cat.examples.map((ex, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 100px', gap: '0', padding: '14px 20px', borderBottom: i < cat.examples.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'start' }}>
                          <code style={{ fontSize: '12px', fontWeight: '700', color: cat.color, background: cat.bg, padding: '3px 8px', borderRadius: '6px', width: 'fit-content' }}>{ex.name}</code>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', paddingRight: '12px' }}>{ex.purpose}</span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', background: 'var(--sidebar-bg)', padding: '3px 10px', borderRadius: '8px', width: 'fit-content' }}>{ex.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── How to Control Cookies ── */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '36px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '20px' }}>How to Control Cookies</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {[
              { browser: 'Google Chrome', icon: '🌐', steps: 'Settings → Privacy and Security → Cookies and other site data' },
              { browser: 'Mozilla Firefox', icon: '🦊', steps: 'Options → Privacy & Security → Cookies and Site Data' },
              { browser: 'Apple Safari', icon: '🧭', steps: 'Preferences → Privacy → Manage Website Data' },
              { browser: 'Microsoft Edge', icon: '🔷', steps: 'Settings → Cookies and site permissions → Manage and delete cookies' },
            ].map((b, i) => (
              <div key={i} style={{ background: 'var(--sidebar-bg)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{b.icon}</div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>{b.browser}</h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>{b.steps}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px', padding: '16px 20px', background: '#fffbeb', borderRadius: '14px', border: '1px solid #fde68a', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
            <p style={{ color: '#92400e', fontSize: '0.88rem', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
              <strong>Please note:</strong> Disabling essential cookies will prevent you from logging in to Smart100X and using core platform features. Disabling optional cookies will only affect analytics, personalisation, and advertising features.
            </p>
          </div>
        </div>

        {/* ── Do Not Track ── */}
        <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: '24px', border: '1px solid #ddd6fe', padding: '32px 36px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#4c1d95', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={20} color='var(--accent-color)' /> Do Not Track Signals
          </h2>
          <p style={{ color: '#5b21b6', lineHeight: '1.75', fontSize: '0.93rem', margin: 0 }}>
            Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you visit that you do not want to have your online activity tracked. Because there is not yet a common understanding of how to interpret DNT signals, Smart100X does not currently respond to browser DNT signals. You can use the controls described in this Cookie Statement to manage tracking on our platform.
          </p>
        </div>

        {/* ── FAQ Accordion ── */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '36px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '20px' }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ border: `1px solid ${openFaq === i ? '#bfdbfe' : 'var(--bg-dark)'}`, borderRadius: '14px', overflow: 'hidden', transition: 'all 0.3s' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: openFaq === i ? '#eff6ff' : 'var(--bg-card)', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{faq.q}</span>
                  <ChevronDown size={16} color="#94a3b8" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s', flexShrink: 0 }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 18px', borderTop: '1px solid #bfdbfe', background: '#eff6ff' }}>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.75', fontSize: '0.9rem', margin: '14px 0 0 0' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Contact ── */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '28px', border: '1px solid var(--border-subtle)', padding: '48px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>Questions About Our Cookie Use?</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 28px' }}>
            If you have any questions about how Smart100X uses cookies or this Cookie Statement, please contact our Privacy team.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>
            <a href="mailto:smart100x.support@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', fontSize: '0.95rem', boxShadow: '0 8px 20px rgba(217,119,6,0.25)' }}>
              <Mail size={18} /> smart100x.support@gmail.com
            </a>
            <Link to="/privacy" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'var(--sidebar-bg)', color: 'var(--text-main)', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', fontSize: '0.95rem', border: '1px solid var(--border-subtle)' }}>
              Privacy Policy
            </Link>
            <Link to="/terms" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'var(--sidebar-bg)', color: 'var(--text-main)', padding: '14px 28px', borderRadius: '14px', textDecoration: 'none', fontWeight: '700', fontSize: '0.95rem', border: '1px solid var(--border-subtle)' }}>
              Terms of Service
            </Link>
          </div>
        </div>

        <footer style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>
          © 2026 Smart100X AI. All rights reserved. ·{' '}
          <Link to="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
          {' · '}
          <Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</Link>
        </footer>
      </div>
    </div>
  );
}
