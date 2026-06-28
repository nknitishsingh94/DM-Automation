import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import Subscription from './Subscription';
import Profile from './Profile';
import { useNotification } from '../App';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notify } = useNotification();
  
  const [activeTab, setActiveTab] = useState('billing'); // 'billing', 'profile', 'danger'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      setDeleting(true);
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/auth/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      if (!res.ok) throw new Error('Failed to delete account');
      notify('Account deleted permanently.', 'success');
      logout();
      navigate('/');
    } catch (error) {
      console.error(error);
      notify('Error deleting account.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', padding: '0 16px 100px 16px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Settings Header */}
      <div className="settings-header" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px', 
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        paddingTop: '16px',
        paddingBottom: '16px',
        margin: '0 -16px',
        paddingLeft: '16px',
        paddingRight: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>Settings</h2>
        
        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '32px', 
          paddingBottom: '0px'
        }}>
          {[
            { id: 'billing', label: 'Billing' },
            { id: 'profile', label: 'Profile' },
            { id: 'danger', label: 'Danger Zone', color: '#ef4444' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${tab.color || '#10b981'}` : '2px solid transparent',
                color: activeTab === tab.id ? (tab.color || '#111827') : '#6b7280',
                padding: '10px 4px',
                fontSize: '0.95rem',
                fontWeight: activeTab === tab.id ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'billing' && (
        <div style={{ marginTop: '20px' }}>
          <Subscription hideSidebar={true} />
        </div>
      )}

      {activeTab === 'profile' && (
        <div style={{ marginTop: '20px' }}>
          <Profile hideSidebar={true} />
        </div>
      )}

      {activeTab === 'danger' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', overflow: 'hidden' }}>
            <div style={{ padding: '24px', background: '#fff1f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#be123c', marginBottom: '12px' }}>
                <AlertTriangle size={24} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Permanently Delete Account</h3>
              </div>
              
              <p style={{ color: '#9f1239', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '20px', fontWeight: '500' }}>
                Deleting your account is permanent. All your automated DM configurations, rules, active message counters, and connected platform credentials will be wiped from our database forever.
              </p>

              {!showDeleteConfirm ? (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{ 
                    padding: '10px 20px', background: '#e11d48', color: 'white', border: 'none', 
                    borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' 
                  }}
                >
                  Delete my account
                </button>
              ) : (
                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
                    Are you absolutely sure? Type 'DELETE' to confirm.
                  </p>
                  <input
                    type="text"
                    placeholder="DELETE"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '16px',
                      border: '1px solid #fecdd3',
                      borderRadius: '8px',
                      outline: 'none',
                      fontSize: '0.9rem'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={handleDeleteAccount} 
                      disabled={deleting || deleteConfirmationText !== 'DELETE'}
                      style={{ flex: 1, background: '#e11d48', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: (deleting || deleteConfirmationText !== 'DELETE') ? 'not-allowed' : 'pointer', fontSize: '0.82rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: (deleting || deleteConfirmationText !== 'DELETE') ? 0.5 : 1 }}
                    >
                      {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
                    </button>
                    <button 
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmationText('');
                      }} 
                      style={{ flex: 1, background: '#f1f5f9', color: '#475569', padding: '10px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global CSS Style Rules */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
