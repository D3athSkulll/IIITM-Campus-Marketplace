const express = require('express');
const router = express.Router();
const { register, login, completeOnboarding, getMe, changePassword, updateProfile, forgotPassword, sendOtp, verifyOtp } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Protected routes (require JWT)
router.get('/me', auth, getMe);
router.put('/onboarding', auth, completeOnboarding);
router.put('/password', auth, changePassword);
router.put('/profile', auth, updateProfile);

module.exports = router;
