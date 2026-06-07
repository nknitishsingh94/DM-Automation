import axios from 'axios';
import Settings from '../../models/Settings.js';

export const publishThreadsContent = async (userId, { type, mediaUrl, caption = '', containerId = null }, workspaceId = null) => {
  try {
    let settings = null;
    if (workspaceId) {
      settings = await Settings.findOne({ userId, workspaceId });
    }
    if (!settings) {
      settings = await Settings.findOne({ userId });
    }
    
    if (!settings || (!settings.threadsAccessToken && !settings.connectedPageName)) {
      throw new Error('Threads credentials missing. Please reconnect your account.');
    }

    let threadsPageId = settings.threadsPageId;
    let threadsAccessToken = settings.threadsAccessToken;

    // Fallback if somehow it was stored as JSON in connectedPageName (legacy)
    if (!threadsAccessToken && settings.connectedPageName) {
      try {
        const threadsData = JSON.parse(settings.connectedPageName);
        if (!threadsData.isThreadsConnected) throw new Error();
        threadsPageId = threadsData.threadsPageId;
        threadsAccessToken = threadsData.threadsAccessToken;
      } catch(e) {
        throw new Error('Threads account not connected properly.');
      }
    }
    
    if (!threadsAccessToken || !threadsPageId) {
      throw new Error('Threads account missing credentials.');
    }

    let mediaType = 'TEXT';
    if (type === 'image' || type === 'carousel') {
      mediaType = 'IMAGE';
    } else if (type === 'video' || type === 'reel' || type === 'story') {
      mediaType = 'VIDEO';
    }

    let containerPayload = {
      media_type: mediaType,
      text: caption,
      access_token: threadsAccessToken
    };

    if (mediaUrl && mediaType === 'IMAGE') {
      containerPayload.image_url = mediaUrl;
    } else if (mediaUrl && mediaType === 'VIDEO') {
      containerPayload.video_url = mediaUrl;
    }

    let activeContainerId = containerId;

    if (!activeContainerId) {
      console.log(`Starting Threads Container Creation for user ${userId}`);
      let createContainerUrl = `https://graph.threads.net/v1.0/${threadsPageId}/threads`;
      const containerRes = await axios.post(createContainerUrl, containerPayload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      activeContainerId = containerRes.data.id;
      console.log(`Threads Container Created: ${activeContainerId}`);
      
      // Return early to allow background worker to poll next minute, preventing Vercel timeout
      return { status: 'IG_PROCESSING', containerId: activeContainerId };
    }

    let publishUrl = `https://graph.threads.net/v1.0/${threadsPageId}/threads_publish`;
    const publishRes = await axios.post(publishUrl, {
      creation_id: activeContainerId,
      access_token: threadsAccessToken
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    console.log(`Threads Published Successfully! Post ID: ${publishRes.data.id}`);
    return publishRes.data;
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.error(`Threads Publish Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }
};
