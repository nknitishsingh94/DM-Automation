import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

const razorpay = process.env.RAZORPAY_KEY_ID ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;

if (!razorpay) {
  console.warn("⚠️ [Payment] Razorpay keys are missing. Payment features will be disabled.");
}

router.post('/create-order', verifyToken, async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ error: "Payment service is currently unavailable. Please configure Razorpay keys." });
  }
  try {
    const options = {
      amount: 1599 * 100, // Amount in paise (₹1599)
      currency: "INR",
      receipt: `receipt_pro_${req.user.userId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Razorpay Order Error:", err);
    res.status(500).json({ error: "Could not create order" });
  }
});

router.post('/verify-payment', verifyToken, async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ error: "Payment service is currently unavailable. Please configure Razorpay keys." });
  }
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      await User.findByIdAndUpdate(req.user.userId, { plan: 'pro' });
      
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
