import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import User from './models/User.js';
import Settings from './models/Settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

/**
 * SUPER FORCE CONNECT TEST
 * This script identifies the Page ID from the token and uses it directly.
 */

const superTest = async () => {
    const token = process.env.META_PAGE_ACCESS_TOKEN;
    if (!token) {
        console.error("❌ No token found in .env");
        process.exit(1);
    }

    try {
        console.log("🔗 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("🔍 Identifying Token Context...");
        const identity = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name,instagram_business_account&access_token=${token}`);
        
        const pageId = identity.data.id;
        const pageName = identity.data.name;
        const instaId = identity.data.instagram_business_account?.id;

        console.log(`✅ Identified Page: ${pageName} (ID: ${pageId})`);
        if (instaId) {
            console.log(`✅ Identified Instagram Account: (ID: ${instaId})`);
        } else {
            console.warn("⚠️ No Instagram account linked. But we will try to send via Page ID anyway.");
        }

        console.log(`🚀 Sending message via Direct ID: ${pageId}...`);
        // Using numerical ID instead of '/me/'
        const url = `https://graph.facebook.com/v19.0/${pageId}/messages?access_token=${token}`;
        
        const payload = {
            recipient: { id: 'test_user_id' }, // Placeholder for simulation
            messaging_type: "RESPONSE",
            message: { text: "Force Test Success: Direct ID Connection Established! 🚀" }
        };

        const response = await axios.post(url, payload);
        console.log("🏁 SUCCESS! The message was accepted by Meta using Direct ID.");
        
        // AUTO UPDATE DB
        const user = await User.findOne();
        if (user) {
            await Settings.findOneAndUpdate(
                { userId: user._id },
                { 
                    facebookPageId: pageId, 
                    instagramPageId: instaId || pageId,
                    instagramAccessToken: token,
                    isAccountConnected: true 
                },
                { upsert: true }
            );
            console.log("💾 Database synchronized with correct IDs.");
        }

        process.exit(0);
    } catch (err) {
        const errorData = err.response?.data || err.message;
        console.error("❌ FINAL ERROR:", JSON.stringify(errorData, null, 2));
        
        if (JSON.stringify(errorData).includes("missing permissions")) {
            console.warn("💡 Permission issue detected. Make sure 'instagram_manage_messages' is added to the token.");
        }
        process.exit(1);
    }
};

superTest();
