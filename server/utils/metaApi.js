import axios from 'axios';
import Settings from '../models/Settings.js';

/**
 * Meta Graph API Helper: Send Message (Instagram / Facebook)
 */
export const sendMessageToInstagram = async (platform, recipientId, text, mediaUrl = '', userId = null) => {
  try {
    let accessToken = process.env.META_PAGE_ACCESS_TOKEN; 
    
    if (userId) {
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
      console.warn("⚠️ No access token found. Skipping real API call.");
      return false;
    }

    // DEBUG: Log the first 10 chars of token to confirm we are using the right one
    console.log(`🔑 Using Token (prefix): ${accessToken.substring(0, 10)}...`);

    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;
    const payload = {
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: { text }
    };

    if (mediaUrl) {
      payload.message.text += `\n\nCheck this out: ${mediaUrl}`;
    }

    const response = await axios.post(url, payload);
    console.log(`✅ SEND SUCCESS: Message delivered to ${recipientId} via ${platform}`);
    return true;
  } catch (err) {
    const errorData = err.response?.data || err.message;
    console.error(`❌ SEND FAIL (${platform}):`, JSON.stringify(errorData, null, 2));
    
    if (JSON.stringify(errorData).includes("ID 'me' does not exist")) {
        console.warn("💡 FIX TIP: Meta doesn't recognize '/me'. This usually means the token is a 'User Token' instead of a 'Page Token'. Please regenerate as a PAGE token in Graph API Explorer.");
    }
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
