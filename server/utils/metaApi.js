import axios from 'axios';
import Settings from '../models/Settings.js';

/**
 * Meta Graph API Helper: Send Message (Instagram / Facebook)
 */
export const sendMessageToInstagram = async (platform, recipientId, text, mediaUrl = '', userId = null) => {
  try {
    let accessToken = process.env.META_PAGE_ACCESS_TOKEN;
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

    console.log(`🔑 Using Token (prefix): ${accessToken.substring(0, 10)}...`);
    console.log(`📄 Using Page ID: ${pageId || 'me (fallback)'}`);

    // ✅ Use pageId endpoint — /me/messages does NOT work for page-owned Instagram accounts
    const endpoint = pageId ? pageId : 'me';
    const url = `https://graph.facebook.com/v19.0/${endpoint}/messages?access_token=${accessToken}`;

    // Check if the provided text is actually a JSON string for a structured message (ManyChat style)
    let finalMessageBody = { text };
    
    if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
      try {
        const structuredData = JSON.parse(text);
        if (structuredData.attachment || structuredData.text || structuredData.quick_replies) {
          finalMessageBody = structuredData;
        }
      } catch (e) {
        // Not valid JSON, fallback to plain text
        finalMessageBody = { text };
      }
    }

    if (mediaUrl && !finalMessageBody.attachment) {
      if (finalMessageBody.text) {
        finalMessageBody.text += `\n\nCheck this out: ${mediaUrl}`;
      }
    }

    const payload = {
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: finalMessageBody
    };

    const response = await axios.post(url, payload);
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
