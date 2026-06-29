import mongoose from 'mongoose';
import 'dotenv/config';

async function checkFailedPinterestPosts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/insta_agent');
    
    // Import the model schema structure without needing the actual model file if complex
    const ScheduledPostSchema = new mongoose.Schema({}, { strict: false });
    const ScheduledPost = mongoose.models.ScheduledPost || mongoose.model('ScheduledPost', ScheduledPostSchema);
    
    const failedPosts = await ScheduledPost.find({ platform: 'pinterest', status: 'Failed' }).sort({ createdAt: -1 }).limit(5);
    
    console.log("Failed Pinterest Posts:");
    failedPosts.forEach(p => {
      console.log(`- ID: ${p._id}`);
      console.log(`  Error: ${p.errorLog}`);
      console.log(`  MediaUrl: ${p.mediaUrl}`);
      console.log('---');
    });
    
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    mongoose.disconnect();
  }
}

checkFailedPinterestPosts();
