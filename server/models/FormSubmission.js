// server/models/FormSubmission.js
import mongoose from 'mongoose';

const FormSubmissionSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }, // Link to lead profile if available
  
  responses: {
    type: Map,
    of: String
  },
  
  // For Quizzes
  score: { type: Number },
  totalPossible: { type: Number },
  
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model('FormSubmission', FormSubmissionSchema);
