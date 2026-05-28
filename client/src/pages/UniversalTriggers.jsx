import React, { useState, useCallback } from 'react';
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
import { 
  ArrowLeft, Zap, MessageSquare, Clock, HelpCircle, 
  UserPlus, Bell, Flag, Check, ChevronDown, TestTube, 
  Send, Users, Globe, Layout, Search, BrainCircuit, Type, Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Custom Nodes Matching the Screenshot
const BaseNode = ({ icon: Icon, title, subtitle, color, bgColor, borderColor }) => (
  <div style={{ 
    width: '260px', 
    background: bgColor || 'white', 
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
      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>{title}</div>
      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>{subtitle}</div>
    </div>
    <Handle type="source" position={Position.Bottom} style={{ background: color, border: 'none', width: '8px', height: '8px' }} />
  </div>
);

const TriggerNode = ({ data }) => <BaseNode icon={Zap} title="Trigger" subtitle="Keyword: price, pricing, cost All Platforms" color="#10b981" bgColor="#f0fdf4" borderColor="#86efac" />;
const MessageNode = ({ data }) => <BaseNode icon={MessageSquare} title="Send Message" subtitle={data.subtitle || "Here is our pricing information for you."} color="#3b82f6" bgColor="#eff6ff" borderColor="#bfdbfe" />;
const WaitNode = ({ data }) => <BaseNode icon={Clock} title="Wait" subtitle="Wait for 5 Minutes" color="#8b5cf6" bgColor="#f5f3ff" borderColor="#ddd6fe" />;
const QuestionNode = ({ data }) => <BaseNode icon={HelpCircle} title="Ask Question" subtitle="Are you interested in our product?" color="#f59e0b" bgColor="#fffbeb" borderColor="#fde68a" />;
const SaveNode = ({ data }) => <BaseNode icon={UserPlus} title="Save Lead" subtitle="Save user data in CRM + Add Tag: Pricing Interested" color="#10b981" bgColor="#f0fdf4" borderColor="#86efac" />;
const NotifyNode = ({ data }) => <BaseNode icon={Bell} title="Notify Admin" subtitle="Send notification to admin & sales team" color="#f59e0b" bgColor="#fffbeb" borderColor="#fde68a" />;
const EndNode = ({ data }) => <BaseNode icon={Flag} title="End" subtitle="Workflow Completed" color="#8b5cf6" bgColor="#f5f3ff" borderColor="#ddd6fe" />;

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
  { id: '1', type: 'triggerNode', position: { x: 300, y: 50 }, data: {} },
  { id: '2', type: 'messageNode', position: { x: 300, y: 160 }, data: {} },
  { id: '3', type: 'waitNode', position: { x: 300, y: 270 }, data: {} },
  
  // Branching
  { id: '4a', type: 'questionNode', position: { x: 140, y: 380 }, data: {} },
  { id: '4b', type: 'messageNode', position: { x: 460, y: 380 }, data: { subtitle: "Just checking in! Let me know if you need any help." } },
  
  // Converging back
  { id: '5', type: 'saveNode', position: { x: 300, y: 500 }, data: {} },
  { id: '6', type: 'notifyNode', position: { x: 300, y: 610 }, data: {} },
  { id: '7', type: 'endNode', position: { x: 300, y: 720 }, data: {} },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  
  // Branch edges
  { id: 'e3-4a', source: '3', target: '4a', label: 'User Reply', labelStyle: { fill: '#10b981', fontWeight: 700, fontSize: 10 }, style: { stroke: '#10b981', strokeWidth: 1.5 }, labelBgStyle: { fill: '#ecfdf5', rx: 4, ry: 4 }, labelBgPadding: [4, 2] },
  { id: 'e3-4b', source: '3', target: '4b', label: 'No Reply', labelStyle: { fill: '#ef4444', fontWeight: 700, fontSize: 10 }, style: { stroke: '#ef4444', strokeWidth: 1.5 }, labelBgStyle: { fill: '#fef2f2', rx: 4, ry: 4 }, labelBgPadding: [4, 2] },
  
  // Converge edges
  { id: 'e4a-5', source: '4a', target: '5', style: { stroke: '#94a3b8', strokeWidth: 1.5 }, type: 'smoothstep' },
  { id: 'e4b-5', source: '4b', target: '5', style: { stroke: '#94a3b8', strokeWidth: 1.5 }, type: 'smoothstep' },
  
  { id: 'e5-6', source: '5', target: '6', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e6-7', source: '6', target: '7', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
];

export default function UniversalTriggers() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  return (
    <div style={{ height: 'calc(100vh - 80px)', width: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
      
      {/* Top Header */}
      <div style={{ padding: '16px 24px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/campaigns')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><ArrowLeft size={20} /></button>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Universal Trigger Engine</h1>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Create once, run everywhere</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{ padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#4f46e5', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <TestTube size={16} /> Test Workflow
          </button>
          <button style={{ padding: '8px 24px', background: '#4f46e5', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Send size={16} /> Publish
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Main Canvas Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 5, background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
            Workflow Builder <span style={{ background: '#c7d2fe', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>Draft</span>
          </div>
          
          <div style={{ flex: 1 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Background color="#cbd5e1" variant="dots" gap={20} size={1} />
              <Controls style={{ left: 16, right: 'auto' }} />
            </ReactFlow>
          </div>

          {/* Bottom Dashboard Panel */}
          <div style={{ height: '220px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', padding: '16px' }}>
            
            {/* Live Events */}
            <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', paddingRight: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Live Events</h3>
                <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: '600', cursor: 'pointer' }}>View All</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { user: 'price', platform: 'Instagram', time: '2 sec ago', icon: Zap, color: '#ec4899' },
                  { user: 'pricing batao', platform: 'Facebook', time: '5 sec ago', icon: MessageSquare, color: '#3b82f6' },
                  { user: 'cost kya hai?', platform: 'WhatsApp', time: '10 sec ago', icon: Send, color: '#10b981' },
                ].map((ev, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: ev.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <ev.icon size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>{ev.user}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{ev.platform} • {ev.time}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', color: '#10b981', background: '#d1fae5', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>Matched</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow Stats */}
            <div style={{ flex: 1, padding: '0 16px', borderRight: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Workflow Stats</h3>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>This Week <ChevronDown size={12}/></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Total Triggers</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>1,250</div>
                  <div style={{ fontSize: '10px', color: '#10b981' }}>↑ 18.5%</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Completed</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>980</div>
                  <div style={{ fontSize: '10px', color: '#10b981' }}>↑ 16.2%</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Conversions</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>320</div>
                  <div style={{ fontSize: '10px', color: '#10b981' }}>↑ 21.4%</div>
                </div>
              </div>
              
              {/* Dummy Chart */}
              <div style={{ height: '60px', background: 'linear-gradient(to top, rgba(79, 70, 229, 0.1), transparent)', position: 'relative', borderBottom: '1px solid #e2e8f0' }}>
                 <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <polyline points="0,25 20,15 40,20 60,5 80,18 100,2" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '9px', color: '#94a3b8' }}>
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                 </div>
              </div>
            </div>

            {/* Top Performing Triggers */}
            <div style={{ flex: 1, paddingLeft: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: '0 0 12px 0' }}>Top Performing Triggers</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {[
                   { label: 'price', count: 432, percent: '34.5%', width: '100%' },
                   { label: 'demo', count: 298, percent: '23.8%', width: '70%' },
                   { label: 'hi', count: 198, percent: '15.8%', width: '50%' },
                   { label: 'support', count: 156, percent: '12.5%', width: '40%' },
                 ].map((t, i) => (
                   <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: '11px' }}>
                      <div style={{ width: '12px', color: '#94a3b8' }}>{i+1}</div>
                      <div style={{ width: '60px', fontWeight: '600', color: '#1e293b' }}>{t.label}</div>
                      <div style={{ flex: 1, height: '4px', background: '#f1f5f9', borderRadius: '2px', margin: '0 12px', position: 'relative' }}>
                         <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: '#10b981', borderRadius: '2px', width: t.width }}></div>
                      </div>
                      <div style={{ width: '30px', textAlign: 'right', color: '#475569', fontWeight: '600' }}>{t.count}</div>
                      <div style={{ width: '40px', textAlign: 'right', color: '#64748b' }}>{t.percent}</div>
                   </div>
                 ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right Configuration Sidebar */}
        <div style={{ width: '300px', background: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Trigger Configuration</h2>
          </div>
          
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {/* Trigger Type */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '10px' }}>Trigger Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ border: '2px solid #e0e7ff', background: '#f8fafc', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <Type size={18} color="#4f46e5" />
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#4f46e5' }}>Keyword</span>
                </div>
                <div style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <BrainCircuit size={18} color="#64748b" />
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>AI Intent</span>
                </div>
                <div style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <MessageSquare size={18} color="#64748b" />
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Comment</span>
                </div>
                <div style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <Heart size={18} color="#64748b" />
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Reaction</span>
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '10px' }}>Keywords</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {['price', 'pricing', 'cost'].map((kw, i) => (
                  <span key={i} style={{ padding: '4px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {kw} <span style={{ cursor: 'pointer', color: '#94a3b8' }}>×</span>
                  </span>
                ))}
              </div>
              <input type="text" placeholder="Add keyword..." style={{ width: '100%', padding: '10px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none' }} />
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>Press Enter to add more keywords</div>
            </div>

            {/* Match Type */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '10px' }}>Match Type</label>
              <select style={{ width: '100%', padding: '10px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', background: 'white', color: '#0f172a' }}>
                <option>Any Keyword</option>
                <option>Exact Match</option>
                <option>Contains</option>
              </select>
            </div>

            {/* Platforms */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '10px' }}>Platforms</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'All Platforms', checked: true, color: '#4f46e5' },
                  { label: 'Instagram', checked: true, color: '#ec4899', icon: true },
                  { label: 'Facebook Messenger', checked: true, color: '#3b82f6', icon: true },
                  { label: 'WhatsApp', checked: true, color: '#10b981', icon: true },
                  { label: 'Telegram', checked: true, color: '#0ea5e9', icon: true },
                  { label: 'Website Chat', checked: true, color: '#6366f1', icon: true },
                ].map((plat, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: plat.checked ? '#4f46e5' : 'white', border: `1px solid ${plat.checked ? '#4f46e5' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {plat.checked && <Check size={12} color="white" strokeWidth={3} />}
                    </div>
                    {plat.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Trigger Condition */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '10px' }}>Trigger Condition</label>
              <select style={{ width: '100%', padding: '10px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', background: 'white', color: '#0f172a' }}>
                <option>Allow Re-entry</option>
                <option>Once per user</option>
              </select>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>Allow user to trigger again after completion</div>
            </div>
            
          </div>
          
          <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
             <button style={{ width: '100%', padding: '12px', background: '#4f46e5', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Send size={16} /> Save Trigger
             </button>
          </div>

        </div>

      </div>
    </div>
  );
}
