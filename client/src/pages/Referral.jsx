import { Gift, Copy, Users, Star, ChevronRight, DollarSign } from 'lucide-react';
import { useState } from 'react';

export default function Referral() {
  const [copied, setCopied] = useState(false);
  const referralLink = 'https://zenxchat.com/ref/user123';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rewards = [
    { tier: '1 Referral', reward: '1 Month Free Pro', icon: <Star size={20} />, color: '#f59e0b', locked: false },
    { tier: '3 Referrals', reward: '$10 Cash Reward', icon: <DollarSign size={20} />, color: '#10b981', locked: true },
    { tier: '10 Referrals', reward: 'Lifetime Pro Access', icon: <Gift size={20} />, color: '#7c3aed', locked: true },
  ];

  return (
    <div style={{ padding: '0 40px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ padding: '8px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px' }}>
            <Gift size={24} color="#f59e0b" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>Refer & Earn</h2>
        </div>
        <p style={{ color: '#64748b', fontSize: '15px' }}>Invite friends to ZenXchat and earn amazing rewards for every successful referral.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Total Referrals', value: '0', color: '#7c3aed' },
              { label: 'Rewards Earned', value: '₹0', color: '#10b981' },
              { label: 'Pending', value: '0', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '30px', fontWeight: '800', color: s.color, marginBottom: '6px' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Referral Link */}
          <div className="stat-card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>Your Referral Link</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Share this link with your friends to earn rewards.</p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1, padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {referralLink}
              </div>
              <button
                onClick={handleCopy}
                style={{ padding: '14px 20px', background: copied ? '#10b981' : '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
              >
                <Copy size={16} /> {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="stat-card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }}>How it works</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { step: '1', title: 'Share your link', desc: 'Send your referral link to friends or post on social media.' },
                { step: '2', title: 'Friend signs up', desc: 'Your friend creates a ZenXchat account using your link.' },
                { step: '3', title: 'Earn rewards', desc: 'Get exclusive rewards when they become an active user.' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0 }}>
                    {s.step}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>{s.title}</h4>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Rewards */}
        <div className="stat-card" style={{ padding: '32px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>Reward Tiers</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Unlock bigger rewards as you refer more friends.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {rewards.map((r, i) => (
              <div key={i} style={{ padding: '16px 20px', borderRadius: '16px', border: `1px solid ${r.locked ? '#f1f5f9' : r.color + '40'}`, background: r.locked ? '#fafafa' : r.color + '08', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: r.locked ? '#f1f5f9' : r.color + '15', color: r.locked ? '#94a3b8' : r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {r.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '2px' }}>{r.tier}</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: r.locked ? '#94a3b8' : '#1e293b' }}>{r.reward}</div>
                </div>
                {r.locked ? (
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #e2e8f0' }}></div>
                ) : (
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star size={10} color="white" fill="white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
