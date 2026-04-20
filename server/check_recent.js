import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from './models/Message.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const oneHourAgo = new Date(Date.now() - 3600000);
  const msgs = await Message.find({ timestamp: { $gte: oneHourAgo } }).sort({ timestamp: -1 });
  
  if (msgs.length === 0) {
    console.log('No recent messages found');
  } else {
    msgs.forEach(m => {
      console.log(`[${m.userId}] ${m.type.toUpperCase()}: ${m.text.substring(0, 50)}`);
    });
  }
  process.exit();
}

check();
