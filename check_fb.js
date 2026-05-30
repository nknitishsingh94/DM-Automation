import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('./server/.env') });

(async () => {
  const Settings = (await import('./server/models/Settings.js')).default;
  const settings = await Settings.find();
  console.log("Facebook Page Accounts:");
  console.log(JSON.stringify(settings.filter(s => s.facebookPageId).map(s => ({ 
    facebookPageId: s.facebookPageId,
    facebookAccessToken: s.facebookAccessToken ? 'exists' : 'missing' 
  })), null, 2));
  process.exit();
})();
