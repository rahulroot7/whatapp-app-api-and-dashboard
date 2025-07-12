const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  aadharNumber: {
    type: String,
    default: null
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['login', 'resend', 'register', 'aadhar'],
    required: true
  },
  expires_at: {
    type: Date,
    required: true
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

module.exports = mongoose.model('Otp', otpSchema);
