import 'dotenv/config';
import Campaign from '../models/Campaign.js';

async function run() {
  try {
    const campaigns = await Campaign.find({});
    console.log(`Campaigns Count: ${campaigns?.length}`);
    console.log(JSON.stringify(campaigns, null, 2));
  } catch (err) {
    console.error('Error fetching campaigns:', err);
  }
}

run().catch(console.error);
