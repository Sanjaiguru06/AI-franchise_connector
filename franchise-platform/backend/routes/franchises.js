const express = require('express');
const router = express.Router();
const Franchise = require('../models/Franchise');
const { protect, requireRole } = require('../middleware/auth');

// GET /api/franchises - Browse with filters
router.get('/', async (req, res) => {
  try {
    const {
      category, zone, budgetMin, budgetMax, beginner,
      royalty, brand, search, sort = '-viabilityScore', page = 1, limit = 12
    } = req.query;

    const query = { status: 'active' };
    if (category) query.category = category;
    if (zone) query.zones = { $in: [zone] };
    if (beginner === 'true') query.beginnerFriendly = true;
    if (royalty) query.royaltyLevel = royalty;
    if (brand) query.brandType = brand;
    if (budgetMin || budgetMax) {
      query['investment.max'] = {};
      if (budgetMax) query['investment.max'].$lte = Number(budgetMax);
      if (budgetMin) query['investment.min'] = { $gte: Number(budgetMin) };
    }
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [franchises, total] = await Promise.all([
      Franchise.find(query).sort(sort).skip(skip).limit(Number(limit)).lean(),
      Franchise.countDocuments(query)
    ]);

    res.json({ success: true, franchises, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/franchises/featured
router.get('/featured', async (req, res) => {
  const franchises = await Franchise.find({ status: 'active', viabilityScore: { $gte: 65 } })
    .sort('-viabilityScore').limit(8).lean();
  res.json({ success: true, franchises });
});

// GET /api/franchises/categories
router.get('/categories', async (req, res) => {
  const cats = await Franchise.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 }, avgScore: { $avg: '$viabilityScore' } } },
    { $sort: { count: -1 } }
  ]);
  res.json({ success: true, categories: cats });
});

// GET /api/franchises/:id
router.get('/:id', async (req, res) => {
  try {
    const franchise = await Franchise.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('owner', 'name ownerProfile.businessName');
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });
    res.json({ success: true, franchise });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/franchises - Owner creates listing
router.post('/', protect, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const franchise = await Franchise.create({ ...req.body, owner: req.user._id, status: 'pending' });
    res.status(201).json({ success: true, franchise });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/franchises/:id
router.put('/:id', protect, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const franchise = await Franchise.findOne({ _id: req.params.id, owner: req.user._id });
    if (!franchise && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await Franchise.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, franchise: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/franchises/:id
router.delete('/:id', protect, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const franchise = await Franchise.findOne({ _id: req.params.id, owner: req.user._id });
    if (!franchise && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Franchise.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Franchise deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
