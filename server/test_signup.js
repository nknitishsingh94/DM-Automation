import axios from 'axios';

async function testApiKeyGeneration() {
  const randomSuffix = Math.floor(Math.random() * 100000);
  const email = `testuser_${randomSuffix}@example.com`;
  const password = `securePass123!`;
  
  console.log(`[1] Registering new user: ${email}...`);
  try {
    const signupRes = await axios.post('http://localhost:5001/api/auth/signup', {
      username: `TestUser${randomSuffix}`,
      email,
      password
    });
    
    console.log('[1] Signup successful! Token received.');
    const token = signupRes.data.token;
    
    console.log(`[2] Fetching API keys for this new user...`);
    const keysRes = await axios.get('http://localhost:5001/api/api-keys', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (keysRes.data && keysRes.data.length > 0) {
      console.log(`✅ SUCCESS! Found auto-generated API key:`, keysRes.data[0].key);
      console.log(`Key Name:`, keysRes.data[0].name);
    } else {
      console.error(`❌ FAILED! No API keys found for the new user.`);
      console.log(`Response:`, keysRes.data);
    }
    
  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.data);
    } else {
      console.error('Request Error:', err.message);
      console.log('Ensure the server is running on port 5001.');
    }
  }
}

testApiKeyGeneration();
