import axios from 'axios';

async function run() {
  try {
    console.log("🔑 Creating a test user...");
    const email = `test_settings_${Math.floor(Math.random() * 1000000)}@gmail.com`;
    
    await axios.post('http://localhost:5001/api/auth/signup', {
      username: 'test_settings_user',
      email: email,
      password: 'password123'
    });
    
    console.log("🔑 Logging in to get JWT token...");
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: email,
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log("✅ Token obtained:", token);
    
    console.log("📡 Fetching Initial Settings...");
    const settingsRes = await axios.get('http://localhost:5001/api/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log("✅ Initial Settings response:", settingsRes.data);

    console.log("📡 Sending POST /api/settings with instagramAutomationEnabled toggle...");
    const postRes = await axios.post('http://localhost:5001/api/settings', 
      {
        ...settingsRes.data,
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
    console.error("❌ Request Failed:", err.response?.data || err.message);
  }
}

run();
