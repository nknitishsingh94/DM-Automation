import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log("🏁 Starting HTTP upload integration test...");
  
  // 1. Generate a mock JWT token for local testing
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-jwt-token-validation-dm-automation-premium';
  
  // Get first user in DB to use their userId
  const { default: User } = await import('../models/User.js');
  const user = await User.findOne({});
  if (!user) {
    console.error("❌ No users found in database to simulate login.");
    process.exit(1);
  }
  
  console.log(`👤 Simulating login for User: ${user.email} (ID: ${user._id})`);
  const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  
  // 2. Prepare mock file
  const testFilePath = path.join(__dirname, 'mock_upload_pic.jpg');
  fs.writeFileSync(testFilePath, 'fake-binary-image-content-for-http-upload-test-12345');
  console.log(`📁 Local test file created at: ${testFilePath}`);
  
  // 3. Make HTTP request with FormData
  const formData = new FormData();
  formData.append('caption', 'HTTP Upload Integration Test');
  formData.append('scheduledFor', new Date(Date.now() + 600000).toISOString()); // 10 mins from now
  formData.append('type', 'image');
  formData.append('triggerKeyword', 'test');
  formData.append('autoResponse', 'Testing upload');
  
  // Append mock file using a blob/file representation
  const fileBuffer = fs.readFileSync(testFilePath);
  const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });
  formData.append('files', fileBlob, 'mock_upload_pic.jpg');
  
  try {
    console.log("📡 Sending POST request to http://localhost:5001/api/scheduling...");
    const res = await axios.post('http://localhost:5001/api/scheduling', formData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log("✅ Response Status:", res.status);
    console.log("📊 Response Data:", JSON.stringify(res.data, null, 2));
    
    // Check if the uploaded file is present in uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const files = fs.readdirSync(uploadsDir);
    console.log(`📂 Contents of server/uploads after request:`, files);
    
  } catch (err) {
    console.error("❌ Request Failed:", err.response?.data || err.message);
  } finally {
    // Cleanup local test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    console.log("🏁 HTTP upload integration test complete.");
    process.exit(0);
  }
}

runTest();
