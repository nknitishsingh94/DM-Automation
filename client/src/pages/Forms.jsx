import { FileText, Plus, BarChart2, MousePointer, CheckCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Forms() {
  const formTypes = [
    { icon: <MousePointer size={22} />, title: 'Lead Capture', desc: 'Collect name, email & phone via DM', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    { icon: <CheckCircle size={22} />, title: 'Survey & Feedback', desc: 'Ask questions and collect answers', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { icon: <BarChart2 size={22} />, title: 'Quiz Flow', desc: 'Interactive quizzes with personalized results', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { icon: <FileText size={22} />, title: 'Application Form', desc: 'Multi-step application collection', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  ];

  return (
    <div style={{ padding: '0 40px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px' }}>
              <FileText size={24} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>Forms</h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '15px' }}>Collect leads and data from your followers directly through Instagram DMs.</p>
        </div>
        <button className="landing-cta" style={{ background: '#10b981', padding: '12px 28px', fontSize: '14px', borderRadius: '14px', gap: '8px', border: 'none', cursor: 'pointer' }}>
          <Plus size={18} /> Create Form
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {[
          { label: 'Total Forms', value: '0', color: '#7c3aed' },
          { label: 'Submissions', value: '0', color: '#10b981' },
          { label: 'Avg. Completion', value: '0%', color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: s.color, marginBottom: '6px' }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Form Type Cards */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Choose a Form Type</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {formTypes.map((f, i) => (
            <div key={i} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', cursor: 'pointer' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {f.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>{f.title}</h4>
                <p style={{ fontSize: '12px', color: '#64748b' }}>{f.desc}</p>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
