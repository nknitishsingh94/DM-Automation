import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ['received', 'sent'], required: true },
  chatId: { type: String },
  isAI: { type: Boolean, default: false },
  platform: { type: String, enum: ['instagram', 'facebook', 'whatsapp', 'unknown'], default: 'instagram' },
  videoUrl: { type: String, default: '' },
  linkUrl: { type: String, default: '' },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }
});

export default mongoose.model('Message', messageSchema);
