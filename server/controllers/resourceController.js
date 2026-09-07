const Resource = require('../models/Resource');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Register a new resource
// @route   POST /api/resources
// @access  Private (any authenticated user)
const createResource = asyncHandler(async (req, res) => {
  const { type, label, quantity, ward, lat, lng, address, contactPhone } = req.body;

  if (lat === undefined || lng === undefined) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  const resource = await Resource.create({
    owner: req.user._id,
    type,
    label,
    quantity,
    ward,
    address,
    contactPhone,
    location: {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)], // GeoJSON order
    },
  });

  res.status(201).json({ success: true, resource });
});

// @desc    Get all resources owned by the logged-in user
// @route   GET /api/resources/mine
// @access  Private
const getMyResources = asyncHandler(async (req, res) => {
  const resources = await Resource.find({ owner: req.user._id }).sort('-createdAt');
  res.status(200).json({ success: true, count: resources.length, resources });
});

// @desc    Find resources near a given point, optionally filtered by type/status
// @route   GET /api/resources/nearby?lat=..&lng=..&radius=..&type=..
// @access  Private
const getNearbyResources = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 2000, type, status = 'available' } = req.query;

  if (!lat || !lng) {
    res.status(400);
    throw new Error('lat and lng query parameters are required');
  }

  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: parseInt(radius), // meters
      },
    },
    status,
  };

  if (type) query.type = type;

  const resources = await Resource.find(query).populate('owner', 'name phone');

  res.status(200).json({ success: true, count: resources.length, resources });
});

// @desc    Update a resource (owner only)
// @route   PUT /api/resources/:id
// @access  Private
const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  if (resource.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this resource');
  }

  const { type, label, quantity, status, lat, lng, address, contactPhone } = req.body;

  if (type) resource.type = type;
  if (label) resource.label = label;
  if (quantity) resource.quantity = quantity;
  if (status) resource.status = status;
  if (address) resource.address = address;
  if (contactPhone) resource.contactPhone = contactPhone;
  if (lat !== undefined && lng !== undefined) {
    resource.location.coordinates = [parseFloat(lng), parseFloat(lat)];
  }

  await resource.save();
  res.status(200).json({ success: true, resource });
});

// @desc    Delete a resource (owner only)
// @route   DELETE /api/resources/:id
// @access  Private
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  if (resource.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this resource');
  }

  await resource.deleteOne();
  res.status(200).json({ success: true, message: 'Resource deleted' });
});

module.exports = {
  createResource,
  getMyResources,
  getNearbyResources,
  updateResource,
  deleteResource,
};