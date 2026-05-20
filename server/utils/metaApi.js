import axios from 'axios';
import Settings from '../models/Settings.js';

/**
 * Meta Graph API Helper: Send Message (Instagram / Facebook)
 */
export const sendMessageToInstagram = async (platform, recipientId, text, mediaUrl = '', userId = null, buttonText = '', manualToken = null, buttons = [], buttonPayload = '', commentId = null) => {
  try {
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

    // ✅ Use 'me/messages' endpoint for all platforms
    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;

    // Ensure bare 'www.' links in text get 'https://' prefix for Desktop compatibility
    let safeText = text || '';
    safeText = safeText.replace(/(^|\s)(www\.[^\s]+)/g, '$1https://$2');

    // Dynamic Recipient Builder for Private Replies on Instagram Comments
    const recipient = (platform === 'instagram' && commentId) ? { comment_id: commentId } : { id: recipientId };
    let payload = null;

    // Meta API STRICT RULE: Private replies (using comment_id) CANNOT contain buttons or templates.
    // If we try to send a button, it will throw an API error and drop the message.
    const isPrivateReply = !!(platform === 'instagram' && commentId);
    let effectiveButtons = isPrivateReply ? [] : (buttons || []);
    let effectiveButtonText = isPrivateReply ? null : buttonText;

    if (isPrivateReply && (buttonText || (buttons && buttons.length > 0))) {
      // Append a fallback instruction since we had to strip the button
      safeText = safeText + `\n\n👉 (Reply "Done" or click the link if you see one to continue)`;
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
                  title: effectiveButtonText,
                  payload: buttonPayload
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
              title: effectiveButtonText,
              payload: effectiveButtonText
            }]
          }
        };
      }
    } else {
      payload = {
        recipient,
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
    if (platform === 'instagram') {
      // Instagram private replies MUST be sent via the standard messages endpoint
      // using comment_id in the recipient field!
      console.log(`💬 Instagram Private Reply: Routing through sendMessageToInstagram for comment ${commentId}...`);
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

    const url = `https://graph.facebook.com/v19.0/${commentId}/private_replies?access_token=${accessToken}`;
    const response = await axios.post(url, { message: text });
    console.log("✅ Private reply sent:", response.data);
    return true;
  } catch (err) {
    const errorData = err.response?.data || err.message;
    console.error("❌ Private Reply Error:", JSON.stringify(errorData, null, 2));
    return false;
  }
};

/**
 * Meta Utility: Check if a media container is ready (Single Check for Vercel compatibility)
 */
export const checkMediaReadiness = async (mediaId, accessToken) => {
  try {
    const statusRes = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
      params: {
        fields: 'status_code,video_status',
        access_token: accessToken
      }
    });
    
    const statusCode = statusRes.data.status_code;
    
    if (statusCode === 'FINISHED') {
      return true;
    } else if (statusCode === 'ERROR') {
      const videoStatus = statusRes.data.video_status || {};
      throw new Error(`Meta Processing Error: ${videoStatus.message || statusCode}`);
    }
    
    return false; // Still processing
  } catch (err) {
    if (err.message?.includes('Meta Processing')) throw err;
    return false;
  }
};

/**
 * Meta Content Publishing API: Post Image, Reel, Story, or Carousel
 */
export const publishInstagramContent = async (userId, type, mediaUrl, caption = '', carouselItems = [], existingContainerId = null) => {
  try {
    let settings = await Settings.findOne({ userId });
    if (!settings || !settings.instagramAccessToken || !settings.businessAccountId) {
      console.log(`⚠️ Settings missing for user ${userId}. Attempting fallback to any active connected settings in DB...`);
      settings = await Settings.findOne({ 
        instagramAccessToken: { $ne: null }, 
        businessAccountId: { $ne: null } 
      });
      if (!settings) {
        throw new Error('Meta credentials missing for publishing');
      }
    }

    const accessToken = settings.instagramAccessToken;
    const igId = settings.businessAccountId;
    
    let finalCreationId = existingContainerId;

    if (!finalCreationId) {
      console.log(`🎬 Starting Meta Container Creation [${type.toUpperCase()}] for user ${userId}`);

      if (type === 'carousel' && carouselItems.length > 0) {
        const childPromises = carouselItems.map(async (itemUrl) => {
          const isVideo = itemUrl.match(/\.(mp4|mov|webm)/i);
          const childParams = { access_token: accessToken, is_carousel_item: true };
          if (isVideo) { childParams.media_type = 'VIDEO'; childParams.video_url = itemUrl; }
          else { childParams.image_url = itemUrl; }
          const childRes = await axios.post(`https://graph.facebook.com/v19.0/${igId}/media`, null, { params: childParams });
          return childRes.data.id;
        });
        const childrenIds = await Promise.all(childPromises);
        
        // Note: For carousels on Vercel, we might need a more complex state, 
        // but for now let's hope children process fast or use the same logic
        const carouselParams = { access_token: accessToken, media_type: 'CAROUSEL', children: childrenIds.join(','), caption };
        const carouselRes = await axios.post(`https://graph.facebook.com/v19.0/${igId}/media`, null, { params: carouselParams });
        finalCreationId = carouselRes.data.id;
      } else {
        let containerUrl = `https://graph.facebook.com/v19.0/${igId}/media?access_token=${accessToken}`;
        const params = { caption };
        if (type === 'reel') { params.media_type = 'REELS'; params.video_url = mediaUrl; params.share_to_feed = true; }
        else if (type === 'story') { 
          params.media_type = 'STORIES'; 
          if (mediaUrl.match(/\.(mp4|mov|webm)/i)) params.video_url = mediaUrl; 
          else params.image_url = mediaUrl;
        } else { params.image_url = mediaUrl; }

        const containerRes = await axios.post(containerUrl, params);
        finalCreationId = containerRes.data.id;
      }
    }

    // Check if ready
    console.log(`📦 Checking readiness for container: ${finalCreationId}`);
    const isReady = await checkMediaReadiness(finalCreationId, accessToken);
    
    if (!isReady) {
      return { status: 'IG_PROCESSING', containerId: finalCreationId };
    }

    // Publish
    const publishUrl = `https://graph.facebook.com/v19.0/${igId}/media_publish?creation_id=${finalCreationId}&access_token=${accessToken}`;
    const publishRes = await axios.post(publishUrl);
    
    // Fetch Official URL
    let liveUrl = mediaUrl;
    try {
      const mediaInfoRes = await axios.get(`https://graph.facebook.com/v19.0/${publishRes.data.id}`, {
        params: { fields: 'media_url,permalink,thumbnail_url', access_token: accessToken }
      });
      liveUrl = mediaInfoRes.data.media_url || mediaInfoRes.data.thumbnail_url || mediaInfoRes.data.permalink || liveUrl;
    } catch (e) {}

    return { id: publishRes.data.id, url: liveUrl, status: 'PUBLISHED' };
  } catch (err) {
    console.error("❌ Meta Publishing Error:", JSON.stringify(err.response?.data || err.message, null, 2));
    throw err;
  }
};

/**
 * Meta Public Comment Reply
 */
export const sendPublicComment = async (platform, commentId, text, userId = null, manualToken = null) => {
  try {
    let accessToken = manualToken;
    if (!accessToken && userId) {
      const userSettings = await Settings.findOne({ userId });
      if (userSettings) { accessToken = platform === 'facebook' ? userSettings.facebookAccessToken : userSettings.instagramAccessToken; }
    }
    if (!accessToken) accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    if (!accessToken) return false;

    const url = `https://graph.facebook.com/v19.0/${commentId}/replies?access_token=${accessToken}`;
    const response = await axios.post(url, { message: text });
    return true;
  } catch (err) {
    console.error("❌ Public Comment Error:", JSON.stringify(err.response?.data || err.message, null, 2));
    return false;
  }
};
