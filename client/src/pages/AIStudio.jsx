import { useState, useEffect } from 'react';
import { Sparkles, Save, Brain, MessageSquare, Sliders, Database, Play, CheckCircle, Smartphone, Send, Settings as SettingsIcon, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function AIStudio() {
  const [activeTab, setActiveTab] = useState('persona');
  const [testMessage, setTestMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hi there! I am your new AI assistant. How can I help?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mapped to backend schema names
  const [aiSettings, setAiSettings] = useState({
    aiName: 'Zen Assistant',
    aiTone: 'professional, helpful, and concise',
    aiKnowledgeBase: 'We are a SaaS company providing DM automation.',
    aiTemperature: 0.7,
    aiFallbackMessage: 'I am not sure about that, please contact human support at help@zenxchat.com',
    aiHumanEscalation: false
  });

  useEffect(() => {
    const token = localStorage.getItem('insta_agent_token');
    fetch(`${API_BASE_URL}/api/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data._id) {
          setAiSettings(prev => ({
            ...prev,
            aiName: data.aiName || prev.aiName,
            aiTone: data.aiTone || prev.aiTone,
            aiKnowledgeBase: data.aiKnowledgeBase || prev.aiKnowledgeBase,
            aiTemperature: data.aiTemperature !== undefined ? data.aiTemperature : prev.aiTemperature,
            aiFallbackMessage: data.aiFallbackMessage || prev.aiFallbackMessage,
            aiHumanEscalation: data.aiHumanEscalation || prev.aiHumanEscalation
          }));
        }
      })
      .catch(err => console.error("Error loading AI settings:", err));
  }, []);

  const handleTestChat = (e) => {
    e.preventDefault();
    if (!testMessage.trim()) return;
    
    setChatHistory(prev => [...prev, { role: 'user', text: testMessage }]);
    setTestMessage('');
    setIsTyping(true);

    // Simulate AI response based on settings
    setTimeout(() => {
      setIsTyping(false);
      setChatHistory(prev => [...prev, { role: 'ai', text: `As a ${aiSettings.aiTone} assistant, I understand. (Simulated Response based on: ${aiSettings.aiName})` }]);
    }, 1500);
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
        // We only send AI settings here; the backend will merge them keeping tokens intact
        body: JSON.stringify({ ...aiSettings, _platform: 'ai_studio' })
      });
      
      if (res.ok) {
        alert('AI Configuration Saved Successfully!');
      } else {
        alert('Failed to save configuration.');
      }
    } catch (err) {
      alert('Network error while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '0 40px 40px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{ padding: '10px', background: 'linear-gradient(135deg, #7c3aed, #db2777)', borderRadius: '12px', color: 'white' }}>
              <Sparkles size={24} />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>AI Studio Configurator</h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '15px' }}>Train your custom AI Agent and test its personality in real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ background: '#ffffff', color: '#1e293b', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
             <Database size={18} /> Manage Knowledge Base
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ background: '#7c3aed', color: 'white', padding: '10px 24px', borderRadius: '12px', fontWeight: '700', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: isSaving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}
          >
             {isSaving ? 'Saving...' : <><Save size={18} /> Save Agent</>}
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 380px', gap: '32px', flex: 1, minHeight: 0 }}>
        
        {/* LEFT COLUMN: Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '12px' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '6px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            {[
              { id: 'persona', label: 'Persona & Role', icon: <Brain size={16} /> },
              { id: 'behavior', label: 'Behavioral Tuning', icon: <Sliders size={16} /> },
              { id: 'advanced', label: 'Advanced Settings', icon: <SettingsIcon size={16} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '600', fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === tab.id ? '#ffffff' : 'transparent',
                  color: activeTab === tab.id ? '#7c3aed' : '#64748b',
                  boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Persona Tab */}
          {activeTab === 'persona' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Identity & Voice</h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Agent Name</label>
                  <input 
                    type="text" 
                    value={aiSettings.aiName}
                    onChange={(e) => setAiSettings({...aiSettings, aiName: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Conversational Tone</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Friendly, professional, humorous..."
                    value={aiSettings.aiTone}
                    onChange={(e) => setAiSettings({...aiSettings, aiTone: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                    <span>System Prompt / Context</span>
                    <span style={{ color: '#8b5cf6', fontSize: '0.8rem', cursor: 'pointer' }}>Use Template</span>
                  </label>
                  <textarea 
                    rows={5}
                    value={aiSettings.aiKnowledgeBase}
                    onChange={(e) => setAiSettings({...aiSettings, aiKnowledgeBase: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px' }}>Instruct the AI on strictly what rules to follow.</p>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Fallback Execution</h3>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Message to send when AI is unsure</label>
                <input 
                  type="text" 
                  value={aiSettings.aiFallbackMessage}
                  onChange={(e) => setAiSettings({...aiSettings, aiFallbackMessage: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Behavior Tab */}
          {activeTab === 'behavior' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Creativity vs Accuracy (Temperature)</h3>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                   <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Strict</span>
                   <input 
                     type="range" 
                     min="0" max="1" step="0.1" 
                     value={aiSettings.aiTemperature}
                     onChange={(e) => setAiSettings({...aiSettings, aiTemperature: parseFloat(e.target.value)})}
                     style={{ flex: 1, accentColor: '#7c3aed' }}
                   />
                   <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Creative</span>
                 </div>
                 <div style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: '800', color: '#7c3aed' }}>{aiSettings.aiTemperature.toFixed(1)}</div>
                 <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', marginTop: '8px' }}>Values closer to 0 adhere strictly to facts. Values near 1 generate highly creative responses.</p>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Human Escalation</h3>
                     <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Transfer chat to admin when angry intent detected.</p>
                   </div>
                   <div 
                     onClick={() => setAiSettings({...aiSettings, aiHumanEscalation: !aiSettings.aiHumanEscalation})}
                     style={{ width: '44px', height: '24px', background: aiSettings.aiHumanEscalation ? '#10b981' : '#e2e8f0', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                     <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: aiSettings.aiHumanEscalation ? '22px' : '2px', transition: 'all 0.2s' }}></div>
                   </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
             <div style={{ background: '#ffffff', borderRadius: '20px', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', textAlign: 'center' }}>
                <Sliders size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>OpenAI / Custom API Link</h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px' }}>Connect your own LLM model API wrapper for deeper customization.</p>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>
                  Available in Developer Mode
                </div>
             </div>
          )}

        </div>

        {/* RIGHT COLUMN: Mobile Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '720px' }}>
           <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '32px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', position: 'relative' }}>
             
             {/* Simulator Header */}
             <div style={{ background: '#f8fafc', padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
               <Smartphone size={20} color="#64748b" />
               <div style={{ flex: 1 }}>
                 <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>Live Preview</div>
                 <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div> Agent Active
                 </div>
               </div>
             </div>

             {/* Chat History */}
             <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fafafa' }}>
               {chatHistory.map((msg, idx) => (
                 <div key={idx} style={{ display: 'flex', gap: '12px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                   <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: msg.role === 'user' ? '#cbd5e1' : 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                     {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                   </div>
                   <div style={{ padding: '12px 16px', borderRadius: '16px', fontSize: '0.9rem', lineHeight: '1.4', background: msg.role === 'user' ? '#1e293b' : '#ffffff', color: msg.role === 'user' ? 'white' : '#1e293b', border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0', borderTopLeftRadius: msg.role === 'ai' ? '4px' : '16px', borderTopRightRadius: msg.role === 'user' ? '4px' : '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                     {msg.text}
                   </div>
                 </div>
               ))}
               
               {isTyping && (
                 <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
                   <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Sparkles size={14} /></div>
                   <div style={{ padding: '12px 16px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderTopLeftRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <div className="typing-dot" style={{width: '6px', height: '6px', background: '#cbd5e1', borderRadius: '50%', animation: 'pulse 1.5s infinite'}}></div>
                     <div className="typing-dot" style={{width: '6px', height: '6px', background: '#cbd5e1', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.2s'}}></div>
                     <div className="typing-dot" style={{width: '6px', height: '6px', background: '#cbd5e1', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.4s'}}></div>
                   </div>
                 </div>
               )}
             </div>

             {/* Chat Input */}
             <form onSubmit={handleTestChat} style={{ padding: '16px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
               <input 
                 type="text" 
                 placeholder="Type a message to test..." 
                 value={testMessage}
                 onChange={(e) => setTestMessage(e.target.value)}
                 style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '12px 16px', borderRadius: '24px', outline: 'none', fontSize: '0.9rem' }}
               />
               <button type="submit" disabled={!testMessage.trim()} style={{ background: testMessage.trim() ? '#7c3aed' : '#e2e8f0', color: 'white', border: 'none', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: testMessage.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                 <Send size={16} style={{ marginLeft: '2px' }} />
               </button>
             </form>
           </div>
        </div>

      </div>
    </div>
  );
}
