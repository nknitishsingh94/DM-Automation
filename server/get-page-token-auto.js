import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

/**
 * AUTOMATIC PAGE TOKEN RECOVERY
 * This script uses a User Token to fetch all available Page Access Tokens
 * and automatically updates the .env file.
 */

const getPageToken = async () => {
    // We use the token currently in .env (even if it's a User token)
    const userToken = process.env.META_PAGE_ACCESS_TOKEN;
    
    if (!userToken) {
        console.error("❌ No token found in .env. Please paste the User Token from Graph API Explorer first.");
        process.exit(1);
    }

    try {
        console.log("📡 Fetching your Pages and their Access Tokens...");
        const response = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}`);
        
        const accounts = response.data.data;
        if (!accounts || accounts.length === 0) {
            console.error("❌ No Pages found for this account. Make sure you have 'pages_show_list' permission.");
            process.exit(1);
        }

        // We take the first page or look for one the user might want
        const targetPage = accounts[0]; 
        console.log(`----------------------------------`);
        console.log(`✅ FOUND PAGE: ${targetPage.name}`);
        console.log(`🆔 PAGE ID: ${targetPage.id}`);
        console.log(`🔑 PAGE TOKEN FOUND! (Starts with: ${targetPage.access_token.substring(0, 10)}...)`);
        console.log(`----------------------------------`);

        // Read .env and replace the token
        let envContent = fs.readFileSync(envPath, 'utf8');
        const tokenRegex = /^META_PAGE_ACCESS_TOKEN=.*$/m;
        
        if (tokenRegex.test(envContent)) {
            envContent = envContent.replace(tokenRegex, `META_PAGE_ACCESS_TOKEN=${targetPage.access_token}`);
        } else {
            envContent += `\nMETA_PAGE_ACCESS_TOKEN=${targetPage.access_token}`;
        }

        fs.writeFileSync(envPath, envContent);
        console.log("💾 SUCCESS! Your .env has been updated with the REAL Page Access Token.");
        console.log("🚀 Now you can run: node server/super-force-test.js");

        process.exit(0);
    } catch (err) {
        console.error("❌ Error fetching accounts:", err.response?.data || err.message);
        console.log("💡 Tip: Make sure your current token in .env is valid and has 'pages_show_list' permission.");
        process.exit(1);
    }
};

getPageToken();
