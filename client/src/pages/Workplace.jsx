import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../App';
import { API_BASE_URL } from '../config';
import {
  Instagram, Facebook, MessageSquare, ChevronRight,
  Sliders, ArrowLeft, Calendar, Clock, Image, Plane,
  Layers, Zap, BarChart2, Users, Inbox, Settings,
  Shield, HelpCircle
} from 'lucide-react';

import LoadingSpinner from '../components/LoadingSpinner';

/* ─────────────────────────────────────────────────────────────────────────────
 * WORKPLACE – Main dashboard
 * ───────────────────────────────────────────────────────────────────────────── */
export default function Workplace() {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) { notify('Session expired. Please log in again.', 'error'); return; }
      const data = await res.json();
      const list = [];

      if (data.instagramAccessToken && data.businessAccountId) {
        list.push({
          id: 'instagram',
          name: data.connectedInstagramName || 'Instagram Account',
          platform: 'Instagram',
          Icon: Instagram,
          color: '#e1306c',
        });
      }
      if (data.facebookAccessToken && data.facebookPageId) {
        list.push({
          id: 'facebook',
          name: data.connectedFacebookName || 'Facebook Page',
          platform: 'Facebook',
          Icon: Facebook,
          color: '#1877f2',
        });
      }
      if (data.whatsappToken && data.whatsappPhoneNumberId) {
        list.push({
          id: 'whatsapp',
          name: data.whatsappDisplayName || 'WhatsApp Business',
          platform: 'WhatsApp',
          Icon: MessageSquare,
          color: '#25d366',
        });
      }
      if (data.connectedPageName) {
        try {
          const parsed = JSON.parse(data.connectedPageName);
          if (parsed.isThreadsConnected) {
            list.push({
              id: 'threads',
              name: parsed.connectedThreadsName || 'Threads Profile',
              platform: 'Threads',
              Icon: ChevronRight,
              color: 'var(--text-main)',
            });
          }
        } catch {}
      }

      setAccounts(list);
    } catch (err) {
      console.error(err);
      notify('Failed to load workplace accounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner minHeight="60vh" />;

  return (
    <div style={{
      maxWidth: '1100px', width: '100%', display: 'flex', flexDirection: 'column',
      gap: '28px', padding: '0 16px 100px 16px', margin: '0 auto',
      fontFamily: 'Inter, system-ui, sans-serif',
      animation: 'fadeIn 0.45s ease-out',
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Workplace
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, fontWeight: '400' }}>
            Your connected accounts, all in one place.
          </p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          style={{
            background: '#ea580c', color: 'white', padding: '10px 18px', borderRadius: '8px',
            fontWeight: '600', fontSize: '0.88rem', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'background 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#c2410c'}
          onMouseOut={e => e.currentTarget.style.background = '#ea580c'}
        >
          <Sliders size={16} /> Manage Connections
        </button>
      </div>

      {/* ── Account Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
        {accounts.map(acc => (
          <div
            key={acc.id}
            onClick={() => navigate(`/workplace/${acc.id}`)}
            style={{
              border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '22px',
              background: 'var(--bg-card)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex', flexDirection: 'column', gap: '16px',
              cursor: 'pointer',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 14px 32px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = acc.color + '66';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            {/* Top colour bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: `linear-gradient(90deg, ${acc.color}, ${acc.color}bb)`
            }} />

            {/* Icon + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: `linear-gradient(135deg, ${acc.color}18, ${acc.color}0c)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <acc.Icon size={26} color={acc.color} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {acc.platform}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {acc.name}
                </p>
              </div>
            </div>

            {/* Status + hint */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: '700',
                padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>Connected</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Click to open workbench</span>
            </div>

            {/* Placeholder stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Scheduled', sub: '0' },
                { label: 'Active', sub: '—' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--sidebar-bg)', borderRadius: '10px', padding: '12px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div style={{
              marginTop: 'auto', padding: '10px 14px', borderRadius: '10px',
              background: 'var(--bg-dark)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: '0.82rem', fontWeight: '500', color: 'var(--text-muted)',
            }}>
              <span>Open {acc.platform} workbench</span>
              <ArrowLeft size={15} style={{ transform: 'rotate(180deg)', color: 'var(--text-muted)' }} />
            </div>
          </div>
        ))}

        {/* Empty state */}
        {accounts.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '70px 20px', textAlign: 'center',
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-dark)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
            }}>
              <Sliders size={32} color="#94a3b8" />
            </div>
            <h3 style={{
              margin: '0 0 12px 0', fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)',
            }}>
              No accounts connected yet
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', lineHeight: '1.6' }}>
              Connect your Instagram, Facebook, WhatsApp or Threads account in
              <button
                onClick={() => navigate('/settings')}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent-color)',
                  fontWeight: '700', cursor: 'pointer', padding: '0 4px', fontSize: '1rem',
                }}
              >Settings</button>
              to get started with your Workplace.
            </p>
            <button
              onClick={() => navigate('/settings')}
              style={{
                marginTop: '22px', background: '#ea580c', color: 'white',
                padding: '12px 24px', borderRadius: '10px', fontWeight: '700',
                fontSize: '0.95rem', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 14px rgba(234,88,12,0.3)', transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#c2410c'}
              onMouseOut={e => e.currentTarget.style.background = '#ea580c'}
            >
              <Sliders size={18} /> Go to Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * INSTAGRAM WORKBENCH  – detail page at /workplace/instagram
 * ───────────────────────────────────────────────────────────────────────────── */
export function InstagramWorkbench() {
  const navigate = useNavigate();
  return <WorkbenchShell platform="Instagram" color="#e1306c" Icon={Instagram} onBack={() => navigate('/workplace')} />;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * FACEBOOK WORKBENCH  – detail page at /workplace/facebook
 * ───────────────────────────────────────────────────────────────────────────── */
export function FacebookWorkbench() {
  const navigate = useNavigate();
  return <WorkbenchShell platform="Facebook" color="#1877f2" Icon={Facebook} onBack={() => navigate('/workplace')} />;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * WORKBENCH SHELL  – shared UI for every single-account detail page
 * ───────────────────────────────────────────────────────────────────────────── */
function WorkbenchShell({ platform, color, Icon, onBack }) {
  return (
    <div style={{
      maxWidth: '1100px', width: '100%', display: 'flex', flexDirection: 'column',
      gap: '24px', padding: '0 16px 100px 16px', margin: '0 auto',
      fontFamily: 'Inter, system-ui, sans-serif',
      animation: 'fadeIn 0.5s ease-out',
    }}>
      {/* ── Back + Title header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'var(--bg-card)', border: 'none', borderRadius: '10px',
            width: '40px', height: '40px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = '#111827'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#6b7280'; }}
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: `linear-gradient(135deg, ${color}18, ${color}08)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={26} color={color} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{
              fontSize: '1.7rem', fontWeight: '700', color: 'var(--text-main)',
              margin: 0,
            }}>
              {platform} Workspace
            </h1>
            <p style={{
              color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0', fontWeight: '400',
            }}>
              Account-specific management and settings
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/settings')}
          style={{
            background: 'var(--bg-card)', color: 'var(--text-main)', padding: '8px 16px', borderRadius: '8px',
            fontWeight: '600', fontSize: '0.82rem', border: '1px solid var(--border-subtle)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#e5e7eb'}
          onMouseOut={e => e.currentTarget.style.background = '#f3f4f6'}
        >
          <Settings size={15} /> Account Settings
        </button>
      </div>

      {/* ── Quick-action cards ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px',
      }}>
        {QUICK_ACTIONS.map(({ label, desc, cardColor }) => {
          /* Resolve icon outside JSX so the parser never sees bracket-notation in a tag name */
          const ActionIcon =
            label === 'Schedule Post' ? Calendar :
            label === 'Auto Replies'  ? Zap :
            label === 'Engagement'    ? BarChart2 :
            label === 'Audience'      ? Users :
            label === 'Inbox'         ? Inbox :
            label === 'Safety Center' ? Shield :
                                         Settings;

          return (
            <div
              key={label}
              onClick={() =>
                label === 'Schedule Post'       ? navigate('/scheduling')        :
                label === 'Auto Replies'        ? navigate('/ai-studio')         :
                label === 'Engagement'          ? navigate('/analytics')         :
                label === 'Audience'            ? navigate('/contacts')          :
                label === 'Inbox'               ? navigate(`/${platform.toLowerCase()}`) :
                label === 'Safety Center'       ? navigate('/automations')       :
                                                   navigate('/')
              }
              style={{
                border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px',
                background: 'var(--bg-card)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                display: 'flex', flexDirection: 'column', gap: '12px',
                cursor: 'pointer',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,0.09)';
                e.currentTarget.style.borderColor = cardColor + '44';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `linear-gradient(135deg, ${cardColor}18, ${cardColor}0a)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ActionIcon size={22} color={cardColor} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {label}
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                  {desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Info callout ── */}
      <div style={{
        background: 'var(--sidebar-bg)', borderRadius: '16px', padding: '24px 28px',
        border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: '14px',
      }}>
        <HelpCircle size={22} color='var(--accent-color)' style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {platform} Account Management
          </h4>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            All connections, automation rules, and campaign settings for this {platform} account
            are managed from{' '}
            <button
              onClick={() => navigate('/settings')}
              style={{
                background: 'none', border: 'none', color: 'var(--accent-color)',
                fontWeight: '700', cursor: 'pointer', padding: 0, fontSize: '0.88rem',
              }}
            >Account Settings</button>.
            Posts you schedule here are queued for this account only.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * ANCHOR DATA – quick-action cards shared by all WorkbenchShells
 * ───────────────────────────────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'Schedule Post', desc: 'Plan publications ahead of time', cardColor: 'var(--accent-color)' },
  { label: 'Auto Replies',  desc: 'AI-powered DM & comment responses', cardColor: '#16a34a' },
  { label: 'Engagement',    desc: 'Growth stats & analytics', cardColor: '#0891b2' },
  { label: 'Audience',      desc: 'Followers & contact directory', cardColor: '#d97706' },
  { label: 'Inbox',         desc: 'View & respond to messages', cardColor: '#2563eb' },
  { label: 'Safety Center', desc: 'Privacy, blocks & moderation', cardColor: '#dc2626' },
];
