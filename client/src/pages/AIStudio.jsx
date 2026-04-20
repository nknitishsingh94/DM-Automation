import { useState, useEffect } from 'react';
import { Sparkles, Save, Brain, MessageSquare, Sliders, Database, Play, CheckCircle, Smartphone, Send, Settings as SettingsIcon, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import toast, { Toaster } from 'react-hot-toast';
import TypingDots from '../components/TypingDots';
import FormField from '../components/FormField';
import '../styles/theme.css';

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
    aiName: 'ZenXchat Assistant',
    aiTone: 'professional, helpful, and concise',
    aiKnowledgeBase: 'We are a SaaS company providing DM automation.',
    aiTemperature: 0.7,
    aiFallbackMessage: 'I am not sure about that, please contact human support at help@zenxchat.com',
    aiHumanEscalation: false
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('insta_agent_token');
    // Load AI settings
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
      .catch(err => console.error('Error loading AI settings:', err));

    // Load persisted chat history
    fetch(`${API_BASE_URL}/api/chats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(messages => {
        if (Array.isArray(messages)) setChatHistory(messages);
      })
      .catch(err => console.error('Error loading chat history:', err));
  }, []);

  const handleTestChat = async (e) => {
    e.preventDefault();
    if (!testMessage.trim()) return;

    const token = localStorage.getItem('insta_agent_token');
    const userMsg = { role: 'user', text: testMessage };
    // Optimistically add user message
    setChatHistory(prev => [...prev, userMsg]);
    setTestMessage('');
    setIsTyping(true);

    // Persist user message
    try {
      await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userMsg)
      });
    } catch (err) {
      console.error('Error saving user message:', err);
    }

    // Call backend AI chat endpoint
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: testMessage, settings: aiSettings })
      });
      const data = await res.json();
      const aiMsg = { role: 'ai', text: data.reply || 'No response' };
      setChatHistory(prev => [...prev, aiMsg]);
      // Persist AI message
      await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(aiMsg)
      });
      toast.success('AI responded');
    } catch (err) {
      console.error('Error fetching AI response:', err);
      toast.error('Failed to get AI response');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSave = async () => {
    // Simple validation for all required fields
    const newErrors = {};
    if (!aiSettings.aiName.trim()) newErrors.aiName = 'Agent name is required';
    if (!aiSettings.aiTone.trim()) newErrors.aiTone = 'Conversational tone is required';
    if (!aiSettings.aiKnowledgeBase.trim()) newErrors.aiKnowledgeBase = 'System prompt is required';
    if (!aiSettings.aiFallbackMessage.trim()) newErrors.aiFallbackMessage = 'Fallback message is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the highlighted errors');
      return;
    }
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
        toast.success('AI Configuration Saved Successfully!');
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to save configuration');
      }
    } catch (err) {
      toast.error('Network error while saving');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container">
      <Toaster />
      {/* Header */}
      <div className="header-section">
        <div>
          <div className="header-title">
            <div className="icon-box">
              <Sparkles size={24} />
            </div>
            <h2>AI Studio Configurator</h2>
          </div>
          <p>Train your custom AI Agent and test its personality in real-time.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
             <Database size={18} /> Manage Knowledge Base
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary"
          >
             {isSaving ? 'Saving...' : <><Save size={18} /> Save Agent</>}
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="studio-grid">
        
        {/* LEFT COLUMN: Editor */}
        <div className="editor-column">
          
          {/* Tabs */}
          <div className="tabs-container">
            {[
              { id: 'persona', label: 'Persona & Role', icon: <Brain size={16} /> },
              { id: 'behavior', label: 'Behavioral Tuning', icon: <Sliders size={16} /> },
              { id: 'advanced', label: 'Advanced Settings', icon: <SettingsIcon size={16} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Persona Tab */}
          {activeTab === 'persona' && (
            <div className="tab-content">
              <div className="card">
                <h3>Identity & Voice</h3>
                <FormField
                  label="Agent Name"
                  value={aiSettings.aiName}
                  onChange={val => setAiSettings({ ...aiSettings, aiName: val })}
                  error={errors.aiName}
                />

                <FormField
                  label="Conversational Tone"
                  placeholder="e.g. Friendly, professional, humorous..."
                  value={aiSettings.aiTone}
                  onChange={val => setAiSettings({ ...aiSettings, aiTone: val })}
                  error={errors.aiTone}
                />

                <FormField
                  label="System Prompt / Context"
                  isTextarea={true}
                  rows={5}
                  value={aiSettings.aiKnowledgeBase}
                  onChange={val => setAiSettings({ ...aiSettings, aiKnowledgeBase: val })}
                  error={errors.aiKnowledgeBase}
                  extraLabel={<span style={{ color: '#8b5cf6', fontSize: '0.8rem', cursor: 'pointer' }}>Use Template</span>}
                />
              </div>

              <div className="card">
                <h3>Fallback Execution</h3>
                <FormField
                  label="Message to send when AI is unsure"
                  value={aiSettings.aiFallbackMessage}
                  onChange={val => setAiSettings({ ...aiSettings, aiFallbackMessage: val })}
                  error={errors.aiFallbackMessage}
                />
              </div>
            </div>
          )}

          {/* Behavior Tab */}
          {activeTab === 'behavior' && (
            <div className="tab-content">
              <div className="card">
                 <h3>Creativity vs Accuracy (Temperature)</h3>
                 <div className="slider-container">
                   <span>Strict</span>
                   <input 
                     type="range" 
                     min="0" max="1" step="0.1" 
                     value={aiSettings.aiTemperature}
                     onChange={(e) => setAiSettings({...aiSettings, aiTemperature: parseFloat(e.target.value)})}
                   />
                   <span>Creative</span>
                 </div>
                 <div className="temp-display">{aiSettings.aiTemperature.toFixed(1)}</div>
                 <p>Values closer to 0 adhere strictly to facts. Values near 1 generate highly creative responses.</p>
              </div>

              <div className="card">
                 <div className="toggle-container">
                   <div>
                     <h3>Human Escalation</h3>
                     <p>Transfer chat to admin when angry intent detected.</p>
                   </div>
                   <div 
                     onClick={() => setAiSettings({...aiSettings, aiHumanEscalation: !aiSettings.aiHumanEscalation})}
                     className={`toggle-switch ${aiSettings.aiHumanEscalation ? 'on' : ''}`}>
                     <div className="toggle-thumb"></div>
                   </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
             <div className="card advanced-placeholder">
                <Sliders size={48} />
                <h3>OpenAI / Custom API Link</h3>
                <p>Connect your own LLM model API wrapper for deeper customization.</p>
                <div className="dev-mode-badge">
                  Available in Developer Mode
                </div>
             </div>
          )}

        </div>

        {/* RIGHT COLUMN: Mobile Simulator */}
        <div className="simulator-column">
           <div className="mobile-simulator">
             
             {/* Simulator Header */}
             <div className="simulator-header">
               <Smartphone size={20} />
               <div>
                 <div>Live Preview</div>
                 <div className="status-badge">
                   <div></div> Agent Active
                 </div>
               </div>
             </div>

             {/* Chat History */}
             <div className="chat-history">
               {chatHistory.map((msg, idx) => (
                 <div key={idx} className={`chat-bubble ${msg.role}`}>
                   <div className="avatar">
                     {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                   </div>
                   <div className="message-text">
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
