const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['seeker', 'owner', 'admin'], default: 'seeker' },
  phone: { type: String, trim: true },
  location: { type: String, default: 'Chennai' },
  avatar: { type: String },

  // Seeker-specific
  seekerProfile: {
    budget: { min: Number, max: Number },
    preferredZones: [String],
    preferredCategories: [String],
    experience: { type: String, enum: ['none', 'basic', 'experienced'], default: 'none' },
    riskTolerance: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    timeAvailability: { type: String, enum: ['part-time', 'full-time'], default: 'full-time' },
    savedFranchises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' }],
    quizCompleted: { type: Boolean, default: false },
    lastQuizResult: { type: mongoose.Schema.Types.Mixed }
  },

  // Owner-specific
  ownerProfile: {
    businessName: String,
    businessType: String,
    gstNumber: String,
    verified: { type: Boolean, default: false },
    verificationDocs: [String]
  },

  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
