import { sendWhatsAppMessage } from '../services/platforms/whatsapp.js';
import { publishInstagramContent } from '../services/platforms/instagram.js';
import { publishFacebookContent, checkMediaReadiness } from '../services/platforms/facebook.js';
import { publishThreadsContent } from '../services/platforms/threads.js';

import axios from 'axios';
import Settings from '../models/Settings.js';

/**
 * Meta Graph API Helper: Send Message (Instagram / Facebook)
 */
export const sendMessageToInstagram = async (platform, recipientId, text, mediaUrl = '', userId = null, buttonText = '', manualToken = null, buttons = [], buttonPayload = '', commentId = null) => {
  try {
    if (platform === 'whatsapp') {
      let waText = text || '';
      if (buttonText) waText += `\n\n👉 Options:\n- ${buttonText}`;
      if (buttons && buttons.length > 0) {
        buttons.forEach(b => {
          waText += `\n- ${b.text}`;
        });
      }
      return await sendWhatsAppMessage(recipientId, waText, userId);
    }

    let accessToken = manualToken;
    if (!accessToken && userId) {
      const userSettings = await Settings.findOne({ userId });
      if (userSettings) {
        if (platform === 'facebook' && userSettings.facebookAccessToken) {
          accessToken = userSettings.facebookAccessToken;
        } else if (userSettings.instagramAccessToken) {
          accessToken = userSettings.instagramAccessToken;
        }
      }
    }
    if (!accessToken) {
      accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    }

    if (!accessToken) {
      console.warn("⚠️ No access token found. Skipping real API call. Simulating success for database metrics.");
      return true;
    }

    let url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;
    let safeText = text || '';
    safeText = safeText.replace(/(^|\s)(www\.[^\s]+)/g, '$1https://$2');

    const recipient = commentId ? { comment_id: commentId } : { id: recipientId };
    let payload = null;
    const isPrivateReply = !!commentId;
    let effectiveButtons = isPrivateReply ? [] : (buttons || []);
    let effectiveButtonText = isPrivateReply ? null : (buttonText || (mediaUrl ? "Click Here" : ""));

    if (isPrivateReply && (buttonText || (buttons && buttons.length > 0) || mediaUrl)) {
      safeText = safeText + `\n\n👉 (Reply "Yes" to receive it!)`;
    }

    if (effectiveButtons.length > 0) {
      payload = {
        recipient,
        messaging_type: "RESPONSE",
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "button",
              text: safeText || "Options:",
              buttons: effectiveButtons.map(btn => {
                let safeUrl = btn.url || '';
                if (safeUrl && !safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) {
                  safeUrl = 'https://' + safeUrl;
                }
                return btn.url ? {
                  type: "web_url",
                  url: safeUrl,
                  title: (btn.text || "").substring(0, 20)
                } : {
                  type: "postback",
                  title: (btn.text || "").substring(0, 20),
                  payload: btn.payload || btn.text
                };
              })
            }
          }
        }
      };
    } else if (effectiveButtonText) {
      if (buttonPayload) {
        payload = {
          recipient,
          messaging_type: "RESPONSE",
          message: {
            attachment: {
              type: "template",
              payload: {
                template_type: "button",
                text: safeText || "Options:",
                buttons: [{
                  type: "postback",
                  title: (effectiveButtonText || "").substring(0, 20),
                  payload: buttonPayload
                }]
              }
            }
          }
        };
      } else if (mediaUrl && (mediaUrl.trim().startsWith('http') || mediaUrl.includes('.'))) {
        let safeUrl = mediaUrl.trim();
        if (!safeUrl.startsWith('http')) safeUrl = 'https://' + safeUrl;
        payload = {
          recipient,
          messaging_type: "RESPONSE",
          message: {
            attachment: {
              type: "template",
              payload: {
                template_type: "button",
                text: safeText || "Click the link below:",
                buttons: [{
                  type: "web_url",
                  url: safeUrl,
                  title: (effectiveButtonText || "").substring(0, 20)
                }]
              }
            }
          }
        };
      } else {
        payload = {
          recipient,
          messaging_type: "RESPONSE",
          message: {
            text: safeText || "Options:",
            quick_replies: [{
              content_type: "text",
              title: (effectiveButtonText || "").substring(0, 20),
              payload: effectiveButtonText
            }]
          }
        };
      }
    } else {
      payload = {
        recipient,
        message: { text: safeText }
      };
      
      if (!isPrivateReply) {
        payload.messaging_type = "RESPONSE";
      }
    }

    if (payload) {
      try {
        await axios.post(url, payload);
      } catch (postError) {
        console.error(`❌ SEND FAIL (${platform}):`, JSON.stringify(postError.response?.data || postError.message, null, 2));
        
        if (payload.message?.attachment?.type === 'template' && postError.response?.data?.error?.code !== 190) {
          console.log(`⚠️ Template rejected by Meta. Falling back to plain text...`);
          let fallbackText = safeText;
          if (mediaUrl) fallbackText += `\n\n👉 ${mediaUrl.trim()}`;
          
          if (effectiveButtons && effectiveButtons.length > 0) {
            fallbackText += `\n\n👉 Links:\n` + effectiveButtons.map(b => `- ${b.text}: ${b.url}`).join('\n');
          }
          
          const fallbackPayload = {
            recipient,
            messaging_type: "RESPONSE",
            message: { text: fallbackText }
          };
          
          try {
            await axios.post(url, fallbackPayload);
            return true;
          } catch (fbErr) {
            console.error(`❌ FALLBACK FAIL:`, JSON.stringify(fbErr.response?.data || fbErr.message, null, 2));
          }
        }
        return null;
      }
      return true;
    }

    return true;
  } catch (error) {
    console.error(`❌ SEND FAIL (${platform}):`, JSON.stringify(error.response?.data || error.message, null, 2));
    return null;
  }
};

export const sendPrivateReply = async (platform, commentId, text, userId = null) => {
  try {
    if (platform === 'instagram') {
      return await sendMessageToInstagram(platform, '', text, '', userId, '', null, [], '', commentId);
    }

    let accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    if (userId) {
      const userSettings = await Settings.findOne({ userId });
      if (userSettings) {
        accessToken = platform === 'facebook' ? userSettings.facebookAccessToken : userSettings.instagramAccessToken;
      }
    }

    if (!accessToken) return false;

    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;
    await axios.post(url, { recipient: { comment_id: commentId }, message: { text } });
    return true;
  } catch (err) {
    return false;
  }
};

export const sendPublicComment = async (platform, commentId, text, userId = null, passedToken = null) => {
  try {
    let accessToken = passedToken;
    if (!accessToken && userId) {
      const userSettings = await Settings.findOne({ userId });
      if (userSettings) {
        accessToken = platform === 'facebook' ? userSettings.facebookAccessToken : userSettings.instagramAccessToken;
      }
    }
    if (!accessToken) {
      accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    }

    if (!accessToken) return false;

    const edge = platform === 'facebook' ? 'comments' : 'replies';
    const url = `https://graph.facebook.com/v19.0/${commentId}/${edge}`;
    await axios.post(url, { message: text, access_token: accessToken });
    return { success: true };
  } catch (err) {
    console.error(`❌ PUBLIC COMMENT FAIL (${platform}):`, JSON.stringify(err.response?.data || err.message, null, 2));
    return { success: false, error: err.response?.data || err.message };
  }
};

export const checkFollowerStatus = async (platform, chatId, userId, preloadedSettings = null) => {
  if (platform !== 'instagram') return false;

  try {
    const userSettings = preloadedSettings || await Settings.findOne({ userId });
    if (!userSettings || !userSettings.instagramAccessToken) {
      console.log("⚠️ Missing credentials for follow check. Defaulting to false.");
      return false;
    }

    const res = await axios.get(`https://graph.facebook.com/v19.0/${chatId}?fields=is_user_follow_business&access_token=${userSettings.instagramAccessToken}`, {
      timeout: 5000 
    });

    return !!(res.data && res.data.is_user_follow_business === true);
  } catch (err) {
    console.warn("⚠️ Follow check API failed:", err.response?.data || err.message);
    return false;
  }
};

export { sendWhatsAppMessage, publishInstagramContent, publishFacebookContent, checkMediaReadiness, publishThreadsContent };
