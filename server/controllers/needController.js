const Need = require('../models/Need');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Raise a new need
// @route   POST /api/needs
// @access  Private
const createNeed = asyncHandler(async (req, res) => {
  const { type, description, quantity, urgency, ward, lat, lng, address, contactPhone } = req.body;

  if (lat === undefined || lng === undefined) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  const need = await Need.create({
    requester: req.user._id,
    type,
    description,
    quantity,
    urgency,
    ward,
    address,
    contactPhone,
    location: {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)],
    },
  });

  res.status(201).json({ success: true, need });
});

// @desc    Get needs raised by the logged-in user
// @route   GET /api/needs/mine
// @access  Private
const getMyNeeds = asyncHandler(async (req, res) => {
  const needs = await Need.find({ requester: req.user._id }).sort('-createdAt');
  res.status(200).json({ success: true, count: needs.length, needs });
});

// @desc    Get all open needs, optionally filtered by ward/type/urgency
// @route   GET /api/needs?ward=..&type=..&urgency=..
// @access  Private (volunteer/admin typically, but any authenticated user can view)
const getNeeds = asyncHandler(async (req, res) => {
  const { ward, type, urgency, status = 'open' } = req.query;

  const query = { status };
  if (ward) query.ward = ward;
  if (type) query.type = type;
  if (urgency) query.urgency = urgency;

  const needs = await Need.find(query)
    .populate('requester', 'name phone')
    .sort('-urgency -createdAt');

  res.status(200).json({ success: true, count: needs.length, needs });
});

// @desc    Get needs near a point (for volunteers deciding where to help)
// @route   GET /api/needs/nearby?lat=..&lng=..&radius=..
// @access  Private
const getNearbyNeeds = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 2000, status = 'open' } = req.query;

  if (!lat || !lng) {
    res.status(400);
    throw new Error('lat and lng query parameters are required');
  }

  const needs = await Need.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseInt(radius),
      },
    },
    status,
  }).populate('requester', 'name phone');

  res.status(200).json({ success: true, count: needs.length, needs });
});

// @desc    Update a need (requester only) — e.g. cancel, edit urgency
// @route   PUT /api/needs/:id
// @access  Private
const updateNeed = asyncHandler(async (req, res) => {
  const need = await Need.findById(req.params.id);

  if (!need) {
    res.status(404);
    throw new Error('Need not found');
  }

  if (need.requester.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this need');
  }

  const { description, quantity, urgency, status, contactPhone } = req.body;

  if (description) need.description = description;
  if (quantity) need.quantity = quantity;
  if (urgency) need.urgency = urgency;
  if (status) need.status = status;
  if (contactPhone) need.contactPhone = contactPhone;

  await need.save();
  res.status(200).json({ success: true, need });
});

// @desc    Delete/cancel a need
// @route   DELETE /api/needs/:id
// @access  Private
const deleteNeed = asyncHandler(async (req, res) => {
  const need = await Need.findById(req.params.id);

  if (!need) {
    res.status(404);
    throw new Error('Need not found');
  }

  if (need.requester.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this need');
  }

  await need.deleteOne();
  res.status(200).json({ success: true, message: 'Need deleted' });
});

module.exports = {
  createNeed,
  getMyNeeds,
  getNeeds,
  getNearbyNeeds,
  updateNeed,
  deleteNeed,
};