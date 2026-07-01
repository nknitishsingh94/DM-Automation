import axios from 'axios';
import Settings from '../models/Settings.js';

/**
 * Ensures a Pinterest board exists, matching the provided name.
 * If no name provided, creates/uses a default "My Posts" board.
 */
async function getOrCreateBoard(accessToken, boardName) {
  const targetName = boardName?.trim() || "My Posts";

  let boards = [];
  try {
    const res = await axios.get('https://api.pinterest.com/v5/boards', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    boards = res.data.items || [];
  } catch (err) {
    console.warn("⚠️ Failed to fetch Pinterest boards:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Failed to fetch Pinterest boards");
  }

  const existingBoard = boards.find(
    (b) => b.name.toLowerCase() === targetName.toLowerCase()
  );

  if (existingBoard) {
    return existingBoard.id;
  }

  try {
    const createRes = await axios.post(
      'https://api.pinterest.com/v5/boards',
      {
        name: targetName,
        description: "Created automatically by Insta AI Agent",
        privacy: "PUBLIC"
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    return createRes.data.id;
  } catch (err) {
    console.error("❌ Failed to create Pinterest board:", err.response?.data || err.message);
    throw new Error(`Failed to create board "${targetName}": ` + (err.response?.data?.message || err.message));
  }
}

/**
 * Publishes content to Pinterest
 * @param {String} userId - The database user ID
 * @param {Object} post - The post object containing mediaUrl, caption, etc.
 * @param {String} workspaceId - The workspace ID (optional)
 */
export async function publishPinterestContent(userId, post, workspaceId) {
  try {
    console.log(`📌 [Pinterest] Publishing for User: ${userId}. Board: ${post.pinterestBoard || 'Default'}`);
    
    const query = { userId };
    if (workspaceId) query.workspaceId = workspaceId;
    const settings = await Settings.findOne(query);

    if (!settings || !settings.pinterestAccessToken) {
      throw new Error('Pinterest access token missing. Please connect your account.');
    }

    const accessToken = settings.pinterestAccessToken;

    let mediaUrl = post.mediaUrl;
    if (mediaUrl && typeof mediaUrl === 'string' && mediaUrl.startsWith('{')) {
      try {
        const parsed = JSON.parse(mediaUrl);
        mediaUrl = parsed.mediaUrl || '';
      } catch (e) {
        console.warn('⚠️ [Pinterest] Failed to parse mediaUrl JSON');
      }
    }

    const fileExt = mediaUrl ? mediaUrl.split('?')[0].split('.').pop().toLowerCase() : '';
    if (fileExt === 'mp4' || fileExt === 'mov' || post.type === 'video') {
      throw new Error('Video uploads to Pinterest are not currently supported by this automation. Please use an image.');
    }

    if (!mediaUrl) {
      throw new Error('A media URL (image) is required for Pinterest pins.');
    }

    const boardId = await getOrCreateBoard(accessToken, post.pinterestBoard);

    const payload = {
      board_id: boardId,
      media_source: {
        source_type: 'image_url',
        url: mediaUrl
      }
    };

    if (post.caption) {
      payload.description = post.caption.substring(0, 500);
    }
    
    if (post.pinterestTitle) {
      payload.title = post.pinterestTitle.substring(0, 100);
    }

    if (post.pinterestLink) {
      payload.link = post.pinterestLink;
    }

    if (post.pinterestAltText) {
      payload.alt_text = post.pinterestAltText.substring(0, 500);
    }

    const pinRes = await axios.post('https://api.pinterest.com/v5/pins', payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (pinRes.data && pinRes.data.id) {
      return {
        status: 'PUBLISHED',
        url: `https://www.pinterest.com/pin/${pinRes.data.id}/`,
        postId: pinRes.data.id
      };
    } else {
      throw new Error('Unknown error during Pinterest publish.');
    }
  } catch (err) {
    console.error('❌ Pinterest Publish Error:', err.response?.data || err.message);
    const apiMessage = err.response?.data?.message || err.response?.data?.error?.message;
    throw new Error(`Pinterest failed: ${apiMessage || err.message}`);
  }
}
