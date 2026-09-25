const User = require('../models/User');
const Resource = require('../models/Resource');
const Need = require('../models/Need');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Dashboard summary stats for a ward
// @route   GET /api/admin/dashboard?ward=Ward 5
// @access  Private (admin only)
const getDashboardStats = asyncHandler(async (req, res) => {
  const { ward } = req.query;
  const wardFilter = ward ? { ward } : {};

  const [
    totalUsers,
    totalResources,
    availableResources,
    totalNeeds,
    openNeeds,
    criticalNeeds,
    fulfilledNeeds,
  ] = await Promise.all([
    User.countDocuments(wardFilter),
    Resource.countDocuments(wardFilter),
    Resource.countDocuments({ ...wardFilter, status: 'available' }),
    Need.countDocuments(wardFilter),
    Need.countDocuments({ ...wardFilter, status: 'open' }),
    Need.countDocuments({ ...wardFilter, status: 'open', urgency: 'critical' }),
    Need.countDocuments({ ...wardFilter, status: 'fulfilled' }),
  ]);

  // Resource breakdown by type
  const resourcesByType = await Resource.aggregate([
    ...(ward ? [{ $match: { ward } }] : []),
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalResources,
      availableResources,
      totalNeeds,
      openNeeds,
      criticalNeeds,
      fulfilledNeeds,
      resourcesByType,
    },
  });
});

// @desc    List all users in a ward (admin oversight)
// @route   GET /api/admin/users?ward=Ward 5
// @access  Private (admin only)
const getUsers = asyncHandler(async (req, res) => {
  const { ward, role } = req.query;
  const query = {};
  if (ward) query.ward = ward;
  if (role) query.role = role;

  const users = await User.find(query).select('-password').sort('-createdAt');
  res.status(200).json({ success: true, count: users.length, users });
});

// @desc    Admin override — force-cancel a need (e.g. spam, duplicate, resolved offline)
// @route   PUT /api/admin/needs/:id/cancel
// @access  Private (admin only)
const cancelNeed = asyncHandler(async (req, res) => {
  const need = await Need.findById(req.params.id);
  if (!need) {
    res.status(404);
    throw new Error('Need not found');
  }

  // If it had a reserved resource, free it back up
  if (need.matchedResource) {
    const resource = await Resource.findById(need.matchedResource);
    if (resource && resource.status === 'reserved') {
      resource.status = 'available';
      await resource.save();
    }
  }

  need.status = 'cancelled';
  await need.save();

  const io = req.app.get('io');
  io.to(`ward-${need.ward}`).emit('dispatchUpdate', {
    needId: need._id,
    status: 'cancelled',
    timestamp: new Date(),
  });

  res.status(200).json({ success: true, message: 'Need cancelled by admin', need });
});

// @desc    Promote a user to volunteer or admin (admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private (admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ['resident', 'volunteer', 'admin'];

  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error(`Role must be one of: ${validRoles.join(', ')}`);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.role = role;
  await user.save();

  res.status(200).json({ success: true, message: `User role updated to ${role}`, user });
});

module.exports = { getDashboardStats, getUsers, cancelNeed, updateUserRole };