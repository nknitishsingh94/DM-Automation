const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://vsrtgwvudallfqnozifu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcnRnd3Z1ZGFsbGZxbm96aWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTgyNDYsImV4cCI6MjA5MTM3NDI0Nn0.-ZkHvaYlwVr7DP6sYEKYaLnKA1yTZucU3XU18WFVKKo';
const supabase = createClient(supabaseUrl, supabaseKey);

const postData = {
  user_id: '11111111-1111-1111-1111-111111111111',
  platform: 'instagram',
  mediaUrl: 'http://example.com',
  scheduledFor: new Date().toISOString()
};

Promise.all([
  supabase.from('scheduled_posts').insert({...postData, status: 'Pending'}),
  supabase.from('scheduled_posts').insert({...postData, status: 'Paused'}),
  supabase.from('scheduled_posts').insert({...postData, status: 'Canceled'}),
  supabase.from('scheduled_posts').insert({...postData, status: 'Cancelled'})
]).then(res => {
  console.log(res.map((r, i) => ['Pending', 'Paused', 'Canceled', 'Cancelled'][i] + ': ' + (r.error?.message || 'Success')));
});
