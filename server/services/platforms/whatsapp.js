import axios from 'axios';
import Settings from '../../models/Settings.js';

/**
 * WhatsApp Cloud API: Send Message
 */
export const sendWhatsAppMessage = async (recipientPhone, text, userId = null) => {
  try {
    let accessToken = '';
    let phoneNumberId = '';

    if (userId) {
      const userSettings = await Settings.findOne({ userId });
      if (userSettings && userSettings.whatsappToken) {
        accessToken = userSettings.whatsappToken;
      }
      if (userSettings && userSettings.whatsappPhoneNumberId) {
        phoneNumberId = userSettings.whatsappPhoneNumberId;
      }
    }
    
    if (!accessToken) accessToken = process.env.WHATSAPP_TOKEN;
    if (!phoneNumberId) phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

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
    console.log("🚀 WhatsApp message sent:", response.data);
    return true;
  } catch (err) {
    console.error("❌ WhatsApp API Error:", err.response?.data || err.message);
    return false;
  }
};

/**
 * WhatsApp Cloud API: Publish Broadcast / Scheduled Content
 */
export const publishWhatsAppContent = async (userId, postData, workspaceId) => {
  try {
    let accessToken = '';
    let phoneNumberId = '';

    const { supabase } = await import('../../utils/supabase.js');
    const { data: userSettings, error } = await supabase.from('settings').select('*').eq('workspaceId', workspaceId).limit(1);
    
    if (userSettings && userSettings.length > 0) {
      const parsedSettings = userSettings[0].parsedSettings ? (typeof userSettings[0].parsedSettings === 'string' ? JSON.parse(userSettings[0].parsedSettings) : userSettings[0].parsedSettings) : {};
      accessToken = parsedSettings.whatsappToken || userSettings[0].whatsappToken;
      phoneNumberId = parsedSettings.whatsappPhoneNumberId || userSettings[0].whatsappPhoneNumberId;
    }

    if (!accessToken) accessToken = process.env.WHATSAPP_TOKEN;
    if (!phoneNumberId) phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      console.warn("⚠️ WhatsApp not configured. Failing post.");
      return { status: 'Failed', error: 'WhatsApp not configured' };
    }

    let numbersStr = postData.whatsappNumbers || '';
    if (!numbersStr && postData.mediaUrl && postData.mediaUrl.startsWith('{')) {
       try {
         const meta = JSON.parse(postData.mediaUrl);
         numbersStr = meta.whatsappNumbers || '';
       } catch (e) {}
    }

    if (!numbersStr) {
      return { status: 'Failed', error: 'No recipient phone numbers provided' };
    }

    const numbers = numbersStr.split(',').map(n => n.trim().replace(/\D/g, '')).filter(n => n.length > 5);
    
    if (numbers.length === 0) {
      return { status: 'Failed', error: 'No valid recipient phone numbers provided' };
    }

    let successCount = 0;
    let failCount = 0;
    let lastError = null;

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    
    for (const recipientPhone of numbers) {
      try {
        let payload = {
          messaging_product: "whatsapp",
          to: recipientPhone,
          type: "text",
          text: { body: postData.caption || "Hello!" }
        };

        let finalMediaUrl = postData.mediaUrl;
        if (finalMediaUrl && finalMediaUrl.startsWith('{')) {
            try {
              const meta = JSON.parse(finalMediaUrl);
              finalMediaUrl = meta.mediaUrl || (meta.carouselItems && meta.carouselItems.length > 0 ? meta.carouselItems[0] : null);
            } catch (e) {}
        }
        
        if (finalMediaUrl && finalMediaUrl.startsWith('http')) {
           const isVideo = finalMediaUrl.match(/\.(mp4|mov|webm)$/i);
           if (isVideo) {
             payload.type = "video";
             payload.video = { link: finalMediaUrl, caption: postData.caption || "" };
             delete payload.text;
           } else {
             payload.type = "image";
             payload.image = { link: finalMediaUrl, caption: postData.caption || "" };
             delete payload.text;
           }
        }

        await axios.post(url, payload, {
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        successCount++;
      } catch (err) {
        failCount++;
        lastError = err.response?.data?.error?.message || err.message;
        console.error(`❌ WhatsApp Broadcast Error to ${recipientPhone}:`, lastError);
      }
    }

    if (successCount === 0 && failCount > 0) {
      return { status: 'Failed', error: lastError || 'Failed to send to any recipients' };
    }

    return { status: 'Posted', id: `whatsapp-broadcast-${Date.now()}` };
  } catch (err) {
    console.error("❌ WhatsApp Publish Error:", err.message);
    return { status: 'Failed', error: err.message };
  }
};
