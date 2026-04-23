import 'dotenv/config';
import axios from 'axios';
import mongoose from 'mongoose';
import Settings from './models/Settings.js';

// Mock function similar to the one in index.js
const testCheckFollowerStatus = async (platform, chatId, userId) => {
  if (platform !== 'instagram') return true;
  
  try {
    const userSettings = await Settings.findOne({ userId });
    if (!userSettings || !userSettings.instagramAccessToken) {
      console.log("⚠️ Missing credentials in DB for follow check. Defaulting to true.");
      return true;
    }

    console.log(`🔍 Testing follower check for user ${userId} and contact ${chatId}...`);
    
    // We append a flag to the URL for our mock test if needed, 
    // but here we just show what the URL would be.
    const url = `https://graph.facebook.com/v19.0/${chatId}?fields=is_user_follow_business&access_token=${userSettings.instagramAccessToken}`;
    console.log(`🌐 Calling Meta API: ${url}`);

    // REAL CALL (will likely fail with invalid token if not setup)
    // const res = await axios.get(url);
    // return !!(res.data && res.data.is_user_follow_business === true);

    // MOCK RESPONSE for verification logic
    const mockRes = { data: { is_user_follow_business: false } }; 
    console.log(`🎭 Mocked Response:`, mockRes.data);
    
    return !!(mockRes.data && mockRes.data.is_user_follow_business === true);
  } catch (err) {
    console.log("❌ Error during check:", err.message);
    return true; 
  }
};

const runTest = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ DB Connected");

  const testUserId = "69e1c97aec8cb5bdcc6896eb"; // Real ID with Token from DB
  const testChatId = "987654321"; // Dummy IGSID

  const result = await testCheckFollowerStatus('instagram', testChatId, testUserId);
  console.log(`🎯 Result: ${result ? "FOLLOWING (or allowed)" : "NOT FOLLOWING (restricted)"}`);

  await mongoose.disconnect();
};

runTest();
