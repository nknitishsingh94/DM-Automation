import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
import Settings from './models/Settings.js';

const simulateWebhook = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const settings = await Settings.findOne();
        if (!settings || !settings.whatsappPhoneNumberId) {
            console.error("❌ No WhatsApp configuration found in Settings database.");
            process.exit(1);
        }

        const payload = {
            object: "whatsapp_business_account",
            entry: [{
                changes: [{
                    field: "messages",
                    value: {
                        metadata: { phone_number_id: settings.whatsappPhoneNumberId },
                        messages: [{
                            from: "919999999999",
                            text: { body: "HELLO" }
                        }]
                    }
                }]
            }]
        };

        console.log("🚀 Sending simulated WhatsApp webhook...");
        const response = await axios.post('http://localhost:5000/webhook', payload);
        console.log("✅ Server response:", response.status, response.data);
        
        await mongoose.connection.close();
    } catch (err) {
        console.error("❌ Error in simulation:", err.response?.data || err.message);
    }
};

simulateWebhook();
