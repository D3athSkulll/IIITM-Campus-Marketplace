const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  realName: { type: String, required: true },
  phone: { type: String, default: '' },
  securityQuestion: { type: String, default: "What is the name of your pet?" },
  securityAnswer: { type: String, default: "tom" },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

// Auto-delete documents after expiresAt
pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
