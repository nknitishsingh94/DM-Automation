import express from 'express';
import crypto from 'crypto';
import ApiKey from '../models/ApiKey.js';
import verifyToken from '../middleware/auth.js';
import { convertObjectIDToUUID } from '../utils/supabase.js';

const router = express.Router();

// Get active API Keys
router.get('/', verifyToken, async (req, res) => {
  try {
    const uuidUserId = convertObjectIDToUUID(req.user.userId);
    const keys = await ApiKey.find({ user_id: uuidUserId, active: true });
    
    // Send full key for copying, but also provide maskedKey for UI
    const mappedKeys = keys.map(k => ({
      id: k.id || k._id,
      name: k.name,
      key: k.key, // Send full key so user can copy it later
      maskedKey: k.key.substring(0, 12) + '...' + k.key.substring(k.key.length - 4),
      createdAt: k.createdAt || k.created_at
    }));

    res.json(mappedKeys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate new API Key
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name = 'Default Key' } = req.body;
    const uuidUserId = convertObjectIDToUUID(req.user.userId);

    // Check if key limit reached (e.g. max 3 active keys per user)
    const activeCount = await ApiKey.countDocuments({ user_id: uuidUserId, active: true });
    if (activeCount >= 3) {
      return res.status(400).json({ error: 'Maximum limit of 3 active API Keys reached. Revoke an existing key first.' });
    }

    // Generate random secure token
    const randomHex = crypto.randomBytes(24).toString('hex');
    const newKeyString = `sk_live_${randomHex}`;

    const newKeyRecord = new ApiKey({
      user_id: uuidUserId,
      key: newKeyString,
      name: name,
      active: true,
      createdAt: new Date().toISOString()
    });

    await newKeyRecord.save();

    // For the generation response only, return the raw unmasked key once so the user can copy it!
    res.status(201).json({
      id: newKeyRecord.id || newKeyRecord._id,
      name: newKeyRecord.name,
      key: newKeyString,
      createdAt: newKeyRecord.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke/Delete API Key
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const uuidUserId = convertObjectIDToUUID(req.user.userId);

    const keyRecord = await ApiKey.findOne({ id, user_id: uuidUserId });
    if (!keyRecord) {
      return res.status(404).json({ error: 'API Key not found or does not belong to you.' });
    }

    await ApiKey.findByIdAndDelete(id);

    res.json({ message: 'API Key successfully revoked.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
