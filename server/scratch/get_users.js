import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function listUsers() {
  try {
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) {
      console.error("Error fetching users:", error);
      return;
    }
    console.log(`Found ${users.length} users:`);
    for (const u of users) {
      console.log(`- ID: ${u.id}`);
      console.log(`  Email: ${u.email}`);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

listUsers();
