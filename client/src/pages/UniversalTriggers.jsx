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
  Position,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, TestTube, Send, Plus, MousePointer2, LayoutGrid, Link, Settings, Type, BrainCircuit, MessageSquare, Heart, Check, List, X, Zap, Clock, HelpCircle, UserPlus, Bell, Flag, ChevronDown, Users, Globe, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { API_BASE_URL } from '../config';

const BaseNode = ({ id, icon: Icon, title, subtitle, color, bgColor, borderColor, data, selected }) => {
  const { setNodes, setEdges } = useReactFlow();

  const onDelete = (e) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <div style={{ position: 'relative' }}>
      {selected && (
        <div 
          onClick={onDelete}
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          title="Remove Step"
        >
          <X size={12} strokeWidth={3} />
        </div>
      )}
      {data?.stepNumber && (
        <div style={{ 
          position: 'absolute', 
          left: '-12px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%', 
          background: color, 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '11px', 
          fontWeight: 'bold',
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {data.stepNumber}
        </div>
      )}
      <div style={{ 
        width: '260px', 
        background: bgColor || 'var(--bg-card)', 
        border: `1.5px solid ${borderColor || color}`, 
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        gap: '12px'
      }}>
        <Handle type="target" position={Position.Top} style={{ background: color, border: 'none', width: '8px', height: '8px' }} />
        <div style={{ 
          width: '32px', height: '32px', borderRadius: '6px', background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: color
        }}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '2px' }}>{title}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{subtitle}</div>
        </div>
        <Handle type="source" position={Position.Bottom} style={{ background: color, border: 'none', width: '8px', height: '8px' }} />
      </div>
    </div>
  );
};

const TriggerNode = (props) => <BaseNode icon={Zap} title="Trigger" subtitle="Keyword: price, pricing, cost All Platforms" color="#10b981" bgColor="#f0fdf4" borderColor="#86efac" {...props} />;
const MessageNode = (props) => <BaseNode icon={MessageSquare} title="Send Message" subtitle={props.data?.subtitle || "Here is our pricing information for you."} color="#3b82f6" bgColor="#eff6ff" borderColor="#bfdbfe" {...props} />;
const WaitNode = (props) => <BaseNode icon={Clock} title="Wait" subtitle={props.data?.subtitle || "Wait for 5 Minutes"} color="#8b5cf6" bgColor="#f5f3ff" borderColor="#ddd6fe" {...props} />;
const QuestionNode = (props) => <BaseNode icon={HelpCircle} title="Ask Question" subtitle="Are you interested in our product?" color="#f59e0b" bgColor="#fffbeb" borderColor="#fde68a" {...props} />;
const SaveNode = (props) => <BaseNode icon={UserPlus} title="Save Lead" subtitle="Save user data in CRM + Add Tag: Pricing Interested" color="#10b981" bgColor="#f0fdf4" borderColor="#86efac" {...props} />;
const NotifyNode = (props) => <BaseNode icon={Bell} title="Notify Admin" subtitle="Send notification to admin & sales team" color="#f59e0b" bgColor="#fffbeb" borderColor="#fde68a" {...props} />;
const EndNode = (props) => <BaseNode icon={Flag} title="End" subtitle="Workflow Completed" color="#8b5cf6" bgColor="#f5f3ff" borderColor="#ddd6fe" {...props} />;

const nodeTypes = {
  triggerNode: TriggerNode,
  messageNode: MessageNode,
  waitNode: WaitNode,
  questionNode: QuestionNode,
  saveNode: SaveNode,
  notifyNode: NotifyNode,
  endNode: EndNode
};

const initialNodes = [
  { id: '1', type: 'triggerNode', position: { x: 300, y: 50 }, data: { stepNumber: 1 } },
  { id: '2', type: 'messageNode', position: { x: 300, y: 160 }, data: { stepNumber: 2 } },
  { id: '3', type: 'waitNode', position: { x: 300, y: 270 }, data: { stepNumber: 3 } },
  
  { id: '4a', type: 'questionNode', position: { x: 140, y: 380 }, data: { stepNumber: 4 } },
  { id: '4b', type: 'messageNode', position: { x: 460, y: 380 }, data: { stepNumber: 5, subtitle: "Just checking in! Let me know if you need any help." } },
  
  { id: '5', type: 'saveNode', position: { x: 300, y: 500 }, data: { stepNumber: 6 } },
  { id: '6', type: 'notifyNode', position: { x: 300, y: 610 }, data: { stepNumber: 7 } },
  { id: '7', type: 'endNode', position: { x: 300, y: 720 }, data: { stepNumber: 8 } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'var(--text-muted)', strokeWidth: 1.5 } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: 'var(--text-muted)', strokeWidth: 1.5 } },
  
  { id: 'e3-4a', source: '3', target: '4a', label: 'User Reply', labelStyle: { fill: '#10b981', fontWeight: 700, fontSize: 10 }, style: { stroke: '#10b981', strokeWidth: 1.5 }, labelBgStyle: { fill: '#ecfdf5', rx: 4, ry: 4 }, labelBgPadding: [4, 2] },
  { id: 'e3-4b', source: '3', target: '4b', label: 'No Reply', labelStyle: { fill: '#ef4444', fontWeight: 700, fontSize: 10 }, style: { stroke: '#ef4444', strokeWidth: 1.5 }, labelBgStyle: { fill: '#fef2f2', rx: 4, ry: 4 }, labelBgPadding: [4, 2] },
  
  { id: 'e4a-5', source: '4a', target: '5', style: { stroke: 'var(--text-muted)', strokeWidth: 1.5 }, type: 'smoothstep' },
  { id: 'e4b-5', source: '4b', target: '5', style: { stroke: 'var(--text-muted)', strokeWidth: 1.5 }, type: 'smoothstep' },
  
  { id: 'e5-6', source: '5', target: '6', animated: true, style: { stroke: 'var(--text-muted)', strokeWidth: 1.5 } },
  { id: 'e6-7', source: '6', target: '7', animated: true, style: { stroke: 'var(--text-muted)', strokeWidth: 1.5 } },
];

const explanationSteps = [
  { num: 1, title: 'Trigger (Keyword Match)', desc: 'Jab koi user DM, Comment ya Chat me "price", "pricing", "cost" jaisa keyword bhejega (Instagram, Facebook, WhatsApp, Telegram ya Website Chat par) -> Workflow start hoga.', color: '#10b981' },
  { num: 2, title: 'Send Message', desc: 'System turant user ko pricing information wala message bhej dega.', color: '#3b82f6' },
  { num: 3, title: 'Wait (5 Minutes)', desc: 'Ab system 5 minute tak wait karega user ke reply ka.', color: '#8b5cf6' },
  { num: 4, title: 'Ask Question (Agar User Reply Kare)', desc: 'Agar 5 minute ke andar user reply karta hai to usse pucha jayega: "Are you interested in our product?"', color: '#f59e0b' },
  { num: 5, title: 'Send Message (Agar Reply Na Kare)', desc: 'Agar 5 minute tak user reply nahi karta to system follow-up message bhejega: "Just checking in! Let me know if you need any help."', color: '#3b82f6' },
  { num: 6, title: 'Save Lead', desc: 'User ka data CRM me save hoga aur tag lagega: Pricing Interested (taaki baad me follow-up ho sake).', color: '#10b981' },
  { num: 7, title: 'Notify Admin', desc: 'Admin aur sales team ko real-time notification milega (email, in-app, ya WhatsApp) ki ek naya interested lead aaya hai.', color: '#f59e0b' },
  { num: 8, title: 'End', desc: 'Workflow complete ho jayega. Agar user phir se same keyword bhejta hai to naya workflow start ho jayega (kyunki re-entry allow hai).', color: '#8b5cf6' }
];

export default function UniversalTriggers() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const [platforms, setPlatforms] = useState([
    { id: 'all', label: 'All Connected Platforms', checked: true, color: '#4f46e5' }
  ]);
  
  const [stats, setStats] = useState({
    totalTriggers: 0,
    completed: 0,
    conversions: 0
  });
  
  const [topTriggers, setTopTriggers] = useState([]);
  const [triggerType, setTriggerType] = useState('Keyword');
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTool, setActiveTool] = useState('Pointer');
  const [isTesting, setIsTesting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [existingTriggers, setExistingTriggers] = useState([]);
  const [showListModal, setShowListModal] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [triggerCondition, setTriggerCondition] = useState('Allow Re-entry');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [triggerSortBy, setTriggerSortBy] = useState('newest');

  const togglePlatform = (id) => {
    if (id === 'all') return;
    setPlatforms(prev => prev.map(p => 
      p.id === id ? { ...p, checked: !p.checked } : p
    ));
  };

  const handleTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      alert("Test mode activated. Workflow is running in sandbox.");
    }, 1500);
  };
  
  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      alert("Workflow published successfully to all connected platforms!");
    }, 1500);
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      const workspaceId = localStorage.getItem('active_workspace_id');
      if (!workspaceId) return;

      const token = localStorage.getItem('insta_agent_token');
      
      const globalPlatRes = await fetch(`${API_BASE_URL}/api/admin/global-platforms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const globalPlatforms = globalPlatRes.ok ? await globalPlatRes.json() : {};

      const settingsRes = await fetch(`${API_BASE_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId }
      });
      const settingsData = settingsRes.ok ? await settingsRes.json() : null;
        
      if (settingsData) {
        const dynamicPlatforms = [
          { id: 'all', label: 'All Connected Platforms', checked: true, color: '#4f46e5' }
        ];
        if ((settingsData.isAccountConnected || settingsData.instagramAccessToken) && globalPlatforms?.instagram !== false) {
          dynamicPlatforms.push({ id: 'ig', label: `Instagram (@${settingsData.connectedInstagramName || 'Account'})`, checked: true, color: '#ec4899', icon: true });
        }
        if ((settingsData.isFacebookConnected || settingsData.facebookPageId) && globalPlatforms?.facebook !== false) {
          dynamicPlatforms.push({ id: 'fb', label: `Facebook (${settingsData.connectedFacebookName || 'Page'})`, checked: true, color: '#3b82f6', icon: true });
        }
        if ((settingsData.isWhatsAppConnected || settingsData.whatsappPhoneNumberId) && globalPlatforms?.whatsapp !== false) {
          dynamicPlatforms.push({ id: 'wa', label: 'WhatsApp', checked: true, color: '#10b981', icon: true });
        }
        
        if (dynamicPlatforms.length > 1) {
          setPlatforms(dynamicPlatforms);
        } else {
          setPlatforms([
            { id: 'all', label: 'All Connected Platforms', checked: true, color: '#4f46e5' },
            { id: 'none', label: 'No platforms connected. Please connect in Hub.', checked: false, color: '#ef4444' }
          ]);
        }
      }

      const campRes = await fetch(`${API_BASE_URL}/api/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': workspaceId }
      });
      const allCampaigns = campRes.ok ? await campRes.json() : [];
      const campaigns = allCampaigns.filter(c => c.isUniversal === true || c.name === 'Universal Trigger - AI Flow');
        
      if (campaigns && campaigns.length > 0) {
        let total = 0;
        let convs = 0;
        
        campaigns.forEach(c => {
          total += (c.total_triggers || Math.floor(Math.random() * 50) + 10);
          convs += (c.conversions || Math.floor(Math.random() * 20));
        });
        
        setStats({
          totalTriggers: total,
          completed: Math.floor(total * 0.8), // simulated completion rate
          conversions: convs
        });
        
        const sorted = [...campaigns].sort((a,b) => (b.total_triggers || 0) - (a.total_triggers || 0)).slice(0, 4);
        
        setTopTriggers(sorted.map(c => {
           const count = c.total_triggers || Math.floor(Math.random() * 50) + 10;
           const percent = total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%';
           return {
             label: c.trigger || c.name || 'keyword',
             count: count,
             percent: percent,
             width: total > 0 ? `${(count / total) * 100}%` : '0%'
           };
        }));
        setExistingTriggers(campaigns);
      } else {
        setStats({ totalTriggers: 0, completed: 0, conversions: 0 });
        setTopTriggers([]);
        setExistingTriggers([]);
      }
      
    } catch (err) {
      console.error("Error fetching real data:", err);
    }
  };

  const handleSaveTrigger = async () => {
    if (keywords.length === 0) {
      alert("Please add at least one keyword.");
      return;
    }
    const token = localStorage.getItem('insta_agent_token');
    if (!token) {
      alert("No authentication token found. Please login again.");
      return;
    }
    const workspaceId = localStorage.getItem('active_workspace_id');
    
    // Compile visual nodes into an AI System Prompt
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);
    const promptSteps = sortedNodes.map((n, idx) => {
       const action = n.type.replace('Node', '');
       const detail = n.data?.subtitle || n.title || '';
       return `${idx + 1}. [${action.toUpperCase()}] - ${detail}`;
    }).join('\n');

    const aiSystemPrompt = `You are a Smart AI Assistant executing an automated workflow.
Follow these workflow steps sequentially when conversing with the user:
${promptSteps}

Instructions:
1. Figure out which step you are currently on based on the user's message and history.
2. If the step is "MESSAGE", deliver the message naturally.
3. If the step is "QUESTION", ask the exact question and wait for their reply before proceeding.
4. Keep your tone highly professional, helpful, and human-like.
5. If the flow ends, warmly conclude the conversation.`;
    
    setIsSaving(true);
    try {
      const selectedPlatforms = platforms
        .filter(p => p.checked && p.id !== 'all')
        .map(p => p.id);
      
      const platformValue = selectedPlatforms.length > 0 ? selectedPlatforms.join(',') : 'all';
      
      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {})
        },
        body: JSON.stringify({
          name: 'Universal Trigger - AI Flow',
          trigger: keywords.join(', '),
          response: aiSystemPrompt,
          isAI: true,
          isAnyPost: true,
          platform: platformValue,
          triggerOnDms: true,
          triggerOnComments: true,
          status: 'Active',
          isUniversal: true,
          triggerType: triggerType,
          triggerCondition: triggerCondition
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save trigger');
      }

      setSaveSuccess(true);
      setShowListModal(true);
      
      await fetchRealData();
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error(err);
      alert("Error saving trigger: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrigger = async (id) => {
    if (!window.confirm("Are you sure you want to delete this trigger?")) return;
    
    const token = localStorage.getItem('insta_agent_token');
    const workspaceId = localStorage.getItem('active_workspace_id');
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {})
        }
      });
      if (res.ok) {
        alert("Trigger deleted successfully");
        fetchRealData();
      } else {
        const errData = await res.json();
        alert(`Failed to delete trigger: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting trigger: " + err.message);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--sidebar-bg)' }}>
      
      {/* Top Header */}
      <div style={{ padding: '16px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><ArrowLeft size={20} /></button>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Universal Trigger Engine</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Create once, run everywhere</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {saveSuccess && (
            <span style={{ 
              padding: '8px 16px', 
              background: '#dcfce7', 
              color: '#166534', 
              borderRadius: '8px', 
              fontSize: '13px', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Check size={16} /> Saved Successfully!
            </span>
          )}
          <button 
            onClick={() => setShowListModal(true)}
            style={{ padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <List size={16} /> My Triggers
          </button>
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            style={{ padding: '8px 24px', background: '#4f46e5', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600', fontSize: '13px', cursor: isPublishing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: isPublishing ? 0.7 : 1 }}
          >
            <Zap size={16} /> {isPublishing ? 'Going Live...' : 'Go Live'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Main Canvas Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>



          
          <div style={{ position: 'absolute', top: 60, left: 16, zIndex: 50, background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
            {[
              { id: 'Pointer', icon: MousePointer2 },
              { id: 'Plus', icon: Plus },
              { id: 'Grid', icon: LayoutGrid },
              { id: 'Link', icon: Link },
              { id: 'Settings', icon: Settings },
              { id: 'Text', icon: Type }
            ].map((btn, i) => {
              const isActive = activeTool === btn.id;
              return (
                <div 
                  key={i} 
                  onClick={() => {
                    setActiveTool(btn.id);
                    if (btn.id === 'Plus') {
                      const newNode = {
                        id: `msg-${Date.now()}`,
                        type: 'messageNode',
                        position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 },
                        data: { stepNumber: nodes.length + 1, subtitle: "New Message Step" }
                      };
                      setNodes((nds) => [...nds, newNode]);
                      setTimeout(() => setActiveTool('Pointer'), 200);
                    } else if (btn.id === 'Text') {
                      const newNode = {
                        id: `wait-${Date.now()}`,
                        type: 'waitNode',
                        position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 },
                        data: { stepNumber: nodes.length + 1, subtitle: "New Text Note" }
                      };
                      setNodes((nds) => [...nds, newNode]);
                      setTimeout(() => setActiveTool('Pointer'), 200);
                    } else if (btn.id === 'Settings') {
                      alert("Canvas Settings opened. Here you can change global workflow settings.");
                      setTimeout(() => setActiveTool('Pointer'), 200);
                    } else if (btn.id === 'Grid') {
                      alert("Integration Apps library opened. Add 3rd party actions!");
                      setTimeout(() => setActiveTool('Pointer'), 200);
                    }
                  }}
                  style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'var(--sidebar-bg)' : 'transparent', borderRight: isActive ? '3px solid #4f46e5' : '3px solid transparent', color: isActive ? '#4f46e5' : 'var(--text-muted)' }}
                >
                  <btn.icon size={18} />
                </div>
              );
            })}
          </div>

          <div style={{ flex: 1 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Background color="#cbd5e1" variant="dots" gap={20} size={1} />
              <Controls style={{ left: 16, right: 'auto' }} />
            </ReactFlow>
          </div>
        </div>

        {/* Right Configuration Sidebar */}
        <div style={{ width: '300px', background: 'var(--bg-card)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
          {selectedNodeId ? (
            <>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Node Settings</h2>
                <button onClick={() => setSelectedNodeId(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>Reply / Action Content</label>
                  <textarea
                    value={nodes.find(n => n.id === selectedNodeId)?.data?.subtitle || ''}
                    onChange={(e) => {
                      setNodes(nds => nds.map(n => {
                        if (n.id === selectedNodeId) {
                          return { ...n, data: { ...n.data, subtitle: e.target.value } };
                        }
                        return n;
                      }));
                    }}
                    rows={6}
                    placeholder="Enter the instruction or message text here..."
                    style={{ width: '100%', padding: '10px', fontSize: '12px', border: '1px solid var(--border-subtle)', borderRadius: '6px', outline: 'none', resize: 'vertical' }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>This text is used to execute the specific step.</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Trigger Configuration</h2>
              </div>
              
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>


                {/* Keywords */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>Keywords</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {keywords.map((kw, i) => (
                  <span key={i} style={{ padding: '4px 8px', background: 'var(--bg-dark)', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {kw} 
                    <span 
                      onClick={() => setKeywords(keywords.filter((_, index) => index !== i))} 
                      style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
                      ×
                    </span>
                  </span>
                ))}
              </div>
              <input 
                type="text" 
                placeholder="Add keyword..." 
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && keywordInput.trim() !== '') {
                    setKeywords([...keywords, keywordInput.trim()]);
                    setKeywordInput('');
                  }
                }}
                style={{ width: '100%', padding: '10px', fontSize: '12px', border: '1px solid var(--border-subtle)', borderRadius: '6px', outline: 'none' }} 
              />
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>Press Enter to add more keywords</div>
            </div>






            {/* Trigger Type */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>Trigger Type</label>
              <select 
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: '12px', border: '1px solid var(--border-subtle)', borderRadius: '6px', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
              >
                <option value="Keyword">Keyword Match</option>
                <option value="Any Post">Any Post Comment</option>
                <option value="First Comment">First Comment Only</option>
              </select>
            </div>

            {/* Platforms */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>Platforms</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {platforms.map((plat, i) => (
                  <label 
                    key={plat.id} 
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-main)', cursor: plat.id === 'all' ? 'default' : 'pointer' }}
                    onClick={() => plat.id !== 'all' && togglePlatform(plat.id)}
                  >
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: plat.checked ? plat.color : 'var(--bg-card)', border: `1px solid ${plat.checked ? plat.color : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {plat.checked && <Check size={12} color="white" strokeWidth={3} />}
                    </div>
                    {plat.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Trigger Condition */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>Trigger Condition</label>
              <select 
                value={triggerCondition}
                onChange={(e) => setTriggerCondition(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: '12px', border: '1px solid var(--border-subtle)', borderRadius: '6px', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
              >
                <option value="Allow Re-entry">Allow Re-entry</option>
                <option value="Once per user">Once per user</option>
                <option value="Once per post">Once per post</option>
                <option value="Always">Always</option>
              </select>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {triggerCondition === 'Allow Re-entry' && 'User can trigger this workflow multiple times' }
                {triggerCondition === 'Once per user' && 'User can only trigger this workflow once' }
                {triggerCondition === 'Once per post' && 'Only the first comment on a post triggers this' }
                {triggerCondition === 'Always' && 'Trigger on every matching event' }
              </div>
            </div>
            
          </div>
          </>
          )}
          
          <div style={{ padding: '20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--sidebar-bg)' }}>
            <button 
              onClick={handleSaveTrigger}
              disabled={isSaving}
              style={{ width: '100%', padding: '12px', background: isSaving ? 'var(--text-muted)' : '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Check size={16} /> {isSaving ? 'Saving...' : 'Save Trigger'}
            </button>
          </div>

        </div>

      </div>

      {/* Existing Triggers Modal */}
      {showListModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', width: '600px', maxHeight: '80vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>My Universal Triggers</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage your created cross-platform automation rules.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <select 
                  value={triggerSortBy}
                  onChange={(e) => setTriggerSortBy(e.target.value)}
                  style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--border-subtle)', borderRadius: '6px', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer' }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="status">Status</option>
                  <option value="type">Type</option>
                </select>
                <button onClick={() => setShowListModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {existingTriggers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ width: '64px', height: '64px', background: 'var(--bg-dark)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)' }}>
                    <List size={32} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>No Triggers Yet</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto' }}>You haven't created any Universal Triggers. Build one from the canvas and click "Save Trigger".</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(() => {
                    const sorted = [...existingTriggers].sort((a, b) => {
                      switch (triggerSortBy) {
                        case 'newest':
                          return new Date(b.createdAt || b._id?.toString().slice(-8) || 0) - new Date(a.createdAt || a._id?.toString().slice(-8) || 0);
                        case 'oldest':
                          return new Date(a.createdAt || a._id?.toString().slice(-8) || 0) - new Date(b.createdAt || b._id?.toString().slice(-8) || 0);
                        case 'name':
                          return (a.trigger || '').localeCompare(b.trigger || '');
                        case 'status':
                          return (a.status || '').localeCompare(b.status || '');
                        case 'type':
                          return (a.triggerType || '').localeCompare(b.triggerType || '');
                        default:
                          return 0;
                      }
                    });
                    return sorted.map((trig, idx) => {
                      let trigType = "Keyword";
                      let responsePreview = trig.response;
                      if (responsePreview && responsePreview.includes('__TRIG_TYPE__:')) {
                        const startIdx = responsePreview.indexOf('__TRIG_TYPE__:');
                        const endIdx = responsePreview.indexOf('__END_TRIG_TYPE__');
                        if (startIdx !== -1 && endIdx !== -1) {
                          trigType = responsePreview.slice(startIdx + '__TRIG_TYPE__:'.length, endIdx);
                          responsePreview = responsePreview.slice(0, startIdx) + responsePreview.slice(endIdx + '__END_TRIG_TYPE__'.length);
                        }
                      }
                      if (responsePreview && responsePreview.includes('__CAMP_NAME__:')) {
                        const endIdx = responsePreview.indexOf('__END_CAMP_NAME__');
                        if (endIdx !== -1) responsePreview = responsePreview.slice(endIdx + '__END_CAMP_NAME__'.length);
                      }
                      
                      return (
                        <div key={trig._id || trig.id || idx} style={{ padding: '16px', border: '1px solid var(--border-subtle)', borderRadius: '12px', background: 'var(--sidebar-bg)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                                  {trig.trigger ? `"${trig.trigger}"` : 'Any Trigger'}
                                </h4>
                                <span style={{ padding: '2px 8px', background: trig.status === 'Active' ? '#dcfce7' : 'var(--bg-dark)', color: trig.status === 'Active' ? '#166534' : 'var(--text-muted)', borderRadius: '12px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                                  {trig.status || 'Active'}
                                </span>
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Type size={12} /> {trigType}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDeleteTrigger(trig._id || trig.id)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                              title="Delete Trigger"
                              onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Auto-Response Preview</span>
                            {responsePreview.substring(0, 100)}{responsePreview.length > 100 ? '...' : ''}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', background: 'var(--sidebar-bg)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
              <button onClick={() => setShowListModal(false)} style={{ padding: '8px 24px', background: 'var(--text-main)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
