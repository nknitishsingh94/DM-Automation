// server/routes/forms.js
import express from 'express';
import Form from '../models/Form.js';
import FormSubmission from '../models/FormSubmission.js';
import verifyToken from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all forms for the current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const forms = await Form.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single form
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!form) return res.status(404).json({ error: 'Form not found' });
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new form
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, type, steps, settings } = req.body;
    const newForm = new Form({
      userId: req.user.userId,
      name,
      type,
      steps,
      settings
    });
    await newForm.save();
    res.status(201).json(newForm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a form
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await Form.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!result) return res.status(404).json({ error: 'Form not found' });
    
    // Also delete submissions
    await FormSubmission.deleteMany({ formId: req.params.id });
    
    res.json({ message: 'Form and related submissions deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get submissions for a specific form
router.get('/:id/submissions', verifyToken, async (req, res) => {
  try {
    const submissions = await FormSubmission.find({ formId: req.params.id })
      .populate('contactId')
      .sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle form active status
router.patch('/:id/toggle', verifyToken, async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!form) return res.status(404).json({ error: 'Form not found' });
    
    form.active = !form.active;
    await form.save();
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
