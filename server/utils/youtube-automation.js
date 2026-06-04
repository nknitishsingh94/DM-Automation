import axios from 'axios';
import { OpenAI } from 'openai';
import Campaign from '../models/Campaign.js';
import Settings from '../models/Settings.js';
import Message from '../models/Message.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const processYouTubeComments = async () => {
  try {
    console.log('[YouTube Cron] Starting check for YouTube comments...');
    
    // 1. Get all active YouTube comment campaigns
    const activeCampaigns = await Campaign.find({
      platform: 'youtube',
      type: 'comment',
      status: 'Active'
    });

    if (!activeCampaigns || activeCampaigns.length === 0) {
      console.log('[YouTube Cron] No active YouTube campaigns found.');
      return;
    }

    // Group campaigns by user/workspace
    const userCampaigns = {};
    for (const campaign of activeCampaigns) {
      if (!userCampaigns[campaign.userId]) {
        userCampaigns[campaign.userId] = [];
      }
      userCampaigns[campaign.userId].push(campaign);
    }

    // 2. Process each user's campaigns
    for (const userId of Object.keys(userCampaigns)) {
      try {
        const settings = await Settings.findOne({ userId });
        if (!settings || !settings.connectedPageName) continue;
        
        let pageData = {};
        try { pageData = JSON.parse(settings.connectedPageName); } catch(e){}

        if (!pageData.isYoutubeConnected || !pageData.youtubeAccessToken || !pageData.youtubeChannelId) {
          console.log(`[YouTube Cron] User ${userId} has YouTube campaigns but YouTube is not connected.`);
          continue;
        }

        // Refresh Token if we have one (to ensure access_token is valid)
        let accessToken = pageData.youtubeAccessToken;
        if (pageData.youtubeRefreshToken) {
          try {
            const refreshRes = await axios.post('https://oauth2.googleapis.com/token', {
              client_id: process.env.GOOGLE_CLIENT_ID,
              client_secret: process.env.GOOGLE_CLIENT_SECRET,
              refresh_token: pageData.youtubeRefreshToken,
              grant_type: 'refresh_token'
            });
            accessToken = refreshRes.data.access_token;
            // Optionally update it in DB
            pageData.youtubeAccessToken = accessToken;
            await Settings.findOneAndUpdate({ userId }, { connectedPageName: JSON.stringify(pageData) });
          } catch (tokenErr) {
            console.error(`[YouTube Cron] Token refresh failed for user ${userId}:`, tokenErr.message);
            // If token fails, we can't fetch comments
            continue;
          }
        }

        const lastCheck = pageData.lastYouTubeCommentCheck ? new Date(pageData.lastYouTubeCommentCheck) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to last 24h
        const nowCheck = new Date();

        // 3. Fetch recent comments
        // Note: For large channels, checking allThreadsRelatedToChannelId might be heavy, but it's the standard way without webhooks.
        const commentsRes = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads', {
          params: {
            part: 'snippet,replies',
            allThreadsRelatedToChannelId: pageData.youtubeChannelId,
            maxResults: 50,
            order: 'time'
          },
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        const threads = commentsRes.data.items || [];
        
        for (const thread of threads) {
          const topComment = thread.snippet.topLevelComment.snippet;
          const commentId = thread.snippet.topLevelComment.id;
          const publishedAt = new Date(topComment.publishedAt);
          
          // Skip if comment is older than our last check
          if (publishedAt <= lastCheck) continue;
          
          // Skip our own comments
          if (topComment.authorChannelId?.value === pageData.youtubeChannelId) continue;

          const text = topComment.textOriginal;
          const authorName = topComment.authorDisplayName;

          // Find matching campaign
          let matchedCampaign = null;
          for (const camp of userCampaigns[userId]) {
            if (camp.trigger === '*') {
              matchedCampaign = camp;
              break;
            }
            const keywords = camp.trigger.split(',').map(k => k.trim().toLowerCase());
            if (keywords.some(kw => text.toLowerCase().includes(kw))) {
              matchedCampaign = camp;
              break;
            }
          }

          if (matchedCampaign) {
            console.log(`[YouTube Cron] Match found! Replying to ${authorName}...`);
            
            let replyText = matchedCampaign.response;

            // Generate AI Response if needed
            if (matchedCampaign.isAI) {
              const aiPrompt = `
                You are managing a YouTube channel named "${pageData.youtubeChannelName || 'Channel'}".
                A viewer named "${authorName}" commented: "${text}".
                Generate a friendly, helpful, and short reply. Do not include hashtags.
              `;
              try {
                const aiRes = await openai.chat.completions.create({
                  model: "gpt-4o-mini",
                  messages: [
                    { role: "system", content: "You are a helpful YouTube assistant." },
                    { role: "user", content: aiPrompt }
                  ],
                  max_tokens: 150
                });
                replyText = aiRes.choices[0].message.content.trim();
              } catch (aiErr) {
                console.error(`[YouTube Cron] AI Generation failed:`, aiErr.message);
                replyText = matchedCampaign.response; // Fallback
              }
            }

            // Append link if there's a button
            if (matchedCampaign.buttons && matchedCampaign.buttons.length > 0) {
              replyText += `\n\n${matchedCampaign.buttons[0].text}: ${matchedCampaign.buttons[0].url}`;
            }

            // 4. Post Reply
            try {
              await axios.post('https://www.googleapis.com/youtube/v3/comments?part=snippet', {
                snippet: {
                  parentId: commentId,
                  textOriginal: replyText
                }
              }, {
                headers: { 
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              });

              console.log(`[YouTube Cron] Successfully replied to ${authorName}`);

              // 5. Log it for the Dashboard
              await Message.create({
                userId,
                workspaceId: settings.workspaceId,
                campaignId: matchedCampaign._id || matchedCampaign.id,
                platform: 'youtube',
                senderId: topComment.authorChannelId?.value || 'unknown',
                senderName: authorName,
                text: text,
                status: 'replied',
                replySent: replyText
              });

            } catch (replyErr) {
              console.error(`[YouTube Cron] Failed to post reply to ${commentId}:`, replyErr.response?.data || replyErr.message);
            }
          }
        }

        // Update last check time
        pageData.lastYouTubeCommentCheck = nowCheck.toISOString();
        await Settings.findOneAndUpdate({ userId }, { connectedPageName: JSON.stringify(pageData) });

      } catch (err) {
        console.error(`[YouTube Cron] Error processing user ${userId}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[YouTube Cron] Fatal Error:', error);
  }
};
