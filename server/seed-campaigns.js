import mongoose from 'mongoose';
import Campaign from './server/models/Campaign.js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const seedCampaigns = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    const samples = [
      {
        name: "Welcome Greeting",
        trigger: "Hello",
        response: "Hi there! 👋 Welcome to DM Automate. I'm your AI assistant. How can I help you today?",
        status: "Active"
      },
      {
        name: "Pricing Info",
        trigger: "Price",
        response: "Our standard AI automation plan starts at just ₹999/month! Would you like to see all plans?",
        status: "Active"
      },
      {
        name: "Customer Support",
        trigger: "Help",
        response: "No problem! Please tell me what's wrong, or type 'HUMAN' to connect with our support team.",
        status: "Active"
      }
    ];

    for (const s of samples) {
      await Campaign.findOneAndUpdate({ trigger: s.trigger }, s, { upsert: true });
    }

    console.log("Sample campaigns added successfully!");
    process.exit();
  } catch (err) {
    console.error("Error seeding campaigns:", err);
    process.exit(1);
  }
};

seedCampaigns();
