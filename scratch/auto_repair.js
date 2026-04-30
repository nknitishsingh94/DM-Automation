import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const SettingsSchema = new mongoose.Schema({}, { strict: false });
const Settings = mongoose.model('Settings', SettingsSchema);

async function repair() {
  try {
    console.log('🧪 Connecting to DB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find the most recently updated settings
    const settings = await Settings.findOne().sort({ updatedAt: -1 });
    
    if (settings && (settings.instagramAccessToken || settings.facebookAccessToken)) {
      const freshToken = settings.instagramAccessToken || settings.facebookAccessToken;
      console.log('✅ FOUND FRESH TOKEN in DB! Updating .env...');
      
      const envPath = './server/.env';
      let content = fs.readFileSync(envPath, 'utf8');
      
      const regex = /^META_PAGE_ACCESS_TOKEN=.*$/m;
      if (regex.test(content)) {
        content = content.replace(regex, `META_PAGE_ACCESS_TOKEN=${freshToken}`);
        fs.writeFileSync(envPath, content);
      } else {
        fs.appendFileSync(envPath, `\nMETA_PAGE_ACCESS_TOKEN=${freshToken}`);
      }
      console.log('🚀 AUTO-REPAIR SUCCESSFUL!');
    } else {
      console.log('❌ No fresh tokens found in database.');
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Repair Failed:', err.message);
    process.exit(1);
  }
}

repair();
