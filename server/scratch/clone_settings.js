import 'dotenv/config';
import Settings from '../models/Settings.js';

async function cloneSettings() {
  try {
    const facebookUserId = '51c6e3d7-b0fe-4d8a-bb05-104023fe1f1e';
    const sourceUserId = '1e45252a-50c3-4c55-a21e-6cdc6d2df2f0';

    console.log(`📡 Searching for active settings from source user ${sourceUserId}...`);
    const sourceSettings = await Settings.findOne({ userId: sourceUserId });
    if (!sourceSettings) {
      console.log("❌ Source settings not found.");
      return;
    }
    console.log("✅ Active settings found.");

    console.log(`📡 Checking if settings already exist for Facebook user ${facebookUserId}...`);
    let targetSettings = await Settings.findOne({ userId: facebookUserId });
    
    if (targetSettings) {
      console.log("📝 Settings record already exists for Facebook user. Updating details...");
      targetSettings.businessAccountId = sourceSettings.businessAccountId;
      targetSettings.instagramPageId = sourceSettings.instagramPageId;
      targetSettings.facebookPageId = sourceSettings.facebookPageId;
      targetSettings.instagramAccessToken = sourceSettings.instagramAccessToken;
      targetSettings.facebookAccessToken = sourceSettings.facebookAccessToken;
      targetSettings.isAccountConnected = true;
      await targetSettings.save();
    } else {
      console.log("🆕 Settings record does not exist for Facebook user. Creating new clone...");
      targetSettings = new Settings({
        userId: facebookUserId,
        businessAccountId: sourceSettings.businessAccountId,
        instagramPageId: sourceSettings.instagramPageId,
        facebookPageId: sourceSettings.facebookPageId,
        instagramAccessToken: sourceSettings.instagramAccessToken,
        facebookAccessToken: sourceSettings.facebookAccessToken,
        isAccountConnected: true
      });
      await targetSettings.save();
    }

    console.log(`\n🎉 SUCCESS! Settings connected successfully for Facebook User ID: ${facebookUserId}`);
    console.log(`Connected Instagram Business Account: ${targetSettings.businessAccountId}`);

  } catch (err) {
    console.error("🔥 Clone failed:", err.message);
  } finally {
    process.exit();
  }
}

cloneSettings();
