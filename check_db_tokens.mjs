import 'dotenv/config';
import { supabase } from './server/utils/supabase.js';

async function checkTokens() {
  const { data, error } = await supabase.from('settings').select('userId, connectedPageName');
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log("No users found in settings table.");
    return;
  }

  let foundTokens = false;
  console.log("Found", data.length, "users. Checking tokens...");
  
  data.forEach(d => {
    let hasThreads = false;
    let threadsToken = null;
    let hasYT = false;
    let ytToken = null;
    
    if (d.connectedPageName) {
       try {
         const parsed = JSON.parse(d.connectedPageName);
         if (parsed.threadsAccessToken) {
           hasThreads = true;
           threadsToken = `${parsed.threadsAccessToken.substring(0, 15)}...`;
         }
         if (parsed.youtubeAccessToken) {
           hasYT = true;
           ytToken = `${parsed.youtubeAccessToken.substring(0, 15)}...`;
         }
       } catch(e) {}
    }

    if (hasYT || hasThreads) {
      foundTokens = true;
      console.log(`User: ${d.userId}`);
      console.log(`  - YouTube Token Exists: ${hasYT} ${ytToken ? `(${ytToken})` : ''}`);
      console.log(`  - Threads Token Exists: ${hasThreads} ${threadsToken ? `(${threadsToken})` : ''}`);
      console.log('-------------------------------------------');
    }
  });

  if (!foundTokens) {
    console.log("No users currently have YouTube or Threads tokens saved in the database.");
  }
  process.exit(0);
}

checkTokens();
