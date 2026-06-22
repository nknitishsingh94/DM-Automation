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
  
  // Ensure text is a string to prevent crashing on null/undefined
  text = typeof text === 'string' ? text : '';
  
  // Resolve settings and contact by workspaceId if provided
  let userSettingsQuery = { userId };
  let contactQuery = { userId, chatId };
  if (workspaceId) {
    const { getSharedUserIdsSync } = await import('../utils/workspace.js');
    const sharedUids = getSharedUserIdsSync(userId, workspaceId);
    userSettingsQuery.workspaceId = workspaceId;
    contactQuery = { userId: { $in: sharedUids }, chatId, workspaceId };
  }
  
  // Load settings and contact in parallel (Use cache if available)
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

  // --- DESKTOP FALLBACK: Follower Re-check ---
  // If the user has a pending campaign (was gated by Follow Check),
  // we check if they have followed now. This allows desktop users
  // (who can't see the "I Followed" button) to just follow and send ANY message to continue.
  if (contact && contact.pendingCampaignId && !contact.pendingCampaignId.startsWith('OPENING:')) {
    console.log(`📡 [DESKTOP FALLBACK] User ${chatId} has pending campaign ${contact.pendingCampaignId}. Checking follow status...`);
    let isFollowing = false;
    if (platform === 'facebook') {
      isFollowing = true; // Trust-based bypass for Facebook since we can't verify
    } else {
      isFollowing = await checkFollowerStatus(platform, chatId, userId, userSettings);
    }
    
    const pendingId = contact.pendingCampaignId;
    const match = await Campaign.findById(pendingId);
    
    if (match && match.status === 'Active') {
      const activeToken = passedToken || userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;
      
      if (isFollowing) {
        console.log(`🔓 [DESKTOP SUCCESS] User ${chatId} has now followed! Triggering pending campaign.`);
        await Contact.findOneAndUpdate(contactQuery, { $unset: { pendingCampaignId: 1 } });
        
        if (match.openingMessage && match.openingMessageText) {
          console.log(`📩 Sending OPENING MESSAGE after follow for ${match.name}`);
          const btnText = match.openingMessageButton || "Click to Continue 🚀";
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
        const followText = match.unfollowedResponse || "It looks like you haven't followed us yet! Please follow our profile and then click the button below. 😊";
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

  // --- DESKTOP FALLBACK: Opening Message Re-check ---
  // If the user was sent an "Opening Message" (Double opt-in), and they reply with text,
  // we treat it as if they clicked the button.
  if (contact && contact.pendingCampaignId && contact.pendingCampaignId.startsWith('OPENING:')) {
    const pendingId = contact.pendingCampaignId.replace('OPENING:', '');
    const match = await Campaign.findById(pendingId);

    if (match && match.status === 'Active') {
      const btnText = (match.openingMessageButton || "Send me the link!").toLowerCase().trim();
      const incomingText = (text || '').toLowerCase().trim();
      const cleanBtnText = btnText.replace(/[\u1F600-\u1F64F\u2702-\u27B0]/g, '').trim();

      if (incomingText === btnText || (cleanBtnText && incomingText === cleanBtnText) || incomingText === 'yes') {
        console.log(`🔓 [DESKTOP SUCCESS] User ${chatId} replied correctly to Opening Message. Triggering final response.`);
        await Contact.findOneAndUpdate(contactQuery, { $unset: { pendingCampaignId: 1 } });

        const activeToken = passedToken || userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;
        
        let finalResponse = match.response;
        if (match.isAI) {
           try {
             const { generateAIResponse } = await import('./utils/aiHandler.js');
             const generated = await generateAIResponse(match.userId, `User just confirmed they want the link. Warmly deliver the content for "${match.triggerKeyword || match.trigger}".`, workspaceId);
             if (generated) {
               if (finalResponse === "[AI Agent will generate a custom neural reply here]" || !finalResponse.trim()) {
                 finalResponse = generated;
               } else {
                 finalResponse = generated + "\n\n" + finalResponse;
               }
             }
           } catch (e) {
             finalResponse = "Here it is! Click the button below! 👇";
           }
        } else if (finalResponse === "[AI Agent will generate a custom neural reply here]") {
           finalResponse = "Here is your link! 👇";
        }

        await sendMessageToInstagram(platform, chatId, finalResponse, match.videoUrl || match.linkUrl, userId, match.buttonText, activeToken, match.buttons);
        await Campaign.findByIdAndUpdate(pendingId, { $inc: { dmsSent: 1 } });
        return { opening_triggered: true };
      } else {
        console.log(`🚫 [DESKTOP FAIL] User ${chatId} replied with "${text}" instead of button click. Cancelling pending opening trigger.`);
        await Contact.findOneAndUpdate(contactQuery, { $unset: { pendingCampaignId: 1 } });
        // Let it fall through to normal keyword processing
      }
    }
  } else if (contact && contact.pendingCampaignId && !contact.pendingCampaignId.includes(':')) {
    // --- DESKTOP FALLBACK: Follow Gate Re-check ---
    const incomingText = (text || '').toLowerCase().trim();
    if (incomingText === 'yes' || incomingText === "i've followed" || incomingText === "ive followed") {
      const match = await Campaign.findById(contact.pendingCampaignId);
      if (match && match.status === 'Active') {
        console.log(`🔓 [DESKTOP SUCCESS] User ${chatId} replied correctly to Follow Gate. Triggering final response directly.`);
        await Contact.findOneAndUpdate(contactQuery, { $unset: { pendingCampaignId: 1 } });
        const activeToken = passedToken || userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;
        
        let finalResponse = match.response;
        if (match.isAI) {
           finalResponse = "Here is your link! 👇"; // Simplified fallback for AI here
        }
        await sendMessageToInstagram(platform, chatId, finalResponse, match.videoUrl || match.linkUrl, userId, match.buttonText, activeToken, match.buttons);
        await Campaign.findByIdAndUpdate(match._id, { $inc: { dmsSent: 1 } });
        return { follow_triggered: true };
      }
    }
  }

  // 1. Fetch Active Flows and Keyword Campaigns in parallel (Advanced Automation)
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
    // Support wildcard (*) for flows too
    return keywords.some(k => k === '*' || cleanUserMsg.includes(k));
  });

  if (matchedFlow) {
    console.log(`🌊 FLOW MATCH: Triggering Flow "${matchedFlow.name}" for Sender: ${chatId}`);
    await runFlow(userId, matchedFlow._id, chatId, platform, text, commentId, workspaceId);

    // NEW: Also send a public reply to the comment for matched visual flows!
    if (source === 'comment' && commentId) {
      console.log(`💬 Sending public comment reply for matched flow to ${commentId}`);
      const activeToken = passedToken || userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;
      
      let nodesArray = matchedFlow.nodes;
      if (typeof nodesArray === 'string') {
        try {
          nodesArray = JSON.parse(nodesArray);
        } catch (e) {
          nodesArray = [];
        }
      }
      const triggerNode = Array.isArray(nodesArray) ? nodesArray.find(n => n.type === 'trigger') : null;
      const replyText = triggerNode?.data?.publicReplyText || matchedFlow.publicReplyText || `Check your DMs! 🚀 I've sent you the info.`;
      
      await sendPublicComment(platform, commentId, replyText, userId, activeToken);
    }

    return { flow: matchedFlow.name };
  }

  const userMessage = text.toLowerCase();

  // 2. Keyword Campaign Checking
  let activeCampaigns = activeCampaignsRaw;

  // SORT: Specific keywords first, Wildcards (*) last
  // SORT: Specific Posts first, then Specific Keywords, Wildcards (*) last
  activeCampaigns = activeCampaigns.sort((a, b) => {
    // 1. Prioritize specific posts over "Any Post"
    const aSpecificPost = a.postId && a.postId !== 'any' && a.postId !== '' && String(a.postId) !== 'undefined' && String(a.postId) !== 'null';
    const bSpecificPost = b.postId && b.postId !== 'any' && b.postId !== '' && String(b.postId) !== 'undefined' && String(b.postId) !== 'null';
    if (aSpecificPost && !bSpecificPost) return -1;
    if (!aSpecificPost && bSpecificPost) return 1;

    // 2. Prioritize specific keywords over wildcards
    if (a.trigger === '*' && b.trigger !== '*') return 1;
    if (a.trigger !== '*' && b.trigger === '*') return -1;
    return 0;
  });

  console.log(`🔍 DEBUG: Checking ${activeCampaigns.length} active campaigns for user ${userId}. Message: "${text}"`);

  const match = activeCampaigns.find(c => {
    const platformMatch = !c.platform || c.platform === 'all' || c.platform === (platform || 'instagram');
    // Null-safe boolean checks — treat null/undefined as false
    const hasTriggerDms = c.triggerOnDms === true;
    const hasTriggerComments = c.triggerOnComments === true;
    const hasTriggerStories = c.triggerOnStories === true;
    const hasNoTriggerFlags = !hasTriggerDms && !hasTriggerComments && !hasTriggerStories;
    // Legacy fallback: if no trigger flags set, check triggerSource; if nothing, default to DM
    const triggerDms = hasTriggerDms || c.triggerSource === 'dm' || (hasNoTriggerFlags && !c.triggerSource);
    const triggerComments = hasTriggerComments || c.triggerSource === 'comment';
    const triggerStories = hasTriggerStories || c.triggerSource === 'story_mention';

    const sourceMatch = (source === 'dm' && triggerDms) ||
      (source === 'comment' && triggerComments) ||
      (source === 'story_mention' && triggerStories);

    const cleanUserMsg = text.toLowerCase().replace(/\s+/g, ' ').trim();

    // Support for multiple keywords separated by commas (safely handle undefined triggers)
    const keywords = (c.trigger || '').split(',').map(k => k.toLowerCase().replace(/\s+/g, ' ').trim());

    // Check if any keyword matches
    const keywordMatch = keywords.some(k => {
      if (!k) return false; // Avoid matching empty triggers/trailing commas to everything
      if (k === '*') return true; // Wildcard match
      return cleanUserMsg.includes(k);
    });

    // Strict Post-Specific Filter for Comments:
    // If a campaign has a specific postId defined, it MUST match the commented post's mediaId.
    // Otherwise, if it has no postId, it can match any post if isAnyPost or isUniversal is true.
    let postMatch = true;
    if (source === 'comment') {
      const isPostIdValid = c.postId && c.postId !== 'any' && c.postId !== '' && String(c.postId) !== 'undefined' && String(c.postId) !== 'null';
      if (isPostIdValid) {
        postMatch = !!(mediaId && String(c.postId) === String(mediaId));
        console.log(`[processAutoReply DEBUG] Campaign: "${c.name}", c.postId="${c.postId}" (${typeof c.postId}), mediaId="${mediaId}" (${typeof mediaId}) -> postMatch=${postMatch}`);
      } else {
        const hasNoSpecificPost = !c.postId || String(c.postId) === 'undefined' || String(c.postId) === 'null' || String(c.postId) === 'any' || String(c.postId) === '';
        postMatch = !!(c.isUniversal || c.isAnyPost || hasNoSpecificPost);
        console.log(`[processAutoReply DEBUG] Campaign: "${c.name}", c.postId="${c.postId}", isUniversal=${c.isUniversal}, isAnyPost=${c.isAnyPost}, hasNoSpecificPost=${hasNoSpecificPost} -> postMatch=${postMatch}`);
      }
    }

    const isMatched = !!(platformMatch && sourceMatch && keywordMatch && postMatch);
    console.log(`[processAutoReply DEBUG] Evaluation for "${c.name}" (trigger="${c.trigger}", platform=${c.platform}, triggerOnComments=${c.triggerOnComments}, triggerSource=${c.triggerSource}): platformMatch=${platformMatch}, sourceMatch=${sourceMatch}, keywordMatch=${keywordMatch}, postMatch=${postMatch} -> isMatched=${isMatched}`);

    return isMatched;
  });

  if (match) {
    const campaignName = match.name || `Automation (${match.trigger})`;
    console.log(`🎯 MATCH FOUND! Campaign: "${campaignName}" | Trigger: "${match.trigger}" | Platform: ${platform} | Source: ${source}`);

    // Determine the best token to use based on platform
    let activeToken = passedToken;
    if (!activeToken) {
      if (platform === 'facebook') {
        activeToken = userSettings?.facebookAccessToken || userSettings?.instagramAccessToken;
      } else {
        activeToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken;
      }
      activeToken = activeToken || process.env.META_PAGE_ACCESS_TOKEN;
    }

    // GATING: Follower Check (Now universal for ALL sources)
    if (match.requireFollow) {
      console.log(`🛡️ UNIVERSAL GATING: Checking follower status for ${chatId}...`);
      const isFollowing = platform === 'facebook' ? true : await checkFollowerStatus(platform, chatId, userId, userSettings);

      if (!isFollowing) {
        console.log(`🚫 GATED: User ${chatId} is not following. Sending follow-request DM.`);

        // 1. Send Private DM Request with "Visit Profile" + "Check Follow" buttons
        const followText = match.unfollowedResponse || "Hey! Please follow our account first to get the link! 😊";
        const checkFollowPayload = `CHECK_FOLLOW_${match._id}`;

        let profileUrl;
        if (platform === 'facebook') {
          const fbId = userSettings?.facebookPageId;
          profileUrl = fbId ? `https://www.facebook.com/${fbId}` : `https://www.facebook.com/`;
        } else {
          const igUsername = userSettings?.connectedInstagramName || userSettings?.instagramUsername;
          if (igUsername) {
            profileUrl = `https://www.instagram.com/${igUsername.replace('@', '')}/`;
          } else if (userSettings?.businessAccountId || userSettings?.instagramPageId) {
            const igId = userSettings?.businessAccountId || userSettings?.instagramPageId;
            profileUrl = `https://www.instagram.com/accounts/login/?next=/${igId}/`;
          } else {
            profileUrl = `https://www.instagram.com/`;
          }
        }

        // Always send TWO buttons: Visit Profile (URL) + I've Followed (postback)
        const followButtons = [
          { text: 'View Profile', url: profileUrl },
          { text: "I've Followed! ✅", payload: checkFollowPayload }
        ];
        console.log(`📎 Profile URL for follow gate: ${profileUrl}`);
        await sendMessageToInstagram(platform, chatId, followText, '', userId, '', activeToken, followButtons, '', commentId);

        // 2. Send PUBLIC Comment Reply (Crucial for Comments)
        if (source === 'comment' && commentId) {
          console.log(`💬 Sending GATED public reply to comment ${commentId}`);
          const thanksReplies = [
            "Thanks for your comment! Check DMs! 🚀",
            "Thanks! I've sent you the info in your DMs! 😊",
            "I've sent the details to your inbox! Thanks for reaching out! 🔥",
            "Check your DMs! I just sent it over. Thanks! ✨"
          ];
          let publicGated = match.publicReplyText || thanksReplies[Math.floor(Math.random() * thanksReplies.length)];
          
          // Anti-Spam: Facebook blocks identical rapid public replies. Append a tiny invisible/random char or ID.
          if (platform === 'facebook') {
             publicGated += ` [ID: ${Math.floor(Math.random() * 10000)}]`;
          }
          
          const commentResult = await sendPublicComment(platform, commentId, publicGated, userId, activeToken);
          if (commentResult?.success === false) {
             console.error(`⚠️ GATED PUBLIC COMMENT FAILED for ${commentId}. Reason:`, commentResult?.error);
             try {
                const debugMsg = new Message({
                  userId: userId, chatId: chatId, sender: 'system', text: `[ERROR] Public Reply Failed: ${JSON.stringify(commentResult.error)}`, type: 'sent', platform, timestamp: new Date()
                });
                await debugMsg.save();
             } catch(e) {}
          }
        }

        // Store this campaign as 'pending' for when they follow
        await Contact.findOneAndUpdate(
          contactQuery,
          { pendingCampaignId: match._id, lastActive: new Date() },
          { upsert: true }
        );

        return { gated: true };
      }
      console.log(`✅ UNGATED: User ${chatId} is a follower.`);
    }

    if (match.openingMessage && match.openingMessageText) {
      console.log(`📩 Sending OPENING MESSAGE First for ${match.name}`);
      const btnText = match.openingMessageButton || "Click to Continue 🚀";
      const payload = `CAMP_${match._id}`;

      // Fire the public comment FIRST so it always happens, even if the DM button is rejected by Meta
      if (source === 'comment' && commentId) {
        console.log(`💬 Sending CUSTOM public comment reply to ${commentId} (Opening Message)`);
        let replyText = match.publicReplyText || `Check your DMs! 🚀 I've sent you the info.`;
        if (platform === 'facebook') {
           replyText += ` [ID: ${Math.floor(Math.random() * 10000)}]`;
        }
        await sendPublicComment(platform, commentId, replyText, userId, activeToken).catch(e => console.error("Public comment failed:", e));
      }

      // This is a comment reply, so it uses commentId
      // NOTE: If Meta rejects the template (button) for comment private replies, it will silently fail the DM but the public comment was already sent.
      const openingSent = await sendMessageToInstagram(platform, chatId, match.openingMessageText, '', userId, btnText, activeToken, [], payload, commentId);

      if (openingSent) {
        // Track that this user is waiting for an opening message confirmation (using pendingCampaignId with OPENING: prefix)
        await Contact.findOneAndUpdate(
          contactQuery,
          { pendingCampaignId: `OPENING:${match._id}`, lastActive: new Date() },
          { upsert: true }
        );

        console.log(`⏳ Flow paused. Waiting for user to click "${btnText}" or reply. Payload: ${payload}`);
        return { opening_message_sent: true };
      } else {
        console.warn(`⚠️ Opening message failed. Falling back to immediate response.`);
      }
    }

    console.log(`✅ EXECUTING: Dispatching response for "${campaignName}"`);
    let finalResponse = match.response;
    if (match.isAI) {
      console.log(`🤖 Campaign has AI response enabled. Generating dynamic response...`);
      try {
        const generated = await generateAIResponse(userId, text, workspaceId);
        if (generated) {
          if (finalResponse === "[AI Agent will generate a custom neural reply here]" || !finalResponse.trim()) {
            finalResponse = generated;
          } else {
            finalResponse = generated + "\n\n" + finalResponse;
          }
        }
      } catch (aiErr) {
        console.error("🔥 Campaign AI generation failed, falling back to static response:", aiErr);
      }
    }
    const dmPromise = sendMessageToInstagram(platform, chatId, finalResponse, match.videoUrl || match.linkUrl, userId, match.buttonText, activeToken, match.buttons, '', commentId);

    let commentPromise = Promise.resolve(true);
    if (source === 'comment' && commentId) {
      console.log(`💬 Sending "Thanks" style public comment reply to ${commentId}`);
      const thanksReplies = [
        "Thanks for your comment! Check DMs! 🚀",
        "Thanks! I've sent you the info in your DMs! 😊",
        "I've sent the details to your inbox! Thanks for reaching out! 🔥",
        "Check your DMs! I just sent it over. Thanks! ✨"
      ];
      let replyText = match.publicReplyText || thanksReplies[Math.floor(Math.random() * thanksReplies.length)];
      // Anti-Spam: Facebook blocks identical rapid public replies. Append a random ID.
      if (platform === 'facebook') {
        replyText += ` [ID: ${Math.floor(Math.random() * 10000)}]`;
      }
      commentPromise = sendPublicComment(platform, commentId, replyText, userId, activeToken);
    }

    const [sent, commentResult] = await Promise.all([dmPromise, commentPromise]);
    const commentSent = commentResult?.success !== false; // handle both boolean (true from older code) and object {success: false}

    if (!commentSent && source === 'comment') {
      console.error(`⚠️ PUBLIC COMMENT FAILED for ${chatId}. Reason:`, commentResult?.error);
      // We don't abort the DM if the public comment fails, but we should log it
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

  // 3. AI Studio Fallback (Only if enabled)
  const isAiEnabledForPlatform = platform === 'facebook'
    ? (userSettings?.facebookAutomationEnabled ?? true)
    : (userSettings?.instagramAutomationEnabled ?? true);

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