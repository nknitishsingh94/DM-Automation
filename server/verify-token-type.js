import 'dotenv/config';
import axios from 'axios';

const verifyToken = async () => {
    const token = process.env.META_PAGE_ACCESS_TOKEN;
    if (!token) {
        console.error("❌ No token found in .env");
        process.exit(1);
    }

    try {
        console.log("🔍 Checking Token Type...");
        const res = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name,category&access_token=${token}`);
        
        const data = res.data;
        console.log(`----------------------------------`);
        console.log(`🆔 ID: ${data.id}`);
        console.log(`👤 Name: ${data.name}`);
        
        if (data.category) {
            console.log(`✅ TYPE: PAGE TOKEN (This is CORRECT!)`);
            console.log(`📝 Category: ${data.category}`);
        } else {
            console.log(`❌ TYPE: USER TOKEN (This is WRONG!)`);
            console.log(`💡 Guide: Go to Graph API Explorer and select your PAGE from the dropdown.`);
        }
        console.log(`----------------------------------`);

        process.exit(0);
    } catch (err) {
        console.error("❌ Error verifying token:", err.response?.data || err.message);
        process.exit(1);
    }
};

verifyToken();
