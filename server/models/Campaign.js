import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  trigger: { type: String, required: true },
  response: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Paused'], default: 'Active' },
  dmsSent: { type: Number, default: 0 },
  platform: { type: String, enum: ['instagram', 'facebook', 'whatsapp', 'all'], default: 'all' },
  videoUrl: { type: String, default: '' },
  linkUrl: { type: String, default: '' },
  requireFollow: { type: Boolean, default: false },
  unfollowedResponse: { type: String, default: 'Please follow our account first to get a reply!' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Campaign', campaignSchema);
