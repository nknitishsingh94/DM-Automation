import 'dotenv/config';
import { supabase } from '../utils/supabase.js';
import Settings from '../models/Settings.js';

const userId = '1622e35a-03e1-443f-9e95-cd4bdc56cb9b';

async function testWrite() {
  console.log('Testing settings write with JSON in connectedPageName...');
  try {
    const threadsData = {
      threadsAccessToken: 'mock_threads_token_123',
      threadsPageId: 'mock_threads_page_123',
      connectedThreadsName: 'Mock Threads User',
      isThreadsConnected: true
    };
    const res = await Settings.findOneAndUpdate(
      { userId: userId },
      { 
        connectedPageName: JSON.stringify(threadsData)
      },
      { new: true }
    );
    console.log('✅ Write success! Result:', res);
  } catch (err) {
    console.error('❌ Write failed:', err.message || err);
  }
}

testWrite();
