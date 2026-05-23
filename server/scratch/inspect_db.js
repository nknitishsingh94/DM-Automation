import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function inspect() {
  console.log('Inspecting settings table columns...');
  if (!supabase) {
    console.error('Supabase is not configured!');
    return;
  }
  // Query postgres information_schema for settings table
  const { data, error } = await supabase.rpc('inspect_settings_schema');
  if (error) {
    console.log('Direct RPC failed. Let\'s try to run a simple SELECT query on settings to see the keys of returned object.');
    const { data: selectData, error: selectErr } = await supabase.from('settings').select('*').limit(1);
    if (selectErr) {
      console.error('Select failed:', selectErr.message);
    } else {
      console.log('Sample settings row:', selectData);
    }
  } else {
    console.log('RPC results:', data);
  }
}

inspect();
