import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Download, Search, 
  Filter, Calendar, User, Mail, 
  Phone, Trash2, Loader2, Sparkles, Users 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import '../styles/theme.css';

export default function FormDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [formRes, subRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/forms/${id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('insta_agent_token')}` } }),
        fetch(`${API_BASE_URL}/api/forms/${id}/submissions`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('insta_agent_token')}` } })
      ]);
      
      const formData = await formRes.json();
      const subData = await subRes.json();
      
      setForm(formData);
      setSubmissions(subData);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => 
    Object.values(sub.responses || {}).some(val => 
      val.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const exportCSV = () => {
    if (submissions.length === 0) return;
    const headers = Object.keys(submissions[0].responses).join(',');
    const rows = submissions.map(sub => Object.values(sub.responses).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions_${form.name}.csv`;
    a.click();
  };

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <button onClick={() => navigate('/forms')} className="btn-secondary" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
        <ChevronLeft size={16} /> Back to Forms
      </button>

      <div className="header-section">
        <div>
          <h2 className="title-lg">{form?.name}</h2>
          <p className="text-secondary">{form?.type} • {submissions.length} leads collected</p>
        </div>
        <button className="btn-secondary" onClick={exportCSV} disabled={submissions.length === 0}>
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-box" style={{ width: '300px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="input" 
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-icon"><Filter size={18} /></button>
            <button className="btn-icon"><Calendar size={18} /></button>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {filteredSubmissions.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
              <Users size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
              <p>No submissions found matching your search.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-light)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-secondary" style={{ padding: '16px 24px', fontSize: '12px' }}>CONTACT</th>
                    {Object.keys(submissions[0].responses || {}).map(key => (
                      <th key={key} className="text-secondary" style={{ padding: '16px 24px', fontSize: '12px' }}>{key.toUpperCase()}</th>
                    ))}
                    <th className="text-secondary" style={{ padding: '16px 24px', fontSize: '12px' }}>SUBMITTED</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((sub, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                            {sub.contactId?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="text-bold" style={{ fontSize: '13px' }}>{sub.contactId?.name || 'Anonymous User'}</div>
                            <div className="text-secondary" style={{ fontSize: '11px' }}>ID: {sub.contactId?.chatId?.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      {Object.values(sub.responses || {}).map((val, j) => (
                        <td key={j} style={{ padding: '16px 24px', fontSize: '13px' }}>{val}</td>
                      ))}
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: '#94a3b8' }}>
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <button className="btn-icon" style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
