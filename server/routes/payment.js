import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;

if (!razorpay) {
  console.warn("⚠️ [Payment] Razorpay keys are missing in env. Manual UPI and QR payments are enabled.");
}

// GET /api/payment/config - Return Razorpay public key availability
router.get(['/config', '/payment/config'], (req, res) => {
  res.json({
    razorpayAvailable: !!razorpay,
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TgJd8IFigFTKFa'
  });
});

// Helper function to create Razorpay Order
const handleCreateOrder = async (req, res) => {
  const { plan = 'pro', amountInr, amount } = req.body;

  if (!razorpay) {
    return res.status(503).json({ 
      error: "Online card/Razorpay gateway is not configured on server. Please set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in .env.",
      fallbackToManual: true
    });
  }

  try {
    // Determine amount in paise (minimum 100 paise = ₹1)
    let parsedAmountInPaise = 2320 * 100;
    if (amount) {
      parsedAmountInPaise = Number(amount);
    } else if (amountInr) {
      parsedAmountInPaise = Math.round(Number(amountInr) * 100);
    }

    if (isNaN(parsedAmountInPaise) || parsedAmountInPaise < 100) {
      return res.status(400).json({ error: "Invalid amount. Minimum order amount is 100 paise (₹1)." });
    }

    const options = {
      amount: parsedAmountInPaise,
      currency: "INR",
      receipt: `receipt_${plan}_${req.user.userId}_${Date.now()}`,
      notes: {
        userId: req.user.userId,
        plan: plan.toLowerCase()
      }
    };

    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error("Razorpay Order Creation Error:", err);
    res.status(500).json({ error: "Could not create Razorpay order: " + (err.message || err.description || err) });
  }
};

// Helper function to verify Razorpay Signature
const handleVerifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan = 'pro', amount = 2320 } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing required Razorpay verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)." });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: "Server missing RAZORPAY_KEY_SECRET environment variable." });
    }

    // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", secret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      const userPlan = plan.toLowerCase() === 'enterprise' ? 'enterprise' : 'pro';
      const paidMonths = Math.max(1, parseInt(req.body.months) || 1);
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (paidMonths * 30));

      const user = await User.findByIdAndUpdate(req.user.userId, { 
        plan: userPlan,
        planExpiryDate: expiryDate.toISOString(),
        planDurationMonths: paidMonths
      }, { new: true });

      // Save completed transaction
      const tx = await Transaction.create({
        user: req.user.userId,
        username: user?.username || 'User',
        email: user?.email || '',
        plan: userPlan,
        amount: Number(amount) || (userPlan === 'enterprise' ? 7920 : 2320),
        currency: 'INR',
        paymentMethod: 'razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        utr: `RZP_${razorpay_payment_id}`,
        status: 'completed',
        notes: `Paid for ${paidMonths} Month(s). Active until ${expiryDate.toLocaleDateString()}`
      });
      
      return res.json({ 
        success: true, 
        message: `Payment verified! ${userPlan.toUpperCase()} Plan active for ${paidMonths} month(s) until ${expiryDate.toLocaleDateString()}.`,
        plan: userPlan,
        planExpiryDate: expiryDate,
        transaction: tx
      });
    } else {
      console.warn("⚠️ Signature Mismatch: Generated:", expectedSign, " Received:", razorpay_signature);
      return res.status(400).json({ success: false, message: "Invalid payment signature. Verification failed." });
    }
  } catch (err) {
    console.error("Razorpay Verification Error:", err);
    res.status(500).json({ success: false, error: "Payment verification failed: " + err.message });
  }
};

// Route definitions for both /create-order and /payment/create-order
router.post('/create-order', verifyToken, handleCreateOrder);
router.post('/payment/create-order', verifyToken, handleCreateOrder);

router.post('/verify-payment', verifyToken, handleVerifyPayment);
router.post('/payment/verify-payment', verifyToken, handleVerifyPayment);

// POST /api/payment/submit-manual-payment (For UPI / QR / Manual payments)
router.post(['/submit-manual-payment', '/payment/submit-manual-payment'], verifyToken, async (req, res) => {
  try {
    const { plan = 'pro', amountInr = 2320, amountUsd = 29, paymentMethod = 'upi', utr = '', notes = '', months = 1 } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const targetPlan = plan.toLowerCase() === 'enterprise' ? 'enterprise' : 'pro';
    const paidMonths = Math.max(1, parseInt(months) || 1);

    const newTx = await Transaction.create({
      user: req.user.userId,
      username: user.username,
      email: user.email,
      plan: targetPlan,
      amount: Number(amountInr),
      amountUsd: Number(amountUsd),
      currency: 'INR',
      paymentMethod: paymentMethod,
      utr: utr.trim(),
      notes: `Requested ${paidMonths} Month(s). ${notes}`.trim(),
      status: 'pending'
    });

    res.json({
      success: true,
      message: "Payment submission received! Your payment reference has been recorded and sent for instant admin verification.",
      transaction: newTx
    });
  } catch (err) {
    console.error("Manual Payment Submit Error:", err);
    res.status(500).json({ error: "Failed to submit payment details: " + err.message });
  }
});

// GET /api/payment/my-transactions
router.get(['/my-transactions', '/payment/my-transactions'], verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(transactions);
  } catch (err) {
    console.error("Fetch Transactions Error:", err);
    res.status(500).json({ error: "Failed to fetch user transactions" });
  }
});

export default router;
