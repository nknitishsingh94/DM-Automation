import axios from 'axios';

const igPayload = {
  "object": "instagram",
  "entry": [
    {
      "id": "17841400000000000",
      "time": 1700000000,
      "changes": [
        {
          "field": "comments",
          "value": {
            "id": "18000000000000000",
            "text": "dost",
            "from": {
              "id": "17841400000000001",
              "username": "test_user"
            },
            "media": {
              "id": "18425496586127072"
            }
          }
        }
      ]
    }
  ]
};

async function testIgWebhook() {
  try {
    console.log("Sending IG Webhook Payload...");
    const res = await axios.post('http://localhost:5005/api/webhook', igPayload);
    console.log("Response:", res.status, res.data);
  } catch (err) {
    console.error("Webhook Error:", err.response ? err.response.data : err.message);
  }
}

testIgWebhook();
