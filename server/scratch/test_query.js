import 'dotenv/config';
import ScheduledPost from '../models/ScheduledPost.js';
import { supabase } from '../utils/supabase.js';

async function testWorkerQuery() {
  try {
    const now = new Date();
    const nowISO = now.toISOString();
    
    console.log(`Current Time (ISO): ${nowISO}`);
    
    const duePosts = await ScheduledPost.find({
      scheduledFor: { $lte: nowISO },
      status: 'Scheduled'
    });
    
    console.log(`Query found ${duePosts.length} posts.`);
    duePosts.forEach(p => {
      console.log(`- Post ID: ${p._id}, Scheduled For: ${p.scheduledFor}`);
    });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

testWorkerQuery();
