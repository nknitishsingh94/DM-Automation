import axios from 'axios';

async function run() {
  try {
    console.log("🔑 Creating a test user with a mock token...");
    const email = `test_mock_${Math.floor(Math.random() * 1000000)}@gmail.com`;
    
    await axios.post('http://localhost:5001/api/auth/signup', {
      username: 'test_mock_user',
      email: email,
      password: 'password123'
    });
    
    console.log("🔑 Logging in...");
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: email,
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    
    console.log("📡 Saving a mock instagramAccessToken first...");
    // Save mock token
    const initialSettingsRes = await axios.post('http://localhost:5001/api/settings', {
      instagramAccessToken: 'mock_instagram_token_123',
      businessAccountId: 'mock_biz_id',
      _platform: 'ai_studio' // Bypass validation during setup
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("✅ Setup settings response:", initialSettingsRes.data);

    console.log("📡 Sending POST /api/settings to toggle instagramAutomationEnabled with mock token...");
    const postRes = await axios.post('http://localhost:5001/api/settings', 
      {
        ...initialSettingsRes.data,
        instagramAutomationEnabled: false,
        _platform: 'instagram'
      },
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("✅ POST Settings response:", postRes.data);

  } catch (err) {
    console.error("❌ Request Failed:", err.response?.status, err.response?.data || err.message);
  }
}

run();
