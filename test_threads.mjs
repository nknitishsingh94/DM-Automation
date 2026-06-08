import 'dotenv/config';
import { publishThreadsContent } from './server/utils/metaApi.js';

async function testThreads() {
  try {
    const userId = 'cbf35748-fb91-4392-8c14-d4113e21e55f';
    const workspaceId = '0d29b746-3389-4d17-9aef-d14a8f6d5f81';
    console.log("Calling publishThreadsContent...");
    const res = await publishThreadsContent(userId, {
      type: 'image',
      mediaUrl: 'https://vsrtgwvudallfqnozifu.supabase.co/storage/v1/object/public/media/1780833916320-165255348-ulleo_grief_7249276_1920_ig_ready.jpg',
      caption: '🎯'
    }, workspaceId);
    console.log("Success:", res);
  } catch (e) {
    console.error("Caught Error:", e);
  }
  process.exit(0);
}

testThreads();
