import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  instagramAccessToken: { type: String, default: "" },
  instagramPageId: { type: String, default: "" },
  businessAccountId: { type: String, default: "" },
  isAccountConnected: { type: Boolean, default: false },

  facebookAccessToken: { type: String, default: "" },
  facebookPageId: { type: String, default: "" },
  isFacebookConnected: { type: Boolean, default: false },

  whatsappToken: { type: String, default: "" },
  whatsappPhoneNumberId: { type: String, default: "" },
  isWhatsAppConnected: { type: Boolean, default: false },

  connectionError: { type: String, default: "" },
  connectedInstagramName: { type: String, default: "" },
  connectedFacebookName: { type: String, default: "" },
  connectedWhatsAppName: { type: String, default: "" },
  lastTestedAt: { type: Date },

  // --- AI Studio Configurations ---
  aiName: { type: String, default: "Zen Assistant" },
  aiTone: { type: String, default: "friendly and concise" },
  aiKnowledgeBase: { type: String, default: "" },
  aiTemperature: { type: Number, default: 0.7 },
  aiFallbackMessage: { type: String, default: "I'm not sure about that, please contact human support." },
  aiHumanEscalation: { type: Boolean, default: false },

  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Settings', settingsSchema);
