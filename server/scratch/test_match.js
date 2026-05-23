import 'dotenv/config';
import Campaign from '../models/Campaign.js';
import Settings from '../models/Settings.js';

async function testMatch() {
  const userId = '1622e35a-03e1-443f-9e95-cd4bdc56cb9b';
  const platform = 'instagram';
  const source = 'comment';
  const text = 'Chal';
  const mediaId = '18175179694405423';

  console.log(`Running match test...`);
  console.log(`Input mediaId: "${mediaId}" (type: ${typeof mediaId})`);

  const activeCampaigns = await Campaign.find({ userId, status: 'Active' });
  console.log(`Found ${activeCampaigns.length} active campaigns.`);

  for (const c of activeCampaigns) {
    console.log(`--- Campaign: "${c.name}" (ID: ${c._id}) ---`);
    console.log(`c.postId: "${c.postId}" (type: ${typeof c.postId})`);
    
    const platformMatch = c.platform === 'all' || c.platform === (platform || 'instagram');
    const triggerComments = c.triggerOnComments ?? (c.triggerSource === 'comment');
    const sourceMatch = (source === 'comment' && triggerComments);
    
    const cleanUserMsg = text.toLowerCase().replace(/\s+/g, ' ').trim();
    const keywords = (c.trigger || '').split(',').map(k => k.toLowerCase().replace(/\s+/g, ' ').trim());
    const keywordMatch = keywords.some(k => {
      if (!k) return false;
      if (k === '*') return true;
      return cleanUserMsg.includes(k);
    });

    let postMatch = true;
    if (source === 'comment') {
      if (c.postId && c.postId !== 'any' && c.postId !== '') {
        postMatch = (mediaId && c.postId === mediaId);
      } else {
        postMatch = c.isUniversal || c.isAnyPost || !c.postId;
      }
    }

    console.log(`- platformMatch: ${platformMatch}`);
    console.log(`- sourceMatch: ${sourceMatch}`);
    console.log(`- keywordMatch: ${keywordMatch} (keywords: ${keywords}, msg: "${cleanUserMsg}")`);
    console.log(`- postMatch: ${postMatch}`);
    console.log(`- FINAL MATCH RESULT: ${platformMatch && sourceMatch && keywordMatch && postMatch}`);
  }
}

testMatch().catch(console.error);
