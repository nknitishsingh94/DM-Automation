import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log("Looking for an existing settings row...");
    const { data: settings, error: findErr } = await supabase
      .from('settings')
      .select('*')
      .limit(1);

    if (findErr) {
      console.error("Find settings error:", findErr);
      return;
    }

    if (settings.length === 0) {
      console.log("No settings row found. Attempting to insert a test settings row...");
      // Let's get a user ID first
      const { data: users, error: userErr } = await supabase.from('users').select('id').limit(1);
      if (userErr || users.length === 0) {
        console.error("No users found to link settings to:", userErr);
        return;
      }
      const userId = users[0].id;
      const { data: inserted, error: insertErr } = await supabase
        .from('settings')
        .insert({
          userId: userId,
          isAccountConnected: false,
          connectedPageName: JSON.stringify({ instagramAutomationEnabled: true })
        })
        .select();
      
      if (insertErr) {
        console.error("Insert settings error:", insertErr);
      } else {
        console.log("Insert successful:", inserted);
      }
    } else {
      const existing = settings[0];
      console.log("Found settings row:", existing);
      console.log("Attempting to update it...");
      
      const { data: updated, error: updateErr } = await supabase
        .from('settings')
        .update({
          isAccountConnected: existing.isAccountConnected,
          connectedPageName: JSON.stringify({ instagramAutomationEnabled: !existing.instagramAutomationEnabled })
        })
        .eq('id', existing.id)
        .select();

      if (updateErr) {
        console.error("Update settings error:", updateErr);
      } else {
        console.log("Update successful:", updated);
      }
    }
  } catch (err) {
    console.error("Test Exception:", err);
  }
}

test();
