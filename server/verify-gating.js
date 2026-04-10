import mongoose from 'mongoose';
import 'dotenv/config';
import Campaign from './models/Campaign.js';
import Message from './models/Message.js';

const MONGODB_URI = process.env.MONGODB_URI;

const verifyGating = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB for verification');

    const demoUserId = new mongoose.Types.ObjectId(); // Mock user

    // 1. Create a gated campaign
    const campaign = new Campaign({
      userId: demoUserId,
      name: "Follower Only Test",
      trigger: "SECRET",
      response: "Here is your secret gift! 🎁",
      requireFollow: true,
      unfollowedResponse: "Hey! You need to follow us first to get the secret gift. 🛑",
      status: "Active",
      platform: "instagram"
    });
    await campaign.save();
    console.log('✅ Gated campaign created');

    // 2. Simulate a message from a user (Mock logic in index.js would handle this)
    // Here we just verify the logic flow conceptually by checking if fields exist
    const fetchedCampaign = await Campaign.findById(campaign._id);
    console.log('🔍 Verified Campaign Fields:', {
      requireFollow: fetchedCampaign.requireFollow,
      unfollowedResponse: fetchedCampaign.unfollowedResponse
    });

    if (fetchedCampaign.requireFollow === true && fetchedCampaign.unfollowedResponse.includes("follow us first")) {
      console.log('🎉 Model Verification Passed!');
    } else {
      console.error('❌ Model Verification Failed!');
    }

    // Cleanup
    await Campaign.findByIdAndDelete(campaign._id);
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Verification Error:', err.message);
  }
};

verifyGating();
