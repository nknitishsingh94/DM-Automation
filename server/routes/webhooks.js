import express from 'express';
import crypto from 'crypto';
import { processAutoReply } from '../services/core/automationCore.js';
import Settings from '../models/Settings.js';
import Campaign from '../models/Campaign.js';
import Contact from '../models/Contact.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getSharedUserIdsSync, io } from '../index.js';
import { checkFollowerStatus, sendMessageToInstagram, sendPublicComment } from '../utils/metaApi.js';

const webhookCache = new Map();

function isDuplicateEvent(eventId) {
  if (!eventId) return false;
  const now = Date.now();
  
  for (const [key, time] of webhookCache.entries()) {
    if (now - time > 120000) {
      webhookCache.delete(key);
    }
  }

  if (webhookCache.has(eventId)) {
    return true; // It's a duplicate!
  }

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


router.get('/webhook/twitter', (req, res) => {
  const crcToken = req.query.crc_token;
  if (crcToken) {
    const consumerSecret = process.env.TWITTER_API_SECRET;
    if (!consumerSecret) {
      console.error('Missing TWITTER_API_SECRET environment variable for CRC check.');
      return res.status(500).send('Server configuration error');
    }
    const hash = crypto.createHmac('sha256', consumerSecret).update(crcToken).digest('base64');
    res.status(200).json({ response_token: `sha256=${hash}` });
  } else {
    res.status(400).send('Error: crc_token missing from request.');
  }
});

router.post('/webhook/twitter', async (req, res) => {
  const body = req.body;
  
  console.log('🐦 [TWITTER WEBHOOK] Received Event!');
  console.log('📦 Payload Keys:', Object.keys(body));
  
  res.status(200).send('EVENT_RECEIVED');

  try {
    if (body.direct_message_events) {
      console.log(`💬 Received ${body.direct_message_events.length} Direct Message(s)`);
    }
    
    if (body.tweet_create_events) {
      console.log(`🐦 Received ${body.tweet_create_events.length} Tweet Create Event(s)`);
    }

  } catch (error) {
    console.error('❌ Error processing Twitter webhook:', error);
  }
});


router.post('/webhook', async (req, res) => {
  const body = req.body;
  
  console.log('🚀 [SUPER LOG] Webhook Received! Object:', body.object);
  console.log('📦 Full Payload:', JSON.stringify(body, null, 2));

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

      const messagingArray = entry.messaging || [];
      for (const messaging of messagingArray) {
        if (messaging.message?.is_echo) {
          console.log('⏭️ Skipping echo message (sent by us).');
          continue;
        }

        const senderId = messaging.sender.id;
        const text = messaging.message?.text;

        if (senderId === pageId) {
          console.log('⏭️ Skipping message from our own Page ID.');
          continue;
        }

        const messageId = messaging.message?.mid;
        if (messageId && isDuplicateEvent(messageId)) {
          console.log(`⏭️ Skipping duplicate message event: ${messageId}`);
          continue;
        }

        console.log(`📩 Messaging detected from ${senderId}`);

        if (messaging.message?.quick_reply?.payload) {
          console.log(`⚡ QUICK REPLY INTERCEPTED: Converting to postback -> ${messaging.message.quick_reply.payload}`);
          messaging.postback = {
            payload: messaging.message.quick_reply.payload,
            title: messaging.message.text
          };
          delete messaging.message; // prevent text handler from double processing it
        }

        if (messaging.message?.text || messaging.message?.story || messaging.message?.reply_to?.story || messaging.message?.attachments) {
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
            const replyPromise = processAutoReply(targetUserId.toString(), platform, senderId, messageText, isStoryEvent ? "story_mention" : "dm", null, null, null, targetWorkspaceId)
              .catch(err => console.error("🔥 Nitro Reply error:", err));

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

            await replyPromise;
            saveAndEmitPromise.catch(e => console.error("Logging background fail:", e));
          }
        }

        if (messaging.postback) {
          const payload = messaging.postback.payload;
          const postbackKey = `postback_${senderId}_${payload}_${messaging.timestamp || Date.now()}`;
          if (messaging.timestamp && isDuplicateEvent(postbackKey)) {
            console.log(`⏭️ Skipping duplicate postback event: ${postbackKey}`);
            continue;
          }

          console.log(`🔘 POSTBACK DETECTED from ${senderId}: ${payload}`);

          const platform = body.object === 'instagram' ? 'instagram' : 'facebook';

          if (payload.startsWith('CAMP_')) {
            const campaignId = payload.split('_')[1];
            try {
              const match = await Campaign.findById(campaignId);

              if (match && match.status === 'Active') {
                console.log(`🚀 TRIGGERING MAIN RESPONSE for Campaign: ${match.name}`);
                
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
                   console.log(`🤖 Postback has AI response enabled. Generating dynamic response...`);
                   try {
                     const { generateAIResponse } = await import('../utils/aiHandler.js');
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
                   finalResponse = "Here is your link! 👇";
                }

                await sendMessageToInstagram(platform, senderId, finalResponse, match.videoUrl || match.linkUrl, match.userId, match.buttonText, activeToken, match.buttons);
                await Campaign.findByIdAndUpdate(campaignId, { $inc: { dmsSent: 1 } });
              }
            } catch (err) {
              console.error("Error processing CAMP_ postback:", err);
            }
          }

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

                  const contact = await Contact.findOne({ chatId: senderId, userId: match.userId });
                  let currentTags = contact && Array.isArray(contact.tags) ? [...contact.tags] : [];
                  if (!currentTags.includes('Follower')) currentTags.push('Follower');
                  await Contact.findOneAndUpdate({ chatId: senderId, userId: match.userId }, { $unset: { pendingCampaignId: 1 }, tags: currentTags });

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

          if (payload.startsWith('SEND_LINK_')) {
            const campaignId = payload.split('_')[2];
            try {
              const match = await Campaign.findById(campaignId);
              if (match && match.status === 'Active') {
                console.log(`🚀 FINAL DELIVERY: Delivering content for campaign ${match.name}`);
                
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

      const changes = entry.changes || [];
      if (changes.length === 0 && body.object === 'instagram') {
        console.warn('💡 CONNECTION DOCTOR: Received a webhook but "changes" (Comments) is empty.');
      }
      
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
        if (change.field === 'feed' || change.field === 'comments' || change.field === 'live_comments') {
          const val = change.value;
          console.log('💎 [DEEP DATA] Interaction Detected! Field:', change.field);
          console.log('📦 Value:', JSON.stringify(val, null, 2));

          if (change.field === 'feed' && val.item && val.item !== 'comment') {
            console.log(`🔕 Skipping non-comment feed event. item="${val.item}", verb="${val.verb || 'N/A'}"`);
            continue;
          }

          if (change.field === 'feed' && val.verb && val.verb !== 'add') {
            console.log(`🔕 Skipping non-add feed event. verb="${val.verb}"`);
            continue;
          }

          const text = val.text || val.message;
          const senderId = val.from?.id;
          const commentId = val.comment_id || val.id;
          const mediaId = val.media?.id || val.post_id || val.video_id || val.photo_id;
          console.log(`[webhook DEBUG] Extracted comment values: text="${text}", senderId="${senderId}", commentId="${commentId}", mediaId="${mediaId}", item="${val.item || 'N/A'}" (from val.media?.id="${val.media?.id}", val.post_id="${val.post_id}", val.video_id="${val.video_id}")`);

          console.log(`🎯 [REEL DEBUG] Processing interaction from ${change.field}. Item: ${val.item || 'N/A'}`);

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

              await Promise.all([saveAndEmitPromise, replyPromise]);
            }
          } else {
            console.log(`⏭️ Skipping comment: text missing or sender is the page itself.`);
          }
        }

        if (change.field === 'relationships') {
          const val = change.value;
          console.log(`👤 RELATIONSHIP CHANGE: ${val.action} from ${val.from_id || val.id}`);

          if (val.action === 'follow') {
            const senderId = val.from_id || val.id;
            const platform = body.object === 'instagram' ? 'instagram' : 'facebook';

            const contacts = await Contact.find({ chatId: senderId, pendingCampaignId: { $ne: null } });

            for (const contact of contacts) {
              if (contact.pendingCampaignId.startsWith('OPENING:')) continue;
              console.log(`🎯 AUTO-TRIGGER: User ${senderId} followed! Sending pending campaign ${contact.pendingCampaignId} in workspace ${contact.workspaceId}`);

              const targetUserId = contact.userId;
              const campaignId = contact.pendingCampaignId;
              const targetWorkspaceId = contact.workspaceId;

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

                await processAutoReply(targetUserId.toString(), 'whatsapp', senderPhone, text, 'dm', null, null, null, targetWorkspaceId);
              }
            }
          }
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else if (body.object === 'threads') {
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

              const processThreadsReply = async () => {
                try {
                  const allMatchingSettings = await Settings.find({ threadsPageId: pageId });
                  if (allMatchingSettings && allMatchingSettings.length > 0) {
                    const userSettings = allMatchingSettings[0];
                    const targetUserId = userSettings.userId;
                    const targetWorkspaceId = userSettings.workspaceId;
                    
                    await processAutoReply(targetUserId.toString(), 'threads', senderId, replyText, 'comment', replyId, userSettings.threadsAccessToken, null, targetWorkspaceId);
                  }
                } catch (e) {
                  console.error("🔥 Threads AutoReply Error:", e);
                }
              };
              
              processThreadsReply();
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

