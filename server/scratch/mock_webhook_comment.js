import axios from 'axios';

async function sendMockWebhook() {
  const url = 'http://localhost:5001/api/webhook';
  
  // We use the connected Instagram account details
  // pageId: 17841446193833606 (Business Account ID) or 1137728142748715 (Instagram Page ID)
  const payload = {
    object: 'instagram',
    entry: [
      {
        id: '17841446193833606', // businessAccountId from settings
        time: Math.floor(Date.now() / 1000),
        changes: [
          {
            field: 'comments',
            value: {
              id: 'mock_comment_id_' + Date.now(),
              text: 'Chal',
              from: {
                id: '1527009128762459', // senderId/chatId
                username: 'mock_user'
              },
              media: {
                id: '18175179694405423' // The published image/carousel postId
              }
            }
          }
        ]
      }
    ]
  };

  console.log(`Sending mock comment webhook to ${url}...`);
  try {
    const res = await axios.post(url, payload);
    console.log(`Response status: ${res.status}`);
    console.log(`Response body: ${res.data}`);
  } catch (err) {
    console.error('Error sending mock webhook:', err.response?.data || err.message);
  }
}

sendMockWebhook();
