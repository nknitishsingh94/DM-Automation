import 'dotenv/config';
import ScheduledPost from '../models/ScheduledPost.js';
import { supabase } from '../utils/supabase.js';

async function resetAndCheck() {
  try {
    // Reset any 'Processing' posts back to 'Scheduled' for a clean state
    const processing = await ScheduledPost.find({ status: 'Processing' });
    for (const p of processing) {
      await ScheduledPost.findByIdAndUpdate(p._id, { status: 'Scheduled' });
      console.log(`Reset Post ${p._id} to Scheduled.`);
    }

    const all = await ScheduledPost.find({});
    console.log(`\n--- All Scheduled Posts ---`);
    all.forEach(p => {
      console.log(`ID: ${p._id}`);
      console.log(`Status: ${p.status}`);
      console.log(`Scheduled For: ${p.scheduledFor}`);
      console.log(`Last Error: ${p.lastError}`);
      console.log('---');
    });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

resetAndCheck();
