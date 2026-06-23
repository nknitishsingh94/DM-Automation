import express from 'express';
import { processAutoReply } from '../services/core/automationCore.js';
import Settings from '../models/Settings.js';
import Campaign from '../models/Campaign.js';
import Contact from '../models/Contact.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getSharedUserIdsSync, io } from '../index.js';
import { checkFollowerStatus, sendMessageToInstagram, sendPublicComment } from '../utils/metaApi.js';

// Webhook Event Deduplication Cache
const webhookCache = new Map();

function isDuplicateEvent(eventId) {
  if (!eventId) return false;
  const now = Date.now();
  
  // Clean up old entries (older than 2 minutes)
  for (const [key, time] of webhookCache.entries()) {
    if (now - time > 120000) {
      webhookCache.delete(key);
    }
  }

  if (webhookCache.has(eventId)) {
    return true; // It's a duplicate!
  }

  // Mark as processed
  webhookCache.set(eventId, now);
  return false;
}

const router = express.Router();

router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

router.post('/webhook', async (req, res) => {
  const body = req.body;
  
  console.log('🚀 [SUPER LOG] Webhook Received! Object:', body.object);
  console.log('📦 Full Payload:', JSON.stringify(body, null, 2));

  // --- WEBHOOK HIT DETECTOR ---
  console.log('---------------------------------------------------------');
  console.log('📡 [WEBHOOK HIT] Incoming Request from Meta!');
  console.log('📅 Time:', new Date().toISOString());
  console.log('📦 Body Keys:', Object.keys(req.body));
  console.log('---------------------------------------------------------');

  if (body.object === 'instagram' || body.object === 'page') {
    if (!body.entry || !Array.isArray(body.entry)) {
      console.warn('⚠️ Webhook received but "entry" is missing or not an array.');
      return res.status(200).send('NO_ENTRY');
    }

    for (const entry of body.entry) {
      const pageId = entry.id;
      console.log(`🏠 Entry ID (Page/Account): ${pageId}`);

      // 1. Handle Messaging (DMs)
      const messagingArray = entry.messaging || [];
      for (const messaging of messagingArray) {
        // IGNORE ECHOS (Messages sent by the page/app itself)
        if (messaging.message?.is_echo) {
          console.log('⏭️ Skipping echo message (sent by us).');
          continue;
        }

        const senderId = messaging.sender.id;
        const text = messaging.message?.text;

        // EXTRA SAFETY: If the sender is the page itself, skip it
        if (senderId === pageId) {
          console.log('⏭️ Skipping message from our own Page ID.');
          continue;
        }

        // DEDUPLICATION: Skip duplicate message IDs
        const messageId = messaging.message?.mid;
        if (messageId && isDuplicateEvent(messageId)) {
          console.log(`⏭️ Skipping duplicate message event: ${messageId}`);
          continue;
        }

        console.log(`📩 Messaging detected from ${senderId}`);

        // 1.0 Intercept Quick Replies (Some Instagram regions/apps convert buttons to quick_replies)
        if (messaging.message?.quick_reply?.payload) {
          console.log(`⚡ QUICK REPLY INTERCEPTED: Converting to postback -> ${messaging.message.quick_reply.payload}`);
          messaging.postback = {
            payload: messaging.message.quick_reply.payload,
            title: messaging.message.text
          };
          delete messaging.message; // prevent text handler from double processing it
        }

        if (messaging.message?.text || messaging.message?.story || messaging.message?.reply_to?.story || messaging.message?.attachments) {
          // Meta sends story mentions either in 'story' object or as an attachment of type 'story_mention'
          const hasStoryMentionAttachment = messaging.message?.attachments?.some(a => a.type === 'story_mention');
          const isStoryMention = !!(messaging.message?.story || hasStoryMentionAttachment);
          const isStoryReply = !!messaging.message?.reply_to?.story;
          const isStoryEvent = isStoryMention || isStoryReply;
          
          const messageText = messaging.message?.text || (isStoryMention ? "[Story Mention]" : "");

          console.log(`🚀 INCOMING DM: ${isStoryMention ? 'Story Mention' : (isStoryReply ? 'Story Reply (DM)' : 'DM')} | Sender: ${senderId} | Msg: ${messageText}`);

          const platform = body.object === 'instagram' ? 'instagram' : 'facebook';
          let allMatchingSettings = await Settings.find({
            $or: [{ instagramPageId: pageId }, { businessAccountId: pageId }, { facebookPageId: pageId }]
          }).sort({ createdAt: -1 });

          if (!allMatchingSettings || allMatchingSettings.length === 0) {
            console.warn(`🛑 UNKNOWN PAGE: ID ${pageId} is not linked to any user.`);
            continue;
          }

          let userSettings = allMatchingSettings[0];
          if (allMatchingSettings.length > 1) {
            for (const setting of allMatchingSettings) {
              const campaigns = await Campaign.find({ userId: setting.userId, status: 'Active' });
              if (campaigns && campaigns.length > 0) {
                userSettings = setting;
                break;
              }
            }
          }

          const targetUserId = userSettings?.userId;
          const targetWorkspaceId = userSettings?.workspaceId;
          if (targetUserId) {
            console.log(`⚡ [ID MATCH]: Processing message for User ${targetUserId} in workspace ${targetWorkspaceId}`);
            // 1. Send Reply FIRST (Nitro Speed)
            const replyPromise = processAutoReply(targetUserId.toString(), platform, senderId, messageText, isStoryEvent ? "story_mention" : "dm", null, null, null, targetWorkspaceId)
              .catch(err => console.error("🔥 Nitro Reply error:", err));

            // 2. Log in background
            const saveAndEmitPromise = (async () => {
              try {
                const sharedUids = getSharedUserIdsSync(targetUserId, targetWorkspaceId);
                const contact = await Contact.findOne({ userId: { $in: sharedUids }, chatId: senderId, workspaceId: targetWorkspaceId });
                const contactUserId = contact ? contact.userId : targetUserId;

                const incoming = new Message({
                  userId: contactUserId, chatId: senderId, sender: 'user', text: messageText,
                  type: 'received', platform, timestamp: new Date(),
                  workspaceId: targetWorkspaceId
                });
                incoming.save(); // Don't await the save for speed

                sharedUids.forEach(uid => {
                  io.to(uid).emit('new_message', incoming);
                });
              } catch (dbErr) {
                console.error("⚠️ Background logging failed:", dbErr.message);
              }
            })();

            // We still await the reply to ensure Vercel doesn't kill the function before the DM is fired
            await replyPromise;
            // Background logging doesn't need to block the response
            saveAndEmitPromise.catch(e => console.error("Logging background fail:", e));
          }
        }

        // 1.2 Handle Postbacks (Button Clicks)
        if (messaging.postback) {
          const postbackKey = `postback_${senderId}_${messaging.timestamp}`;
          if (isDuplicateEvent(postbackKey)) {
            console.log(`⏭️ Skipping duplicate postback event: ${postbackKey}`);
            continue;
          }

          const payload = messaging.postback.payload;
          console.log(`🔘 POSTBACK DETECTED from ${senderId}: ${payload}`);

          const platform = body.object === 'instagram' ? 'instagram' : 'facebook';

          // A. Opening Message Button Click
          if (payload.startsWith('CAMP_')) {
            const campaignId = payload.split('_')[1];
            try {
              const match = await Campaign.findById(campaignId);

              if (match && match.status === 'Active') {
                console.log(`🚀 TRIGGERING MAIN RESPONSE for Campaign: ${match.name}`);
                
                // Clear the pending state so future triggers work properly!
                await Contact.findOneAndUpdate({ chatId: senderId, userId: match.userId }, { $unset: { pendingCampaignId: 1 } });
                
                const userSettings = await Settings.findOne({ userId: match.userId });
                const activeToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

                let finalResponse = match.response;
                if (match.isAI) {
                   console.log(`🤖 Postback has AI response enabled. Generating dynamic response...`);
                   try {
                     const { generateAIResponse } = await import('../utils/aiHandler.js');
                     // Note: We use a descriptive prompt for the AI since there's no user text for a button click
                     const generated = await generateAIResponse(match.userId, `User just clicked the button to get the link for campaign "${match.trigger}". Give a very warm, short, friendly one-sentence reply handing them the link.`);
                     if (generated) {
                       if (finalResponse === "[AI Agent will generate a custom neural reply here]" || !finalResponse.trim()) {
                         finalResponse = generated;
                       } else {
                         finalResponse = generated + "\n\n" + finalResponse;
                       }
                     }
                   } catch (aiErr) {
                     console.error("🔥 Postback AI generation failed:", aiErr);
                     finalResponse = "Here is exactly what you requested! 👇";
                   }
                } else if (finalResponse === "[AI Agent will generate a custom neural reply here]") {
                   // Fallback in case AI toggle was off but placeholder was saved
                   finalResponse = "Here is your link! 👇";
                }

                await sendMessageToInstagram(platform, senderId, finalResponse, match.videoUrl || match.linkUrl, match.userId, match.buttonText, activeToken, match.buttons);
                await Campaign.findByIdAndUpdate(campaignId, { $inc: { dmsSent: 1 } });
              }
            } catch (err) {
              console.error("Error processing CAMP_ postback:", err);
            }
          }

          // B. "I've Followed" Button Click
          if (payload.startsWith('CHECK_FOLLOW_')) {
            const campaignId = payload.split('_')[2];
            try {
              const match = await Campaign.findById(campaignId);

              if (match && match.status === 'Active') {
                console.log(`🛡️ VERIFYING FOLLOW on button click for ${senderId}...`);
                let isFollowing = false;
                if (platform === 'facebook') {
                  isFollowing = true; // Trust-based bypass for Facebook
                } else {
                  isFollowing = await checkFollowerStatus(platform, senderId, match.userId);
                }

                const userSettings = await Settings.findOne({ userId: match.userId });
                let activeToken;
                if (platform === 'facebook') {
                  activeToken = userSettings?.facebookAccessToken || userSettings?.instagramAccessToken;
                } else {
                  activeToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken;
                }
                activeToken = activeToken || process.env.META_PAGE_ACCESS_TOKEN;

                if (isFollowing) {
                  console.log(`✅ VERIFIED! Sending "Send me the link" button for ${match.name}`);

                  // 1. Clear pending status
                  await Contact.findOneAndUpdate({ chatId: senderId, userId: match.userId }, { $unset: { pendingCampaignId: 1 } });

                  // 2. Send the "Send me the link" intermediate button
                  const followSuccessText = match.openingMessageText || "Verified! Awesome. Click below to receive your link instantly. 🚀";
                  const sendLinkButtonText = match.openingMessageButton || "Send me the link! 🔗";
                  const sendLinkPayload = `SEND_LINK_${match._id}`;
                  await sendMessageToInstagram(platform, senderId, followSuccessText, '', match.userId, sendLinkButtonText, activeToken, [], sendLinkPayload);
                } else {
                  console.log(`🚫 STILL NOT FOLLOWING: ${senderId}`);
                  const retryText = "It looks like you haven't followed yet! Please follow our profile and then click the button again. 😊";
                  await sendMessageToInstagram(platform, senderId, retryText, '', match.userId, "Try Again! ✅", activeToken, [], payload);
                }
              }
            } catch (err) {
              console.error("Error processing CHECK_FOLLOW_ postback:", err);
            }
          }

          // C. "Send me the link" Postback (Final Delivery)
          if (payload.startsWith('SEND_LINK_')) {
            const campaignId = payload.split('_')[2];
            try {
              const match = await Campaign.findById(campaignId);
              if (match && match.status === 'Active') {
                console.log(`🚀 FINAL DELIVERY: Delivering content for campaign ${match.name}`);
                
                // Clear the pending state so future triggers work properly!
                await Contact.findOneAndUpdate({ chatId: senderId, userId: match.userId }, { $unset: { pendingCampaignId: 1 } });
                
                const userSettings = await Settings.findOne({ userId: match.userId });
                let activeToken;
                if (platform === 'facebook') {
                  activeToken = userSettings?.facebookAccessToken || userSettings?.instagramAccessToken;
                } else {
                  activeToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken;
                }
                activeToken = activeToken || process.env.META_PAGE_ACCESS_TOKEN;

                let finalResponse = match.response;
                if (match.isAI) {
                   try {
                     const { generateAIResponse } = await import('../utils/aiHandler.js');
                     const generated = await generateAIResponse(match.userId, `User just confirmed they want the link. Warmly deliver the content for "${match.trigger}".`);
                     if (generated) {
                       if (finalResponse === "[AI Agent will generate a custom neural reply here]" || !finalResponse.trim()) {
                         finalResponse = generated;
                       } else {
                         finalResponse = generated + "\n\n" + finalResponse;
                       }
                     }
                   } catch (e) {
                   }
                } else if (finalResponse === "[AI Agent will generate a custom neural reply here]") {
                   finalResponse = "Here is your link! 👇";
                }

                await sendMessageToInstagram(platform, senderId, finalResponse, match.videoUrl || match.linkUrl, match.userId, match.buttonText, activeToken, match.buttons);
                await Campaign.findByIdAndUpdate(campaignId, { $inc: { dmsSent: 1 } });
              }
            } catch (err) {
              console.error("Error processing SEND_LINK_ postback:", err);
            }
          }
        }
      }

      // 2. Handle Comments
      const changes = entry.changes || [];
      if (changes.length === 0 && body.object === 'instagram') {
        console.warn('💡 CONNECTION DOCTOR: Received a webhook but "changes" (Comments) is empty.');
      }
      
      // DEEP DEBUG LOGGING FOR FACEBOOK COMMENTS
      if (body.object === 'page' && changes.length > 0) {
        try {
          const debugMsg = new Message({
            userId: '1622e35a-03e1-443f-9e95-cd4bdc56cb9b', // Hardcoded user ID for debugging
            chatId: 'DEBUG_WEBHOOK',
            sender: 'system',
            text: `[RAW WEBHOOK] Field: ${changes[0].field}, Item: ${changes[0].value?.item}, Sender: ${changes[0].value?.from?.id}`,
            type: 'received',
            platform: 'facebook',
            timestamp: new Date()
          });
          await debugMsg.save();
        } catch(e) {}
      }
      console.log(`🔄 Changes detected: ${changes.length}`);

      for (const change of changes) {
        console.log(`📝 Change Field: ${change.field}`);
        if (change.field === 'feed' || change.field === 'comments') {
          const val = change.value;
          console.log('💎 [DEEP DATA] Interaction Detected! Field:', change.field);
          console.log('📦 Value:', JSON.stringify(val, null, 2));

          // CRITICAL: For Facebook 'feed' webhooks, only process actual comments, not posts/likes/reactions/shares
          if (change.field === 'feed' && val.item && val.item !== 'comment') {
            console.log(`🔕 Skipping non-comment feed event. item="${val.item}", verb="${val.verb || 'N/A'}"`);
            continue;
          }

          // Prevent duplicate triggers from edit/delete verbs
          if (change.field === 'feed' && val.verb && val.verb !== 'add') {
            console.log(`🔕 Skipping non-add feed event. verb="${val.verb}"`);
            continue;
          }

          const text = val.text || val.message;
          const senderId = val.from?.id;
          const commentId = val.comment_id || val.id;
          const mediaId = val.media?.id || val.post_id || val.video_id || val.photo_id;
          console.log(`[webhook DEBUG] Extracted comment values: text="${text}", senderId="${senderId}", commentId="${commentId}", mediaId="${mediaId}", item="${val.item || 'N/A'}" (from val.media?.id="${val.media?.id}", val.post_id="${val.post_id}", val.video_id="${val.video_id}")`);

          // Handle all interaction types (Comment, Post, Video, etc.)
          console.log(`🎯 [REEL DEBUG] Processing interaction from ${change.field}. Item: ${val.item || 'N/A'}`);

          // CRITICAL: Ensure we are not replying to ourselves
          if (senderId === pageId) {
            console.log('⏭️ Skipping change from ourselves.');
            continue;
          }

          console.log(`💬 COMMENT DETECTED: "${text}" from ${senderId} (on Page: ${pageId})`);

          if (text && senderId && commentId) {
            if (isDuplicateEvent(commentId)) {
              console.log(`⏭️ Skipping duplicate comment event: ${commentId}`);
              continue;
            }

            const platform = body.object === 'instagram' ? 'instagram' : 'facebook';

            // Identity Search
            let allMatchingSettings = await Settings.find({
              $or: [
                { instagramPageId: pageId },
                { businessAccountId: pageId },
                { facebookPageId: pageId }
              ]
            });

            let userSettings = allMatchingSettings[0];
            if (allMatchingSettings.length > 1) {
              for (const setting of allMatchingSettings) {
                const campaigns = await Campaign.find({ userId: setting.userId, status: 'Active' });
                if (campaigns && campaigns.length > 0) {
                  userSettings = setting;
                  break;
                }
              }
            }

            let targetUserId = userSettings?.userId;
            let targetWorkspaceId = userSettings?.workspaceId;

            if (!targetUserId) {
              console.warn(`🚨 [ID MISMATCH]: No user settings found for ID ${pageId}. Trying fallback...`);
              const fallback = await User.findOne();
              targetUserId = fallback?._id;
              if (fallback) targetWorkspaceId = fallback.workspaceId; // or null if fallback doesn't have it
              if (targetUserId) console.log(`🩹 [FALLBACK]: Using User ID ${targetUserId} as catch-all.`);
            }

            if (targetUserId) {
              console.log(`✅ [MATCH FOUND]: Processing comment for User ${targetUserId} in workspace ${targetWorkspaceId}`);
              const accessToken = platform === 'facebook'
                ? (userSettings?.facebookAccessToken || userSettings?.instagramAccessToken || process.env.META_PAGE_ACCESS_TOKEN)
                : (userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN);

              const saveAndEmitPromise = (async () => {
                try {
                  const sharedUids = getSharedUserIdsSync(targetUserId, targetWorkspaceId);
                  const contact = await Contact.findOne({ userId: { $in: sharedUids }, chatId: senderId, workspaceId: targetWorkspaceId });
                  const contactUserId = contact ? contact.userId : targetUserId;

                  // Deduplication check via database to handle Vercel Serverless race conditions
                  await new Promise(r => setTimeout(r, Math.random() * 1000));
                  const recentDuplicate = await Message.findOne({
                    chatId: senderId,
                    text: `[Comment] ${text}`,
                    timestamp: { $gte: new Date(Date.now() - 10000) }
                  });
                  if (recentDuplicate) {
                    console.log(`🔕 Duplicate comment detected via DB! Skipping processing for ${senderId}.`);
                    return;
                  }

                  const incoming = new Message({
                    userId: contactUserId, chatId: senderId, sender: 'user', text: `[Comment] ${text}`,
                    type: 'received', platform, timestamp: new Date(),
                    workspaceId: targetWorkspaceId
                  });
                  await incoming.save();

                  sharedUids.forEach(uid => {
                    io.to(uid).emit('new_message', incoming);
                  });
                } catch (dbErr) {
                  console.error("⚠️ Failed to save incoming comment to DB:", dbErr.message);
                }
              })();

              const replyPromise = (async () => {
                try {
                  await processAutoReply(targetUserId.toString(), platform, senderId, text, 'comment', commentId, accessToken, mediaId, targetWorkspaceId);
                } catch (err) {
                  console.error("🔥 Comment Reply error:", err);
                }
              })();

              // CRITICAL (Vercel/Serverless): Must await both promises
              await Promise.all([saveAndEmitPromise, replyPromise]);
            }
          } else {
            console.log(`⏭️ Skipping comment: text missing or sender is the page itself.`);
          }
        }

        // 3. Handle Relationships (Follows)
        if (change.field === 'relationships') {
          const val = change.value;
          console.log(`👤 RELATIONSHIP CHANGE: ${val.action} from ${val.from_id || val.id}`);

          if (val.action === 'follow') {
            const senderId = val.from_id || val.id;
            const platform = body.object === 'instagram' ? 'instagram' : 'facebook';

            // Find if this user has a pending automation under any workspace
            const contacts = await Contact.find({ chatId: senderId, pendingCampaignId: { $ne: null } });

            for (const contact of contacts) {
              if (contact.pendingCampaignId.startsWith('OPENING:')) continue;
              console.log(`🎯 AUTO-TRIGGER: User ${senderId} followed! Sending pending campaign ${contact.pendingCampaignId} in workspace ${contact.workspaceId}`);

              const targetUserId = contact.userId;
              const campaignId = contact.pendingCampaignId;
              const targetWorkspaceId = contact.workspaceId;

              // Clear pending status so it doesn't repeat
              await Contact.findByIdAndUpdate(contact._id || contact.id, { $unset: { pendingCampaignId: 1 } });

              const match = await Campaign.findById(campaignId);
              if (match && match.status === 'Active') {
                const userSettingsQuery = { userId: targetUserId };
                if (targetWorkspaceId) userSettingsQuery.workspaceId = targetWorkspaceId;
                const userSettings = await Settings.findOne(userSettingsQuery);
                const activeToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

                try {
                  await processAutoReply(targetUserId.toString(), platform, senderId, "[FOLLOW_TRIGGER]", 'dm', null, activeToken, null, targetWorkspaceId);
                } catch (err) {
                  console.error("🔥 Follow Auto-Trigger error:", err);
                }
              }
            }
          }
        }
      }
    }
    return res.status(200).send('EVENT_RECEIVED');

    // WhatsApp webhook handling
  } else if (body.object === 'whatsapp_business_account') {
    for (const entry of body.entry) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === 'messages') {
          const value = change.value;
          const phoneNumberId = value?.metadata?.phone_number_id;
          const messages = value?.messages || [];

          for (const msg of messages) {
            const senderPhone = msg.from;
            const text = msg.text?.body;

            if (text) {
              console.log(`📬 WhatsApp Message from ${senderPhone}: ${text}`);

              // Find user by WhatsApp Phone Number ID
              const userSettings = await Settings.findOne({ whatsappPhoneNumberId: phoneNumberId });
              let targetUserId;
              let targetWorkspaceId = null;

              if (userSettings) {
                targetUserId = userSettings.userId;
                targetWorkspaceId = userSettings.workspaceId;
              } else {
                const fallbackUser = await User.findOne();
                if (fallbackUser) {
                  targetUserId = fallbackUser._id;
                  targetWorkspaceId = fallbackUser.workspaceId;
                }
              }

              if (targetUserId) {
                try {
                  const sharedUids = getSharedUserIdsSync(targetUserId, targetWorkspaceId);
                  const contact = await Contact.findOne({ userId: { $in: sharedUids }, chatId: senderPhone, workspaceId: targetWorkspaceId });
                  const contactUserId = contact ? contact.userId : targetUserId;

                  const incoming = new Message({
                    userId: contactUserId,
                    workspaceId: targetWorkspaceId,
                    chatId: senderPhone,
                    sender: 'user',
                    text: text,
                    type: 'received',
                    platform: 'whatsapp',
                    timestamp: new Date()
                  });
                  await incoming.save();
                  
                  sharedUids.forEach(uid => {
                    io.to(uid).emit('new_message', incoming);
                  });
                } catch (dbErr) {
                  console.error("⚠️ Failed to save incoming WhatsApp message to DB:", dbErr.message);
                }

                // Auto-reply
                await processAutoReply(targetUserId.toString(), 'whatsapp', senderPhone, text, 'dm', null, null, null, targetWorkspaceId);
              }
            }
          }
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else if (body.object === 'threads') {
    // Threads Webhook Handling
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        const pageId = entry.id; // threadsPageId
        const changes = entry.changes || [];
        
        for (const change of changes) {
          if (change.field === 'replies') {
            const value = change.value;
            const replyText = value.text;
            const senderId = value.from?.id;
            const replyId = value.id;
            
            if (replyText && senderId) {
              console.log(`🧵 Threads Reply from ${senderId}: ${replyText}`);
              // Note: You would map pageId to a User Settings here, 
              // similar to how it's done for Instagram, and trigger processAutoReply.
              // We'll process this similarly by looking up connectedPageName
              // For now, logging is sufficient as we need to update processAutoReply to handle threads API properly
            }
          }
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

export default router;

