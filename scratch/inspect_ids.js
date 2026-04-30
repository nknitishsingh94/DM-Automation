import mongoose from 'mongoose';
import fs from 'fs';

function getEnv(key) {
  const content = fs.readFileSync('./server/.env', 'utf8');
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
}

const mongoUri = getEnv('MONGODB_URI');
const SettingsSchema = new mongoose.Schema({}, { strict: false });
const Settings = mongoose.model('Settings', SettingsSchema);

async function check() {
  try {
    await mongoose.connect(mongoUri);
    const all = await Settings.find({});
    console.log(`📊 Total Settings Found: ${all.length}`);
    
    all.forEach((s, i) => {
      console.log(`\n[User ${i}] ${s.userId}`);
      console.log(`  - Insta Page ID: ${s.instagramPageId || 'N/A'}`);
      console.log(`  - Biz Account ID: ${s.businessAccountId || 'N/A'}`);
      console.log(`  - FB Page ID: ${s.facebookPageId || 'N/A'}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
