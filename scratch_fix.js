const fs = require('fs');
let file = fs.readFileSync('client/src/pages/Connections.jsx', 'utf8');

const target1 = `<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/profile'); }}
                  style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', color: '#475569', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background='#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background='#f1f5f9'}
                >
                  Profile
                </button>
              </div>`;

const rep1 = `<div style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/profile'); }}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background='#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background='#f1f5f9'}
                >
                  Profile
                </button>`;

const target2 = `                </button>
              </div>
              
              <button`;

const rep2 = `                </button>
              <button`;

const target3 = `style={{ marginTop: 'auto', width: '100%', padding: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}`;

const rep3 = `style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}`;

const target4 = `>Disconnect</button>
            </div>`;

const rep4 = `>Disconnect</button>
              </div>
            </div>`;

file = file.split(target1).join(rep1);
file = file.split(target2).join(rep2);
file = file.split(target3).join(rep3);
file = file.split(target4).join(rep4);

fs.writeFileSync('client/src/pages/Connections.jsx', file);
console.log('Replaced successfully');
