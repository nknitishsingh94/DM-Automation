import { useState, useEffect } from 'react';
import { 
  FileText, Plus, BarChart2, MousePointer, 
  CheckCircle, ChevronRight, X, Trash2, 
  Eye, ToggleLeft, ToggleRight, Loader2, Sparkles,
  ArrowRight, Save, Trash
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import '../styles/theme.css';

export default function Forms() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  
  // New Form State
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
    { icon: <MousePointer size={22} />, title: 'Lead Capture', desc: 'Collect name, email & phone via DM', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    { icon: <CheckCircle size={22} />, title: 'Survey & Feedback', desc: 'Ask questions and collect answers', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { icon: <BarChart2 size={22} />, title: 'Quiz Flow', desc: 'Interactive quizzes with personalized results', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { icon: <FileText size={22} />, title: 'Application Form', desc: 'Multi-step application collection', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  ];

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/forms', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('insta_agent_token')}` }
      });
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
    try {
      const res = await fetch('/api/forms', {
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
        // Reset state
        setWizardStep(1);
      } else {
        toast.error('Failed to create form');
      }
    } catch (err) {
      toast.error('Connection error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this form?')) return;
    try {
      await fetch(`/api/forms/${id}`, {
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
      const res = await fetch(`/api/forms/${id}/toggle`, {
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
    <div className="container" style={{ maxWidth: '1200px' }}>
      {/* Header Section */}
      <div className="header-section">
        <div>
          <h2 className="title-lg">Forms & Lead Gen</h2>
          <p className="text-secondary">Manage your automated data collection flows</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Create Form
        </button>
      </div>

      {/* Global Stats */}
      <div className="studio-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '32px' }}>
        <div className="stat-card">
          <span className="stat-label">Total Forms</span>
          <span className="stat-value">{forms.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Submissions</span>
          <span className="stat-value">{forms.reduce((acc, f) => acc + (f.submissionsCount || 0), 0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Conversion Rate</span>
          <span className="stat-value">12.4%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Gating</span>
          <span className="stat-value">{forms.filter(f => f.active).length}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="studio-grid" style={{ gridTemplateColumns: '1fr 350px' }}>
        {/* Left Side: Existing Forms */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="text-bold">Your Active Forms</h3>
          </div>
          
          <div className="card-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
            ) : forms.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                <p>No forms created yet. Start with a template!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {forms.map(form => (
                  <div key={form._id} className="stat-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                      onClick={() => navigate(`/forms/${form._id}`)}
                    >
                      <div style={{ width: '40px', height: '40px', background: 'var(--bg-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="text-bold" style={{ fontSize: '14px' }}>{form.name}</h4>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className={`badge ${form.active ? 'badge-active' : 'badge-draft'}`}>
                            {form.active ? 'Active' : 'Paused'}
                          </span>
                          <span className="text-secondary" style={{ fontSize: '11px' }}>• {form.type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right', marginRight: '16px' }}>
                        <div className="text-bold" style={{ fontSize: '14px' }}>{form.submissionsCount || 0}</div>
                        <div className="text-secondary" style={{ fontSize: '11px' }}>leads</div>
                      </div>
                      <button onClick={() => handleToggle(form._id)} className="btn-icon">
                        {form.active ? <ToggleRight size={24} color="var(--primary)" /> : <ToggleLeft size={24} color="#94a3b8" />}
                      </button>
                      <button onClick={() => navigate(`/forms/${form._id}`)} className="btn-icon"><Eye size={18} /></button>
                      <button onClick={() => handleDelete(form._id)} className="btn-icon" style={{ color: '#ef4444' }}><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Templates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="text-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--primary)" /> Templates
              </h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {formTypes.map((t, i) => (
                <div 
                  key={i} 
                  className="stat-card" 
                  onClick={() => openWizard(t.title)}
                  style={{ padding: '16px', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = t.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: '32px', background: t.bg, color: t.color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {t.icon}
                    </div>
                    <h4 className="text-bold" style={{ fontSize: '13px' }}>{t.title}</h4>
                  </div>
                  <p className="text-secondary" style={{ fontSize: '11px', lineHeight: '1.4' }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="stat-card" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
            <h4 className="text-bold" style={{ fontSize: '14px', marginBottom: '8px' }}>Need custom logic?</h4>
            <p style={{ fontSize: '11px', opacity: 0.9, marginBottom: '16px' }}>Use the Flow Builder to create complex conditional forms and branching logic.</p>
            <button className="btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', width: '100%', fontSize: '12px' }}>
              Open Flow Builder
            </button>
          </div>
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '32px 32px 10px', position: 'relative' }}>
              <button className="btn-icon" style={{ position: 'absolute', top: '20px', right: '20px' }} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '0 32px 32px', overflowY: 'auto', flex: 1 }}>

            {wizardStep === 1 ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--bg-light)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', margin: '0 auto 20px' }}>
                  <Plus size={32} />
                </div>
                <h3 className="title-lg" style={{ marginBottom: '8px' }}>Create New Form</h3>
                <p className="text-secondary" style={{ marginBottom: '32px' }}>Give your form a name and choose a starting type.</p>
                
                <div style={{ textAlign: 'left' }}>
                  <FormField 
                    label="Form Name" 
                    placeholder="e.g. Winter Sale Leads"
                    value={newForm.name}
                    onChange={val => setNewForm({...newForm, name: val})}
                  />

                  <div style={{ marginTop: '24px' }}>
                    <label className="form-label">Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {formTypes.map(t => (
                        <div 
                          key={t.title}
                          className={`stat-card ${newForm.type === t.title ? 'active' : ''}`}
                          onClick={() => setNewForm({...newForm, type: t.title})}
                          style={{ padding: '12px', cursor: 'pointer', border: newForm.type === t.title ? '2px solid var(--primary)' : '1px solid var(--border)' }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: '700' }}>{t.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="title-md" style={{ marginBottom: '8px' }}>Configure Fields</h3>
                <p className="text-secondary" style={{ marginBottom: '24px' }}>These fields will be collected sequentially in the DM.</p>

                <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                  {newForm.steps[0].fields.map((field, idx) => (
                    <div key={idx} className="stat-card" style={{ padding: '16px', marginBottom: '12px', background: 'var(--bg-light)', border: 'none', position: 'relative' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <FormField 
                            label={`Field ${idx + 1} Label`}
                            value={field.label}
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
                        <div style={{ width: '100px' }}>
                          <label className="form-label">Type</label>
                          <div className="badge badge-draft" style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                            {field.type}
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const updatedFields = newForm.steps[0].fields.filter((_, i) => i !== idx);
                            setNewForm({
                              ...newForm,
                              steps: [{ ...newForm.steps[0], fields: updatedFields }]
                            });
                          }}
                          className="btn-icon" 
                          style={{ color: '#ef4444', marginBottom: '8px' }}
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    className="btn-secondary" 
                    style={{ width: '100%', borderStyle: 'dashed', fontSize: '13px', padding: '12px' }}
                    onClick={() => {
                      const updatedFields = [...newForm.steps[0].fields, { label: 'New Field', type: 'text', placeholder: '', required: true }];
                      setNewForm({
                        ...newForm,
                        steps: [{ ...newForm.steps[0], fields: updatedFields }]
                      });
                    }}
                  >
                    <Plus size={16} /> Add Another Field
                  </button>
                </div>

                <div style={{ marginTop: '32px' }}>
                  <FormField 
                    label="Success Message" 
                    type="textarea"
                    value={newForm.settings.successMessage}
                    onChange={val => setNewForm({...newForm, settings: {...newForm.settings, successMessage: val}})}
                  />
                </div>
              </div>
            )}
            </div>

            {/* Sticky Footer */}
            <div style={{ padding: '20px 32px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg-white)', display: 'flex', gap: '12px' }}>
              {wizardStep === 1 ? (
                <>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => setWizardStep(2)}>
                    Next Step <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setWizardStep(1)}>Back</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={handleCreateForm}>
                    <Save size={18} /> Finish & Create
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
