import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../App';
import { API_BASE_URL } from '../config';
import { ArrowLeft, CheckCircle, Video, Link as LinkIcon, Zap, ChevronLeft, MoreHorizontal, Info } from 'lucide-react';

export default function CampaignBuilder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();
  
  const [formStep, setFormStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [mediaMode, setMediaMode] = useState('link');
  const [uploading, setUploading] = useState(false);
  
  const [newCamp, setNewCamp] = useState({ 
    name: '', 
    trigger: '', 
    triggerSource: 'dm',
    response: '', 
    platform: 'all', 
    videoUrl: '', 
    linkUrl: '',
    requireFollow: false,
    unfollowedResponse: 'Hi! Please follow our page first to unlock this content! 🙏'
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      notify('❌ File is too large (max 50 MB)', 'error');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('media', file);

    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setNewCamp({ ...newCamp, videoUrl: data.url });
        notify('✅ File uploaded successfully!', 'success');
      } else {
        notify(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      notify('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (formStep < 3) return; // safeguard
    setSubmitting(true);
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCamp)
      });
      const data = await res.json();
      if (res.ok) {
        notify('Campaign deployed successfully! ⚡', 'success');
        navigate('/campaigns');
      } else {
        notify(data.error || 'Failed to create campaign', 'error');
      }
    } catch (err) {
      notify('Connection error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate('/campaigns')}
          style={{ background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} color="var(--text-main)" />
        </button>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Create New Campaign</h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.95rem' }}>Configure rules and preview your bot's behavior in real-time.</p>
        </div>
      </div>

      {/* Main Split Layout */}
      <div style={{ display: 'flex', gap: '32px', flex: 1, flexDirection: window.innerWidth < 1000 ? 'column' : 'row' }}>
        
        {/* LEFT PANE: Form Wizard */}
        <div className="table-card" style={{ flex: '1', padding: '32px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
          
          {/* Step Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: formStep >= 1 ? 'var(--accent-main)' : '#e2e8f0', color: formStep >= 1 ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.3s' }}>1</div>
              <span style={{ fontSize: '0.85rem', fontWeight: formStep >= 1 ? '700' : '600', color: formStep >= 1 ? 'var(--text-main)' : '#64748b' }}>Basics</span>
            </div>
            <div style={{ height: '2px', flex: 0.5, background: formStep >= 2 ? 'var(--accent-main)' : '#e2e8f0', transition: 'all 0.3s' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: formStep >= 2 ? 'var(--accent-main)' : '#e2e8f0', color: formStep >= 2 ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.3s' }}>2</div>
              <span style={{ fontSize: '0.85rem', fontWeight: formStep >= 2 ? '700' : '600', color: formStep >= 2 ? 'var(--text-main)' : '#64748b' }}>Rules</span>
            </div>
            <div style={{ height: '2px', flex: 0.5, background: formStep >= 3 ? 'var(--accent-main)' : '#e2e8f0', transition: 'all 0.3s' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: formStep >= 3 ? 'var(--accent-main)' : '#e2e8f0', color: formStep >= 3 ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.3s' }}>3</div>
              <span style={{ fontSize: '0.85rem', fontWeight: formStep >= 3 ? '700' : '600', color: formStep >= 3 ? 'var(--text-main)' : '#64748b' }}>Action</span>
            </div>
          </div>

          <form onSubmit={handleAddSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
              {/* STEP 1: BASICS */}
              {formStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s' }}>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '700' }}>Campaign Name</label>
                    <input 
                      type="text" 
                      required
                      value={newCamp.name}
                      onChange={(e) => setNewCamp({...newCamp, name: e.target.value})}
                      placeholder="e.g. Real Estate Lead Lead Magnet"
                      style={{ width: '100%', padding: '14px', background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '10px', outline: 'none', transition: 'border 0.2s', fontSize: '1rem' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="input-group">
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '700' }}>Platform</label>
                      <select 
                        required
                        value={newCamp.platform}
                        onChange={(e) => setNewCamp({...newCamp, platform: e.target.value})}
                        style={{ width: '100%', padding: '14px', background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '10px', outline: 'none', fontSize: '1rem' }}
                      >
                        <option value="all">All Platforms</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook Messenger</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '700' }}>Trigger Source</label>
                      <select 
                        required
                        value={newCamp.triggerSource}
                        onChange={(e) => setNewCamp({...newCamp, triggerSource: e.target.value})}
                        style={{ width: '100%', padding: '14px', background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '10px', outline: 'none', fontSize: '1rem' }}
                      >
                        <option value="dm">Direct Chat (DM)</option>
                        <option value="comment">Post Comment</option>
                        <option value="story_mention">Story Mention</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: TRIGGER RULES */}
              {formStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s' }}>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '700' }}>Trigger Keyword <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '0.8rem' }}>(What should they send?)</span></label>
                    <input 
                      type="text" 
                      required
                      value={newCamp.trigger}
                      onChange={(e) => setNewCamp({...newCamp, trigger: e.target.value})}
                      placeholder="e.g. SEND LINK"
                      style={{ width: '100%', padding: '14px', background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '10px', outline: 'none', fontSize: '1rem', textTransform: 'uppercase' }}
                    />
                  </div>

                  <div className="input-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', background: newCamp.requireFollow ? 'rgba(139, 92, 246, 0.05)' : '#f8fafc', borderRadius: '10px', border: newCamp.requireFollow ? '1px solid var(--accent-main)' : '1px solid var(--border-subtle)', transition: 'all 0.3s' }}>
                    <input 
                      type="checkbox" 
                      id="requireFollow"
                      checked={newCamp.requireFollow}
                      onChange={(e) => setNewCamp({...newCamp, requireFollow: e.target.checked})}
                      style={{ width: '22px', height: '22px', accentColor: 'var(--accent-color)', cursor: 'pointer', marginTop: '2px' }}
                    />
                    <div>
                      <label htmlFor="requireFollow" style={{ fontSize: '1.05rem', fontWeight: '800', cursor: 'pointer', display: 'block', color: newCamp.requireFollow ? 'var(--accent-main)' : 'var(--text-main)', marginBottom: '4px' }}>Follower Gate (Lock Content)</label>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', display: 'block' }}>If toggled, the bot will verify if the user is following your page. If they are not, it sends the gating message instead of the real content.</span>
                    </div>
                  </div>

                  {newCamp.requireFollow && (
                    <div className="input-group" style={{ animation: 'fadeIn 0.3s ease-in' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--accent-color)', fontWeight: '700' }}>Message if they aren't following</label>
                      <textarea 
                        required
                        value={newCamp.unfollowedResponse}
                        onChange={(e) => setNewCamp({...newCamp, unfollowedResponse: e.target.value})}
                        placeholder="Hi! Please follow our page first..."
                        style={{ width: '100%', padding: '14px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--accent-light)', borderRadius: '10px', height: '110px', outline: 'none', resize: 'vertical', fontSize: '0.95rem', lineHeight: '1.5' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: ACTION / RESPONSE */}
              {formStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s' }}>
                  <div className="input-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '700' }}>
                      Bot Reply <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '0.8rem' }}>(What arrives after they send the keyword?)</span>
                    </label>
                    <textarea 
                      required
                      value={newCamp.response}
                      onChange={(e) => setNewCamp({...newCamp, response: e.target.value})}
                      placeholder="Here is the information you requested!"
                      style={{ width: '100%', padding: '14px', background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '10px', height: '140px', outline: 'none', resize: 'vertical', fontSize: '0.95rem', lineHeight: '1.5' }}
                    />
                  </div>

                  <div className="input-group" style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}><Video size={16} color="var(--accent-color)"/> Bonus Attachment (Optional)</label>
                      <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
                        <button 
                          type="button" 
                          onClick={() => setMediaMode('link')}
                          style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', background: mediaMode === 'link' ? 'white' : 'transparent', color: mediaMode === 'link' ? 'var(--accent-color)' : '#475569', fontWeight: '700', cursor: 'pointer', boxShadow: mediaMode === 'link' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                        >
                          Link
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setMediaMode('upload')}
                          style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px', border: 'none', background: mediaMode === 'upload' ? 'white' : 'transparent', color: mediaMode === 'upload' ? 'var(--accent-color)' : '#475569', fontWeight: '700', cursor: 'pointer', boxShadow: mediaMode === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
                        >
                          Upload
                        </button>
                      </div>
                    </div>
                    
                    {mediaMode === 'link' ? (
                      <div style={{ position: 'relative' }}>
                        <LinkIcon size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          value={newCamp.videoUrl}
                          onChange={(e) => setNewCamp({...newCamp, videoUrl: e.target.value})}
                          placeholder="Paste direct URL (https://...jpg)"
                          style={{ width: '100%', padding: '14px 14px 14px 44px', background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '10px', outline: 'none', fontSize: '0.95rem' }}
                        />
                      </div>
                    ) : (
                      <div style={{ border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '30px 20px', textAlign: 'center', position: 'relative', background: '#f8fafc', cursor: 'pointer', transition: 'border 0.2s' }}>
                        {uploading ? (
                          <div style={{ color: 'var(--accent-color)', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <div className="loader" style={{ width: '20px', height: '20px', border: '3px solid #e2e8f0', borderTopColor: 'var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            Uploading Media...
                          </div>
                        ) : (
                          <>
                            <input 
                              type="file" 
                              onChange={handleFileUpload}
                              style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 5 }}
                            />
                            <div style={{ color: '#475569', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                              {newCamp.videoUrl ? (
                                <>
                                  <CheckCircle size={32} color="#10b981" />
                                  <span style={{ color: '#10b981', fontWeight: '600' }}>{newCamp.videoUrl.split('/').pop().substring(0, 25)}</span>
                                </>
                              ) : (
                                <>
                                  <Video size={32} color="#94a3b8" />
                                  <span>Drag to upload (Max 50MB)</span>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* NAVIGATION BUTTONS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
              <button 
                type="button" 
                onClick={() => setFormStep(prev => Math.max(1, prev - 1))}
                style={{ 
                  background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', 
                  padding: '12px 28px', borderRadius: '8px', fontWeight: '700', cursor: formStep === 1 ? 'not-allowed' : 'pointer',
                  opacity: formStep === 1 ? 0 : 1, transition: 'all 0.2s', visibility: formStep === 1 ? 'hidden' : 'visible'
                }}>
                Back
              </button>
              
              {formStep < 3 ? (
                <button 
                  type="button" 
                  onClick={() => {
                    if (formStep === 1 && (!newCamp.name || !newCamp.platform)) return notify("Please fill all details", "error");
                    if (formStep === 2 && !newCamp.trigger) return notify("Please define what starts your automation (Trigger)", "error");
                    setFormStep(prev => Math.min(3, prev + 1));
                  }}
                  style={{ 
                    background: 'var(--text-main)', color: 'white', border: 'none',
                    padding: '12px 36px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                  Continue Next
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={submitting || !newCamp.response}
                  style={{ 
                    background: submitting ? 'var(--text-muted)' : 'var(--accent-color)', color: 'white', border: 'none',
                    padding: '12px 36px', borderRadius: '8px', fontWeight: '800', cursor: submitting || !newCamp.response ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 16px rgba(139, 92, 246, 0.4)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                  {submitting ? 'Deploying...' : <><Zap size={18} /> Launch Campaign</>}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT PANE: Live Mobile Preview */}
        <div style={{ flex: '1', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', position: 'sticky', top: '20px' }}>
          
          <div style={{ 
            width: '360px', height: '700px', 
            background: 'white', 
            borderRadius: '45px', 
            border: '8px solid #0f172a',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* dynamic bezel notch */}
            <div style={{ width: '120px', height: '24px', background: '#0f172a', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', zIndex: 10 }}></div>

            {/* Platform Mock Header */}
            <div style={{ padding: '40px 16px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <ChevronLeft size={24} color="#0f172a" />
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'white', border: '1px solid white', display: 'flex', overflow: 'hidden' }}>
                        {user?.profilePhoto ? <img src={user.profilePhoto} alt="dp" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', background:'#8b5cf6', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'800' }}>{user?.username.charAt(0).toUpperCase()}</div>}
                     </div>
                   </div>
                   <div>
                     <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>{user?.businessName || user?.username}</h4>
                     <span style={{ fontSize: '0.7rem', color: '#64748b' }}>ZenXchat AI Agent</span>
                   </div>
                 </div>
               </div>
               <div style={{ display: 'flex', gap: '16px', color: '#0f172a' }}>
                 <Info size={22} />
               </div>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, background: '#fafafa', padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', margin: '8px 0' }}>Today 10:41 AM</div>
                
                {/* User Trigger Message (Right aligned like Instagram sent msg) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'slideInRight 0.3s' }}>
                  <div style={{ background: '#e2e8f0', color: '#0f172a', padding: '10px 14px', borderRadius: '18px 18px 4px 18px', maxWidth: '80%', fontSize: '0.9rem', fontWeight: '500' }}>
                    {newCamp.trigger || 'Type your trigger keyword...'}
                  </div>
                </div>

                {/* Bot Response Message (Left aligned) */}
                {formStep >= 1 && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', animation: 'slideInLeft 0.5s' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#8b5cf6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: '800' }}>
                      AI
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '75%' }}>
                      
                      {/* Media Rendering */}
                      {newCamp.videoUrl && (
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '4px', overflow: 'hidden' }}>
                          <div style={{ width: '100%', height: '120px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                             <ImageIcon size={24} /> <span style={{ fontSize: '0.75rem', marginLeft: '6px' }}>Media Attached</span>
                          </div>
                        </div>
                      )}

                      {/* Text Response Rendering (Depending on follow gating) */}
                      {newCamp.requireFollow && formStep === 2 ? (
                        <>
                          {/* Showing Gated Preview for visual confirmation */}
                          <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '700', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}><Zap size={10}/> IF NOT FOLLOWING:</div>
                          <div style={{ background: 'white', border: '1px solid #e2e8f0', color: '#0f172a', padding: '10px 14px', borderRadius: '18px 18px 18px 4px', fontSize: '0.9rem', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                             {newCamp.unfollowedResponse || 'Please follow us first...'}
                          </div>
                        </>
                      ) : (
                        <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', padding: '10px 14px', borderRadius: '18px 18px 18px 4px', fontSize: '0.9rem', fontWeight: '500', whiteSpace: 'pre-wrap', boxShadow: '0 4px 6px rgba(139, 92, 246, 0.2)' }}>
                          {newCamp.response || 'Your automated response will appear here when the keyword is triggered. Configure this in Step 3! ✨'}
                        </div>
                      )}

                    </div>
                  </div>
                )}
            </div>

            {/* Footer Input Area */}
            <div style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Video size={16} color="white" />
              </div>
              <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '20px', padding: '8px 16px', fontSize: '0.85rem', color: '#94a3b8', background: '#f8fafc' }}>
                 Message...
              </div>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
