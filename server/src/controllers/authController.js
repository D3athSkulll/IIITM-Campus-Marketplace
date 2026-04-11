const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { generateNickname } = require('../models/User');

/**
 * POST /api/auth/register
 * Register a new user with @iiitm.ac.in email
 */
const register = async (req, res) => {
  try {
    const { email, password, realName, phone, securityQuestion, securityAnswer } = req.body;

    // Validate required fields
    if (!email || !password || !realName || !phone) {
      return res.status(400).json({
        error: 'Email, password, real name, and phone number are required.',
      });
    }

    // Validate email domain
    if (!/@iiitm\.ac\.in$/.test(email.toLowerCase())) {
      return res.status(400).json({
        error: 'Only @iiitm.ac.in email addresses are allowed.',
      });
    }

    // Check password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
      });
    }

    // Create user with auto-generated nickname
    const user = new User({
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save hook
      realName: realName.trim(),
      phone: phone.trim(),
      anonymousNickname: generateNickname(),
      ...(securityQuestion && { securityQuestion: securityQuestion.trim() }),
      ...(securityAnswer && { securityAnswer: securityAnswer.trim().toLowerCase() }),
    });

    await user.save();

    // Generate JWT
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        _id: user._id,
        email: user.email,
        realName: user.realName,
        phone: user.phone,
        anonymousNickname: user.anonymousNickname,
        showRealIdentity: user.showRealIdentity,
        hostelBlock: user.hostelBlock,
        onboardingComplete: false,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
};

/**
 * POST /api/auth/login
 * Login with email & password, returns JWT
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    // Generate JWT
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        email: user.email,
        realName: user.realName,
        phone: user.phone,
        anonymousNickname: user.anonymousNickname,
        showRealIdentity: user.showRealIdentity,
        hostelBlock: user.hostelBlock,
        displayName: user.displayName,
        totalTrades: user.totalTrades,
        isRatingVisible: user.isRatingVisible,
        averageRating: user.isRatingVisible ? user.averageRating : null,
        tradesUntilRatingVisible: user.tradesUntilRatingVisible,
        onboardingComplete: !!user.hostelBlock,
        securityQuestion: user.securityQuestion,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

/**
 * PUT /api/auth/onboarding
 * Complete onboarding: set identity preference & hostel block
 */
const completeOnboarding = async (req, res) => {
  try {
    const { showRealIdentity, hostelBlock } = req.body;

    if (!hostelBlock) {
      return res.status(400).json({
        error: 'Hostel block is required.',
      });
    }

    const user = req.user;
    user.showRealIdentity = !!showRealIdentity;
    user.hostelBlock = hostelBlock;

    await user.save();

    res.json({
      message: 'Onboarding completed!',
      user: {
        _id: user._id,
        email: user.email,
        realName: user.realName,
        anonymousNickname: user.anonymousNickname,
        showRealIdentity: user.showRealIdentity,
        hostelBlock: user.hostelBlock,
        displayName: user.displayName,
        onboardingComplete: true,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding.' });
  }
};

/**
 * GET /api/auth/me
 * Get current user profile (requires auth)
 */
const getMe = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      user: {
        _id: user._id,
        email: user.email,
        realName: user.realName,
        phone: user.phone,
        anonymousNickname: user.anonymousNickname,
        showRealIdentity: user.showRealIdentity,
        hostelBlock: user.hostelBlock,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        totalTrades: user.totalTrades,
        isRatingVisible: user.isRatingVisible,
        averageRating: user.isRatingVisible ? user.averageRating : null,
        tradesUntilRatingVisible: user.tradesUntilRatingVisible,
        onboardingComplete: !!user.hostelBlock,
        securityQuestion: user.securityQuestion,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

/**
 * PUT /api/auth/password
 * Change password (requires current password)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // Update password hash (will be hashed by pre-save hook)
    user.passwordHash = newPassword;
    user.markModified('passwordHash'); // Explicitly mark as modified
    await user.save();

    res.json({ message: 'Password changed successfully!' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
};

/**
 * PUT /api/auth/profile
 * Update profile: identity preference, hostel block, avatar URL
 */
const updateProfile = async (req, res) => {
  try {
    const { showRealIdentity, hostelBlock, avatarUrl, phone, realName, anonymousNickname, securityQuestion, securityAnswer } = req.body;
    const user = req.user;

    if (showRealIdentity !== undefined) user.showRealIdentity = !!showRealIdentity;
    if (hostelBlock) user.hostelBlock = hostelBlock;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (phone !== undefined) user.phone = phone.trim();
    if (realName !== undefined) user.realName = realName.trim();
    if (securityQuestion !== undefined) user.securityQuestion = securityQuestion.trim();
    if (securityAnswer !== undefined) user.securityAnswer = securityAnswer.trim().toLowerCase();

    if (anonymousNickname !== undefined) {
      const trimmed = anonymousNickname.trim();
      if (!trimmed || trimmed.length < 3) {
        return res.status(400).json({ error: 'Nickname must be at least 3 characters.' });
      }
      if (!/^[\w-]+$/.test(trimmed)) {
        return res.status(400).json({ error: 'Nickname can only contain letters, numbers, hyphens, and underscores.' });
      }
      const existing = await User.findOne({
        anonymousNickname: new RegExp(`^${trimmed}$`, 'i'),
        _id: { $ne: user._id },
      });
      if (existing) {
        return res.status(409).json({ error: 'This nickname is already taken.' });
      }
      user.anonymousNickname = trimmed;
    }

    await user.save();

    res.json({
      message: 'Profile updated!',
      user: {
        _id: user._id,
        email: user.email,
        realName: user.realName,
        phone: user.phone,
        anonymousNickname: user.anonymousNickname,
        showRealIdentity: user.showRealIdentity,
        hostelBlock: user.hostelBlock,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        totalTrades: user.totalTrades,
        isRatingVisible: user.isRatingVisible,
        averageRating: user.isRatingVisible ? user.averageRating : null,
        tradesUntilRatingVisible: user.tradesUntilRatingVisible,
        onboardingComplete: !!user.hostelBlock,
        securityQuestion: user.securityQuestion,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('updateProfile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

module.exports = { register, login, completeOnboarding, getMe, changePassword, updateProfile };
