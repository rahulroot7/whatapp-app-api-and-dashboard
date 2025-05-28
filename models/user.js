const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  first_name: { type: String },
  last_name: { type: String },
  email: {
    type: String,
    unique: true,
    sparse: true // prevent index issues with multiple nulls
  },
  phone: {
    type: String,
    unique: true,
    required: true
  },
  password: { type: String },
  role: {
    type: String,
    enum: ['user', 'business_user', 'admin', 'super_admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['0', '1', '2'],
    default: '0'
  },
  email_verified: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true // includes createdAt and updatedAt
});

// Add soft delete (equivalent to Sequelize `paranoid`)
userSchema.add({
  deletedAt: { type: Date, default: null }
});

module.exports = mongoose.model('User', userSchema);
