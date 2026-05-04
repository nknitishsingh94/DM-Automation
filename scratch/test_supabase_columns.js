import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('campaigns').select('*').limit(1);
  if (error) {
    console.error('Error fetching campaigns:', error);
  } else {
    console.log('Campaigns sample row:', data);
    if (data && data.length > 0) {
      console.log('Columns in campaigns table:', Object.keys(data[0]));
    } else {
      console.log('Table exists but has 0 rows.');
    }
  }
}

test();
