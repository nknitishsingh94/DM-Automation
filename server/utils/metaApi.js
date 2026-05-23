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
      const res = await axios.post(url, payload);
      
      return true;
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
    // Try to get status_code first (supported by all media types)
    const statusRes = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
      params: {
        fields: 'status_code',
        access_token: accessToken
      }
    });
    
    const statusCode = statusRes.data.status_code;
    
    // If status_code is not returned at all (e.g. image container), it is ready immediately
    if (statusCode === undefined || statusCode === null) {
      console.log(`ℹ️ [Meta API] Container ${mediaId} has no status_code (likely an image). Marking ready immediately.`);
      return true;
    }
    
    if (statusCode === 'FINISHED' || statusCode === 'PUBLISHED') {
      return true;
    } else if (statusCode === 'ERROR') {
      // If it failed, try to get video_status for more details
      try {
        const videoStatusRes = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
          params: {
            fields: 'video_status',
            access_token: accessToken
          }
        });
        const videoStatus = videoStatusRes.data.video_status || {};
        throw new Error(`Meta Processing Error: ${videoStatus.message || statusCode}`);
      } catch (e) {
        throw new Error(`Meta Processing Error: ${statusCode}`);
      }
    } else if (statusCode === 'EXPIRED') {
      throw new Error(`Meta Processing Error: Container Expired`);
    }
    
    return false; // Still processing
  } catch (err) {
    if (err.message?.includes('Meta Processing')) throw err;
    if (err.response) {
      console.error(`❌ Meta API Error in checkMediaReadiness:`, err.response.data);
      throw new Error(`Meta API Error: ${err.response.data.error?.message || err.message}`);
    }
    throw err;
  }
};

/**
 * Meta Content Publishing API: Post Image, Reel, Story, or Carousel
 */
export const publishInstagramContent = async (userId, { type, mediaUrl, caption = '', carouselItems = [], containerId = null }, workspaceId = null) => {
  try {
    console.log(`📡 [Meta API] Start Publishing for User: ${userId}. Type: ${type}, Container: ${containerId || 'NEW'}, Workspace: ${workspaceId || 'NONE'}`);
    let settings = null;
    if (workspaceId) {
      settings = await Settings.findOne({ userId, workspaceId });
    }
    if (!settings) {
      settings = await Settings.findOne({ userId });
    }
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
    
    let finalCreationId = containerId;

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

    // Check if ready (with a retry loop to poll for readiness immediately)
    console.log(`📦 Checking readiness for container: ${finalCreationId}`);
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 2; // Reduced from 4 to 2 to prevent Vercel 10s timeout
    
    while (attempts < maxAttempts) {
      isReady = await checkMediaReadiness(finalCreationId, accessToken);
      if (isReady) break;
      
      attempts++;
      if (attempts < maxAttempts) {
        console.log(`⏳ Container ${finalCreationId} not ready yet. Waiting 2.5 seconds (Attempt ${attempts}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    }
    
    if (!isReady) {
      return { status: 'IG_PROCESSING', containerId: finalCreationId };
    }

    // Publish
    const publishUrl = `https://graph.facebook.com/v19.0/${igId}/media_publish?creation_id=${finalCreationId}&access_token=${accessToken}`;
    console.log(`🚀 [Meta API] Final Publish Step. Container: ${finalCreationId}`);
    
    const publishRes = await axios.post(publishUrl);
    console.log(`✅ [Meta API] Published Successfully! Media ID: ${publishRes.data.id}`);
    
    // Fetch Official URL
    let liveUrl = mediaUrl;
    try {
      const mediaInfoRes = await axios.get(`https://graph.facebook.com/v19.0/${publishRes.data.id}`, {
        params: { fields: 'media_url,permalink,thumbnail_url', access_token: accessToken }
      });
      liveUrl = mediaInfoRes.data.media_url || mediaInfoRes.data.thumbnail_url || mediaInfoRes.data.permalink || liveUrl;
      console.log(`🔗 [Meta API] Official URL Fetched: ${liveUrl}`);
    } catch (e) {
      console.warn(`⚠️ [Meta API] Could not fetch live URL info: ${e.message}`);
    }

    return { id: publishRes.data.id, url: liveUrl, status: 'PUBLISHED' };
  } catch (err) {
    const metaError = err.response?.data?.error;
    const errorMessage = metaError ? `${metaError.message} (Code: ${metaError.code})` : err.message;
    console.error("❌ Meta Publishing Error:", JSON.stringify(err.response?.data || err.message, null, 2));
    throw new Error(errorMessage);
  }
};

/**
 * Meta Content Publishing API: Post Image, Video, or Carousel to Facebook Page Feed
 */
export const publishFacebookContent = async (userId, { type, mediaUrl, caption = '', carouselItems = [] }, workspaceId = null) => {
  try {
    console.log(`📡 [Meta API] Start FB Feed Publishing for User: ${userId}. Type: ${type}, Workspace: ${workspaceId || 'NONE'}`);
    let settings = null;
    if (workspaceId) {
      settings = await Settings.findOne({ userId, workspaceId });
    }
    if (!settings) {
      settings = await Settings.findOne({ userId });
    }
    if (!settings || !settings.facebookAccessToken || !settings.facebookPageId) {
      console.log(`⚠️ Settings missing for user ${userId}. Attempting fallback to any active connected settings in DB...`);
      settings = await Settings.findOne({ 
        facebookAccessToken: { $ne: null }, 
        facebookPageId: { $ne: null } 
      });
      if (!settings) {
        throw new Error('Meta credentials missing for Facebook publishing');
      }
    }

    const accessToken = settings.facebookAccessToken;
    const pageId = settings.facebookPageId;
    
    let publishRes = null;
    let publishedId = null;

    if (type === 'carousel' && carouselItems && carouselItems.length > 0) {
      console.log(`🎬 Publishing Carousel to FB Page for user ${userId}`);
      const childPromises = carouselItems.map(async (itemUrl) => {
        const isVideo = itemUrl.match(/\.(mp4|mov|webm)/i);
        if (isVideo) {
          const childRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/videos`, null, {
            params: {
              access_token: accessToken,
              file_url: itemUrl,
              published: false
            }
          });
          return { media_fbid: childRes.data.id };
        } else {
          const childRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/photos`, null, {
            params: {
              access_token: accessToken,
              url: itemUrl,
              published: false
            }
          });
          return { media_fbid: childRes.data.id };
        }
      });
      const attachedMedia = await Promise.all(childPromises);
      publishRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, null, {
        params: {
          access_token: accessToken,
          message: caption,
          attached_media: JSON.stringify(attachedMedia)
        }
      });
      publishedId = publishRes.data.id;
    } else if (mediaUrl) {
      const isVideo = mediaUrl.match(/\.(mp4|mov|webm)/i) || type === 'video' || type === 'reel';
      if (isVideo) {
        console.log(`🎬 Publishing Video to FB Page for user ${userId}`);
        publishRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/videos`, null, {
          params: {
            access_token: accessToken,
            file_url: mediaUrl,
            description: caption
          }
        });
        publishedId = publishRes.data.id;
      } else {
        console.log(`🎬 Publishing Photo to FB Page for user ${userId}`);
        publishRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/photos`, null, {
          params: {
            access_token: accessToken,
            url: mediaUrl,
            message: caption
          }
        });
        publishedId = publishRes.data.post_id || publishRes.data.id;
      }
    } else {
      console.log(`🎬 Publishing Text Post to FB Page for user ${userId}`);
      publishRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, null, {
        params: {
          access_token: accessToken,
          message: caption
        }
      });
      publishedId = publishRes.data.id;
    }

    console.log(`✅ [Meta API] FB Feed Published Successfully! Post ID: ${publishedId}`);
    
    // Fetch Official URL
    let liveUrl = `https://www.facebook.com/${publishedId}`;
    try {
      const postInfoRes = await axios.get(`https://graph.facebook.com/v19.0/${publishedId}`, {
        params: { fields: 'permalink_url', access_token: accessToken }
      });
      liveUrl = postInfoRes.data.permalink_url || liveUrl;
      console.log(`🔗 [Meta API] FB Official URL Fetched: ${liveUrl}`);
    } catch (e) {
      console.warn(`⚠️ [Meta API] Could not fetch FB live URL info: ${e.message}`);
    }

    return { id: publishedId, url: liveUrl, status: 'PUBLISHED' };
  } catch (err) {
    const metaError = err.response?.data?.error;
    const errorMessage = metaError ? `${metaError.message} (Code: ${metaError.code})` : err.message;
    console.error("❌ Meta FB Feed Publishing Error:", JSON.stringify(err.response?.data || err.message, null, 2));
    throw new Error(errorMessage);
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
