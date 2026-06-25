const fs = require('fs');
let code = fs.readFileSync('client/src/pages/Scheduling.jsx', 'utf8');

// 1. Change default to false so regular scheduling works
code = code.replace(
  'const [isPostNow, setIsPostNow] = useState(true);',
  'const [isPostNow, setIsPostNow] = useState(false);'
);

// 2. Inject the checkbox into the UI
const uiFind = `<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>date & time</label>`;
const uiReplace = `<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', margin: 0 }}>date & time</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#475569' }}>
                        <input 
                          type="checkbox" 
                          checked={isPostNow} 
                          onChange={(e) => setIsPostNow(e.target.checked)} 
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#4f46e5' }}
                        />
                        Post Immediately
                      </label>
                    </div>`;
code = code.replace(uiFind, uiReplace);

// 3. Update the datetime input to be hidden when isPostNow is true
const dateInputFind = `<div style={{ position: 'relative' }}>
                      <input
                        type="datetime-local"`;
const dateInputReplace = `{!isPostNow && (
                    <div style={{ position: 'relative' }}>
                      <input
                        type="datetime-local"`;
code = code.replace(dateInputFind, dateInputReplace);

const dateInputCloseFind = `color: '#334155', background: 'white'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>timezone</label>`;
const dateInputCloseReplace = `color: '#334155', background: 'white'
                        }}
                      />
                    </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>timezone</label>`;
code = code.replace(dateInputCloseFind, dateInputCloseReplace);

// 4. Update the submit button text
const buttonFind = `<span style={{ fontSize: '0.95rem' }}>{submitting ? 'Scheduling...' : 'Schedule Post'}</span>`;
const buttonReplace = `<span style={{ fontSize: '0.95rem' }}>{submitting ? (isPostNow ? 'Posting...' : 'Scheduling...') : (isPostNow ? 'Post Now' : 'Schedule Post')}</span>`;
code = code.replace(buttonFind, buttonReplace);

fs.writeFileSync('client/src/pages/Scheduling.jsx', code);
console.log('UI injected successfully.');
