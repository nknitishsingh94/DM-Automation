import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI;

console.log('🔗 Attempting to connect to MongoDB Atlas...');
console.log('URI:', uri.replace(/:([^@]+)@/, ':****@')); // Hide password in logs

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Success! Connected to MongoDB Atlas.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection failed!');
    console.error('Error Details:', err.message);
    if (err.message.includes('IP address')) {
      console.log('💡 Tip: It looks like your IP address is not whitelisted in MongoDB Atlas.');
    } else if (err.message.includes('Authentication failed')) {
      console.log('💡 Tip: Check if your password is correct.');
    }
    process.exit(1);
  });
