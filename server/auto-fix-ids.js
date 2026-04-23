import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import mongoose from 'mongoose';
import axios from 'axios';
import Settings from './models/Settings.js';
import User from './models/User.js';

/**
 * AUTO-FIX IDS SCRIPT
 * This script uses your .env token to fetch the CORRECT Page ID and Instagram ID
 * and automatically updates your database.
 */

const autoFix = async () => {
    const token = process.env.META_PAGE_ACCESS_TOKEN;
    if (!token) {
        console.error("❌ No token found in .env. Please add META_PAGE_ACCESS_TOKEN first.");
        process.exit(1);
    }

    try {
        console.log("🔗 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("📡 Fetching your IDs from Meta...");
        const res = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name,instagram_business_account&access_token=${token}`);
        
        const pageId = res.data.id;
        const pageName = res.data.name;
        const instaId = res.data.instagram_business_account?.id;

        if (!pageId) {
            console.error("❌ Could not find Page ID. Is your token valid?");
            process.exit(1);
        }

        console.log(`✅ FOUND: Facebook Page "${pageName}" (ID: ${pageId})`);
        if (instaId) {
            console.log(`✅ FOUND: Instagram Business Account (ID: ${instaId})`);
        } else {
            console.warn("⚠️ WARNING: No Instagram Business Account linked to this Page.");
        }

        const user = await User.findOne();
        if (user) {
            console.log(`🆙 Updating settings for user: ${user.email}`);
            await Settings.findOneAndUpdate(
                { userId: user._id },
                { 
                    facebookPageId: pageId,
                    instagramPageId: instaId,
                    businessAccountId: instaId,
                    facebookAccessToken: token,
                    instagramAccessToken: token,
                    isAccountConnected: true
                },
                { upsert: true }
            );
            console.log("🏁 SUCCESS! Database updated with correct IDs. Your bot is now ready.");
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Error fetching from Meta:", err.response?.data || err.message);
        process.exit(1);
    }
};

autoFix();
