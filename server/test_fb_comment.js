import axios from 'axios';

const fbPayload = {
  "object": "page",
  "entry": [
    {
      "id": "1137728142748715", // Facebook Page ID
      "time": 1700000000,
      "changes": [
        {
          "field": "feed",
          "value": {
            "item": "comment",
            "verb": "add",
            "comment_id": "122114044700776693_99999999999", // Test comment ID
            "post_id": "1137728142748715_122114044700776693", // Test post ID
            "from": {
              "id": "1000000000000",
              "name": "Test User"
            },
            "message": "hii bro",
            "created_time": 1700000000
          }
        }
      ]
    }
  ]
};

async function testFbWebhook() {
  try {
    console.log("Sending FB Webhook Payload...");
    const res = await axios.post('http://localhost:5005/api/webhook', fbPayload);
    console.log("Response:", res.status, res.data);
  } catch (err) {
    console.error("Webhook Error:", err.response ? err.response.data : err.message);
  }
}

testFbWebhook();
