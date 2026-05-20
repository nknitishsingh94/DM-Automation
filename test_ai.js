import { generateAIResponse } from './server/utils/aiHandler.js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function testAI() {
  try {
    console.log('🤖 Testing AI Studio Connection...');
    
    const userId = '69ee16f93aa6784adf582bca';
    const testMessage = "Hello! How are you?";
    
    const response = await generateAIResponse(userId, testMessage);
    console.log('\n✅ AI RESPONSE RECEIVED:');
    console.log('----------------------------');
    console.log(response);
    console.log('----------------------------');
    
  } catch (err) {
    console.error('❌ AI Test Failed:', err.message);
  }
}

testAI();
