import Settings from '../../models/Settings.js';
import Contact from '../../models/Contact.js';
import Campaign from '../../models/Campaign.js';
import Flow from '../../models/Flow.js';
import Message from '../../models/Message.js';
import User from '../../models/User.js';
import { sendMessageToInstagram, sendPublicComment, checkFollowerStatus } from '../../utils/metaApi.js';
import { generateAIResponse } from '../../utils/aiHandler.js';
import { getSharedUserIdsSync, settingsCache, campaignsCache, io, runFlow } from '../../index.js';

export const processAutoReply = async (userId, platform, chatId, text, source = 'dm', commentId = null, passedToken = null, mediaId = null, workspaceId = null) => {
  const queryUserId = userId;
  
  text = typeof text === 'string' ? text : '';
  
  let userSettingsQuery = { userId };
  let contactQuery = { userId, chatId };
  if (workspaceId) {
    const sharedUids = getSharedUserIdsSync(userId, workspaceId);
    userSettingsQuery.workspaceId = workspaceId;
    contactQuery = { userId: { $in: sharedUids }, chatId, workspaceId };
  }
  
  let cachedSettings = null;
  if (workspaceId) {
    cachedSettings = settingsCache.get(`${userId.toString()}_${workspaceId.toString()}`);
  } else {
    for (const [key, s] of settingsCache.entries()) {
      if (key.startsWith(`${userId.toString()}_`)) {
        cachedSettings = s;
        break;
      }
    }
  }

  const [contact, userSettings] = await Promise.all([
    Contact.findOne(contactQuery),
    cachedSettings ? Promise.resolve(cachedSettings) : Settings.findOne(userSettingsQuery)
  ]);

  if (contact && contact.isBotMuted) {
    console.log(`🔇 Bot is muted for contact ${chatId}. Skipping auto-reply.`);
    return { skipped: true, reason: 'muted' };
  }

  if (contact && contact.pendingCampaignId && !contact.pendingCampaignId.startsWith('OPENING:')) {
    console.log(`📡 [DESKTOP FALLBACK] User ${chatId} has pending campaign ${contact.pendingCampaignId}. Checking follow status...`);
    
    const pendingId = contact.pendingCampaignId;
    const match = await Campaign.findById(pendingId);
    if (match && match.status === 'Active') {
      let isFollowing = (contact && Array.isArray(contact.tags) && contact.tags.includes('Follower')) ? true : (platform === 'facebook' ? true : await checkFollowerStatus(platform, chatId, userId, userSettings));
      
      const activeToken = passedToken || (platform === 'facebook' ? (userSettings?.facebookAccessToken || userSettings?.instagramAccessToken) : (userSettings?.instagramAccessToken || userSettings?.facebookAccessToken)) || process.env.META_PAGE_ACCESS_TOKEN;
      
      if (isFollowing) {
        if (contact && !(Array.isArray(contact.tags) && contact.tags.includes('Follower'))) {
          let updatedTags = Array.isArray(contact.tags) ? [...contact.tags] : [];
          if (!updatedTags.includes('Follower')) updatedTags.push('Follower');
          await Contact.findOneAndUpdate(contactQuery, { tags: updatedTags });
        }
        console.log(`🔓 [DESKTOP SUCCESS] User ${chatId} has now followed! Triggering pending campaign.`);
        let updatedTags = Array.isArray(contact.tags) ? [...contact.tags] : [];
        if (!updatedTags.includes('Follower')) updatedTags.push('Follower');
        await Contact.findOneAndUpdate(contactQuery, { $unset: { pendingCampaignId: 1 }, tags: updatedTags });
        
        if (match.openingMessage && match.openingMessageText) {
          console.log(`📩 Sending OPENING MESSAGE after follow for ${match.name}`);
          const btnText = match.openingMessageButton || "Click to Continue 👇";
          const payload = `CAMP_${match._id}`;
          
          const openingSent = await sendMessageToInstagram(platform, chatId, match.openingMessageText, '', userId, btnText, activeToken, [], payload);
          if (openingSent) {
            await Contact.findOneAndUpdate(
              contactQuery,
              { pendingCampaignId: `OPENING:${match._id}`, lastActive: new Date() },
              { upsert: true }
            );
            return { opening_message_sent: true };
          }
        }
        
        await sendMessageToInstagram(platform, chatId, match.response, match.videoUrl || match.linkUrl, userId, match.buttonText, activeToken, match.buttons);
        await Campaign.findByIdAndUpdate(pendingId, { $inc: { dmsSent: 1 } });
        return { pending_triggered: true };
      } else {
        console.log(`🚫 [DESKTOP FAIL] User ${chatId} still not following. Sending buttons!`);
        const followText = match.unfollowedResponse || "It looks like you haven't followed us yet! Please follow our profile and then click the button below. 👇";
        const checkFollowPayload = `CHECK_FOLLOW_${match._id}`;
        let profileUrl;
        if (platform === 'facebook') {
          const fbId = userSettings?.facebookPageId;
          profileUrl = fbId ? `https://www.facebook.com/${fbId}` : `https://www.facebook.com/`;
        } else {
          const igUsername = userSettings?.connectedInstagramName || userSettings?.instagramUsername;
          profileUrl = igUsername ? `https://www.instagram.com/${igUsername.replace('@', '')}/` : `https://www.instagram.com/`;
        }
        
        const followButtons = [
          { text: 'View Profile', url: profileUrl },
          { text: "I've Followed! ✅", payload: checkFollowPayload }
        ];
        await sendMessageToInstagram(platform, chatId, followText, '', userId, '', activeToken, followButtons, '');
        return { pending_retry: true };
      }
    }
  }

  if (contact && contact.pendingCampaignId && contact.pendingCampaignId.startsWith('OPENING:')) {
    const pendingId = contact.pendingCampaignId.replace('OPENING:', '');
    const match = await Campaign.findById(pendingId);

    if (match && match.status === 'Active') {
      const btnText = (match.openingMessageButton || "Send me the link!").toLowerCase().trim();
      const incomingText = (text || '').toLowerCase().trim();
      
      if (incomingText === btnText || incomingText === 'yes' || incomingText.includes("send")) {
        console.log(`🔓 [DESKTOP SUCCESS] User ${chatId} replied correctly to Opening Message. Triggering final response.`);
        await Contact.findOneAndUpdate(contactQuery, { $unset: { pendingCampaignId: 1 } });

        const activeToken = passedToken || (platform === 'facebook' ? (userSettings?.facebookAccessToken || userSettings?.instagramAccessToken) : (userSettings?.instagramAccessToken || userSettings?.facebookAccessToken)) || process.env.META_PAGE_ACCESS_TOKEN;
        
        let finalResponse = match.response;
        if (match.isAI) {
           try {
             const generated = await generateAIResponse(match.userId, `User just confirmed they want the link. Warmly deliver the content for "${match.triggerKeyword || match.trigger}".`, workspaceId);
             if (generated) {
               finalResponse = generated;
             }
           } catch (e) {
             finalResponse = "Here it is! Click the button below! 👇";
           }
        }

        await sendMessageToInstagram(platform, chatId, finalResponse, match.videoUrl || match.linkUrl, userId, match.buttonText, activeToken, match.buttons);
        await Campaign.findByIdAndUpdate(pendingId, { $inc: { dmsSent: 1 } });
        return { opening_triggered: true };
      } else {
        await Contact.findOneAndUpdate(contactQuery, { $unset: { pendingCampaignId: 1 } });
      }
    }
  } else if (contact && contact.pendingCampaignId && !contact.pendingCampaignId.includes(':')) {
    const incomingText = (text || '').toLowerCase().trim();
    if (incomingText === 'yes' || incomingText.includes("i've followed") || incomingText.includes("ive followed")) {
      const match = await Campaign.findById(contact.pendingCampaignId);
      if (match && match.status === 'Active') {
        let isFollowing = (contact && Array.isArray(contact.tags) && contact.tags.includes('Follower')) ? true : (platform === 'facebook' ? true : await checkFollowerStatus(platform, chatId, userId, userSettings));

        if (isFollowing) {
          if (contact && !(Array.isArray(contact.tags) && contact.tags.includes('Follower'))) {
            let updatedTags = Array.isArray(contact.tags) ? [...contact.tags] : [];
            if (!updatedTags.includes('Follower')) updatedTags.push('Follower');
            await Contact.findOneAndUpdate(contactQuery, { tags: updatedTags });
          }
          console.log(`🔓 [DESKTOP SUCCESS] User ${chatId} replied correctly to Follow Gate.`);
          let updatedTags = Array.isArray(contact.tags) ? [...contact.tags] : [];
          if (!updatedTags.includes('Follower')) updatedTags.push('Follower');
          await Contact.findOneAndUpdate(contactQuery, { $unset: { pendingCampaignId: 1 }, tags: updatedTags });
          const activeToken = passedToken || (platform === 'facebook' ? (userSettings?.facebookAccessToken || userSettings?.instagramAccessToken) : (userSettings?.instagramAccessToken || userSettings?.facebookAccessToken)) || process.env.META_PAGE_ACCESS_TOKEN;
          
          let finalResponse = match.response;
          await sendMessageToInstagram(platform, chatId, finalResponse, match.videoUrl || match.linkUrl, userId, match.buttonText, activeToken, match.buttons);
          await Campaign.findByIdAndUpdate(match._id, { $inc: { dmsSent: 1 } });
          return { follow_triggered: true };
        }
      }
    }
  }

  const sharedUids = getSharedUserIdsSync(userId, workspaceId);
  let cachedCampaignsMerged = [];
  let allCached = true;
  for (const uid of sharedUids) {
    const key = workspaceId ? `${uid}_${workspaceId}` : uid;
    const cached = campaignsCache.get(key);
    if (cached) {
      cachedCampaignsMerged.push(...cached);
    } else {
      allCached = false;
    }
  }

  const flowQuery = { userId: { $in: sharedUids }, status: 'Active' };
  if (workspaceId) flowQuery.workspaceId = workspaceId;
  const campaignQuery = { userId: { $in: sharedUids }, status: 'Active' };
  if (workspaceId) campaignQuery.workspaceId = workspaceId;

  const [activeFlows, activeCampaignsRaw] = await Promise.all([
    Flow.find(flowQuery),
    allCached ? Promise.resolve(cachedCampaignsMerged) : Campaign.find(campaignQuery)
  ]);

  const matchedFlow = activeFlows.find(f => {
    if (!f.triggerKeyword) return false;
    const keywords = f.triggerKeyword.split(',').map(k => k.toLowerCase().replace(/\s+/g, ' ').trim());
    const cleanUserMsg = text.toLowerCase().replace(/\s+/g, ' ').trim();
    return keywords.some(k => k === '*' || cleanUserMsg.includes(k));
  });

  if (matchedFlow) {
    console.log(`🌊 FLOW MATCH: Triggering Flow "${matchedFlow.name}" for Sender: ${chatId}`);
    await runFlow(userId, matchedFlow._id, chatId, platform, text, commentId, workspaceId);
    if (source === 'comment' && commentId) {
      const activeToken = passedToken || (platform === 'facebook' ? (userSettings?.facebookAccessToken || userSettings?.instagramAccessToken) : (userSettings?.instagramAccessToken || userSettings?.facebookAccessToken)) || process.env.META_PAGE_ACCESS_TOKEN;
      const replyText = matchedFlow.publicReplyText || `Check your DMs! 🚀 I've sent you the info.`;
      await sendPublicComment(platform, commentId, replyText, userId, activeToken);
    }
    return { flow: matchedFlow.name };
  }

  let activeCampaigns = activeCampaignsRaw.sort((a, b) => {
    const aSpecificPost = a.postId && a.postId !== 'any' && a.postId !== '' && String(a.postId) !== 'undefined' && String(a.postId) !== 'null';
    const bSpecificPost = b.postId && b.postId !== 'any' && b.postId !== '' && String(b.postId) !== 'undefined' && String(b.postId) !== 'null';
    if (aSpecificPost && !bSpecificPost) return -1;
    if (!aSpecificPost && bSpecificPost) return 1;
    if (a.trigger === '*' && b.trigger !== '*') return 1;
    if (a.trigger !== '*' && b.trigger === '*') return -1;
    return 0;
  });

  const match = activeCampaigns.find(c => {
    const platformMatch = !c.platform || c.platform === 'all' || c.platform === (platform || 'instagram');
    const hasTriggerDms = c.triggerOnDms === true;
    const hasTriggerComments = c.triggerOnComments === true;
    const hasTriggerStories = c.triggerOnStories === true;
    const hasNoTriggerFlags = !hasTriggerDms && !hasTriggerComments && !hasTriggerStories;
    const triggerDms = hasTriggerDms || c.triggerSource === 'dm' || (hasNoTriggerFlags && !c.triggerSource);
    const triggerComments = hasTriggerComments || c.triggerSource === 'comment';
    const triggerStories = hasTriggerStories || c.triggerSource === 'story_mention';

    const sourceMatch = (source === 'dm' && triggerDms) ||
      (source === 'comment' && triggerComments) ||
      (source === 'story_mention' && triggerStories) ||
      (platform === 'facebook' && source === 'dm' && triggerStories);

    const cleanUserMsg = text.toLowerCase().replace(/\s+/g, ' ').trim();
    const keywords = (c.trigger || '').split(',').map(k => k.toLowerCase().replace(/\s+/g, ' ').trim());
    const keywordMatch = keywords.some(k => {
      if (!k) return false;
      if (k === '*') return true;
      return cleanUserMsg.includes(k);
    });

    let postMatch = true;
    if (source === 'comment') {
      const isPostIdValid = c.postId && c.postId !== 'any' && c.postId !== '' && String(c.postId) !== 'undefined' && String(c.postId) !== 'null';
      if (isPostIdValid) {
        postMatch = !!(mediaId && String(c.postId) === String(mediaId));
      } else {
        const hasNoSpecificPost = !c.postId || String(c.postId) === 'undefined' || String(c.postId) === 'null' || String(c.postId) === 'any' || String(c.postId) === '';
        postMatch = !!(c.isUniversal || c.isAnyPost || hasNoSpecificPost);
      }
    }

    return !!(platformMatch && sourceMatch && keywordMatch && postMatch);
  });

  if (match) {
    let activeToken = passedToken || (platform === 'facebook' ? (userSettings?.facebookAccessToken || userSettings?.instagramAccessToken) : (userSettings?.instagramAccessToken || userSettings?.facebookAccessToken)) || process.env.META_PAGE_ACCESS_TOKEN;

    if (match.requireFollow) {
      console.log(`🚀 UNIVERSAL GATING: Checking follower status for ${chatId}...`);
      let isFollowing = false;
      if (contact && Array.isArray(contact.tags) && contact.tags.includes('Follower')) {
        isFollowing = true;
      } else if (platform === 'facebook') {
        isFollowing = Array.isArray(contact?.tags) && contact.tags.includes('FacebookFollower');
      } else {
        isFollowing = await checkFollowerStatus(platform, chatId, userId, userSettings);
        if (isFollowing) {
           let currentTags = contact ? (Array.isArray(contact.tags) ? [...contact.tags] : []) : [];
           if (!currentTags.includes('Follower')) currentTags.push('Follower');
           await Contact.findOneAndUpdate(contactQuery, { tags: currentTags }, { upsert: true });
        }
      }

      if (!isFollowing) {
        const followText = match.unfollowedResponse || "Hey! Please follow our account first to get the link! 👇";
        const checkFollowPayload = `CHECK_FOLLOW_${match._id}`;
        let profileUrl;
        if (platform === 'facebook') {
          const fbId = userSettings?.facebookPageId;
          profileUrl = fbId ? `https://www.facebook.com/${fbId}` : `https://www.facebook.com/`;
        } else {
          const igUsername = userSettings?.connectedInstagramName || userSettings?.instagramUsername;
          profileUrl = igUsername ? `https://www.instagram.com/${igUsername.replace('@', '')}/` : `https://www.instagram.com/`;
        }

        const followButtons = [
          { text: 'View Profile', url: profileUrl },
          { text: "I've Followed! ✅", payload: checkFollowPayload }
        ];
        await sendMessageToInstagram(platform, chatId, followText, '', userId, '', activeToken, followButtons, '', commentId);

        if (source === 'comment' && commentId) {
          const thanksReplies = ["Thanks for your comment! Check DMs! 👇", "Thanks! I've sent you the info in your DMs! 👇", "I've sent the details to your inbox! Thanks for reaching out! ✅", "Check your DMs! I just sent it over. Thanks! ✅"];
          let publicGated = match.publicReplyText || thanksReplies[Math.floor(Math.random() * thanksReplies.length)];
          await sendPublicComment(platform, commentId, publicGated, userId, activeToken);
        }

        await Contact.findOneAndUpdate(contactQuery, { pendingCampaignId: match._id, lastActive: new Date() }, { upsert: true });
        return { gated: true };
      }
    }

    if (match.openingMessage && match.openingMessageText) {
      const btnText = match.openingMessageButton || "Click to Continue 👇";
      const payload = `CAMP_${match._id}`;

      if (source === 'comment' && commentId) {
        let replyText = match.publicReplyText || `Check your DMs! 👇 I've sent you the info.`;
        await sendPublicComment(platform, commentId, replyText, userId, activeToken).catch(e => console.error(e));
      }

      const openingSent = await sendMessageToInstagram(platform, chatId, match.openingMessageText, '', userId, btnText, activeToken, [], payload, commentId);
      if (openingSent) {
        const queryForUpsert = { chatId, userId };
        if (workspaceId) queryForUpsert.workspaceId = workspaceId;
        await Contact.findOneAndUpdate(queryForUpsert, { pendingCampaignId: `OPENING:${match._id}`, lastActive: new Date() }, { upsert: true });
        return { opening_message_sent: true };
      }
    }

    let finalResponse = match.response;
    if (match.isAI) {
      try {
        const { default: Message } = await import('../../models/Message.js');
        const recentMessages = await Message.find({ chatId, userId }).sort({ timestamp: -1 }).limit(10);
        const historyStr = recentMessages.reverse().map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
        
        let aiPrompt = text;
        if (match.name === 'Universal Trigger - AI Flow' || match.response.includes('automated workflow')) {
           aiPrompt = `System Instructions: ${match.response}\n\nRecent Conversation History:\n${historyStr}\n\nCurrent User Message: "${text}"`;
        } else {
           aiPrompt = `System Instructions: Use the following prompt as context: ${match.response}\n\nRecent Conversation:\n${historyStr}\n\nUser: ${text}`;
        }
        
        const generated = await generateAIResponse(userId, aiPrompt, workspaceId);
        if (generated) finalResponse = generated;
      } catch (aiErr) {
        console.error("AI Flow Gen Error:", aiErr);
      }
    }
    const dmPromise = sendMessageToInstagram(platform, chatId, finalResponse, match.videoUrl || match.linkUrl, userId, match.buttonText, activeToken, match.buttons, '', commentId);

    let commentPromise = Promise.resolve(true);
    if (source === 'comment' && commentId) {
      const thanksReplies = ["Thanks for your comment! Check DMs! 👇", "Thanks! I've sent you the info in your DMs! 👇", "I've sent the details to your inbox! Thanks for reaching out! ✅", "Check your DMs! I just sent it over. Thanks! ✅"];
      let replyText = match.publicReplyText || thanksReplies[Math.floor(Math.random() * thanksReplies.length)];
      commentPromise = sendPublicComment(platform, commentId, replyText, userId, activeToken);
    }

    const [sent, commentResult] = await Promise.all([dmPromise, commentPromise]);
    const commentSent = commentResult?.success !== false; // handle both boolean (true from older code) and object {success: false}

    if (!commentSent && source === 'comment') {
      console.error(`⚠️ PUBLIC COMMENT FAILED for ${chatId}. Reason:`, commentResult?.error);
    }

    if (sent) {
      const autoReply = new Message({
        userId: userId,
        workspaceId: workspaceId,
        chatId: chatId || 'default', sender: 'AI Agent', text: finalResponse, type: 'sent', platform, isAI: true, campaignId: match._id, timestamp: new Date(),
        metadata: { publicCommentSent: commentSent, publicCommentError: commentResult?.error } // Save status for debugging in DB!
      });
      
      await Promise.all([
        autoReply.save().catch(dbErr => console.error("⚠️ Failed to save campaign message to DB:", dbErr.message)),
        Campaign.findByIdAndUpdate(match._id, { $inc: { dmsSent: 1 } }).catch(dbErr => console.error("⚠️ Failed to increment dmsSent:", dbErr.message))
      ]);

      const sharedUids = getSharedUserIdsSync(userId, workspaceId);
      sharedUids.forEach(uid => {
        io.to(uid).emit('new_message', autoReply);
      });
      console.log(`🚀 REPLY DISPATCHED to ${chatId}`);
      return { reply: autoReply };
    } else {
      console.error(`❌ DISPATCH FAIL: metaApi.js could not send the message to ${chatId}`);
      return { error: 'dispatch_failed' };
    }
  }

  const isAiEnabledForPlatform = false; // Disabled temporarily due to user request (AI ka replay abhi bhi aa rha hai)

  if (isAiEnabledForPlatform) {
    console.log(`😴 NO KEYWORD MATCH: Falling back to AI Studio...`);
    try {
      const aiResponse = await generateAIResponse(userId, text, workspaceId);

      if (aiResponse) {
        const sent = await sendMessageToInstagram(platform, chatId, aiResponse, '', userId, '', null, [], '', commentId);

        if (sent) {
          try {
            const autoReply = new Message({
              userId: userId,
              workspaceId: workspaceId,
              chatId: chatId || 'default',
              sender: 'AI Agent',
              text: aiResponse,
              type: 'sent',
              platform,
              isAI: true,
              timestamp: new Date()
            });
            await autoReply.save();
            const sharedUids = getSharedUserIdsSync(userId, workspaceId);
            sharedUids.forEach(uid => {
              io.to(uid).emit('new_message', autoReply);
            });
          } catch (dbErr) {
            console.error("⚠️ Failed to save AI response to DB:", dbErr.message);
          }
          console.log(`🤖 AI FALLBACK SUCCESS: Sent AI response to ${chatId}`);
          return { ai_reply: aiResponse };
        }
      }
    } catch (aiErr) {
      console.error("🔥 AI Fallback failed:", aiErr);
    }
  } else {
    console.log(`😴 NO KEYWORD MATCH: AI Studio is disabled for user ${userId}.`);
  }

  return { skipped: true, reason: 'no keywords matched and AI failed' };
}