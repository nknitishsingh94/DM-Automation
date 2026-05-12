import 'dotenv/config';
import ScheduledPost from '../models/ScheduledPost.js';
import { supabase } from '../utils/supabase.js';

async function checkDuePosts() {
  try {
    const now = new Date();
    const nowISO = now.toISOString();
    
    console.log(`Current Time (ISO): ${nowISO}`);
    
    const allScheduled = await ScheduledPost.find({ status: 'Scheduled' });
    console.log(`Found ${allScheduled.length} scheduled posts in total.`);
    
    const duePosts = allScheduled.filter(p => p.scheduledFor <= nowISO);
    console.log(`Found ${duePosts.length} due posts.`);
    
    if (duePosts.length > 0) {
      duePosts.forEach(p => {
        console.log(`Post ID: ${p._id}, Scheduled For: ${p.scheduledFor}, Status: ${p.status}`);
      });
    }

    const failedPosts = await ScheduledPost.find({ status: 'Failed' });
    console.log(`Found ${failedPosts.length} failed posts.`);
    if (failedPosts.length > 0) {
      failedPosts.forEach(p => {
        console.log(`Post ID: ${p._id}, Error: ${p.errorLog}`);
      });
    }

    const processingPosts = await ScheduledPost.find({ status: 'Processing' });
    console.log(`Found ${processingPosts.length} processing posts.`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

checkDuePosts();
