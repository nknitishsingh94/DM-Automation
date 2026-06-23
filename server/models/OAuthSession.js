import mongoose from 'mongoose';

const oauthSessionSchema = new mongoose.Schema({
  oauthToken: { type: String, required: true, unique: true },
  oauthTokenSecret: { type: String, required: true },
  userId: { type: String, required: true },
  workspaceId: { type: String },
  isFromOnboarding: { type: Boolean, default: false },
  createdAt: { type: Date, expires: '1h', default: Date.now } // Auto-delete after 1 hour
});

export default mongoose.models.OAuthSession || mongoose.model('OAuthSession', oauthSessionSchema);
