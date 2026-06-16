import 'dotenv/config';
import ApiKey from './models/ApiKey.js';
import { convertObjectIDToUUID } from './utils/supabase.js';

async function test() {
  console.log("🧪 Starting ApiKey model test...");
  
  // Use user ID from existing records (from scheduled_posts printout)
  const testUserId = 'cbf35748-fb91-4392-8c14-d4113e21e55f';
  const testKey = 'sk_live_test_1234567890abcdefghijklmnopqrstuv';

  try {
    // 1. Clean up any old test keys first
    console.log("🧹 Cleaning up old test keys...");
    await ApiKey.deleteMany({ key: testKey });

    // 2. Create a new test API Key
    console.log("➕ Creating new API Key...");
    const keyInstance = new ApiKey({
      user_id: testUserId,
      key: testKey,
      name: 'Test Dev Key',
      active: true,
      createdAt: new Date().toISOString()
    });

    await keyInstance.save();
    console.log("✅ Key created successfully!");
    console.log(`- ID: ${keyInstance.id || keyInstance._id}`);
    console.log(`- Key: ${keyInstance.key}`);

    // 3. Query the created API Key
    console.log("🔍 Fetching API Key...");
    const fetched = await ApiKey.findOne({ key: testKey });
    if (fetched) {
      console.log("✅ Key retrieved successfully!");
      console.log(`- Name: ${fetched.name}`);
      console.log(`- Active: ${fetched.active}`);
    } else {
      throw new Error("Could not find the inserted API Key in database.");
    }

    // 4. Delete the test key
    console.log("🗑️ Revoking API Key...");
    await ApiKey.findByIdAndDelete(keyInstance.id || keyInstance._id);
    console.log("✅ Key revoked successfully!");

    const doubleCheck = await ApiKey.findOne({ key: testKey });
    if (!doubleCheck) {
      console.log("✅ Verified key no longer exists.");
    } else {
      throw new Error("Key still exists after deletion.");
    }

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ TEST FAILED:", err.message);
  }
}

test();
