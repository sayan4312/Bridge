import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { createNotification } from './notificationController.js';

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({ name, email, password, role });

    await ActivityLog.logActivity(
      user._id,
      'USER_REGISTER',
      'User',
      user._id,
      { role },
      req
    );

    await createNotification(
      user._id,
      'SYSTEM_ANNOUNCEMENT', // ✅ Fixed
      'Welcome to Bridge!',
      'Your account has been created successfully.',
      {},
      null,
      'medium',
      req
    );

    console.log(`✅ New user registered: ${email} [${role}]`);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await ActivityLog.logActivity(
      user._id,
      'USER_LOGIN',
      'User',
      user._id,
      { loginTime: new Date() },
      req
    );

    // ✅ Add this block for notification
    await createNotification(
      user._id,
      'LOGIN_ALERT',
      'Login Successful',
      `You logged into your account on ${new Date().toLocaleString()}.`,
      {},
      null,
      'low',
      req
    );

    console.log(`✅ User logged in: ${email}`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('❌ Login error:', error.message);
    next(error);
  }
};


// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    await ActivityLog.logActivity(
      req.user._id,
      'USER_LOGOUT',
      'User',
      req.user._id,
      { logoutTime: new Date() },
      req
    );

    console.log(`🚪 User logged out: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('❌ GetMe error:', error.message);
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (name) user.name = name;
  if (email) user.email = email;
  await user.save();

  res.json({ user });
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    await ActivityLog.logActivity(
      req.user._id,
      'PASSWORD_CHANGED',
      'User',
      req.user._id,
      { changeTime: new Date() },
      req
    );

    console.log(`🔐 Password changed for: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('❌ Change password error:', error.message);
    next(error);
  }
};
