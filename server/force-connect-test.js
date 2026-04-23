import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import mongoose from 'mongoose';
import Settings from './models/Settings.js';
import User from './models/User.js';
import { sendMessageToInstagram } from './utils/metaApi.js';

/**
 * FORCE CONNECT TEST
 * This script wipes old DB tokens and tests the .env token directly.
 */

const runTest = async () => {
    try {
        console.log("🔗 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        
        const user = await User.findOne();
        if (!user) {
            console.error("❌ No user found in database. Please sign up first.");
            process.exit(1);
        }

        console.log(`🧹 Cleaning old settings for user: ${user.email}`);
        await Settings.deleteMany({ userId: user._id });

        console.log("🚀 Attempting to send TEST message using .env token...");
        // Replace 'test_user_id' with your actual numerical Instagram Scoped ID if you have it,
        // or keep it to see if Meta returns an 'Invalid ID' vs 'Invalid Token' error.
        const result = await sendMessageToInstagram('instagram', 'test_user_id', 'Force Test: Hello from ZenXchat!', '', user._id);

        if (result) {
            console.log("✅ SUCCESS! The .env token is working perfectly.");
            console.log("💡 Now you can just use the dashboard normally.");
        } else {
            console.error("❌ FAILED! Even the .env token is rejected by Meta.");
            console.log("💡 Check if your token in .env is expired (Graph API tokens expire in 1-2 hours).");
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
};

runTest();
