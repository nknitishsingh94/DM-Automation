import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  plan: {
    type: String,
    enum: ['pro', 'enterprise'],
    default: 'pro'
  },
  amount: {
    type: Number,
    required: true
  },
  amountUsd: {
    type: Number
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'upi', 'card', 'qr', 'manual'],
    default: 'razorpay'
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  utr: {
    type: String
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
