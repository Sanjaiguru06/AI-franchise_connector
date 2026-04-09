const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Inquiry = require('../models/Inquiry');
const Franchise = require('../models/Franchise');
const { protect, requireRole } = require('../middleware/auth');

// GET /api/seeker/saved
router.get('/saved', protect, requireRole('seeker'), async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('seekerProfile.savedFranchises');
  res.json({ success: true, saved: user.seekerProfile?.savedFranchises || [] });
});

// POST /api/seeker/save/:franchiseId
router.post('/save/:franchiseId', protect, requireRole('seeker'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const id = req.params.franchiseId;
    const saved = user.seekerProfile?.savedFranchises || [];
    if (saved.includes(id)) {
      return res.status(400).json({ success: false, message: 'Already saved' });
    }
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { 'seekerProfile.savedFranchises': id }
    });
    res.json({ success: true, message: 'Franchise saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/seeker/save/:franchiseId
router.delete('/save/:franchiseId', protect, requireRole('seeker'), async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { 'seekerProfile.savedFranchises': req.params.franchiseId }
  });
  res.json({ success: true, message: 'Removed from saved' });
});

// POST /api/seeker/inquire
router.post('/inquire', protect, requireRole('seeker'), async (req, res) => {
  try {
    const { franchiseId, message, phone } = req.body;
    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });

    const inquiry = await Inquiry.create({
      seeker: req.user._id, franchise: franchiseId, message, phone
    });
    await Franchise.findByIdAndUpdate(franchiseId, { $inc: { inquiryCount: 1 } });
    res.status(201).json({ success: true, inquiry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/seeker/inquiries
router.get('/inquiries', protect, requireRole('seeker'), async (req, res) => {
  const inquiries = await Inquiry.find({ seeker: req.user._id })
    .populate('franchise', 'name category investment viabilityScore');
  res.json({ success: true, inquiries });
});

module.exports = router;
