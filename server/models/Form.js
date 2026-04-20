// server/models/Form.js
import mongoose from 'mongoose';

const FormSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Lead Capture', 'Survey & Feedback', 'Quiz Flow', 'Application Form'], 
    required: true 
  },
  
  // Array of steps, where each step contains an array of fields
  // For single-step forms (Lead Capture), there will be only 1 element in this array.
  steps: [{
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    fields: [{
      label: { type: String, required: true },
      type: { 
        type: String, 
        enum: ['text', 'email', 'phone', 'number', 'textarea', 'dropdown', 'mcq'], 
        required: true 
      },
      placeholder: { type: String, default: '' },
      options: [{ type: String }], // For MCQ and Dropdown
      required: { type: Boolean, default: true }
    }]
  }],
  
  settings: {
    successMessage: { type: String, default: 'Thank you! Your response has been recorded.' },
    redirectUrl: { type: String, default: '' },
    notifyAdmin: { type: Boolean, default: true }
  },
  
  active: { type: Boolean, default: true },
  submissionsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Form', FormSchema);
