import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Campaign from '../server/models/Campaign.js';
import Settings from '../server/models/Settings.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const userId = '69f4e9e73196fed750446d16';

  const allUserCampaigns = await Campaign.find({
    $or: [
      { userId: userId },
      { userId: new mongoose.Types.ObjectId(userId) }
    ]
  });

  console.log(`Found ${allUserCampaigns.length} total campaigns for user ${userId}:`);
  allUserCampaigns.forEach((c, idx) => {
    console.log(`Campaign #${idx + 1}:`, {
      id: c._id,
      name: c.name,
      trigger: c.trigger,
      status: c.status,
      triggerOnComments: c.triggerOnComments,
      triggerOnDms: c.triggerOnDms,
      platform: c.platform
    });
  });

  const activeCampaigns = await Campaign.find({
    $or: [
      { userId: userId },
      { userId: new mongoose.Types.ObjectId(userId) }
    ],
    status: 'Active'
  });
  console.log(`Found ${activeCampaigns.length} ACTIVE campaigns for user ${userId}`);

  const userSettings = await Settings.findOne({
    $or: [
      { userId: userId },
      { userId: new mongoose.Types.ObjectId(userId) }
    ]
  });
  console.log('User Settings:', userSettings);

  await mongoose.disconnect();
}

check();
