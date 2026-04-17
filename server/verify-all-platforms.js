import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const verifyPlatforms = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.useDb('dm-automate');
        const settings = await db.collection('settings').findOne();
        
        if (!settings) {
            console.error("❌ No user settings found. Please connect accounts first.");
            process.exit(1);
        }

        const webhookUrl = 'http://localhost:5000/api/webhook';
        
        // 1. WhatsApp Simulation
        if (settings.whatsappPhoneNumberId) {
            console.log("🚀 Simulating WhatsApp message...");
            await axios.post(webhookUrl, {
                object: "whatsapp_business_account",
                entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: settings.whatsappPhoneNumberId }, messages: [{ from: "918888888888", text: { body: "HELLO" } }] } }] }]
            });
        }

        // 2. Facebook Simulation
        if (settings.facebookPageId) {
            console.log("🚀 Simulating Facebook message...");
            await axios.post(webhookUrl, {
                object: "page",
                entry: [{ id: settings.facebookPageId, messaging: [{ sender: { id: "fb_user_123" }, message: { text: "HELLO" } }] }]
            });
        }

        // 3. Instagram Simulation
        if (settings.businessAccountId) {
            console.log("🚀 Simulating Instagram message...");
            await axios.post(webhookUrl, {
                object: "instagram",
                entry: [{ id: settings.businessAccountId, messaging: [{ sender: { id: "ig_user_456" }, message: { text: "HELLO" } }] }]
            });
        }

        console.log("⏳ Waiting for AI to process replies...");
        await new Promise(r => setTimeout(r, 3000));

        const recentMessages = await db.collection('messages').find({}).sort({ timestamp: -1 }).limit(10).toArray();
        console.log(`\n📊 VERIFICATION RESULTS (Last ${recentMessages.length} items):`);
        recentMessages.reverse().forEach(m => {
            console.log(`[${m.platform.toUpperCase()}] ${m.sender === 'user' ? '👤 IN' : '🤖 AI'}: ${m.text}`);
        });

        await mongoose.connection.close();
        console.log("\n✅ Platform testing completed.");
    } catch (err) {
        console.error("❌ Verification Error:", err.message);
    }
};

verifyPlatforms();
