const fs = require('fs');
let code = fs.readFileSync('client/src/pages/Scheduling.jsx', 'utf8');

// 1. Add isPostNow
code = code.replace(
  'const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);',
  'const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);\n  const [isPostNow, setIsPostNow] = useState(true);'
);

// 2. Add validation logic
code = code.replace(
  'if (!newPost.scheduledFor) {\n      notify("Please select a date and time", "error");\n      return;\n    }',
  'if (!isPostNow && !newPost.scheduledFor) {\n      notify("Please select a date and time", "error");\n      return;\n    }'
);

// 3. Update the scheduledFor setting (first instance)
code = code.replace(
  'scheduledFor: convertLocalToUTC(payloadBase.scheduledFor, selectedTimezone),',
  'scheduledFor: isPostNow ? \'\' : convertLocalToUTC(payloadBase.scheduledFor, selectedTimezone),'
);

// 4. Update the scheduledFor setting (second instance for form data)
code = code.replace(
  'postData.append(\'scheduledFor\', convertLocalToUTC(payloadBase.scheduledFor, selectedTimezone));',
  'postData.append(\'scheduledFor\', isPostNow ? \'\' : convertLocalToUTC(payloadBase.scheduledFor, selectedTimezone));'
);

// 5. Update UI
const uiFind = `                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Schedule For</label>`;
const uiReplace = `<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', margin: 0 }}>Schedule For</label>
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

// 6. Hide the datetime picker if isPostNow is true
const dateFind = `                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Calendar size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="datetime-local"
                      value={newPost.scheduledFor || ''}`;
const dateReplace = `                {!isPostNow && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Calendar size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="datetime-local"
                        value={newPost.scheduledFor || ''}`;
code = code.replace(dateFind, dateReplace);

// 7. Change button text
const buttonFind = `                  <span style={{ fontSize: '0.95rem' }}>{submitting ? 'Scheduling...' : 'Schedule Post'}</span>`;
const buttonReplace = `                  <span style={{ fontSize: '0.95rem' }}>{submitting ? (isPostNow ? 'Posting...' : 'Scheduling...') : (isPostNow ? 'Post Now' : 'Schedule Post')}</span>`;
code = code.replace(buttonFind, buttonReplace);

// Now close the isPostNow wrapper
code = code.replace(
  `                  </div>\n                </div>\n              </div>\n\n              {/* Right Column - Preview */}`,
  `                  </div>\n                </div>\n                )}\n              </div>\n\n              {/* Right Column - Preview */}`
);

fs.writeFileSync('client/src/pages/Scheduling.jsx', code);
console.log('Update complete');
