const express = require('express');
const router = express.Router();
const Franchise = require('../models/Franchise');
const Inquiry = require('../models/Inquiry');
const { protect, requireRole } = require('../middleware/auth');

// GET /api/owner/listings
router.get('/listings', protect, requireRole('owner', 'admin'), async (req, res) => {
  const franchises = await Franchise.find({ owner: req.user._id })
    .sort('-createdAt');
  res.json({ success: true, franchises });
});

// GET /api/owner/inquiries
router.get('/inquiries', protect, requireRole('owner', 'admin'), async (req, res) => {
  const myFranchises = await Franchise.find({ owner: req.user._id }).select('_id');
  const ids = myFranchises.map(f => f._id);
  const inquiries = await Inquiry.find({ franchise: { $in: ids } })
    .populate('seeker', 'name email phone')
    .populate('franchise', 'name category')
    .sort('-createdAt');
  res.json({ success: true, inquiries });
});

// PUT /api/owner/inquiries/:id/reply
router.put('/inquiries/:id/reply', protect, requireRole('owner'), async (req, res) => {
  const inquiry = await Inquiry.findByIdAndUpdate(
    req.params.id,
    { ownerReply: req.body.reply, status: 'responded' },
    { new: true }
  );
  res.json({ success: true, inquiry });
});

// GET /api/owner/stats
router.get('/stats', protect, requireRole('owner'), async (req, res) => {
  const franchises = await Franchise.find({ owner: req.user._id });
  const myIds = franchises.map(f => f._id);
  const totalInquiries = await Inquiry.countDocuments({ franchise: { $in: myIds } });
  const totalViews = franchises.reduce((sum, f) => sum + (f.views || 0), 0);
  res.json({
    success: true,
    stats: {
      totalListings: franchises.length,
      activeListings: franchises.filter(f => f.status === 'active').length,
      totalViews,
      totalInquiries,
    }
  });
});

module.exports = router;
