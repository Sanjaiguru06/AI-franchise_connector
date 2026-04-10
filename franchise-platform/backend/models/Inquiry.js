const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  seeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise', required: true },
  message: { type: String, required: true, maxlength: 1000 },
  phone: String,
  status: { type: String, enum: ['pending', 'responded', 'closed'], default: 'pending' },
  ownerReply: String,
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
