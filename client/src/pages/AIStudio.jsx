import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Save, Brain, MessageSquare, Sliders, Database, 
  Play, CheckCircle, Smartphone, Send, Settings as SettingsIcon, 
  User, RotateCcw, Target, Zap, ShieldCheck, Heart
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import TypingDots from '../components/TypingDots';
import '../styles/theme.css';
import '../styles/AIStudio.css';

export default function AIStudio() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('persona');
  const [testMessage, setTestMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Identity verified. AI Neural Link established. How can I assist you today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const personas = [
    { id: 'pro', name: 'Professional', icon: <ShieldCheck size={18} />, tone: 'Expert, efficient, and serious', prompt: 'You are a high-level executive assistant. Your goal is to solve problems quickly and use professional language.'},
    { id: 'friendly', name: 'Friendly', icon: <Heart size={18} />, tone: 'Warm, welcoming, and helpful', prompt: 'You are a friendly concierge. Use warm greetings, emojis, and make the customer feel valued.' },
    { id: 'sales', name: 'Sales Closer', icon: <Zap size={18} />, tone: 'Persuasive, energetic, and direct', prompt: 'You are a master salesperson. Focus on benefits, create urgency, and guide the user toward a purchase.' }
  ];

  const applyPersona = (p) => {
    setAiSettings({
      ...aiSettings,
      aiTone: p.tone,
      aiKnowledgeBase: p.prompt
    });
    toast.success(`Applied ${p.name} persona!`);
  };

  const [aiSettings, setAiSettings] = useState({
    aiName: 'Zen Assistant',
    aiTone: 'friendly and concise',
    aiKnowledgeBase: 'We are a SaaS company providing DM automation.',
    aiTemperature: 0.7,
    aiFallbackMessage: 'I am not sure about that, please contact human support.',
    aiHumanEscalation: false
  });

  useEffect(() => {
    const token = localStorage.getItem('insta_agent_token');
    fetch(`${API_BASE_URL}/api/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) { logout(); navigate('/login'); return; }
        return res.json();
      })
      .then(data => {
        if (data && data._id) {
          setAiSettings({
            aiName: data.aiName || 'Zen Assistant',
            aiTone: data.aiTone || 'friendly and concise',
            aiKnowledgeBase: data.aiKnowledgeBase || '',
            aiTemperature: data.aiTemperature ?? 0.7,
            aiFallbackMessage: data.aiFallbackMessage || 'Contact support for more help.',
            aiHumanEscalation: !!data.aiHumanEscalation
          });
        }
      })
      .catch(err => console.error('Error loading AI settings:', err));
  }, []);

  const handleTestChat = async (e) => {
    e.preventDefault();
    if (!testMessage.trim()) return;

    const userMsg = { role: 'user', text: testMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setTestMessage('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: testMessage, settings: aiSettings })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'ai', text: data.reply || 'Connection established, but no data received.' }]);
    } catch (err) {
      toast.error('AI Link unstable. Check connection.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...aiSettings, _platform: 'ai_studio' })
      });
      if (res.ok) {
        toast.success('Neural weights updated!');
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
      }
    } catch (err) {
      toast.error('Failed to sync settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="studio-container" style={{ padding: isMobile ? '0 20px 20px' : '0 40px 40px' }}>
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="studio-header" style={{ 
        display: 'flex',
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: isMobile ? '12px 20px' : '16px 40px',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e5e7eb',
        margin: isMobile ? '0 -20px 20px -20px' : '0 -40px 32px -40px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
          <div className="brain-glow" style={{ width: isMobile ? '36px' : '48px', height: isMobile ? '36px' : '48px' }}>
            <Brain size={isMobile ? 20 : 28} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.8rem', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>AI Neural Studio</h2>
            {!isMobile && <p style={{ color: 'var(--text-muted)', margin: 0 }}>Configure and train your custom AI personality</p>}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isMobile && <div className={`save-status ${showSaved ? 'visible' : ''}`} style={{ fontSize: '12px' }}>
            <CheckCircle size={12} /> Saved
          </div>}
          <button onClick={handleSave} disabled={isSaving} className="btn-primary" style={{ 
            background: '#8b5cf6', 
            borderRadius: '11px', 
            padding: isMobile ? '7px 14px' : '12px 24px', 
            fontSize: isMobile ? '12px' : '14px',
            width: 'auto',
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}>
            {isSaving ? 'Syncing...' : <><Save size={isMobile ? 14 : 16} /> {isMobile ? 'Update' : 'Update Agent'}</>}
          </button>
        </div>
      </div>

      <div className="studio-grid" style={{ 
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', 
        gap: '32px',
        overflowX: 'hidden'
      }}>
        
        {/* LEFT: Training Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="studio-glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target size={18} color="#8b5cf6" /> Choose Agent Persona
            </h3>
            <div className="persona-grid">
              {personas.map(p => (
                <div 
                  key={p.id} 
                  className={`persona-option ${aiSettings.aiTone.toLowerCase().includes(p.name.toLowerCase()) ? 'active' : ''}`}
                  onClick={() => applyPersona(p)}
                >
                  <div style={{ marginBottom: '8px', color: '#8b5cf6' }}>{p.icon}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800' }}>{p.name}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Agent Identity</label>
                <input 
                  className="training-input"
                  value={aiSettings.aiName}
                  onChange={val => setAiSettings({...aiSettings, aiName: val.target.value})}
                  placeholder="e.g. Zen Assistant"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Vocal Tone</label>
                <input 
                  className="training-input"
                  value={aiSettings.aiTone}
                  onChange={val => setAiSettings({...aiSettings, aiTone: val.target.value})}
                  placeholder="e.g. Friendly, professional"
                />
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Knowledge Base & Context</label>
            <textarea 
              className="training-input"
              rows={8}
              value={aiSettings.aiKnowledgeBase}
              onChange={val => setAiSettings({...aiSettings, aiKnowledgeBase: val.target.value})}
              placeholder="Tell the AI who you are and what your business does..."
            />
          </div>

          <div className="studio-glass-card" style={{ padding: '24px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: '800' }}>Neural Creativity</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Higher values make the bot more creative.</p>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#8b5cf6' }}>{aiSettings.aiTemperature.toFixed(1)}</div>
             </div>
             <input 
                type="range" min="0" max="1" step="0.1" 
                value={aiSettings.aiTemperature} 
                onChange={e => setAiSettings({...aiSettings, aiTemperature: parseFloat(e.target.value)})}
                style={{ width: '100%', marginTop: '16px', accentColor: '#8b5cf6' }}
             />
          </div>

        </div>

        {/* RIGHT: Live Simulator */}
        <div className="simulator-wrap" style={{ 
          height: isMobile ? '500px' : 'auto',
          minHeight: '500px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div className="simulator-top">
             <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
             <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>LIVE NEURAL INTERFACE</div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble-ai" style={{ width: '60px', display: 'flex', justifyContent: 'center' }}>
                <TypingDots color="#ffffff" />
              </div>
            )}
          </div>

          <form onSubmit={handleTestChat} style={{ padding: '20px', background: '#011C40', display: 'flex', gap: '12px' }}>
            <input 
              className="training-input"
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              placeholder="Test your AI here..."
              style={{ border: 'none', background: '#26658C', color: 'var(--bg-card)' }}
            />
            <button type="submit" disabled={!testMessage.trim()} style={{ background: '#8b5cf6', border: 'none', width: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-card)', cursor: 'pointer' }}>
               <Send size={18} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
