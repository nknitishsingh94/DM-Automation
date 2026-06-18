import React, { useState, useCallback, useEffect } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Play, ArrowLeft, MessageSquare, Zap, Activity, Trash2, Plus, Info, Sparkles, Instagram, Link as LinkIcon, HelpCircle } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';
import { useAuth } from '../context/AuthContext';
import { Crown } from 'lucide-react';
import { getTemplateData } from '../utils/flowTemplates';

// --- Custom Node Components ---

const MessageNode = ({ data }) => (
  <div style={{ position: 'relative' }}>
    {data.noteTop && (
      <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '12px', background: '#ffedd5', padding: '8px 12px', borderRadius: '8px', fontSize: '10px', color: '#9a3412', width: '220px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', whiteSpace: 'pre-wrap' }}>
        {data.noteTop}
      </div>
    )}
    <div style={{ 
      padding: '0', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', width: '240px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden', position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ background: '#94a3b8', width: '8px', height: '8px' }} />
      <div style={{ background: '#f8fafc', padding: '12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ background: '#ef4444', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Instagram size={14} color="white" />
        </div>
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', whiteSpace: 'pre-wrap' }}>{data.title || 'Instagram\nSend Message'}</span>
      </div>
      <div style={{ padding: '12px', fontSize: '12px', color: '#334155', minHeight: '40px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
        {data.text || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Click to edit text...</span>}
      </div>
      {data.buttons && data.buttons.length > 0 && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {data.buttons.map(btn => (
            <div key={btn.id} style={{ position: 'relative', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#3b82f6', background: 'white' }}>
              {btn.text}
              <Handle type="source" position={Position.Right} id={btn.id} style={{ background: '#94a3b8', width: '8px', height: '8px', right: '-12px' }} />
            </div>
          ))}
        </div>
      )}
      {(!data.buttons || data.buttons.length === 0) && (
        <Handle type="source" position={Position.Right} style={{ background: '#94a3b8', width: '8px', height: '8px' }} />
      )}
    </div>
    {data.noteBottom && (
      <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '12px', background: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', fontSize: '10px', color: '#475569', width: '220px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', whiteSpace: 'pre-wrap' }}>
        {data.noteBottom}
      </div>
    )}
  </div>
);

const TriggerNode = ({ data }) => (
  <div style={{ position: 'relative' }}>
    <div style={{ 
      padding: '0', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', width: '240px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden'
    }}>
      <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Zap size={14} color="#64748b" />
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{data.title || 'When...'}</span>
      </div>
      <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ background: '#ef4444', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Instagram size={12} color="white" />
        </div>
        <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', whiteSpace: 'pre-wrap' }}>
          {data.text || `User comments on your Post or Reel`}
        </span>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#94a3b8', width: '8px', height: '8px' }} />
    </div>
    {data.noteBottom && (
      <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '12px', background: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', fontSize: '10px', color: '#475569', width: '220px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', whiteSpace: 'pre-wrap' }}>
        {data.noteBottom}
      </div>
    )}
  </div>
);

const ConditionNode = ({ data }) => (
  <div style={{ 
    padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #ec4899', minWidth: '180px'
  }}>
    <Handle type="target" position={Position.Top} style={{ background: '#ec4899' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <Activity size={14} color="#ec4899" />
      <span style={{ fontSize: '12px', fontWeight: '800' }}>Wait / Condition</span>
    </div>
    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
      <span style={{ color: '#ec4899', fontWeight: 'bold' }}>{data.condition || 'Condition Check'}</span>
    </div>
    <Handle type="source" position={Position.Bottom} id="true" style={{ background: '#10b981', left: '30%' }} />
    <Handle type="source" position={Position.Bottom} id="false" style={{ background: '#ef4444', left: '70%' }} />
  </div>
);

const AiNode = ({ data }) => (
  <div style={{ 
    padding: '12px', 
    background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)', 
    borderRadius: '12px', 
    border: '2px solid #a855f7', 
    minWidth: '200px',
    boxShadow: '0 8px 20px rgba(168, 85, 247, 0.15)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ 
      position: 'absolute', top: '-10px', right: '-10px', width: '40px', height: '40px', 
      background: 'rgba(168, 85, 247, 0.1)', borderRadius: '50%', zIndex: 0 
    }}></div>
    
    <Handle type="target" position={Position.Top} style={{ background: '#a855f7' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
      <div style={{ padding: '4px', background: '#f5f3ff', borderRadius: '6px' }}>
        <Sparkles size={14} color="#a855f7" />
      </div>
      <span style={{ fontSize: '13px', fontWeight: '800', color: '#6b21a8' }}>AI Agent Response</span>
    </div>
    <div style={{ fontSize: '11px', color: '#7e22ce', fontWeight: '600', marginBottom: '4px' }}>
      Brain: <span style={{ color: '#581c87' }}>AI Studio Config</span>
    </div>
    <p style={{ fontSize: '10px', color: '#9333ea', margin: 0, opacity: 0.8, fontStyle: 'italic' }}>
      "Will respond dynamically based on personality and history."
    </p>
    <Handle type="source" position={Position.Bottom} style={{ background: '#a855f7' }} />
  </div>
);

const nodeTypes = {
  message: MessageNode,
  trigger: TriggerNode,
  condition: ConditionNode,
  ai: AiNode,
};

// --- Optimized Input Component to prevent lag/word-loss ---
const StableInput = ({ value, onChange, placeholder, isTextArea = false }) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync if external value changes (selection change)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  if (isTextArea) {
    return (
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={commit}
        placeholder={placeholder}
        style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', resize: 'none' }}
      />
    );
  }

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
      placeholder={placeholder}
      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
    />
  );
};

// --- Main Flow Builder Component ---

export default function FlowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useNotification();
  const { user } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowName, setFlowName] = useState('New Automation Flow');
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerateAI = async (type) => {
    const promptText = window.prompt(`What should the AI write for ${type}?`);
    if (!promptText) return;
    
    notify("Generating with AI...", "info");
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ prompt: promptText, type })
      });
      const data = await res.json();
      
      if (res.ok && data.generatedText) {
        if (type === 'message') updateNodeData('text', data.generatedText);
        if (type === 'keywords') updateNodeData('keyword', (selectedNode.data.keyword ? selectedNode.data.keyword + ', ' : '') + data.generatedText);
        notify("AI generation successful!", "success");
      } else {
        notify(data.error || "AI generation failed.", "error");
      }
    } catch(e) {
      notify("AI generation error.", "error");
    }
  };

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  useEffect(() => {
    if (id !== 'new') {
      fetchFlow();
    } else {
      const params = new URLSearchParams(location.search);
      const templateId = params.get('template');
      
      const tplData = getTemplateData(templateId);
      setFlowName(tplData.name);
      setNodes(tplData.nodes);
      setEdges(tplData.edges);
    }
  }, [id, location]);

  const fetchFlow = async () => {
    const token = localStorage.getItem('insta_agent_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/flows/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFlowName(data.name);
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (err) {
      console.error("Error loading flow:", err);
    }
  };

  const saveFlow = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('insta_agent_token');
    const method = id === 'new' ? 'POST' : 'PUT';
    const url = id === 'new' ? `${API_BASE_URL}/api/flows` : `${API_BASE_URL}/api/flows/${id}`;

    try {
      // Ensure we have the latest trigger keyword from the nodes array
      const triggerNode = nodes.find(n => n.type === 'trigger');
      const triggerKW = triggerNode?.data?.keyword || '';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: flowName,
          nodes,
          edges,
          status: 'Active',
          triggerKeyword: triggerKW
        })
      });
      if (res.ok) {
        const saved = await res.json();
        notify("Flow published successfully!", "success");
        if (id === 'new') navigate(`/flow-builder/${saved._id}`);
      } else {
        notify("Failed to publish flow", "error");
      }
    } catch (err) {
      console.error("Save error:", err);
      notify("Network error while saving", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const addNode = (type) => {
    const newNode = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { text: 'New Message...', keyword: '' },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onSelectionChange = ({ nodes: selectedNodes }) => {
    setSelectedNode(selectedNodes[0] || null);
  };

  const updateNodeData = (field, value) => {
    if (!selectedNode) return;
    
    // Update the nodes array - this is the source of truth for React Flow
    setNodes(nds => nds.map(node => {
      if (node.id === selectedNode.id) {
        return { ...node, data: { ...node.data, [field]: value } };
      }
      return node;
    }));

    // Also update the selectedNode snapshot so the input field continues to reflect the change
    setSelectedNode(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value }
    }));
  };

  return (
    <div style={{ height: '100vh', position: 'fixed', top: 0, left: window.innerWidth > 1000 ? '260px' : 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', background: '#f8fafc', zIndex: 10 }}>
      
      {/* ManyChat Style Top Header */}
      <div style={{ height: '60px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => {
              const params = new URLSearchParams(location.search);
              if (id === 'new' && params.get('template')) {
                navigate('/campaigns?openTemplates=true');
              } else {
                navigate('/campaigns');
              }
            }} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
          >
            <ArrowLeft size={20} />
          </button>
          <input 
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', border: 'none', outline: 'none', background: 'transparent', width: '250px' }}
            placeholder="Name your flow..."
          />
          <div style={{ background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', border: '1px solid #a7f3d0' }}>
            Published
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#64748b', marginRight: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
            Live Support
          </div>
          <button style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
            Preview
          </button>
          <button 
            onClick={saveFlow} 
            disabled={isSaving} 
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
             {isSaving ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        {/* Sidebar / Properties Panel - ONLY VISIBLE WHEN A NODE IS SELECTED */}
        {selectedNode && (
          <div style={{ width: '320px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', zIndex: 10, boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}>
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              <div style={{ padding: '0 0 20px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                    Node Properties
                  </h4>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Editing {selectedNode.type === 'trigger' ? 'Flow Trigger' : 'Message Action'}
                  </div>
                </div>
                <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  ✕
                </button>
              </div>
              
              {selectedNode.type === 'trigger' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', margin: 0 }}>Keyword Trigger</label>
                      <button onClick={() => handleGenerateAI('keywords')} style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #e9d5ff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <Sparkles size={12} /> Auto-Gen
                      </button>
                    </div>
                    <StableInput 
                      value={selectedNode.data.keyword || ''}
                      onChange={(val) => updateNodeData('keyword', val)}
                      placeholder="e.g. START"
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '8px' }}>Public Comment Reply (optional)</label>
                    <StableInput 
                      value={selectedNode.data.publicReplyText || ''}
                      onChange={(val) => updateNodeData('publicReplyText', val)}
                      placeholder="e.g. Thank you! Check your DMs 🚀"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'message' && (
                <>
                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', margin: 0 }}>Message Text</label>
                      <button onClick={() => handleGenerateAI('message')} style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #e9d5ff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <Sparkles size={12} /> Auto-Gen
                      </button>
                    </div>
                    <StableInput 
                      value={selectedNode.data.text || ''}
                      onChange={(val) => updateNodeData('text', val)}
                      isTextArea={true}
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '8px' }}>Buttons</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                      {(selectedNode.data.buttons || []).map((btn, idx) => (
                        <div key={btn.id || idx} style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <input
                              type="text"
                              value={btn.text}
                              onChange={(e) => {
                                const newButtons = [...(selectedNode.data.buttons || [])];
                                newButtons[idx] = { ...newButtons[idx], text: e.target.value };
                                updateNodeData('buttons', newButtons);
                              }}
                              placeholder="Button Text"
                              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12px' }}
                            />
                            <select
                              value={btn.type || 'reply'}
                              onChange={(e) => {
                                const newButtons = [...(selectedNode.data.buttons || [])];
                                newButtons[idx] = { ...newButtons[idx], type: e.target.value };
                                updateNodeData('buttons', newButtons);
                              }}
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12px', background: 'white' }}
                            >
                              <option value="reply">Quick Reply</option>
                              <option value="url">Link (URL)</option>
                            </select>
                            <button onClick={() => {
                              const newButtons = (selectedNode.data.buttons || []).filter((_, i) => i !== idx);
                              updateNodeData('buttons', newButtons);
                            }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                          {btn.type === 'url' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <LinkIcon size={12} color="#94a3b8" />
                              <input
                                type="url"
                                value={btn.url || ''}
                                onChange={(e) => {
                                  const newButtons = [...(selectedNode.data.buttons || [])];
                                  newButtons[idx] = { ...newButtons[idx], url: e.target.value };
                                  updateNodeData('buttons', newButtons);
                                }}
                                placeholder="https://..."
                                style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '11px', background: 'white' }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {(selectedNode.data.buttons || []).length < 3 && (
                      <button onClick={() => {
                        const newButtons = [...(selectedNode.data.buttons || []), { id: `b${Date.now()}`, text: 'New Button', type: 'reply' }];
                        updateNodeData('buttons', newButtons);
                      }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Plus size={14} /> Add Button
                      </button>
                    )}
                  </div>
                </>
              )}

              {selectedNode.type === 'ai' && (
                <div style={{ padding: '16px', background: '#faf5ff', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
                  <div style={{ display: 'flex', gap: '8px', color: '#7e22ce', marginBottom: '12px' }}>
                     <Sparkles size={18} /> <span style={{ fontWeight: '800', fontSize: '13px' }}>AI Studio Integration</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6b21a8', lineHeight: '1.5', margin: 0 }}>
                    This node uses the personality, tone, and knowledge base you defined in <strong>AI Studio</strong>. 
                    It is perfect for handling open-ended questions or complex customer inquiries mid-flow.
                  </p>
                </div>
              )}

              <button 
                onClick={() => {
                  setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                  setSelectedNode(null);
                }}
                style={{ marginTop: '24px', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #fee2e2', color: '#ef4444', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Trash2 size={16} /> Delete Node
              </button>
            </div>
          </div>
        )}

        {/* React Flow Canvas Area */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onSelectionChange={onSelectionChange}
            fitView
          >
            <Background color="#cbd5e1" variant="dots" />
            <Controls />
            <MiniMap style={{ borderRadius: '12px', border: '1px solid #f1f5f9' }} />
          </ReactFlow>

          {/* Floating Add Node Toolbar */}
          {!selectedNode && (
            <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '12px 24px', borderRadius: '100px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', gap: '16px', zIndex: 10, alignItems: 'center', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Add Node:</span>
              <button onClick={() => addNode('message')} style={{ border: 'none', background: '#e0e7ff', color: '#4f46e5', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={14} /> Message
              </button>
              <button onClick={() => addNode('condition')} style={{ border: 'none', background: '#fce7f3', color: '#ec4899', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} /> Condition
              </button>
              <button onClick={() => addNode('ai')} style={{ border: 'none', background: '#f3e8ff', color: '#a855f7', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> Smart Reply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
