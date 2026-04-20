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
import { Save, Play, ArrowLeft, MessageSquare, Zap, Activity, Trash2, Plus, Info, Sparkles } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';

// --- Custom Node Components ---

const MessageNode = ({ data }) => (
  <div style={{ 
    padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #4f46e5', minWidth: '180px',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.1)'
  }}>
    <Handle type="target" position={Position.Top} style={{ background: '#4f46e5' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
      <MessageSquare size={14} color="#4f46e5" />
      <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>Send Message</span>
    </div>
    <div style={{ fontSize: '13px', color: '#475569', minHeight: '20px' }}>
      {data.text || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Click to edit text...</span>}
    </div>
    <Handle type="source" position={Position.Bottom} style={{ background: '#4f46e5' }} />
  </div>
);

const TriggerNode = ({ data }) => (
  <div style={{ 
    padding: '12px', background: '#0f172a', borderRadius: '12px', color: 'white', minWidth: '180px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <Zap size={14} color="#fbbf24" />
      <span style={{ fontSize: '12px', fontWeight: '800', color: '#f8fafc' }}>Flow Start</span>
    </div>
    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
      Keyword: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{data.keyword || '*Any Message*'}</span>
    </div>
    <Handle type="source" position={Position.Bottom} style={{ background: '#fbbf24' }} />
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
    <Handle type="source" position={Position.Bottom} style={{ background: '#ec4899' }} />
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
  const { notify } = useNotification();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowName, setFlowName] = useState('New Automation Flow');
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  useEffect(() => {
    if (id !== 'new') {
      fetchFlow();
    } else {
      // Default Initial Nodes
      setNodes([
        { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'START' } },
        { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: 'Welcome to our automation!' } },
      ]);
      setEdges([{ id: 'e1-2', source: '1', target: '2' }]);
    }
  }, [id]);

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
    <div style={{ height: 'calc(100vh - 80px)', width: '100%', position: 'fixed', top: '80px', left: '260px', right: 0, bottom: 0, display: 'flex', background: '#f8fafc' }}>
      {/* Sidebar / Properties Panel */}
      <div style={{ width: '320px', background: 'white', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
          <button onClick={() => navigate('/campaigns')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', border: 'none', background: 'none', cursor: 'pointer', marginBottom: '16px' }}>
            <ArrowLeft size={16} /> Back to List
          </button>
          <input 
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            style={{ fontSize: '1.2rem', fontWeight: '800', border: 'none', outline: 'none', width: '100%', color: '#1e293b' }}
          />
        </div>

        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {!selectedNode ? (
            <div>
              <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Add Nodes</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button onClick={() => addNode('message')} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <MessageSquare size={20} color="#4f46e5" />
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Message</span>
                </button>
                <button onClick={() => addNode('condition')} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <Activity size={20} color="#ec4899" />
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Condition</span>
                </button>
                <button onClick={() => addNode('ai')} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f3e8ff', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', gridColumn: 'span 2' }}>
                  <Sparkles size={20} color="#a855f7" />
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#6b21a8' }}>AI Agent (Smart Reply)</span>
                </button>
              </div>
              <div style={{ marginTop: '40px', padding: '20px', borderRadius: '16px', background: '#eff6ff', border: '1px solid #dbeafe' }}>
                <div style={{ display: 'flex', gap: '8px', color: '#1e40af', marginBottom: '8px' }}>
                   <Info size={16} /> <span style={{ fontWeight: '700', fontSize: '12px' }}>How to use</span>
                </div>
                <p style={{ fontSize: '11px', color: '#1e40af', lineHeight: '1.5', margin: 0 }}>
                  Drag nodes to move them. Connect dots to create paths. The "Flow Start" node is where the magic begins.
                </p>
              </div>
            </div>
          ) : (
            <div>
               <div style={{ padding: '0 0 20px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
                 <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                   Node Properties
                 </h4>
                 <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                   Editing {selectedNode.type === 'trigger' ? 'Flow Trigger' : 'Message Action'}
                 </div>
               </div>
               
               {selectedNode.type === 'trigger' && (
                <div className="input-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '8px' }}>Keyword Trigger</label>
                  <StableInput 
                    value={selectedNode.data.keyword || ''}
                    onChange={(val) => updateNodeData('keyword', val)}
                    placeholder="e.g. START"
                  />
                </div>
              )}

              {selectedNode.type === 'message' && (
                <div className="input-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '8px' }}>Message Text</label>
                  <StableInput 
                    value={selectedNode.data.text || ''}
                    onChange={(val) => updateNodeData('text', val)}
                    isTextArea={true}
                  />
                </div>
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
                onClick={() => setNodes(nds => nds.filter(n => n.id !== selectedNode.id))}
                style={{ marginTop: '24px', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #fee2e2', color: '#ef4444', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Trash2 size={16} /> Delete Node
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9' }}>
          <button 
            onClick={saveFlow}
            disabled={isSaving}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Save size={18} /> {isSaving ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
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

        {/* Floating Toolbar */}
        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '12px' }}>
          <div style={{ background: 'white', padding: '8px 16px', borderRadius: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
            Live Support Enabled
          </div>
        </div>
      </div>
    </div>
  );
}
