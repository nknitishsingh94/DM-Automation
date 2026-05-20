import jwt from 'jsonwebtoken';
import axios from 'axios';
import FormData from 'form-data';

const JWT_SECRET = 'super_secret_insta_agent_key_123';
const userId = 'ffe99b88-3156-4f9f-aabf-3302264a96bf'; // Live user ID

async function run() {
  try {
    // Generate valid token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1d' });
    console.log("🔑 Generated JWT:", token);

    // Build form data
    const form = new FormData();
    form.append('caption', 'Test creation from automated script');
    form.append('scheduledFor', new Date(Date.now() + 120000).toISOString()); // 2 minutes from now
    form.append('type', 'image');

    // Add a dummy text buffer as a file (to simulate image upload)
    form.append('files', Buffer.from('dummy image content'), {
      filename: 'dummy.png',
      contentType: 'image/png'
    });

    console.log("📡 Sending POST request to http://localhost:5001/api/scheduling...");
    const res = await axios.post('http://localhost:5001/api/scheduling', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log("✅ Response Status:", res.status);
    console.log("📦 Response Data:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error:", err.response.status, err.response.data);
    } else {
      console.error("❌ Network / Other Error:", err.message);
    }
  }
}

run();
