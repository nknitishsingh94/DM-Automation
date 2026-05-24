import { supabase } from './server/utils/supabase.js';

async function checkSchema() {
  const { data, error } = await supabase.from('scheduled_posts').select('*').limit(1);
  if (error) {
    console.error('Error fetching data:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Sample row keys:', Object.keys(data[0]));
  } else {
    console.log('No data found, but query succeeded.');
  }
}

checkSchema();
