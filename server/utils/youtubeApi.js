import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

export async function publishYouTubeVideo(userId, postData, settings) {
  try {
    const { mediaUrl, caption } = postData;
    let videoUrl = '';
    let description = '';
    let thumbnail = '';
    let youtubeVideoId = '';

    // Handle parsed JSON or raw string
    try {
      const parsed = JSON.parse(mediaUrl);
      videoUrl = parsed.videoUrl || parsed.mediaUrl || '';
      description = parsed.description || '';
      thumbnail = parsed.thumbnail || '';
      youtubeVideoId = parsed.youtubeVideoId || '';
    } catch (e) {
      videoUrl = mediaUrl;
    }

    if (!videoUrl && !youtubeVideoId) {
      throw new Error('Video URL or YouTube Video ID missing.');
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

    let videoId = youtubeVideoId;

    if (videoId) {
      console.log(`✅ [YouTube API] Pre-uploaded video found. Updating privacy to public for ID: ${videoId}`);
      await youtube.videos.update({
        part: 'status',
        requestBody: {
          id: videoId,
          status: {
            privacyStatus: 'public'
          }
        }
      });
    } else {
      const serverRoot = process.cwd();
      let mediaStream;

      if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
        // Handle remote URL by streaming directly to YouTube
        console.log(`[YouTube API] Fetching remote video stream from: ${videoUrl}`);
        const response = await axios({
          method: 'get',
          url: videoUrl,
          responseType: 'stream'
        });
        mediaStream = response.data;
      } else if (videoUrl.startsWith('/uploads/')) {
        // Handle local file
        const absoluteVideoPath = path.join(serverRoot, videoUrl);
        if (!fs.existsSync(absoluteVideoPath)) {
          throw new Error(`Video file not found at ${absoluteVideoPath}`);
        }
        mediaStream = fs.createReadStream(absoluteVideoPath);
      } else {
        throw new Error(`Video URL must be an http(s) URL or a local /uploads path, got: ${videoUrl}`);
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
          body: mediaStream,
        },
      });

      videoId = videoRes.data.id;
      console.log(`✅ [YouTube API] Video uploaded successfully. ID: ${videoId}`);
    }

    // If thumbnail provided, upload it too
    if (thumbnail) {
      try {
        const serverRoot = process.cwd();
        let thumbStream;

        if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) {
          const response = await axios({ method: 'get', url: thumbnail, responseType: 'stream' });
          thumbStream = response.data;
        } else if (thumbnail.startsWith('/uploads/')) {
          const absoluteThumbPath = path.join(serverRoot, thumbnail);
          if (fs.existsSync(absoluteThumbPath)) {
            thumbStream = fs.createReadStream(absoluteThumbPath);
          }
        }

        if (thumbStream) {
          await youtube.thumbnails.set({
            videoId: videoId,
            media: {
              body: thumbStream,
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
