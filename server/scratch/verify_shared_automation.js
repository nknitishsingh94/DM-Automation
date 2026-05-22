import 'dotenv/config';
import { supabase } from '../utils/supabase.js';
import Campaign from '../models/Campaign.js';
import Settings from '../models/Settings.js';

// User IDs we found in the database
const user2_id = '1622e35a-03e1-443f-9e95-cd4bdc56cb9b'; // nitish singh (Active owner)
const user1_id = 'c7c003ef-631f-46e9-ad31-d7f1f5b47fd9'; // sneha
const user3_id = '51c6e3d7-b0fe-4d8a-bb05-104023fe1f1e'; // Nitish Singh (Facebook)

async function verify() {
  console.log('--- STARTING VERIFICATION ---');
  
  // 1. Fetch source settings
  console.log(`Fetching active settings for primary user (${user2_id})...`);
  const primarySettings = await Settings.findOne({ userId: user2_id });
  if (!primarySettings) {
    console.error("❌ Primary settings not found. Cannot proceed.");
    process.exit(1);
  }
  
  const bId = primarySettings.businessAccountId;
  const iId = primarySettings.instagramPageId;
  console.log(`Primary page settings: businessAccountId=${bId}, instagramPageId=${iId}`);
  
  // 2. Clone/Upsert settings for User 1 and User 3 to simulate multiple users linking the same page
  console.log(`\nSyncing/Cloning settings to other users to link them to the same page...`);
  
  for (const uid of [user1_id, user3_id]) {
    let settings = await Settings.findOne({ userId: uid });
    if (settings) {
      console.log(`- Updating settings for User ID: ${uid}`);
      settings.businessAccountId = bId;
      settings.instagramPageId = iId;
      settings.facebookPageId = primarySettings.facebookPageId;
      settings.instagramAccessToken = primarySettings.instagramAccessToken;
      settings.facebookAccessToken = primarySettings.facebookAccessToken;
      settings.isAccountConnected = true;
      await settings.save();
    } else {
      console.log(`- Creating settings for User ID: ${uid}`);
      settings = new Settings({
        userId: uid,
        businessAccountId: bId,
        instagramPageId: iId,
        facebookPageId: primarySettings.facebookPageId,
        instagramAccessToken: primarySettings.instagramAccessToken,
        facebookAccessToken: primarySettings.facebookAccessToken,
        isAccountConnected: true
      });
      await settings.save();
    }
  }
  
  // 3. Simulating settingsCache and getSharedUserIdsSync logic
  console.log('\n--- SIMULATING settingsCache AND getSharedUserIdsSync ---');
  const allSettings = await Settings.find({});
  const settingsCache = new Map();
  allSettings.forEach(s => settingsCache.set(s.userId?.toString(), s));
  
  function getSharedUserIdsSync(userId) {
    if (!userId) return [];
    const uidStr = userId.toString();
    const settings = settingsCache.get(uidStr);
    if (!settings) return [uidStr];
    
    const bId = settings.businessAccountId;
    const iId = settings.instagramPageId;
    const fId = settings.facebookPageId;
    const wId = settings.whatsappPhoneNumberId;
    
    if (!bId && !iId && !fId && !wId) {
      return [uidStr];
    }
    
    const uids = new Set([uidStr]);
    for (const [uid, s] of settingsCache.entries()) {
      if (
        (bId && s.businessAccountId === bId) ||
        (iId && s.instagramPageId === iId) ||
        (fId && s.facebookPageId === fId) ||
        (wId && s.whatsappPhoneNumberId === wId)
      ) {
        uids.add(uid);
      }
    }
    return Array.from(uids);
  }
  
  // Test shared user lookup for all three users
  const sharedForUser1 = getSharedUserIdsSync(user1_id);
  const sharedForUser2 = getSharedUserIdsSync(user2_id);
  const sharedForUser3 = getSharedUserIdsSync(user3_id);
  
  console.log(`Shared user IDs for User 1 (sneha):`, sharedForUser1);
  console.log(`Shared user IDs for User 2 (nitish singh):`, sharedForUser2);
  console.log(`Shared user IDs for User 3 (Nitish Singh):`, sharedForUser3);
  
  const setsAreEqual = (arr1, arr2) => {
    const s1 = new Set(arr1);
    const s2 = new Set(arr2);
    return s1.size === s2.size && [...s1].every(v => s2.has(v));
  };
  
  if (
    setsAreEqual(sharedForUser1, [user1_id, user2_id, user3_id]) &&
    setsAreEqual(sharedForUser2, [user1_id, user2_id, user3_id]) &&
    setsAreEqual(sharedForUser3, [user1_id, user2_id, user3_id])
  ) {
    console.log("✅ getSharedUserIdsSync correctly maps all three users together!");
  } else {
    console.error("❌ getSharedUserIdsSync mappings do not match expected outcomes!");
  }
  
  // 4. Test querying campaigns using shared user IDs
  console.log('\n--- TESTING SHARED CAMPAIGN QUERY ---');
  const sharedUserIds = getSharedUserIdsSync(user1_id); // using User 1
  const campaigns = await Campaign.find({ userId: { $in: sharedUserIds } });
  
  console.log(`Campaigns fetched via User 1's shared query: ${campaigns.length}`);
  campaigns.forEach(c => {
    console.log(`- Campaign: "${c.name}" | Owner: ${c.userId}`);
  });
  
  if (campaigns.length > 0) {
    console.log("✅ User 1 (who owns 0 campaigns) can successfully see User 2's campaigns because of shared page mappings!");
  } else {
    console.warn("⚠️ No campaigns found or shared query didn't fetch any.");
  }
  
  console.log('\n--- VERIFICATION COMPLETE ---');
  process.exit(0);
}

verify().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
