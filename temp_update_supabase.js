import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

import Campaign from './server/models/Campaign.js';

async function run() {
  try {
    const activeCampaigns = await Campaign.find({});
    console.log(`Found ${activeCampaigns.length} campaigns. Updating...`);
    
    for (let c of activeCampaigns) {
      if (c.triggerOnComments === false || c.triggerOnStories === false) {
        await Campaign.findByIdAndUpdate(c._id || c.id, { triggerOnComments: true, triggerOnStories: true });
        console.log(`Updated campaign: ${c.name}`);
      }
    }
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
