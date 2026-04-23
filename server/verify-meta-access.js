import 'dotenv/config';
import axios from 'axios';
import mongoose from 'mongoose';
import Settings from './models/Settings.js';

const verifyAccess = async () => {
    try {
        console.log("🔍 Starting Meta Access Diagnosis...");
        
        await mongoose.connect(process.env.MONGODB_URI);
        const settings = await Settings.findOne({ instagramAccessToken: { $ne: "" } });
        
        if (!settings) {
            console.error("❌ No connected Instagram settings found in database.");
            process.exit(1);
        }

        const token = settings.instagramAccessToken;
        const pageId = settings.instagramPageId || settings.businessAccountId;

        console.log(`📡 Testing Token for Page/Business ID: ${pageId}`);

        // 1. Check Token Debugger Info
        console.log("\n--- Checking Scopes ---");
        try {
            const debugRes = await axios.get(`https://graph.facebook.com/debug_token?input_token=${token}&access_token=${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`);
            console.log("✅ Scopes found:", debugRes.data.data.scopes.join(', '));
            
            const required = ['instagram_basic', 'instagram_manage_messages', 'pages_messaging', 'pages_show_list'];
            const missing = required.filter(s => !debugRes.data.data.scopes.includes(s));
            
            if (missing.length > 0) {
                console.warn("⚠️ MISSING PERMISSIONS:", missing.join(', '));
            } else {
                console.log("✅ All required permissions appear to be present in the token.");
            }
        } catch (e) {
            console.error("❌ Could not debug token:", e.response?.data?.error?.message || e.message);
        }

        // 2. Test Message Profile Access
        console.log("\n--- Testing API Access ---");
        try {
            const meRes = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name,accounts&access_token=${token}`);
            console.log("✅ API Connection: Success");
            console.log("👤 Connected Name:", meRes.data.name);
        } catch (e) {
            console.error("❌ API Access Failed:", e.response?.data?.error?.message || e.message);
            if (e.response?.data?.error?.message?.includes("feature isn't available")) {
                console.log("\n💡 DIAGNOSIS: Meta is blocking this feature. This usually means:");
                console.log("   a) Your Instagram isn't linked correctly to the Facebook Page.");
                console.log("   b) You haven't enabled 'Allow Access to Messages' in Instagram Mobile App Privacy settings.");
            }
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("🔥 Fatal Error:", err.message);
        process.exit(1);
    }
};

verifyAccess();
