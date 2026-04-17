import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const forceConnectAll = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.useDb('dm-automate');
        
        // Find the most recent user or the test user
        const user = await db.collection('users').findOne({ email: /@gmail.com/ });
        
        if (!user) {
            console.error("❌ No Gmail user found. Please signup first.");
            process.exit(1);
        }

        console.log(`🔗 Force-connecting all platforms for user: ${user.email}`);

        const result = await db.collection('settings').findOneAndUpdate(
            { userId: user._id.toString() },
            {
                $set: {
                    instagramAccessToken: "EAAB_MOCK_TOKEN",
                    facebookAccessToken: "EAAB_MOCK_TOKEN",
                    whatsappToken: "EAAB_MOCK_TOKEN",
                    
                    instagramPageId: "1234567890",
                    businessAccountId: "9876543210",
                    facebookPageId: "1234567890",
                    whatsappPhoneNumberId: "555555555",
                    
                    isAccountConnected: true,
                    isFacebookConnected: true,
                    isWhatsAppConnected: true,
                    
                    connectedInstagramName: "Test Instagram Pro",
                    connectedFacebookName: "Test FB Page",
                    connectedWhatsAppName: "Test WhatsApp Biz",
                    
                    lastTestedAt: new Date(),
                    updatedAt: new Date()
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        console.log("✅ SUCCESS: All 3 platforms (IG, FB, WA) are now marked as CONNECTED in the database.");
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
};

forceConnectAll();
