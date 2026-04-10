import mongoose from 'mongoose';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;

const checkAtlasData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Atlas for Verification');
    
    // Check 'users' collection in 'dm-automate' database
    const db = mongoose.connection.useDb('dm-automate');
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`📊 Found ${users.length} users in 'dm-automate' database on Atlas.`);
    console.log('📝 Last 3 users:', users.slice(-3).map(u => u.email));
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error checking Atlas data:', err.message);
  }
};

checkAtlasData();
