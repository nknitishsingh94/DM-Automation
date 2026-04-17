import mongoose from 'mongoose';

const flowSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  
  // Triggers for this flow
  triggerKeyword: { type: String, default: '' },
  triggerEvent: { type: String, enum: ['keyword', 'story_mention', 'none'], default: 'keyword' },
  
  // The actual graph data from React Flow
  nodes: { type: Array, default: [] },
  edges: { type: Array, default: [] },
  
  status: { type: String, enum: ['Active', 'Draft', 'Paused'], default: 'Draft' },
  platform: { type: String, enum: ['instagram', 'facebook', 'all'], default: 'all' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
flowSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Flow', flowSchema);
