const mongoose = require('../server/node_modules/mongoose');

const Settings = mongoose.model('Settings', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  instagramPageId: String,
  businessAccountId: String,
  facebookPageId: String
}));

async function check() {
  await mongoose.connect('mongodb+srv://nkknitishsingh92:nks780045@cluster0.qkd71yy.mongodb.net/dm-automate?retryWrites=true&w=majority');
  console.log('Connected to DB');

  const allSettings = await Settings.find();
  console.log(`There are ${allSettings.length} total settings in the DB.`);
  allSettings.forEach((s, idx) => {
    console.log(`Settings #${idx + 1}:`, {
      id: s._id,
      userId: s.userId,
      instagramPageId: s.instagramPageId,
      businessAccountId: s.businessAccountId,
    });
  });

  await mongoose.disconnect();
}

check();
