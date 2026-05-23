import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function checkCampaignSchema() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'campaigns' });
  if (error) {
    // If get_table_columns helper doesn't exist, we query pg_catalog
    const { data: cols, error: pgError } = await supabase.from('campaigns').select('*').limit(1);
    if (pgError) {
      console.error('Error fetching columns:', pgError);
    } else {
      console.log('Sample Row from DB to inspect types:');
      if (cols.length > 0) {
        Object.entries(cols[0]).forEach(([key, val]) => {
          console.log(`- ${key}: ${val} (type: ${typeof val})`);
        });
      } else {
        console.log('No rows in campaigns.');
      }
    }
  } else {
    console.log('Table columns:', data);
  }
}

checkCampaignSchema();
