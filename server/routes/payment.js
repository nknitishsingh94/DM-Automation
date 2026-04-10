import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// Initialize Razorpay (Optional to prevent crash if environmental variables are missing)
const razorpay = process.env.RAZORPAY_KEY_ID ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;

if (!razorpay) {
  console.warn("⚠️ [Payment] Razorpay keys are missing. Payment features will be disabled.");
}

// 1. Create Order
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const options = {
      amount: 1599 * 100, // Amount in paise (₹1599)
      currency: "INR",
      receipt: `receipt_pro_${req.user.id}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Razorpay Order Error:", err);
    res.status(500).json({ error: "Could not create order" });
  }
});

// 2. Verify Payment
router.post('/verify-payment', verifyToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment Successful - Update User Plan
      await User.findByIdAndUpdate(req.user.id, { plan: 'pro' });
      
      return res.json({ 
        success: true, 
        message: "Payment verified successfully. Welcome to Pro Mastery!" 
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (err) {
    console.error("Razorpay Verification Error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

export default router;
