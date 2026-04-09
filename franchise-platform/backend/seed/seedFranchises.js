const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Franchise = require('../models/Franchise');
const franchisesData = require('./franchises_data.json');

const normalizeCategory = (cat) => {
  const map = {
    'Shawarma & BBQ': 'Shawarma & BBQ',
    'Tea & Coffee': 'Tea & Coffee',
    'Car Care': 'Car Care',
    'Biryani': 'Biryani',
    'Pharmacy': 'Pharmacy',
    'Salon': 'Salon',
  };
  return map[cat] || 'Other';
};

const normalizeBrand = (b) => {
  const v = String(b).toLowerCase();
  if (v.includes('international')) return 'International';
  if (v.includes('national')) return 'National';
  if (v.includes('regional')) return 'Regional';
  return 'Local';
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Franchise.deleteMany({});
    console.log('Cleared existing franchises');

    const docs = franchisesData.map(f => ({
      name: f.name || 'Unknown',
      category: normalizeCategory(f.category),
      subCategory: f.subCategory,
      brandType: normalizeBrand(f.brandType),
      description: f.description || '',
      investment: {
        min: Number(f.investment?.min) || 0,
        max: Number(f.investment?.max) || 0,
      },
      franchiseFee: {
        min: Number(f.franchiseFee?.min) || 0,
        max: Number(f.franchiseFee?.max) || 0,
      },
      royaltyLevel: ['none','low','medium','high'].includes(f.royaltyLevel) ? f.royaltyLevel : 'none',
      outletFormat: f.outletFormat || '',
      minArea: Number(f.minArea) || 100,
      zones: Array.isArray(f.zones) ? f.zones : [f.zones].filter(Boolean),
      footfall: f.footfall || 'High',
      staffRequired: f.staffRequired || '2-4',
      trainingProvided: Boolean(f.trainingProvided),
      beginnerFriendly: Boolean(f.beginnerFriendly),
      operationalComplexity: ['low','medium','high'].includes(f.operationalComplexity) ? f.operationalComplexity : 'medium',
      monthlyRevenue: {
        min: Number(f.monthlyRevenue?.min) || 100000,
        max: Number(f.monthlyRevenue?.max) || 300000,
      },
      breakevenMonths: {
        min: Number(f.breakevenMonths?.min) || 12,
        max: Number(f.breakevenMonths?.max) || 24,
      },
      viabilityScore: Math.round(Number(f.viabilityScore) || 50),
      setupIncludes: Array.isArray(f.setupIncludes) ? f.setupIncludes : [],
      licenses: Array.isArray(f.licenses) ? f.licenses : [],
      status: 'active',
      featured: (f.viabilityScore || 0) >= 70,
    }));

    const inserted = await Franchise.insertMany(docs, { ordered: false });
    console.log(`✅ Seeded ${inserted.length} franchises successfully`);

    const cats = {};
    inserted.forEach(f => { cats[f.category] = (cats[f.category] || 0) + 1; });
    console.log('By category:', cats);

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
