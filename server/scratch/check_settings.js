import 'dotenv/config';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import axios from 'axios';

async function checkAllSettings() {
  try {
    const users = await User.find({});
    console.log(`\n--- ALL USERS (${users.length}) ---`);
    users.forEach(u => {
      console.log(`User: ${u.username || 'No name'} (${u.email}) [ID: ${u._id}]`);
    });

    const allSettings = await Settings.find({});
    console.log(`\n--- ALL SETTINGS RECORDS (${allSettings.length}) ---`);
    allSettings.forEach(s => {
      console.log(`Settings ID: ${s._id}`);
      console.log(`User ID: ${s.userId}`);
      console.log(`Business Account ID: ${s.businessAccountId}`);
      console.log(`Instagram Page ID: ${s.instagramPageId}`);
      console.log(`Has Instagram Token: ${!!s.instagramAccessToken}`);
      console.log('---');
    });

  } catch (err) {
    console.error("🔥 Error:", err.message);
  } finally {
    process.exit();
  }
}

checkAllSettings();
