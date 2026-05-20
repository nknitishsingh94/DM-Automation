import axios from 'axios';

async function run() {
  try {
    console.log("📡 Sending GET request to live Vercel diagnostic endpoint: https://dm-automation-w9a4.vercel.app/api/diag-storage...");
    const res = await axios.get('https://dm-automation-w9a4.vercel.app/api/diag-storage');
    console.log("✅ Response Status:", res.status);
    console.log("📦 Diagnostics Data:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("❌ Diagnostic API Error:", err.response.status, err.response.data);
    } else {
      console.error("❌ Network / Other Error:", err.message);
    }
  }
}

run();
