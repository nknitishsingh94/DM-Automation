import express from 'express';
import crypto from 'crypto';
import ApiKey from '../models/ApiKey.js';
import verifyToken from '../middleware/auth.js';
import { convertObjectIDToUUID } from '../utils/supabase.js';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const uuidUserId = convertObjectIDToUUID(req.user.userId);
    const keys = await ApiKey.find({ user_id: uuidUserId, active: true });
    
    const mappedKeys = keys.map(k => {
      let displayName = k.name;
      let displayScope = 'All profiles';
      let displayPermission = 'Read & Write';
      
      if (k.name && k.name.includes('|||')) {
        const parts = k.name.split('|||');
        displayName = parts[0];
        displayScope = parts[1] || 'All profiles';
        displayPermission = parts[2] || 'Read & Write';
      }

      return {
        id: k.id || k._id,
        name: displayName,
        key: k.key,
        maskedKey: k.key.substring(0, 12) + '...' + k.key.substring(k.key.length - 4),
        createdAt: k.createdAt || k.created_at,
        scope: displayScope,
        permission: displayPermission
      };
    });

    res.json(mappedKeys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { name = 'Default Key', scope = 'All profiles', permission = 'Read & Write' } = req.body;
    const uuidUserId = convertObjectIDToUUID(req.user.userId);

    const activeCount = await ApiKey.countDocuments({ user_id: uuidUserId, active: true });
    if (activeCount >= 3) {
      return res.status(400).json({ error: 'Maximum limit of 3 active API Keys reached. Revoke an existing key first.' });
    }

    const randomHex = crypto.randomBytes(24).toString('hex');
    const newKeyString = `sk_live_${randomHex}`;

    const encodedName = `${name}|||${scope}|||${permission}`;

    const newKeyRecord = new ApiKey({
      user_id: uuidUserId,
      key: newKeyString,
      name: encodedName,
      active: true,
      createdAt: new Date().toISOString()
    });

    await newKeyRecord.save();

    res.status(201).json({
      id: newKeyRecord.id || newKeyRecord._id,
      name: name,
      key: newKeyString,
      scope: scope,
      permission: permission,
      createdAt: newKeyRecord.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
