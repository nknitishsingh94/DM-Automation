import 'dotenv/config';
import { supabase } from '../server/utils/supabase.js';

async function listPosts() {
  try {
    const { data: posts, error } = await supabase.from('scheduled_posts').select('*');
    if (error) {
      console.error("Error fetching scheduled posts:", error);
      return;
    }
    console.log(`Found ${posts.length} posts:`);
    for (const post of posts) {
      console.log(`- ID: ${post.id}`);
      console.log(`  Status: ${post.status}`);
      console.log(`  Caption: ${post.caption}`);
      console.log(`  Platform: ${post.platform}`);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

listPosts();
