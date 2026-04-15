import { Sparkles, Plus, Zap, MessageCircle, ChevronRight, Brain, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AIStudio() {
  const aiFeatures = [
    { icon: <Brain size={24} />, title: 'Smart Triggers', desc: 'Detect keywords and intent automatically', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)' },
    { icon: <MessageCircle size={24} />, title: 'AI Responses', desc: 'Generate contextual replies in real-time', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
    { icon: <Zap size={24} />, title: 'Auto Flows', desc: 'Build multi-step conversation flows', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { icon: <Star size={24} />, title: 'Sentiment Analysis', desc: 'Understand tone and emotion in messages', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  ];

  return (
    <div style={{ padding: '0 40px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ padding: '8px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '12px' }}>
              <Sparkles size={24} color="#7c3aed" />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>AI Studio</h2>
            <span style={{ background: '#fdf2f8', color: '#db2777', fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '8px', textTransform: 'uppercase' }}>NEW</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '15px' }}>Build intelligent automations powered by AI for your Instagram DMs.</p>
        </div>
        <Link to="/campaigns" className="landing-cta" style={{ background: '#7c3aed', padding: '12px 28px', fontSize: '14px', borderRadius: '14px', gap: '8px' }}>
          <Plus size={18} /> New AI Trigger
        </Link>
      </div>

      {/* Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px' }}>
        {aiFeatures.map((f, i) => (
          <div key={i} className="stat-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', padding: '28px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {f.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>{f.desc}</p>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </div>
        ))}
      </div>

      {/* Empty State CTA */}
      <div className="stat-card" style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={40} color="#7c3aed" />
        </div>
        <div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>No AI triggers yet</h3>
          <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '380px', margin: '0 auto' }}>
            Create your first AI-powered trigger to start having intelligent conversations with your followers automatically.
          </p>
        </div>
        <Link to="/campaigns" className="landing-cta" style={{ background: '#7c3aed', padding: '14px 32px', fontSize: '15px', borderRadius: '14px', gap: '8px' }}>
          <Plus size={18} /> Create First AI Trigger
        </Link>
      </div>
    </div>
  );
}
