const mongoose = require('mongoose');

const franchiseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['Tea & Coffee', 'Shawarma & BBQ', 'Biryani', 'Pharmacy', 'Salon', 'Car Care', 'Laundry', 'Other']
  },
  subCategory: String,
  brandType: { type: String, enum: ['Local', 'Regional', 'National', 'International'], default: 'Regional' },
  description: { type: String, required: true },
  logo: String,
  images: [String],

  // Financials (all in Lakhs INR)
  investment: { min: { type: Number, default: 0 }, max: { type: Number, default: 0 } },
  franchiseFee: { min: { type: Number, default: 0 }, max: { type: Number, default: 0 } },
  royaltyLevel: { type: String, enum: ['none', 'low', 'medium', 'high'], default: 'low' },
  royaltyPercent: { type: String },

  // Operations
  outletFormat: String,
  minArea: { type: Number, default: 100 },
  zones: [{ type: String }],
  footfall: { type: String, default: 'High' },
  staffRequired: String,
  trainingProvided: { type: Boolean, default: true },
  beginnerFriendly: { type: Boolean, default: false },
  operationalComplexity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },

  // Performance
  monthlyRevenue: { min: { type: Number, default: 0 }, max: { type: Number, default: 0 } },
  breakevenMonths: { min: { type: Number, default: 12 }, max: { type: Number, default: 24 } },

  // Score (0-100)
  viabilityScore: { type: Number, default: 50, min: 0, max: 100 },

  // Setup
  setupIncludes: [String],
  licenses: [String],

  // Contact / Listing
  contactEmail: String,
  contactPhone: String,
  website: String,

  // Owner who listed this franchise
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status: { type: String, enum: ['active', 'pending', 'inactive', 'rejected'], default: 'active' },
  featured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  inquiryCount: { type: Number, default: 0 },
}, { timestamps: true });

// Text search index
franchiseSchema.index({ name: 'text', description: 'text', category: 'text' });
franchiseSchema.index({ category: 1, viabilityScore: -1 });
franchiseSchema.index({ 'investment.min': 1, 'investment.max': 1 });

module.exports = mongoose.model('Franchise', franchiseSchema);
