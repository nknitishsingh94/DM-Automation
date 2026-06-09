const fs = require('fs');

let content = fs.readFileSync('client/src/pages/Connections.jsx', 'utf8');

// 1. Add state variable
content = content.replace(
  'const [showDangerZone, setShowDangerZone] = useState(false);',
  'const [showDangerZone, setShowDangerZone] = useState(false);\n  const [selectedSettingsPlatform, setSelectedSettingsPlatform] = useState(null);'
);

// 2. Add handleRemoveAccount function right before triggerConnect
const removeFunc = `
  const handleRemoveAccount = (platformId) => {
    if (!window.confirm(\`Are you sure you want to remove \${platformId}?\`)) return;
    
    let cleared = { ...settings };
    let pageData = {};
    try { pageData = JSON.parse(settings.connectedPageName || '{}'); } catch(e){}

    if (platformId === 'instagram') {
      cleared = { ...cleared, instagramAccessToken: null, instagramPageId: null, businessAccountId: null, connectedInstagramName: null, isAccountConnected: false };
    } else if (platformId === 'facebook') {
      cleared = { ...cleared, facebookAccessToken: null, facebookPageId: null, connectedFacebookName: null, isFacebookConnected: false };
    } else if (platformId === 'youtube') {
      delete pageData.isYouTubeConnected; delete pageData.isYoutubeConnected; delete pageData.connectedYouTubeName; delete pageData.youtubeChannelName; delete pageData.youtubeAccessToken; delete pageData.youtubeRefreshToken; delete pageData.youtubeChannelId;
      cleared = { ...cleared, youtubeAccessToken: null, youtubeRefreshToken: null, connectedYouTubeName: null, isYouTubeConnected: false, youtubeChannelId: null, isYoutubeConnected: false, youtubeChannelName: null };
    } else if (platformId === 'linkedin') {
      delete pageData.isLinkedInConnected; delete pageData.connectedLinkedInName; delete pageData.linkedinAccessToken;
      cleared = { ...cleared, linkedinAccessToken: null, connectedLinkedInName: null, isLinkedInConnected: false };
    } else if (platformId === 'twitter') {
      delete pageData.isTwitterConnected; delete pageData.connectedTwitterName; delete pageData.twitterAccessToken; delete pageData.twitterRefreshToken; delete pageData.connectedTwitterId;
      cleared = { ...cleared, twitterAccessToken: null, connectedTwitterName: null, isTwitterConnected: false, twitterRefreshToken: null, connectedTwitterId: null };
    } else if (platformId === 'google-business') {
      delete pageData.isGoogleBusinessConnected; delete pageData.connectedGoogleBusinessName; delete pageData.googleBusinessAccessToken; delete pageData.googleBusinessRefreshToken;
      cleared = { ...cleared, googleBusinessAccessToken: null, googleBusinessRefreshToken: null, connectedGoogleBusinessName: null, isGoogleBusinessConnected: false };
    } else if (platformId === 'threads') {
      delete pageData.isThreadsConnected; delete pageData.connectedThreadsName; delete pageData.threadsAccessToken; delete pageData.threadsPageId;
      cleared = { ...cleared, isThreadsConnected: false, threadsAccessToken: null, threadsPageId: null, connectedThreadsName: null };
    } else if (platformId === 'whatsapp') {
      cleared = { ...cleared, whatsappToken: null, whatsappPhoneNumberId: null, whatsappBusinessAccountId: null, isWhatsAppConnected: false };
    }
    
    cleared.connectedPageName = JSON.stringify(pageData);
    setSettings(cleared);
    handleSaveSettings(null, cleared, platformId);
    setSelectedSettingsPlatform(null);
  };
`;
content = content.replace('const triggerConnect =', removeFunc + '\n  const triggerConnect =');


// 3. Replace Disconnect buttons with Manage buttons
const cards = [
  { id: 'instagram', name: 'Instagram', userVar: 'settings.connectedInstagramName', toggleVar: 'settings.instagramAutomationEnabled', color: '#ec4899' },
  { id: 'facebook', name: 'Facebook', userVar: 'settings.connectedFacebookName', toggleVar: 'settings.facebookAutomationEnabled', color: '#1877f2' },
  { id: 'youtube', name: 'YouTube', userVar: 'settings.connectedYouTubeName || settings.youtubeChannelName', toggleVar: 'true', color: '#ff0000' },
  { id: 'linkedin', name: 'LinkedIn', userVar: 'settings.connectedLinkedInName', toggleVar: 'true', color: '#0077b5' },
  { id: 'twitter', name: 'Twitter/X', userVar: 'settings.connectedTwitterName', toggleVar: 'true', color: '#0f1419' },
  { id: 'google-business', name: 'Google Business', userVar: 'settings.connectedGoogleBusinessName', toggleVar: 'true', color: '#3b82f6' },
  { id: 'threads', name: 'Threads', userVar: 'settings.connectedThreadsName', toggleVar: 'true', color: '#000000' },
  { id: 'whatsapp', name: 'WhatsApp', userVar: 'settings.whatsappDisplayName', toggleVar: 'true', color: '#22c55e' }
];

cards.forEach(card => {
  let lines = content.split('\\n');
  for (let i=0; i<lines.length; i++) {
    if (lines[i].includes('>Disconnect</button>')) {
      let j = i;
      let foundCardId = null;
      while(j > i - 30) {
        if (lines[j].includes('Instagram</h4>')) { foundCardId = 'instagram'; break; }
        if (lines[j].includes('Facebook</h4>')) { foundCardId = 'facebook'; break; }
        if (lines[j].includes('YouTube</h4>')) { foundCardId = 'youtube'; break; }
        if (lines[j].includes('LinkedIn</h4>')) { foundCardId = 'linkedin'; break; }
        if (lines[j].includes('Twitter / X</h4>')) { foundCardId = 'twitter'; break; }
        if (lines[j].includes('Google Business</h4>')) { foundCardId = 'google-business'; break; }
        if (lines[j].includes('Threads</h4>')) { foundCardId = 'threads'; break; }
        if (lines[j].includes('WhatsApp</h4>')) { foundCardId = 'whatsapp'; break; }
        j--;
      }
      
      if (foundCardId === card.id) {
        lines[i] = "              <button onClick={() => setSelectedSettingsPlatform({ id: '" + card.id + "', name: '" + card.name + "', username: " + card.userVar + ", isAutomationEnabled: " + card.toggleVar + ", color: '" + card.color + "' })}";
        lines[i+1] = "                style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}";
        lines[i+2] = "                onMouseOver={(e) => { e.currentTarget.style.background='#f9fafb'; }}";
        lines[i+3] = "                onMouseOut={(e) => { e.currentTarget.style.background='#fff'; }}";
        lines[i+4] = "              ><Sliders size={14} /> Settings</button>";
      }
    }
  }
  content = lines.join('\\n');
});

// 4. Add the Modal JSX at the end right before <style>
const modalJSX = \`
      {/* PLATFORM SETTINGS MODAL */}
      {selectedSettingsPlatform && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ 
            background: '#f8fafc', borderRadius: '16px', width: '100%', maxWidth: '580px', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0', position: 'relative', margin: '20px',
            overflow: 'hidden', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '24px', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => setSelectedSettingsPlatform(null)}
                style={{ position: 'absolute', top: '24px', right: '24px', background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#e2e8f0'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = '#f1f5f9'; }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: \`\${selectedSettingsPlatform.color}15\`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={20} color={selectedSettingsPlatform.color} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{selectedSettingsPlatform.name} settings</h2>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, paddingLeft: '52px' }}>Manage your {selectedSettingsPlatform.name} account connection and messaging preferences.</p>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Account Connection Section */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>Account connection</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 20px 0' }}>Your connected {selectedSettingsPlatform.name} account and connection status.</p>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '700' }}>
                      {selectedSettingsPlatform.username ? selectedSettingsPlatform.username.substring(0, 2).toUpperCase() : 'UI'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>Connected account</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                        {selectedSettingsPlatform.username && !selectedSettingsPlatform.username.startsWith('@') ? '@' : ''}{selectedSettingsPlatform.username || 'unknown'}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      triggerConnect(selectedSettingsPlatform.id);
                      setSelectedSettingsPlatform(null);
                    }}
                    style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 16px', color: '#334155', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  >
                    <Activity size={16} /> Refresh permissions
                  </button>
                </div>
              </div>

              {/* Automation Channel Section */}
              {['instagram', 'facebook', 'whatsapp'].includes(selectedSettingsPlatform.id) && (
                <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>{selectedSettingsPlatform.name} channel</h3>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                      {selectedSettingsPlatform.isAutomationEnabled ? 'Channel is active and receiving messages' : 'Channel is currently paused'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      background: selectedSettingsPlatform.isAutomationEnabled ? '#dcfce7' : '#f1f5f9', 
                      color: selectedSettingsPlatform.isAutomationEnabled ? '#166534' : '#64748b', 
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' 
                    }}>
                      {selectedSettingsPlatform.isAutomationEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button 
                      onClick={() => {
                        const newVal = !selectedSettingsPlatform.isAutomationEnabled;
                        setSelectedSettingsPlatform({ ...selectedSettingsPlatform, isAutomationEnabled: newVal });
                        handleSaveSettings(null, { ...settings, [\`\${selectedSettingsPlatform.id}AutomationEnabled\`]: newVal }, selectedSettingsPlatform.id);
                      }}
                      style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 16px', color: '#334155', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                    >
                      <Sliders size={16} /> {selectedSettingsPlatform.isAutomationEnabled ? 'Disable channel' : 'Enable channel'}
                    </button>
                  </div>
                </div>
              )}

              {/* Remove Account Section */}
              <div style={{ background: '#fff1f2', borderRadius: '12px', padding: '20px', border: '1px solid #fecdd3', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ paddingRight: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#9f1239', margin: '0 0 6px 0' }}>Remove {selectedSettingsPlatform.name} account</h3>
                  <p style={{ color: '#be123c', fontSize: '0.85rem', margin: 0, lineHeight: '1.4' }}>
                    This will disconnect your {selectedSettingsPlatform.name} account and remove all associated data. This action cannot be undone.
                  </p>
                </div>
                <button 
                  onClick={() => handleRemoveAccount(selectedSettingsPlatform.id)}
                  style={{ background: 'white', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 16px', color: '#e11d48', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#fecaca'; }}
                >
                  <Trash2 size={16} /> Remove account
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
\`;

content = content.replace('{/* Global CSS Style Rules */}', modalJSX + '\\n      {/* Global CSS Style Rules */}');

fs.writeFileSync('client/src/pages/Connections.jsx', content);
console.log('Successfully updated Connections.jsx');
