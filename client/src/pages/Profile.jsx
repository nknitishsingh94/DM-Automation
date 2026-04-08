import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Info, Save, User as UserIcon } from 'lucide-react';

export default function Profile() {
  const { user, login } = useAuth();
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    profilePhoto: user?.profilePhoto || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id, ...profileData })
      });
      const data = await res.json();
      if (res.ok) {
        // Update both local storage and context
        login(data, localStorage.getItem('insta_agent_token'));
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Update failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="table-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', 
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            border: '4px solid var(--border-subtle)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {profileData.profilePhoto ? (
              <img src={profileData.profilePhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              profileData.username.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '700' }}>Your Profile</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage your account identity and avatar.</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Display Name</label>
              <input 
                type="text"
                value={profileData.username}
                onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                style={{ width: '100%', background: 'white', border: '1px solid var(--border-subtle)', padding: '14px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none' }}
              />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Profile Photo URL</label>
              <input 
                type="text"
                placeholder="https://example.com/avatar.gif"
                value={profileData.profilePhoto}
                onChange={(e) => setProfileData({...profileData, profilePhoto: e.target.value})}
                style={{ width: '100%', background: 'white', border: '1px solid var(--border-subtle)', padding: '14px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none' }}
              />
            </div>
          </div>

          {message.text && (
            <div style={{ 
              padding: '12px 16px', 
              borderRadius: '8px', 
              background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: message.type === 'success' ? '#34d399' : '#f87171',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <Info size={18} /> {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={savingProfile} 
            className="send-btn" 
            style={{ 
              borderRadius: '10px', 
              width: 'fit-content', 
              padding: '12px 32px', 
              alignSelf: 'flex-start',
              background: 'var(--accent-color)',
              color: 'white',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}>
            <Save size={18} /> {savingProfile ? 'Updating...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      <div className="table-card" style={{ padding: '32px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '12px' }}>
          <ShieldCheck size={20} /> Identity Verified
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Your account is currently linked to your unique workspace. All messages and campaigns are isolated to this identity.</p>
      </div>
    </div>
  );
}

function ShieldCheck({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="m9 12 2 2 4-4"></path></svg>
  );
}
