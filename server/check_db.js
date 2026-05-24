import { supabase } from './utils/supabase.js';

async function checkPosts() {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('id, status, mediaUrl')
    .order('createdAt', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  console.log('Last 5 posts:');
  data.forEach(post => {
    console.log(`\nID: ${post.id}`);
    console.log(`Status: ${post.status}`);
    console.log(`MediaUrl: ${post.mediaUrl}`);
    
    let parsed = {};
    if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
        try { parsed = JSON.parse(post.mediaUrl); } catch(e) {}
    }
    console.log(`Parsed Type: ${parsed.type}`);
  });
}

checkPosts();
