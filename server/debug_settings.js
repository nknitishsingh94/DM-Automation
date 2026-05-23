import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { supabase } from './utils/supabase.js';

async function checkSettings() {
  const { data, error } = await supabase.from('settings').select('*');
  if (error) {
    console.error(error);
  } else {
    console.log(`Found ${data.length} settings rows.`);
    data.forEach(row => {
      console.log(`User: ${row.userId}, Workspace: ${row.workspaceId}`);
      console.log(`  IG Token: ${row.instagramAccessToken ? 'Yes' : 'No'}`);
      console.log(`  IG Page ID: ${row.instagramPageId}`);
      console.log(`  Business Account ID: ${row.businessAccountId}`);
      console.log(`  FB Token: ${row.facebookAccessToken ? 'Yes' : 'No'}`);
      console.log(`  FB Page ID: ${row.facebookPageId}`);
      console.log(`-----------------------------------------`);
    });
  }
  process.exit(0);
}

checkSettings();
