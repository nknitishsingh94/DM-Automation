import axios from 'axios';
import Settings from '../models/Settings.js';

/**
 * Meta Graph API Helper: Send Message (Instagram / Facebook)
 */
export const sendMessageToInstagram = async (platform, recipientId, text, mediaUrl = '', userId = null, buttonText = '', manualToken = null, buttons = [], buttonPayload = '') => {
  try {
    let accessToken = manualToken || process.env.META_PAGE_ACCESS_TOKEN;
    let pageId = null;

    if (userId) {
      const userSettings = await Settings.findOne({ userId });
      if (userSettings) {
        if (platform === 'facebook' && userSettings.facebookAccessToken) {
          accessToken = userSettings.facebookAccessToken;
          pageId = userSettings.facebookPageId;
        } else if (userSettings.instagramAccessToken) {
          accessToken = userSettings.instagramAccessToken;
          // Instagram messaging uses the connected Page ID
          pageId = userSettings.instagramPageId || userSettings.businessAccountId;
        }
      }
    }

    if (!accessToken) {
      console.warn("⚠️ No access token found. Skipping real API call.");
      return false;
    }

    // ✅ Use 'me/messages' endpoint for all platforms
    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;

    // Ensure bare 'www.' links in text get 'https://' prefix for Desktop compatibility
    let safeText = text || '';
    safeText = safeText.replace(/(^|\s)(www\.[^\s]+)/g, '$1https://$2');

    let payload = null;

    if (buttons && buttons.length > 0) {
      payload = {
        recipient: { id: recipientId },
        messaging_type: "RESPONSE",
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "button",
              text: safeText || "Options:",
              buttons: buttons.map(btn => {
                let safeUrl = btn.url || '';
                if (safeUrl && !safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) {
                  safeUrl = 'https://' + safeUrl;
                }
                return btn.url ? {
                  type: "web_url",
                  url: safeUrl,
                  title: btn.text
                } : {
                  type: "postback",
                  title: btn.text,
                  payload: btn.payload || btn.text
                };
              })
            }
          }
        }
      };
    } else if (buttonText) {
      if (buttonPayload) {
        payload = {
          recipient: { id: recipientId },
          messaging_type: "RESPONSE",
          message: {
            attachment: {
              type: "template",
              payload: {
                template_type: "button",
                text: safeText || "Options:",
                buttons: [{
                  type: "postback",
                  title: buttonText,
                  payload: buttonPayload
                }]
              }
            }
          }
        };
      } else {
        payload = {
          recipient: { id: recipientId },
          messaging_type: "RESPONSE",
          message: {
            text: safeText || "Options:",
            quick_replies: [{
              content_type: "text",
              title: buttonText,
              payload: buttonText
            }]
          }
        };
      }
    } else {
      payload = {
        recipient: { id: recipientId },
        messaging_type: "RESPONSE",
        message: { text: safeText }
      };
    }

    if (payload) {
      console.log("📦 Sending Payload:", JSON.stringify(payload, null, 2));
      await axios.post(url, payload);
    }

    console.log(`✅ SEND SUCCESS: Message delivered to ${recipientId} via ${platform}`);
    return true;
  } catch (err) {
    const errorData = err.response?.data || err.message;
    console.error(`❌ SEND FAIL (${platform}):`, JSON.stringify(errorData, null, 2));
    return false;
  }
};

/**
 * WhatsApp Cloud API: Send Message
 */
export const sendWhatsAppMessage = async (recipientPhone, text, userId = null) => {
  try {
    let accessToken = '';
    let phoneNumberId = '';

    if (userId) {
      const userSettings = await Settings.findOne({ userId });
      if (userSettings && userSettings.whatsappToken && userSettings.whatsappPhoneNumberId) {
        accessToken = userSettings.whatsappToken;
        phoneNumberId = userSettings.whatsappPhoneNumberId;
      }
    }

    if (!accessToken || !phoneNumberId) {
      console.warn("⚠️ WhatsApp not configured. Skipping.");
      return false;
    }

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "text",
      text: { body: text }
    };

    const response = await axios.post(url, payload, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });
    console.log("✅ WhatsApp message sent:", response.data);
    return true;
  } catch (err) {
    console.error("❌ WhatsApp API Error:", err.response?.data || err.message);
    return false;
  }
};

/**
 * Meta Private Reply: Respond to a Comment with a DM
 */
export const sendPrivateReply = async (platform, commentId, text, userId = null) => {
  try {
    let accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    if (userId) {
      const userSettings = await Settings.findOne({ userId });
      if (userSettings) {
        accessToken = platform === 'facebook' ? userSettings.facebookAccessToken : userSettings.instagramAccessToken;
      }
    }

    if (!accessToken) return false;

    const url = `https://graph.facebook.com/v19.0/${commentId}/private_replies?access_token=${accessToken}`;
    const response = await axios.post(url, { message: text });
    console.log("✅ Private reply sent:", response.data);
    return true;
  } catch (err) {
    console.error("❌ Private Reply Error:", err.response?.data || err.message);
    return false;
  }
};

/**
 * Meta Content Publishing API: Post Image, Reel, or Story
 */
/**
 * Meta Content Publishing API: Post Image, Reel, Story, or Carousel
 */
export const publishInstagramContent = async (userId, type, mediaUrl, caption = '', carouselItems = []) => {
  try {
    const settings = await Settings.findOne({ userId });
    if (!settings || !settings.instagramAccessToken || !settings.businessAccountId) {
      throw new Error('Meta credentials missing for publishing');
    }

    const accessToken = settings.instagramAccessToken;
    const igId = settings.businessAccountId;
    
    console.log(`🎬 Starting Meta Publishing [${type.toUpperCase()}] for user ${userId}`);

    let finalCreationId = null;

    if (type === 'carousel' && carouselItems.length > 0) {
      // --- CAROUSEL FLOW ---
      console.log(`🎠 Processing Carousel with ${carouselItems.length} items...`);
      const childrenIds = [];

      for (const itemUrl of carouselItems) {
        const isVideo = itemUrl.match(/\.(mp4|mov|webm)/i);
        const childParams = { 
          access_token: accessToken,
          is_carousel_item: true
        };

        if (isVideo) {
          childParams.media_type = 'VIDEO';
          childParams.video_url = itemUrl;
        } else {
          childParams.image_url = itemUrl;
        }

        const childRes = await axios.post(`https://graph.facebook.com/v19.0/${igId}/media`, null, { params: childParams });
        childrenIds.push(childRes.data.id);
        console.log(`👶 Carousel Child Created: ${childRes.data.id}`);
      }

      // Wait for all children to be ready
      console.log("⏳ Waiting for carousel children to be processed...");
      await new Promise(r => setTimeout(r, 30000)); // Carousels need more time

      // Create Carousel Container
      const carouselParams = {
        access_token: accessToken,
        media_type: 'CAROUSEL',
        children: childrenIds.join(','),
        caption
      };

      const carouselRes = await axios.post(`https://graph.facebook.com/v19.0/${igId}/media`, null, { params: carouselParams });
      finalCreationId = carouselRes.data.id;
    } else {
      // --- SINGLE ITEM FLOW (Image, Reel, Story) ---
      let containerUrl = `https://graph.facebook.com/v19.0/${igId}/media?access_token=${accessToken}`;
      const params = { caption };

      if (type === 'reel') {
        params.media_type = 'REELS';
        params.video_url = mediaUrl;
      } else if (type === 'story') {
        params.media_type = 'STORIES';
        if (mediaUrl.match(/\.(mp4|mov|webm)/i)) {
          params.video_url = mediaUrl;
        } else {
          params.image_url = mediaUrl;
        }
      } else {
        params.image_url = mediaUrl;
      }

      const containerRes = await axios.post(containerUrl, params);
      finalCreationId = containerRes.data.id;
    }

    console.log(`📦 Final Media Container created: ${finalCreationId}`);

    // --- STEP 2: Polling for Status ---
    let isReady = false;
    let attempts = 0;
    while (!isReady && attempts < 20) {
      await new Promise(r => setTimeout(r, 10000));
      const statusRes = await axios.get(`https://graph.facebook.com/v19.0/${finalCreationId}?fields=status_code&access_token=${accessToken}`);
      console.log(`⏳ Status Check (${attempts + 1}): ${statusRes.data.status_code}`);
      if (statusRes.data.status_code === 'FINISHED') {
        isReady = true;
      } else if (statusRes.data.status_code === 'ERROR') {
        throw new Error('Meta processing failed');
      }
      attempts++;
    }

    if (!isReady) throw new Error('Meta processing timeout');

    // --- STEP 3: Publish Media ---
    const publishUrl = `https://graph.facebook.com/v19.0/${igId}/media_publish?creation_id=${finalCreationId}&access_token=${accessToken}`;
    const publishRes = await axios.post(publishUrl);
    
    console.log(`✅ PUBLISH SUCCESS: ${publishRes.data.id}`);
    return publishRes.data.id;
  } catch (err) {
    const errorData = err.response?.data || err.message;
    console.error("❌ Meta Publishing Error:", JSON.stringify(errorData, null, 2));
    throw err;
  }
};

/**
 * Meta Public Comment Reply: Respond to a Comment with another Comment
 */
export const sendPublicComment = async (platform, commentId, text, userId = null, manualToken = null) => {
  try {
    let accessToken = manualToken || process.env.META_PAGE_ACCESS_TOKEN;
    if (userId) {
      const userSettings = await Settings.findOne({ userId });
      if (userSettings) {
        accessToken = platform === 'facebook' ? userSettings.facebookAccessToken : userSettings.instagramAccessToken;
      }
    }

    if (!accessToken) return false;

    // For Instagram, the endpoint is /{comment-id}/replies
    const url = `https://graph.facebook.com/v19.0/${commentId}/replies?access_token=${accessToken}`;
    const response = await axios.post(url, { message: text });
    console.log("✅ Public comment reply sent:", response.data);
    return true;
  } catch (err) {
    const errorData = err.response?.data || err.message;
    console.error("❌ Public Comment Error:", JSON.stringify(errorData, null, 2));
    return false;
  }
};
