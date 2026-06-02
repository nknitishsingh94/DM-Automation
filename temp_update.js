const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin123@cluster0.p71r6.mongodb.net/insta_agent?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    const Campaign = require('./server/models/Campaign.js');
    const result = await Campaign.updateMany({}, { $set: { triggerOnComments: true, triggerOnStories: true } });
    console.log("Updated existing campaigns:", result);
    process.exit();
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
