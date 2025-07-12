const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: { type: String},
  first_name: { type: String },
  last_name: { type: String },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String},
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: false
  },
  status: { type: String, enum: ['0', '1', '2'], default: '0' },
  // 0 - active, 1 - inactive, 2 - blocked
  email_verified: { type: Boolean, default: false },
  bio: { type: String, default: 'Available' },
  profilePic: {
    type: String,
    default: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'
  },
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  businessDetails: {
    fullName: { type: String },
    contactDetails: { type: String },
    businessName: { type: String },
    businessCategory: { type: String, enum: ['retail', 'service', 'manufacturing', 'other'] },
    businessAddress: {
      addressLine: { type: String },
      pinCode: { type: String },
      mapLocation: {
        latitude: { type: Number },
        longitude: { type: Number }
      }
    },
    idProof: {
      type: { type: String, enum: ['aadhar', 'pan'] },
      number: { type: String },
      otpVerified: { type: Boolean, default: false }
    },
    selfieUrl: { type: String },
    socialLinks: {
      facebook: { type: String },
      instagram: { type: String },
      website: { type: String }
    }
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// JWT token generator
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET || 'defaultsecret',
    { expiresIn: '24h' }
  );
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
