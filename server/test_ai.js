import { generateAIResponse } from './utils/aiHandler.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function testAI() {
  try {
    console.log('🤖 Testing AI Studio Connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const userId = '69ee16f93aa6784adf582bca';
    const testMessage = "Hello! Tell me about yourself in 5 words.";
    
    const response = await generateAIResponse(userId, testMessage);
    console.log('\n✅ AI RESPONSE RECEIVED:');
    console.log('----------------------------');
    console.log(response);
    console.log('----------------------------');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ AI Test Failed:', err.message);
  }
}

testAI();
