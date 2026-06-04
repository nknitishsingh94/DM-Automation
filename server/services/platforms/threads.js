import axios from 'axios';
import Settings from '../../models/Settings.js';

export const publishThreadsContent = async (userId, { type, mediaUrl, caption = '' }, workspaceId = null) => {
  try {
    let settings = null;
    if (workspaceId) {
      settings = await Settings.findOne({ userId, workspaceId });
    }
    if (!settings) {
      settings = await Settings.findOne({ userId });
    }
    
    if (!settings || !settings.connectedPageName) {
      throw new Error('Threads credentials missing. Please reconnect your account.');
    }

    let threadsData;
    try {
      threadsData = JSON.parse(settings.connectedPageName);
      if (!threadsData.isThreadsConnected) throw new Error();
    } catch(e) {
      throw new Error('Threads account not connected properly.');
    }

    const { threadsPageId, threadsAccessToken } = threadsData;

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

    console.log(`Starting Threads Container Creation for user ${userId}`);
    let createContainerUrl = `https://graph.threads.net/v1.0/${threadsPageId}/threads`;
    const containerRes = await axios.post(createContainerUrl, containerPayload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const containerId = containerRes.data.id;
    console.log(`Threads Container Created: ${containerId}`);

    // Wait a brief moment before publishing (Threads API can be finicky immediately after container creation)
    await new Promise(resolve => setTimeout(resolve, 3000));

    let publishUrl = `https://graph.threads.net/v1.0/${threadsPageId}/threads_publish`;
    const publishRes = await axios.post(publishUrl, {
      creation_id: containerId,
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
