const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');

const replacement = `      const allowedKeys = [
        'id', 'userId', 'workspaceId', 'instagramAccessToken', 'instagramPageId', 'businessAccountId', 'connectedInstagramName', 'isAccountConnected', 'instagramAutomationEnabled', 'facebookAccessToken', 'facebookPageId', 'connectedFacebookName', 'isFacebookConnected', 'facebookAutomationEnabled', 'whatsappToken', 'whatsappPhoneNumberId', 'connectedWhatsAppName', 'isWhatsAppConnected', 'whatsappAutomationEnabled', 'telegramToken', 'isTelegramConnected', 'telegramAutomationEnabled', 'twitterApiKey', 'isTwitterConnected', 'twitterAutomationEnabled', 'twitterAccessToken', 'twitterRefreshToken', 'connectedTwitterName', 'connectedTwitterId', 'youtubeApiKey', 'isYouTubeConnected', 'isYoutubeConnected', 'youtubeAutomationEnabled', 'youtubeAccessToken', 'youtubeRefreshToken', 'youtubeChannelId', 'youtubeChannelName', 'linkedinAccessToken', 'isLinkedInConnected', 'linkedinAutomationEnabled', 'connectedLinkedInName', 'isGoogleBusinessConnected', 'connectedGoogleBusinessName', 'googleBusinessAccessToken', 'googleBusinessRefreshToken', 'isThreadsConnected', 'threadsAccessToken', 'threadsPageId', 'connectedThreadsName', 'lastTestedAt', 'aiFallbackMessage', 'aiName', 'aiTone', 'aiKnowledgeBase', 'aiTemperature', 'connectedPageName', 'whatsappBusinessAccountId'
      ];`;

code = code.replace(/const allowedKeys = \[\s*[\s\S]*?\s*\];/, replacement);
fs.writeFileSync('server/index.js', code);
console.log('Fixed index.js allowedKeys to include all virtual fields!');
