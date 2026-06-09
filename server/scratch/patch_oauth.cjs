const fs = require('fs');
let code = fs.readFileSync('server/routes/oauth.js', 'utf8');

// 1. Uncomment userinfo.profile
code = code.replace(
  /\/\/ 'https:\/\/www\.googleapis\.com\/auth\/userinfo\.profile', \/\/ Optional/,
  "'https://www.googleapis.com/auth/userinfo.profile',"
);

// 2. Add fallback to userinfo in callback
const fallbackCode = `
    let businessName = 'Google Business Account';
    try {
      const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: { Authorization: \`Bearer \${tokens.access_token}\` }
      });
      if (userInfoRes.data && userInfoRes.data.name) {
        businessName = userInfoRes.data.name;
      }
    } catch(err) {
      console.warn('Could not fetch Google user info:', err.message);
    }
`;

code = code.replace(
  /let businessName = 'Google Business Account';/,
  fallbackCode
);

fs.writeFileSync('server/routes/oauth.js', code);
console.log('oauth.js patched successfully!');
