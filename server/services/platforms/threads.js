import axios from 'axios';
import Settings from '../../models/Settings.js';

export const publishThreadsContent = async (userId, { type, mediaUrl, caption = '', containerId = null, replyToId = null }, workspaceId = null) => {
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

    let finalCaption = caption || '';
    if (finalCaption.length > 500) {
      finalCaption = finalCaption.substring(0, 497) + '...';
    }

    let containerPayload = {
      media_type: mediaType,
      text: finalCaption,
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
      let createContainerUrl = replyToId 
        ? `https://graph.threads.net/v1.0/${replyToId}/replies` 
        : `https://graph.threads.net/v1.0/${threadsPageId}/threads`;
      
      const containerRes = await axios.post(createContainerUrl, null, {
        params: containerPayload
      });
      
      activeContainerId = containerRes.data.id;
      console.log(`Threads Container Created: ${activeContainerId}`);
    }

    if (mediaType !== 'TEXT') {
      try {
        const statusRes = await axios.get(`https://graph.threads.net/v1.0/${activeContainerId}`, {
          params: { fields: 'status,error_message', access_token: threadsAccessToken }
        });
        const status = statusRes.data.status;
        if (status === 'IN_PROGRESS') {
           console.log(`⏳ Threads Container ${activeContainerId} is IN_PROGRESS. Deferring...`);
           return { status: 'IG_PROCESSING', containerId: activeContainerId };
        } else if (status === 'ERROR') {
           throw new Error(statusRes.data.error_message || 'Threads container processing failed');
        }
      } catch (e) {
        if (e.response && e.response.data && e.response.data.error && e.response.data.error.code === 100) {
           console.log(`⏳ Threads Container ${activeContainerId} not found yet (consistency delay). Deferring...`);
           return { status: 'IG_PROCESSING', containerId: activeContainerId };
        }
      }
    }

    let publishUrl = `https://graph.threads.net/v1.0/${threadsPageId}/threads_publish`;
    try {
      const publishRes = await axios.post(publishUrl, null, {
        params: {
          creation_id: activeContainerId,
          access_token: threadsAccessToken
        }
      });
      console.log(`Threads Published Successfully! Post ID: ${publishRes.data.id}`);
      return publishRes.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.message;
      if (errorMsg.includes('does not exist') || errorMsg.includes('not ready')) {
        console.log(`⏳ Threads container ${activeContainerId} threw '${errorMsg}'. Deferring to worker...`);
        return { status: 'IG_PROCESSING', containerId: activeContainerId };
      }
      throw err;
    }
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.error(`Threads Publish Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }
};
