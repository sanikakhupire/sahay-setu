const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { generateOtp, sendOtp } = require('../utils/otpService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Register new user + send OTP for phone verification
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, phone, email, password, role, ward } = req.body;

  const userExists = await User.findOne({ phone });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this phone number');
  }

  // Prevent self-registration as admin — admins should be created manually/seeded
  const safeRole = role === 'admin' ? 'resident' : role;

  const user = await User.create({
    name,
    phone,
    email,
    password,
    role: safeRole,
    ward,
  });

  // Generate & "send" OTP
  const otp = generateOtp();
  user.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
  };
  await user.save({ validateBeforeSave: false });
  await sendOtp(user.phone, otp);

  res.status(201).json({
    success: true,
    message: 'Registration successful. OTP sent for phone verification.',
    userId: user._id,
  });
});

// @desc    Verify phone OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  const user = await User.findById(userId).select('+otp.code +otp.expiresAt');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.otp || !user.otp.code) {
    res.status(400);
    throw new Error('No OTP requested for this user');
  }

  if (user.otp.expiresAt < new Date()) {
    res.status(400);
    throw new Error('OTP has expired, please request a new one');
  }

  if (user.otp.code !== otp) {
    res.status(400);
    throw new Error('Invalid OTP');
  }

  user.isPhoneVerified = true;
  user.otp = undefined;
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    message: 'Phone verified successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      ward: user.ward,
    },
  });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const otp = generateOtp();
  user.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  };
  await user.save({ validateBeforeSave: false });
  await sendOtp(user.phone, otp);

  res.status(200).json({ success: true, message: 'OTP resent successfully' });
});

// @desc    Login with phone + password
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  const user = await User.findOne({ phone }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid phone number or password');
  }

  if (!user.isPhoneVerified) {
    res.status(403);
    throw new Error('Phone not verified. Please verify OTP first.');
  }

  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      ward: user.ward,
    },
  });
});

// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

module.exports = { registerUser, verifyOtp, resendOtp, loginUser, getMe };