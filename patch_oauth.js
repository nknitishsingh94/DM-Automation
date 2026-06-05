const fs = require('fs');
let code = fs.readFileSync('server/routes/oauth.js', 'utf8');

// Replace YouTube
code = code.replace(
  /const updateData = \{\s*isYouTubeConnected: true,[\s\S]*?\};/,
  `let pageData = {};
    if (settings && settings.connectedPageName) {
      try { pageData = JSON.parse(settings.connectedPageName); } catch(e){}
    }
    pageData.isYouTubeConnected = true;
    pageData.connectedYouTubeName = channelName;
    pageData.youtubeAccessToken = tokens.access_token;
    pageData.youtubeRefreshToken = tokens.refresh_token || (pageData.youtubeRefreshToken || null);
    
    const updateData = { connectedPageName: JSON.stringify(pageData) };`
);

// Replace LinkedIn
code = code.replace(
  /const updateData = \{\s*isLinkedInConnected: true,[\s\S]*?\};/,
  `const settings = await Settings.findOne(settingsQuery);
    let pageData = {};
    if (settings && settings.connectedPageName) {
      try { pageData = JSON.parse(settings.connectedPageName); } catch(e){}
    }
    pageData.isLinkedInConnected = true;
    pageData.connectedLinkedInName = profileName;
    pageData.linkedinAccessToken = accessToken;
    
    const updateData = { connectedPageName: JSON.stringify(pageData) };`
);

// Replace Google Business
code = code.replace(
  /const updateData = \{\s*isGoogleBusinessConnected: true,[\s\S]*?\};/,
  `let pageData = {};
    if (settings && settings.connectedPageName) {
      try { pageData = JSON.parse(settings.connectedPageName); } catch(e){}
    }
    pageData.isGoogleBusinessConnected = true;
    pageData.connectedGoogleBusinessName = businessName;
    pageData.googleBusinessAccessToken = tokens.access_token;
    pageData.googleBusinessRefreshToken = tokens.refresh_token || (pageData.googleBusinessRefreshToken || null);
    
    const updateData = { connectedPageName: JSON.stringify(pageData) };`
);

// Replace Twitter
code = code.replace(
  /const updateData = \{\s*isTwitterConnected: true,[\s\S]*?\};/,
  `let pageData = {};
      if (settings && settings.connectedPageName) {
        try { pageData = JSON.parse(settings.connectedPageName); } catch(e){}
      }
      pageData.isTwitterConnected = true;
      pageData.connectedTwitterName = profileName;
      pageData.twitterAccessToken = access_token;
      pageData.twitterRefreshToken = refresh_token || (pageData.twitterRefreshToken || null);
      pageData.connectedTwitterId = profileId;
      
      const updateData = { connectedPageName: JSON.stringify(pageData) };`
);

fs.writeFileSync('server/routes/oauth.js', code);
console.log('Done!');
