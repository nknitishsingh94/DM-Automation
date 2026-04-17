import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chatId: { type: String, required: true },
  name: { type: String, required: true },
  platform: { type: String, enum: ['instagram', 'facebook', 'whatsapp', 'unknown'], default: 'instagram' },
  tags: [{ type: String }],
  notes: { type: String, default: '' },
  isBotMuted: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
  totalMessages: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Unique contact per user + chatId
contactSchema.index({ userId: 1, chatId: 1 }, { unique: true });

export default mongoose.model('Contact', contactSchema);
