import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

(async () => {
  try {
    const { data: workspaces, error: workspaceError } = await supabase.from('workspaces').select('*').limit(1);
    if (workspaceError) {
      console.error('❌ workspaces table error:', workspaceError.message);
    } else {
      console.log('✅ workspaces table exists! Sample data:', workspaces);
    }

    const { data: settings, error: settingsError } = await supabase.from('settings').select('*').limit(1);
    if (settingsError) {
      console.error('❌ settings table error:', settingsError.message);
    } else {
      console.log('✅ settings table exists! Keys in settings:', settings.length > 0 ? Object.keys(settings[0]) : 'No records');
    }

    const { data: posts, error: postsError } = await supabase.from('scheduled_posts').select('*').limit(1);
    if (postsError) {
      console.error('❌ scheduled_posts table error:', postsError.message);
    } else {
      console.log('✅ scheduled_posts table exists! Keys in scheduled_posts:', posts.length > 0 ? Object.keys(posts[0]) : 'No records');
    }
  } catch (err) {
    console.error('System error:', err.message);
  }
})();
