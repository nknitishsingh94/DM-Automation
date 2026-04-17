import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const simulateError = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.useDb('dm-automate');
        
        const user = await db.collection('users').findOne({ email: /@gmail.com/ });
        
        if (user) {
            await db.collection('settings').updateOne(
                { userId: user._id.toString() },
                { 
                    $set: { 
                        isWhatsAppConnected: false, 
                        whatsappError: 'No WhatsApp Business Accounts found. Please ensure you have created a WABA in your Meta Business Suite and added it to this App.' 
                    } 
                }
            );
            console.log(`✅ Diagnostics: Error simulated successfully for ${user.email}`);
        } else {
            console.log('❌ No user found to test.');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("❌ Diagnostic Error:", err.message);
        process.exit(1);
    }
};

simulateError();
