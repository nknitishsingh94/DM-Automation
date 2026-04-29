import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trigger: { type: String, required: true },
  triggerSource: { type: String, enum: ['dm', 'comment', 'story_mention'], default: 'dm' },
  response: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Paused'], default: 'Active' },
  dmsSent: { type: Number, default: 0 },
  platform: { type: String, enum: ['instagram', 'facebook', 'whatsapp', 'all'], default: 'all' },
  videoUrl: { type: String, default: '' },
  linkUrl: { type: String, default: '' },
  buttonText: { type: String, default: '' },
  requireFollow: { type: Boolean, default: false },
  unfollowedResponse: { type: String, default: 'Please follow our account first to get a reply!' },
  openingMessage: { type: Boolean, default: false },
  openingMessageText: { type: String, default: "" },
  openingMessageButton: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Campaign', campaignSchema);
