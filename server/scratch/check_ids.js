import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function checkIds() {
  const ids = ['ffe99b88-3156-4f9f-aabf-3302264a96bf', '1e45252a-50c3-4c55-a21e-6cdc6d2df2f0', '69ee16f9-3aa6-784a-df58-2bca00000000', '51c6e3d7-b0fe-4d8a-bb05-104023fe1f1e'];
  for (const id of ids) {
    console.log(`Checking ID: ${id}`);
    const { data: user } = await supabase.from('users').select('*').eq('id', id);
    console.log(`- users table:`, user);
    const { data: settings } = await supabase.from('settings').select('*').eq('userId', id);
    console.log(`- settings table:`, settings);
  }
}
checkIds();
