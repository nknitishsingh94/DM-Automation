import sys

file_path = r'c:\Users\Lenovo\OneDrive\Desktop\Insta AI Agent\client\src\pages\Scheduling.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Restore size
old_container = """                <div style={{
                  width: '380px', height: '800px', background: '#000', borderRadius: '60px', border: '16px solid #1e1b4b',
                  position: 'relative', overflow: 'hidden', boxShadow: '0 60px 150px -40px rgba(0,0,0,0.5)',
                  display: 'flex', flexDirection: 'column',
                  transform: window.innerHeight < 900 ? `scale(${window.innerHeight / 1000})` : 'scale(1)',
                  transformOrigin: 'top center',
                  marginTop: window.innerHeight < 900 ? '20px' : '0'
                }}>"""

new_container = """                <div style={{
                  width: '380px', height: '800px', background: '#000', borderRadius: '60px', border: '16px solid #1e1b4b',
                  position: 'relative', overflow: 'hidden', boxShadow: '0 60px 150px -40px rgba(0,0,0,0.5)',
                  display: 'flex', flexDirection: 'column'
                }}>"""

# Find the scroller and add ref
old_scroller = 'className="custom-ig-scroller"'
new_scroller = 'ref={chatRef} className="custom-ig-scroller"'

if old_container in content:
    content = content.replace(old_container, new_container)
    print("RESTORED container size")
else:
    print("COULD NOT find container")

if old_scroller in content:
    # We want to replace all occurrences because they all need refs if they exist
    # But only if chatRef is defined in that scope.
    # In Scheduling.jsx, the one inside the mockup is what we need.
    content = content.replace(old_scroller, new_scroller)
    print("ADDED chatRef to scroller")
else:
    print("COULD NOT find scroller")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
