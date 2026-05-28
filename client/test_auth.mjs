import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vsrtgwvudallfqnozifu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcnRnd3Z1ZGFsbGZxbm96aWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTgyNDYsImV4cCI6MjA5MTM3NDI0Nn0.-ZkHvaYlwVr7DP6sYEKYaLnKA1yTZucU3XU18WFVKKo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log("Testing supabase anon key fetch on settings table...");
  const { data, error } = await supabase.from('settings').select('*').limit(1);
  if (error) {
    console.error("Error fetching settings:", error);
  } else {
    console.log("Success! Fetched data:", data);
  }
}

test();
