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

  let cleanMediaUrl = post.mediaUrl || '';
  let selectedTargetUrn = null;
  if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
    try {
      const meta = JSON.parse(post.mediaUrl);
      cleanMediaUrl = meta.mediaUrl || '';
      if (meta.linkedinTarget) {
        selectedTargetUrn = meta.linkedinTarget;
      }
    } catch (e) {}
  }

  let targetUrn = null; // FORCE personal profile by ignoring selectedTargetUrn for now
  
  console.log('📡 [LinkedIn] Forcing personal profile posting as requested, fetching profile info...');
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
  targetUrn = `urn:li:person:${sub}`;

  console.log(`✅ [LinkedIn] Target URN to publish: ${targetUrn}`);

  const hasMedia = !!cleanMediaUrl;

  let isVideo = false;
  if (hasMedia) {
    const lowercaseUrl = cleanMediaUrl.toLowerCase();
    if (lowercaseUrl.includes('.mp4') || lowercaseUrl.includes('.mov') || lowercaseUrl.includes('.avi') || lowercaseUrl.includes('.webm') || post.type === 'video') {
      isVideo = true;
    }
  }

  let assetUrn = null;

  if (hasMedia) {
    try {
      console.log(`📡 [LinkedIn] Downloading media from URL: ${cleanMediaUrl}`);
      const mediaResponse = await axios.get(cleanMediaUrl, { responseType: 'arraybuffer' });
      const mediaBuffer = Buffer.from(mediaResponse.data, 'binary');
      const contentType = mediaResponse.headers['content-type'] || (isVideo ? 'video/mp4' : 'image/jpeg');

      console.log(`📡 [LinkedIn] Registering upload for ${isVideo ? 'video' : 'image'}...`);
      const registerRes = await axios.post(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          registerUploadRequest: {
            recipes: [
              isVideo ? 'urn:li:digitalmediaRecipe:feedshare-video' : 'urn:li:digitalmediaRecipe:feedshare-image'
            ],
            owner: targetUrn,
            supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }
            ]
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      const uploadUrl = registerRes.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      assetUrn = registerRes.data.value.asset;

      console.log(`📡 [LinkedIn] Uploading media binary to LinkedIn... URN: ${assetUrn}`);
      await axios.put(uploadUrl, mediaBuffer, {
        headers: {
          'Content-Type': contentType,
          Authorization: `Bearer ${accessToken}`
        }
      });
      console.log('✅ [LinkedIn] Media uploaded successfully!');

    } catch (mediaErr) {
      console.warn('⚠️ [LinkedIn] Native media upload failed, falling back to link sharing (ARTICLE):', mediaErr.response?.data || mediaErr.message);
      assetUrn = null; // fallback
    }
  }

  const postBody = {
    author: targetUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: post.caption || ''
        }
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  const shareContent = postBody.specificContent['com.linkedin.ugc.ShareContent'];

  if (hasMedia && assetUrn) {
    shareContent.shareMediaCategory = isVideo ? 'VIDEO' : 'IMAGE';
    shareContent.media = [
      {
        status: 'READY',
        media: assetUrn
      }
    ];
  } else if (hasMedia) {
    shareContent.shareMediaCategory = 'ARTICLE';
    shareContent.media = [
      {
        status: 'READY',
        originalUrl: cleanMediaUrl,
        title: {
          text: post.caption ? (post.caption.substring(0, 50) + '...') : 'Shared Link'
        }
      }
    ];
  } else {
    shareContent.shareMediaCategory = 'NONE';
  }

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
