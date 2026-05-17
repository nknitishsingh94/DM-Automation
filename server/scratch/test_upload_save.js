import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadToSupabase } from '../utils/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const mockFilePath = path.join(uploadsDir, 'mock_test_image.jpg');
  
  console.log("🏁 Starting upload persistence diagnostic test...");
  
  // 1. Create a dummy image file
  fs.writeFileSync(mockFilePath, 'fake-image-content-data');
  console.log(`📁 Mock file created at: ${mockFilePath}`);
  console.log(`🔎 Exists before process? ${fs.existsSync(mockFilePath)}`);
  
  // Mock file object like Multer
  const mockFile = {
    path: mockFilePath,
    filename: 'mock_test_image.jpg',
    mimetype: 'image/jpeg'
  };
  
  try {
    const fileContent = fs.readFileSync(mockFile.path);
    const fileName = `${Date.now()}-${mockFile.filename}`;
    
    console.log("📤 Attempting upload to Supabase...");
    const publicUrl = await uploadToSupabase(fileContent, fileName, mockFile.mimetype);
    console.log(`🛰️ Supabase returned publicUrl: ${publicUrl}`);
    
    if (publicUrl) {
      console.log("🗑️ Cloud upload succeeded. Cleaning up local file...");
      fs.unlinkSync(mockFile.path);
    } else {
      console.log("⚠️ Cloud upload failed! Applying local fallback: Keeping the file on disk.");
    }
    
    console.log(`🔎 Exists after process? ${fs.existsSync(mockFile.path)}`);
    
  } catch (err) {
    console.error("❌ Process crashed:", err.message);
  } finally {
    // Cleanup if still exists
    if (fs.existsSync(mockFilePath)) {
      console.log("🧹 Tearing down: Deleting mock file to leave workspace clean.");
      fs.unlinkSync(mockFilePath);
    }
    console.log("🏁 Diagnostic test complete.");
    process.exit(0);
  }
}

runTest();
