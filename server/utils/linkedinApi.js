import axios from 'axios';
import Settings from '../models/Settings.js';

export async function publishLinkedInContent(userId, post, workspaceId) {
  console.log(`📡 [LinkedIn] Starting publishing sequence for user: ${userId}, post: ${post.id || post._id}`);

  const settingsQuery = { userId };
  if (workspaceId) settingsQuery.workspaceId = workspaceId;

  const settings = await Settings.findOne(settingsQuery);
  if (!settings || !settings.linkedinAccessToken) {
    throw new Error('LinkedIn is not connected or access token is missing.');
  }

  const accessToken = settings.linkedinAccessToken;

  // 1. Fetch User URN (sub)
  console.log('📡 [LinkedIn] Fetching profile info...');
  let profileRes;
  try {
    profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (err) {
    console.error('❌ [LinkedIn] Fetch profile failed:', err.response?.data || err.message);
    const apiError = err.response?.data?.message || err.message;
    throw new Error(`LinkedIn API failed to fetch profile: ${apiError}`);
  }

  const sub = profileRes.data.sub;
  if (!sub) {
    throw new Error('Could not retrieve URN (sub) from LinkedIn profile.');
  }

  const personUrn = `urn:li:person:${sub}`;
  console.log(`✅ [LinkedIn] Author URN: ${personUrn}`);

  // 2. Build Post Body
  let cleanMediaUrl = post.mediaUrl || '';
  if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
    try {
      const meta = JSON.parse(post.mediaUrl);
      cleanMediaUrl = meta.mediaUrl || '';
    } catch(e){}
  }

  const hasMedia = !!cleanMediaUrl;

  const postBody = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: post.caption || ''
        },
        shareMediaCategory: hasMedia ? 'ARTICLE' : 'NONE'
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  if (hasMedia) {
    postBody.specificContent['com.linkedin.ugc.ShareContent'].media = [
      {
        status: 'READY',
        originalUrl: cleanMediaUrl,
        title: {
          text: post.caption ? (post.caption.substring(0, 50) + '...') : 'Shared Link'
        }
      }
    ];
  }

  // 3. Post to ugcPosts
  console.log('📡 [LinkedIn] Posting UGC Share to LinkedIn...');
  try {
    const postRes = await axios.post('https://api.linkedin.com/v2/ugcPosts', postBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ [LinkedIn] Post created successfully:', postRes.data.id);
    return {
      status: 'PUBLISHED',
      id: postRes.data.id,
      url: `https://www.linkedin.com/feed/update/${postRes.data.id}`
    };
  } catch (err) {
    console.error('❌ [LinkedIn] Publish UGC Share failed:', err.response?.data || err.message);
    const apiError = err.response?.data?.message || err.response?.data?.error?.message || err.message;
    throw new Error(`LinkedIn API failed to publish: ${apiError}`);
  }
}
