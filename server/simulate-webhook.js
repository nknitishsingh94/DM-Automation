import 'dotenv/config';
import axios from 'axios';

/**
 * SIMULATE WEBHOOK SCRIPT
 * This script sends a "Fake" message to your local server
 * to see if the auto-reply logic and Meta API work correctly.
 */

const TEST_KEYWORD = "hello"; // Change this to your campaign trigger
const PORT = process.env.PORT || 5000;

const simulateMessage = async () => {
    console.log(`🧪 SIMULATION: Sending fake "${TEST_KEYWORD}" message to localhost:${PORT}...`);

    const payload = {
        object: "instagram",
        entry: [{
            id: "fake_page_id", // We will use fallback logic if this doesn't match
            messaging: [{
                sender: { id: "test_user_id" }, 
                message: { text: TEST_KEYWORD }
            }]
        }]
    };

    try {
        const res = await axios.post(`http://localhost:${PORT}/api/webhook`, payload);
        console.log("✅ Server response:", res.data);
        console.log("\n💡 AB TERMINAL DEKHEIN: Kya server console mein '✅ SEND SUCCESS' dikh raha hai?");
        console.log("Agar console mein error nahi hai, toh aapke phone par reply aana chahiye!");
    } catch (err) {
        console.error("❌ Simulation Failed:", err.response?.data || err.message);
        console.log("\n💡 TIP: Make sure your server is running on port " + PORT);
    }
};

simulateMessage();
