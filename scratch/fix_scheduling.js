const fs = require('fs');
const filePath = 'client/src/pages/Scheduling.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const targetSnippet = "description: newPost.youtubeTags ? `${payloadBase.caption}\\\r\nconst getSafeImageUrl = (url) => {\r\n  if (!url || typeof url !== 'string') return url;\r\n  if (url.includes('cdninstagram.com') || url.includes('scontent-') || url.includes('fbcdn.net')) {\r\n    const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')\r\n      ? 'https://dm-automation-w9a4.vercel.app' \r\n      : 'https://dm-automation-w9a4.vercel.app';\r\n    return API_BASE_URL + '/api/storage/proxy-external?url=' + encodeURIComponent(url);\r\n  }\r\n  return url;\r\n};\r\nn\\n${newPost.youtubeTags}` : payloadBase.caption";

const replacementSnippet = "description: newPost.youtubeTags ? `${payloadBase.caption}\\n\\n${newPost.youtubeTags}` : payloadBase.caption";

let changed = false;

if (code.includes(targetSnippet)) {
  code = code.replace(targetSnippet, replacementSnippet);
  console.log('✅ Fixed broken string literal (CRLF)');
  changed = true;
} else {
  const lfSnippet = targetSnippet.replace(/\r\n/g, '\n');
  if (code.includes(lfSnippet)) {
    const lfReplacement = replacementSnippet.replace(/\r\n/g, '\n');
    code = code.replace(lfSnippet, lfReplacement);
    console.log('✅ Fixed broken string literal (LF)');
    changed = true;
  } else {
    console.log('❌ Could not find the broken string literal target');
  }
}

const addGetSafeImageUrl = `  const [pinterestBoards, setPinterestBoards] = useState([]);

  const getSafeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('cdninstagram.com') || url.includes('scontent-') || url.includes('fbcdn.net')) {
      const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'https://dm-automation-w9a4.vercel.app' 
        : 'https://dm-automation-w9a4.vercel.app';
      return API_BASE_URL + '/api/storage/proxy-external?url=' + encodeURIComponent(url);
    }
    return url;
  };`;

const stateTarget = `  const [pinterestBoards, setPinterestBoards] = useState([]);`;

if (code.includes(stateTarget) && !code.includes('const getSafeImageUrl = (url) => {')) {
  code = code.replace(stateTarget, addGetSafeImageUrl);
  console.log('✅ Added getSafeImageUrl to top level');
  changed = true;
} else {
  console.log('⚠️ Could not add getSafeImageUrl (either target not found or already exists)');
}

if (changed) {
  fs.writeFileSync(filePath, code);
  console.log('File saved.');
}
