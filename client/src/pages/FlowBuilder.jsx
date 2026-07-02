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


const MessageNode = ({ data }) => (
  <div style={{ position: 'relative' }}>
    {data.noteTop && (
      <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '12px', background: '#ffedd5', padding: '8px 12px', borderRadius: '8px', fontSize: '10px', color: '#9a3412', width: '220px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', whiteSpace: 'pre-wrap' }}>
        {data.noteTop}
      </div>
    )}
    <div style={{ 
      padding: '0', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', width: '280px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'visible', position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ background: 'var(--text-muted)', width: '8px', height: '8px', marginLeft: '-4px' }} />
      <div style={{ background: 'var(--sidebar-bg)', padding: '12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
        <div style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Instagram size={14} color="white" />
        </div>
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{data.title || 'Instagram\nSend Message'}</span>
      </div>
      <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text-main)', minHeight: '40px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
        {data.text || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Click to edit text...</span>}
      </div>
      
      {data.buttons && data.buttons.length > 0 && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.buttons.map(btn => (
            <div key={btn.id} style={{ position: 'relative', border: '1px solid #bfdbfe', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#1d4ed8', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {btn.text}
              {btn.type === 'url' && <LinkIcon size={14} color="#3b82f6" />}
              <Handle type="source" position={Position.Right} id={btn.id} style={{ background: '#3b82f6', width: '10px', height: '10px', right: '-5px', border: '2px solid white' }} />
            </div>
          ))}
        </div>
      )}

      {data.waitAction && (
        <div style={{ margin: '0 12px 12px', padding: '10px', border: '1px solid #bfdbfe', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ color: '#3b82f6' }}>⏱️</div>
          <span style={{ fontSize: '12px', color: '#1e3a8a', fontWeight: '600' }}>{data.waitAction}</span>
        </div>
      )}

      {data.customHandles && data.customHandles.length > 0 ? (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', position: 'relative' }}>
          {data.customHandles.map((handle, idx) => (
            <div key={handle.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', opacity: handle.disabled ? 0.4 : 1 }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: handle.color || 'var(--text-muted)' }}>{handle.text}</span>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: handle.color || '#cbd5e1', border: '2px solid white', boxShadow: '0 0 0 1px var(--border-subtle)', position: 'relative', zIndex: 2 }}>
                <Handle type="source" position={Position.Right} id={handle.id} style={{ background: 'transparent', border: 'none', width: '100%', height: '100%', right: '-6px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        (!data.buttons || data.buttons.length === 0) && (
          <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Next Step</span>
              <Handle type="source" position={Position.Right} style={{ background: 'var(--text-muted)', width: '8px', height: '8px', right: '-4px' }} />
            </div>
          </div>
        )
      )}
    </div>
  </div>
);

const TriggerNode = ({ data }) => (
  <div style={{ position: 'relative' }}>
    <div style={{ 
      padding: '0', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', width: '280px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'visible'
    }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--sidebar-bg)', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <Zap size={14} color="#64748b" />
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>{data.title || 'When...'}</span>
      </div>
      
      <div style={{ padding: '12px' }}>
        {data.triggers && data.triggers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.triggers.map((trigger, idx) => (
              <div key={idx} style={{ padding: '10px', background: 'var(--sidebar-bg)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Instagram size={10} color="white" />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: '700' }}>{trigger.title}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '22px' }}>{trigger.subtext}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '10px', background: 'var(--sidebar-bg)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Instagram size={10} color="white" />
            </div>
            <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', whiteSpace: 'pre-wrap' }}>
              {data.text || `User comments on your Post or Reel`}
            </span>
          </div>
        )}

      </div>
      
      <Handle type="source" position={Position.Right} style={{ background: 'var(--text-muted)', width: '8px', height: '8px', right: '-4px' }} />
    </div>
  </div>
);

const ConditionNode = ({ data }) => (
  <div style={{ 
    padding: '12px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid #ec4899', minWidth: '180px'
  }}>
    <Handle type="target" position={Position.Top} style={{ background: '#ec4899' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <Activity size={14} color="#ec4899" />
      <span style={{ fontSize: '12px', fontWeight: '800' }}>Wait / Condition</span>
    </div>
    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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

const StableInput = ({ value, onChange, placeholder, isTextArea = false }) => {
  const [localValue, setLocalValue] = useState(value);

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
        style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', outline: 'none', resize: 'none' }}
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
      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', outline: 'none' }}
    />
  );
};


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
  const [rfInstance, setRfInstance] = useState(null);
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
    let position = { x: 100, y: 100 };
    if (rfInstance) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      if (rfInstance.screenToFlowPosition) {
        position = rfInstance.screenToFlowPosition({ x: centerX, y: centerY });
      } else {
        const { x, y, zoom } = rfInstance.getViewport();
        position = { x: (centerX - x) / zoom, y: (centerY - y) / zoom };
      }
    } else {
      position = { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 };
    }

    const newNode = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      position,
      data: { text: type === 'message' ? 'New Message...' : type === 'condition' ? 'Condition Check' : 'User comments', keyword: '' },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = (field, value) => {
    if (!selectedNode) return;
    
    setNodes(nds => nds.map(node => {
      if (node.id === selectedNode.id) {
        return { ...node, data: { ...node.data, [field]: value } };
      }
      return node;
    }));

    setSelectedNode(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value }
    }));
  };

  return (
    <div style={{ height: '100vh', position: 'fixed', top: 0, left: window.innerWidth > 1000 ? '260px' : 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', background: 'var(--sidebar-bg)', zIndex: 10 }}>
      
      {/* ManyChat Style Top Header */}
      <div style={{ height: '60px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
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
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={20} />
          </button>
          <input 
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', border: 'none', outline: 'none', background: 'transparent', width: '250px' }}
            placeholder="Name your flow..."
          />
          <div style={{ background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', border: '1px solid #a7f3d0' }}>
            Published
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginRight: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
            Live Support
          </div>
          <button style={{ background: 'var(--sidebar-bg)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
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
          <div style={{ width: '320px', background: 'var(--bg-card)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', zIndex: 10, boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}>
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              <div style={{ padding: '0 0 20px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                    Node Properties
                  </h4>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Editing {selectedNode.type === 'trigger' ? 'Flow Trigger' : 'Message Action'}
                  </div>
                </div>
                <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  ✕
                </button>
              </div>
              
              {selectedNode.type === 'trigger' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', margin: 0 }}>Keyword Trigger</label>
                      <button onClick={() => handleGenerateAI('keywords')} style={{ background: '#f5f3ff', color: 'var(--accent-color)', border: '1px solid #e9d5ff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <Sparkles size={12} /> Auto-Gen
                      </button>
                    </div>
                    <StableInput 
                      value={selectedNode.data.text || ''}
                      onChange={(val) => updateNodeData('text', val)}
                      placeholder="e.g. User comments START"
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Target Keyword (for matching)</label>
                    <StableInput 
                      value={selectedNode.data.keyword || ''}
                      onChange={(val) => updateNodeData('keyword', val)}
                      placeholder="e.g. START"
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Additional Triggers</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                      {(selectedNode.data.triggers || []).map((t, idx) => (
                        <div key={idx} style={{ border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: '8px', background: 'var(--sidebar-bg)' }}>
                          <input type="text" value={t.title || ''} onChange={(e) => {
                             const newTriggers = [...(selectedNode.data.triggers || [])];
                             newTriggers[idx] = { ...newTriggers[idx], title: e.target.value };
                             updateNodeData('triggers', newTriggers);
                          }} style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '12px', background: 'var(--bg-card)', color: 'var(--text-main)' }} placeholder="Title (e.g. User sends a message)" />
                          <input type="text" value={t.subtext || ''} onChange={(e) => {
                             const newTriggers = [...(selectedNode.data.triggers || [])];
                             newTriggers[idx] = { ...newTriggers[idx], subtext: e.target.value };
                             updateNodeData('triggers', newTriggers);
                          }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '12px', background: 'var(--bg-card)', color: 'var(--text-main)' }} placeholder="Subtext (e.g. Message contains ebook)" />
                          <button onClick={() => {
                             const newTriggers = [...(selectedNode.data.triggers || [])];
                             newTriggers.splice(idx, 1);
                             updateNodeData('triggers', newTriggers);
                          }} style={{ background: 'none', border: 'none', color: '#ef4444', marginTop: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}><Trash2 size={12} style={{marginRight: '4px', verticalAlign: 'middle'}}/>Remove</button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => {
                       const newTriggers = [...(selectedNode.data.triggers || []), { title: 'New Trigger', subtext: 'Trigger details' }];
                       updateNodeData('triggers', newTriggers);
                    }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px dashed #cbd5e1', background: 'var(--sidebar-bg)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Plus size={14} /> Add Trigger
                    </button>
                  </div>
                  <div className="input-group">
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Public Comment Reply (optional)</label>
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
                      <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', margin: 0 }}>Message Text</label>
                      <button onClick={() => handleGenerateAI('message')} style={{ background: '#f5f3ff', color: 'var(--accent-color)', border: '1px solid #e9d5ff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Buttons</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                      {(selectedNode.data.buttons || []).map((btn, idx) => (
                        <div key={btn.id || idx} style={{ border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: '8px', background: 'var(--sidebar-bg)' }}>
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
                              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '12px' }}
                            />
                            <select
                              value={btn.type || 'reply'}
                              onChange={(e) => {
                                const newButtons = [...(selectedNode.data.buttons || [])];
                                newButtons[idx] = { ...newButtons[idx], type: e.target.value };
                                updateNodeData('buttons', newButtons);
                              }}
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '12px', background: 'var(--bg-card)' }}
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
                                style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '11px', background: 'var(--bg-card)' }}
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
                      }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px dashed #cbd5e1', background: 'var(--sidebar-bg)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Plus size={14} /> Add Button
                      </button>
                    )}
                  </div>
                </>
              )}

              {selectedNode.type === 'condition' && (
                <div className="input-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Condition Check</label>
                  <StableInput 
                    value={selectedNode.data.condition || ''}
                    onChange={(val) => updateNodeData('condition', val)}
                    placeholder="e.g. Is Follower"
                  />
                </div>
              )}

              {selectedNode.type === 'ai' && (
                <div style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
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
                style={{ marginTop: '24px', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #fee2e2', color: '#ef4444', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
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
            onInit={setRfInstance}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            defaultEdgeOptions={{
              type: 'smoothstep',
              style: { stroke: '#94a3b8', strokeWidth: 2 },
              animated: false
            }}
            fitView
          >
            <Background color="#cbd5e1" variant="dots" />
            <Controls />
            <MiniMap style={{ borderRadius: '12px', border: '1px solid var(--border-subtle)' }} />
          </ReactFlow>

          {/* Floating Add Node Toolbar */}
          {!selectedNode && (
            <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-card)', padding: '12px 24px', borderRadius: '100px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', gap: '16px', zIndex: 10, alignItems: 'center', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Add Node:</span>
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
