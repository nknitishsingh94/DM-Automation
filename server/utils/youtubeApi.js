import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export async function publishYouTubeVideo(userId, postData, settings) {
  try {
    const { mediaUrl, caption } = postData;
    let videoUrl = '';
    let description = '';
    let thumbnail = '';

    // Handle parsed JSON or raw string
    try {
      const parsed = JSON.parse(mediaUrl);
      videoUrl = parsed.videoUrl || '';
      description = parsed.description || '';
      thumbnail = parsed.thumbnail || '';
    } catch (e) {
      videoUrl = mediaUrl;
    }

    if (!videoUrl) {
      throw new Error('Video URL missing in mediaUrl.');
    }

    const { youtubeAccessToken, youtubeRefreshToken } = settings;
    if (!youtubeAccessToken) {
      throw new Error('YouTube Access Token is missing.');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: youtubeAccessToken,
      refresh_token: youtubeRefreshToken || ''
    });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    // Ensure video exists locally (if uploaded via /api/upload)
    const serverRoot = process.cwd();
    let absoluteVideoPath = videoUrl;
    if (videoUrl.startsWith('/uploads/')) {
      absoluteVideoPath = path.join(serverRoot, videoUrl);
    } else {
      throw new Error(`Video URL must be a local /uploads path, got: ${videoUrl}`);
    }

    if (!fs.existsSync(absoluteVideoPath)) {
      throw new Error(`Video file not found at ${absoluteVideoPath}`);
    }

    // Upload Video
    const videoRes = await youtube.videos.insert({
      part: 'id,snippet,status',
      notifySubscribers: false,
      requestBody: {
        snippet: {
          title: caption.substring(0, 100), // Max 100 chars
          description: description,
        },
        status: {
          privacyStatus: 'public', // Or private if testing
        },
      },
      media: {
        body: fs.createReadStream(absoluteVideoPath),
      },
    });

    const videoId = videoRes.data.id;
    console.log(`✅ [YouTube API] Video uploaded successfully. ID: ${videoId}`);

    // If thumbnail provided, upload it too
    if (thumbnail && thumbnail.startsWith('/uploads/')) {
      try {
        const absoluteThumbPath = path.join(serverRoot, thumbnail);
        if (fs.existsSync(absoluteThumbPath)) {
          await youtube.thumbnails.set({
            videoId: videoId,
            media: {
              body: fs.createReadStream(absoluteThumbPath),
            },
          });
          console.log(`✅ [YouTube API] Thumbnail uploaded successfully for video ID: ${videoId}`);
        }
      } catch (thumbErr) {
        console.warn(`⚠️ [YouTube API] Failed to set thumbnail:`, thumbErr.message);
      }
    }

    return {
      status: 'PUBLISHED',
      url: `https://www.youtube.com/watch?v=${videoId}`
    };

  } catch (error) {
    console.error('🔥 [YouTube API] publishYouTubeVideo failed:', error.response?.data || error.message);
    throw new Error(error.message);
  }
}
