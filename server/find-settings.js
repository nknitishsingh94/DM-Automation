import 'dotenv/config';
import mongoose from 'mongoose';
import Settings from './models/Settings.js';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const set = await Settings.findOne({ instagramAccessToken: { $ne: "" } });
  if (set) {
    console.log("FOUND_SETTINGS:", JSON.stringify({ userId: set.userId, hasToken: !!set.instagramAccessToken }));
  } else {
    console.log("NO_SETTINGS_WITH_TOKEN_FOUND");
  }
  process.exit(0);
};

run();
