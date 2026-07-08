import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cpu, Zap, Activity, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

export default function AIUsageTab() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const token = localStorage.getItem('insta_agent_token');
        const res = await axios.get(`${API_BASE_URL}/api/admin/ai-usage`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsage(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load AI usage stats');
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
      <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
    </div>
  );

  const usagePercentage = usage ? Math.min(100, Math.round((usage.totalTokensUsed / usage.monthlyLimit) * 100)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ position: 'sticky', top:  0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--bg-base)', padding: '24px 24px 12px 24px', margin: '-24px -24px 24px -24px', borderRadius: '0 0 16px 16px', boxShadow: '0 4px 25px rgba(0,0,0,0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>AI Token Usage</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Track platform-wide OpenAI/Anthropic token consumption.</p>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', color: 'var(--primary)' }}>
              <Cpu size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>Total Platform Tokens</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Current Billing Cycle</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {(usage?.totalTokensUsed || 0).toLocaleString()}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '600', marginLeft: '4px' }}>
              / {(usage?.monthlyLimit || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '16px', background: 'var(--sidebar-bg)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${usagePercentage}%`, 
            background: usagePercentage > 90 ? '#ef4444' : usagePercentage > 75 ? '#f59e0b' : 'linear-gradient(90deg, #4f46e5, #ec4899)',
            transition: 'width 1s ease-in-out'
          }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.85rem', fontWeight: '600' }}>
          <span style={{ color: 'var(--text-muted)' }}>0%</span>
          <span style={{ color: usagePercentage > 90 ? '#ef4444' : 'var(--primary)' }}>{usagePercentage}% Used</span>
          <span style={{ color: 'var(--text-muted)' }}>100%</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Top Users */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Award size={20} color="#f59e0b" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>Top Token Consumers</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {usage?.topUsers?.map((u, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: i !== usage.topUsers.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--sidebar-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>
                    {i + 1}
                  </div>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>{u.email}</span>
                </div>
                <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.9rem' }}>{u.tokens.toLocaleString()} <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>tkns</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Models */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-subtle)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Activity size={20} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>Active Models Connected</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {usage?.activeModels?.map((model, i) => (
              <div key={i} style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontWeight: '700', fontSize: '0.9rem' }}>
                <Zap size={16} />
                {model}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
