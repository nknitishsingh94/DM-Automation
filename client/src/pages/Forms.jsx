import { useState, useEffect } from 'react';
import { 
  FileText, Plus, BarChart2, MousePointer, 
  CheckCircle, ChevronRight, X, Trash2, 
  Eye, ToggleLeft, ToggleRight, Loader2, Sparkles,
  ArrowRight, Save, Trash, Layout, Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/theme.css';
import '../styles/Forms.css';

export default function Forms() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  
  const [newForm, setNewForm] = useState({
    name: '',
    type: 'Lead Capture',
    steps: [
      {
        title: 'Basic Info',
        fields: [
          { label: 'Full Name', type: 'text', placeholder: 'Enter name', required: true },
          { label: 'Email', type: 'email', placeholder: 'Enter email', required: true },
          { label: 'Phone Number', type: 'phone', placeholder: 'Enter phone', required: true }
        ]
      }
    ],
    settings: {
      successMessage: 'Thank you! We will get back to you soon.',
      notifyAdmin: true
    }
  });

  const formTypes = [
    { icon: <MousePointer size={22} />, title: 'Lead Capture', desc: 'Collect name, email & phone via DM', color: 'var(--accent-color)', bg: 'rgba(124,58,237,0.1)' },
    { icon: <CheckCircle size={22} />, title: 'Survey & Feedback', desc: 'Ask questions and collect answers', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { icon: <BarChart2 size={22} />, title: 'Quiz Flow', desc: 'Interactive quizzes with personalized results', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { icon: <FileText size={22} />, title: 'Application Form', desc: 'Multi-step application collection', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  ];

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/forms`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('insta_agent_token')}` }
      });
      if (res.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setForms(data);
      } else {
        setForms([]);
      }
    } catch (err) {
      toast.error('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async () => {
    if (!newForm.name) return toast.error('Please enter a form name');
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/forms`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('insta_agent_token')}`
        },
        body: JSON.stringify(newForm)
      });
      
      if (res.ok) {
        toast.success('Form created successfully!');
        setIsModalOpen(false);
        fetchForms();
        setWizardStep(1);
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to create form');
      }
    } catch (err) {
      console.error("Form creation error:", err);
      toast.error('Connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this form?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/forms/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('insta_agent_token')}` }
      });
      setForms(forms.filter(f => f._id !== id));
      toast.success('Form deleted');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/forms/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('insta_agent_token')}` }
      });
      const updated = await res.json();
      setForms(forms.map(f => f._id === id ? updated : f));
    } catch (err) {
      toast.error('Toggle failed');
    }
  };

  const openWizard = (type) => {
    setNewForm({
      ...newForm,
      type: type,
      name: `New ${type}`,
      steps: type === 'Application Form' ? [
        { title: 'Personal Details', fields: [{ label: 'Full Name', type: 'text', placeholder: 'Enter name', required: true }] },
        { title: 'Questions', fields: [{ label: 'Why do you want to join?', type: 'textarea', placeholder: 'Tell us more...', required: true }] }
      ] : [
        { title: 'Main Step', fields: type === 'Lead Capture' ? [
          { label: 'Name', type: 'text', placeholder: 'Name', required: true },
          { label: 'Email', type: 'email', placeholder: 'Email', required: true }
        ] : [{ label: 'Question 1', type: 'text', placeholder: 'Enter your question', required: true }] }
      ]
    });
    setWizardStep(1);
    setIsModalOpen(true);
  };

  return (
    <div className="forms-container">
      {/* Hero Header */}
      <div className="forms-hero">
        <div className="forms-title-group">
          <h2>Forms & Studio</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Collect leads, feedback and data automatically via Instagram DMs.</p>
        </div>
        <button className="btn-premium" onClick={() => { setWizardStep(1); setIsModalOpen(true); }}>
          <Plus size={20} /> Create New Form
        </button>
      </div>

      {/* Modern Stats Grid */}
      <div className="forms-stats-grid">
        <div className="forms-stat-card">
          <span className="forms-stat-label">Total Forms</span>
          <span className="forms-stat-value">{forms.length}</span>
        </div>
        <div className="forms-stat-card">
          <span className="forms-stat-label">Active Gating</span>
          <span className="forms-stat-value" style={{ color: '#10b981' }}>{forms.filter(f => f.active).length}</span>
        </div>
        <div className="forms-stat-card">
          <span className="forms-stat-label">Total Leads</span>
          <span className="forms-stat-value">{forms.reduce((acc, f) => acc + (f.submissionsCount || 0), 0)}</span>
        </div>
        <div className="forms-stat-card">
          <span className="forms-stat-label">Response rate</span>
          <span className="forms-stat-value" style={{ color: 'var(--accent-color)' }}>{forms.length > 0 ? '86%' : '0%'}</span>
        </div>
      </div>

      <div className="forms-main-layout">
        {/* Forms List Container */}
        <div className="forms-list-card">
          <div className="forms-list-header">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layout size={20} color='var(--accent-color)' /> Active Form Flows
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Manage existing automations</div>
          </div>
          
          <div className="forms-list-body" style={{ minHeight: '400px' }}>
            {loading ? (
              <LoadingSpinner minHeight="300px" />
            ) : forms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 40px', color: 'var(--text-muted)' }}>
                <FileText size={64} style={{ opacity: 0.1, marginBottom: '16px' }} />
                <p style={{ fontWeight: '700' }}>No forms found. Start with a template on the right!</p>
              </div>
            ) : (
              forms.map(form => (
                <div key={form._id} className="form-item-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', flex: 1 }} onClick={() => navigate(`/forms/${form._id}`)}>
                    <div className="form-icon-circle">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '4px', color: 'var(--text-main)' }}>{form.name}</h4>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span className={`badge-premium ${form.active ? 'badge-active-premium' : 'badge-paused-premium'}`}>
                          {form.active ? 'Live' : 'Paused'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>• {form.type}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>{form.submissionsCount || 0}</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Leads</div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleToggle(form._id)} className="btn-icon" title={form.active ? "Pause" : "Resume"}>
                        {form.active ? <ToggleRight size={32} color="#10b981" /> : <ToggleLeft size={32} color="#94a3b8" />}
                      </button>
                      <button onClick={() => navigate(`/forms/${form._id}`)} className="btn-icon" style={{ background: 'var(--sidebar-bg)', padding: '8px', borderRadius: '10px' }}><Eye size={18} /></button>
                      <button onClick={() => handleDelete(form._id)} className="btn-icon" style={{ background: '#fff1f2', color: '#ef4444', padding: '8px', borderRadius: '10px' }}><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Templates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="forms-list-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#f59e0b" /> Studio Templates
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formTypes.map((t, i) => (
                <div key={i} className="template-card" onClick={() => openWizard(t.title)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div className="template-icon-wrap" style={{ background: t.bg, color: t.color }}>
                      {t.icon}
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{t.title}</div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)', borderRadius: '24px', padding: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h4 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '8px' }}>Power user?</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '20px' }}>Create multi-step flows with conditional branching logic in the Flow Builder.</p>
              <button 
                onClick={() => navigate('/flow-builder/new')}
                className="btn-premium" 
                style={{ background: 'rgba(255,255,255,0.2)', width: '100%', fontSize: '0.85rem', padding: '12px' }}
              >
                Open Flow Builder
              </button>
            </div>
            <Sparkles size={120} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', bottom: '-20px', right: '-20px' }} />
          </div>
        </div>
      </div>

      {/* Creation Wizard Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="wizard-modal" onClick={e => e.stopPropagation()}>
            <div className="wizard-header">
              <div>
                <div className="wizard-step-indicator">
                  <div className={`step-dot ${wizardStep === 1 ? 'active' : ''}`}></div>
                  <div className={`step-dot ${wizardStep === 2 ? 'active' : ''}`}></div>
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-main)' }}>
                  {wizardStep === 1 ? 'New Form Setup' : 'Form Configuration'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {wizardStep === 1 ? 'Start by naming your automation flow' : 'Configure the sequential questions to ask'}
                </p>
              </div>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg-dark)', padding: '8px', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '0 40px 40px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
              {wizardStep === 1 ? (
                <div style={{ padding: '20px 0' }}>
                  <FormField 
                    label="Give your form a name" 
                    placeholder="e.g. Winter Sale Lead Capture"
                    value={newForm.name}
                    onChange={val => setNewForm({...newForm, name: val})}
                  />

                  <div style={{ marginTop: '32px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>Select Template Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      {formTypes.map(t => (
                        <div 
                          key={t.title}
                          onClick={() => setNewForm({...newForm, type: t.title})}
                          style={{ 
                            padding: '16px', borderRadius: '16px', cursor: 'pointer', border: '2px solid', 
                            borderColor: newForm.type === t.title ? 'var(--accent-color)' : 'var(--bg-dark)',
                            background: newForm.type === t.title ? '#fdfcff' : 'var(--bg-card)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ color: newForm.type === t.title ? 'var(--accent-color)' : 'var(--text-muted)' }}>{t.icon}</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{t.title}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>Sequences & Fields</h4>
                    <button 
                      className="btn-premium" 
                      style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'var(--sidebar-bg)', color: 'var(--accent-color)', boxShadow: 'none', border: '1px solid var(--border-subtle)' }}
                      onClick={() => {
                        const updatedFields = [...newForm.steps[0].fields, { label: 'New Question', type: 'text', placeholder: '', required: true }];
                        setNewForm({
                          ...newForm,
                          steps: [{ ...newForm.steps[0], fields: updatedFields }]
                        });
                      }}
                    >
                      <Plus size={16} /> Add Question
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {newForm.steps[0].fields.map((field, idx) => (
                      <div key={idx} className="field-editor-card">
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800', flexShrink: 0 }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <FormField 
                            label={`Question Text`}
                            placeholder="What should the bot ask?"
                            value={field.label}
                            isTextarea={field.type === 'textarea'}
                            onChange={val => {
                              const updatedFields = [...newForm.steps[0].fields];
                              updatedFields[idx].label = val;
                              setNewForm({
                                ...newForm,
                                steps: [{ ...newForm.steps[0], fields: updatedFields }]
                              });
                            }}
                          />
                        </div>
                        <select 
                          value={field.type}
                          onChange={(e) => {
                            const updatedFields = [...newForm.steps[0].fields];
                            updatedFields[idx].type = e.target.value;
                            setNewForm({
                              ...newForm,
                              steps: [{ ...newForm.steps[0], fields: updatedFields }]
                            });
                          }}
                          style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', outline: 'none' }}
                        >
                          <option value="text">Short Text</option>
                          <option value="textarea">Long Text</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                        </select>
                        <button 
                          className="delete-field-btn"
                          onClick={() => {
                            const updatedFields = newForm.steps[0].fields.filter((_, i) => i !== idx);
                            setNewForm({
                              ...newForm,
                              steps: [{ ...newForm.steps[0], fields: updatedFields }]
                            });
                          }}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '32px' }}>
                    <FormField 
                      label="Automation Success Message" 
                      subLabel="This message is sent after all questions are answered."
                      isTextarea={true}
                      value={newForm.settings.successMessage}
                      onChange={val => setNewForm({...newForm, settings: {...newForm.settings, successMessage: val}})}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '30px 40px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)', display: 'flex', gap: '16px' }}>
              {wizardStep === 1 ? (
                <>
                  <button className="btn-secondary" style={{ flex: 1, padding: '14px', borderRadius: '16px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button className="btn-premium" style={{ flex: 1 }} onClick={() => setWizardStep(2)}>
                    Continue <ArrowRight size={18} />
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-secondary" style={{ flex: 1, padding: '14px', borderRadius: '16px' }} onClick={() => setWizardStep(1)} disabled={isSubmitting}>Back</button>
                  <button className="btn-premium" style={{ flex: 1 }} onClick={handleCreateForm} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="animate-spin" size={18} /> Launching...</>
                    ) : (
                      <><Send size={18} /> Submit & Launch Form</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
