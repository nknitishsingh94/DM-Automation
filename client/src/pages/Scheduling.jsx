import React from 'react';
import { 
  Plus, 
  UploadCloud, 
  ChevronDown, 
  Grid, 
  List, 
  Calendar, 
  Minus, 
  Pencil,
  ArrowDownUp
} from 'lucide-react';

export default function Scheduling() {
  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '1.75rem', fontWeight: '700', color: '#1e293b' }}>Posts</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Manage your scheduled and published content</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#e14d2a', color: 'white', border: 'none',
            padding: '10px 16px', borderRadius: '8px', fontWeight: '600',
            fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s'
          }} onMouseOver={(e) => e.currentTarget.style.background = '#d03f20'} onMouseOut={(e) => e.currentTarget.style.background = '#e14d2a'}>
            <Plus size={18} /> Create post
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'white', color: '#334155', border: '1px solid #cbd5e1',
            padding: '10px 16px', borderRadius: '8px', fontWeight: '600',
            fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s'
          }} onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.background = 'white'}>
            <UploadCloud size={18} /> Import CSV
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {['All posts', 'All platforms', 'All profiles', 'All users', 'All dates'].map((filter, idx) => (
            <button key={idx} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'white', color: '#475569', border: '1px solid #cbd5e1',
              padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem',
              fontWeight: '500', cursor: 'pointer'
            }}>
              {filter === 'All dates' && <Calendar size={14} style={{ marginRight: '4px' }} />}
              {filter} <ChevronDown size={14} />
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'white', color: '#475569', border: '1px solid #cbd5e1',
            padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem',
            fontWeight: '500', cursor: 'pointer'
          }}>
            <ArrowDownUp size={14} /> Scheduled (new) <ChevronDown size={14} />
          </button>
          
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
            <button style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '8px 10px', cursor: 'pointer' }}><Grid size={16} /></button>
            <button style={{ background: 'white', color: '#64748b', border: 'none', borderLeft: '1px solid #cbd5e1', padding: '8px 10px', cursor: 'pointer' }}><List size={16} /></button>
            <button style={{ background: 'white', color: '#64748b', border: 'none', borderLeft: '1px solid #cbd5e1', padding: '8px 10px', cursor: 'pointer' }}><Calendar size={16} /></button>
          </div>
          
          <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', alignItems: 'center' }}>
            <button style={{ background: 'white', color: '#64748b', border: 'none', padding: '8px', cursor: 'pointer' }}><Minus size={14} /></button>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', padding: '0 8px' }}>4</span>
            <button style={{ background: 'white', color: '#64748b', border: 'none', padding: '8px', cursor: 'pointer' }}><Plus size={14} /></button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div style={{ 
        background: 'white', 
        border: '1px solid #e2e8f0', 
        borderRadius: '12px', 
        height: '500px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' 
        }}>
          <Pencil size={32} color="#64748b" style={{ transform: 'rotate(-45deg)' }} />
        </div>
        
        <h2 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>No posts yet</h2>
        <p style={{ margin: '0 0 32px 0', color: '#64748b', fontSize: '1rem' }}>Create your first social media post</p>
        
        <button style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#e14d2a', color: 'white', border: 'none',
          padding: '14px 48px', borderRadius: '8px', fontWeight: '600',
          fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s',
          width: '400px', justifyContent: 'center'
        }} onMouseOver={(e) => e.currentTarget.style.background = '#d03f20'} onMouseOut={(e) => e.currentTarget.style.background = '#e14d2a'}>
          <Plus size={20} /> Create post
        </button>
      </div>

    </div>
  );
}
