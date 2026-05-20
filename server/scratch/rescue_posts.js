import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function rescueStuckPosts() {
  console.log("🚀 Starting Rescue Script for Stuck Posts...");
  
  // 1. Find all scheduled posts that look like they have the timezone drift
  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'Scheduled');

  if (error) {
    console.error("❌ Error fetching posts:", error);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log("✅ No stuck posts found.");
    return;
  }

  console.log(`🔍 Found ${posts.length} posts to check.`);

  let updatedCount = 0;
  for (const post of posts) {
    const scheduledTime = new Date(post.scheduledFor);
    const now = new Date();
    
    // If it's scheduled for more than 5 hours in the future but was created recently...
    // Or if it's just stuck in the future, we pull it to "Now" to force publish
    console.log(`📝 Post ${post.id}: Scheduled for ${post.scheduledFor}`);
    
    // Safety check: only move it if it's within the next 6 hours (typical drift)
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    
    if (scheduledTime > now && scheduledTime < sixHoursFromNow) {
      console.log(`   ✨ Rescuing: Moving ${post.id} to NOW`);
      const { error: updateErr } = await supabase
        .from('scheduled_posts')
        .update({ scheduledFor: now.toISOString() })
        .eq('id', post.id);
        
      if (updateErr) console.error(`   ❌ Failed to update ${post.id}:`, updateErr.message);
      else updatedCount++;
    }
  }

  console.log(`🎉 Finished! ${updatedCount} posts rescued and pushed to NOW.`);
}

rescueStuckPosts();
