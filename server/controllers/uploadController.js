const Resource = require('../models/Resource');
const Need = require('../models/Need');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Upload/attach a verification photo to a resource
// @route   POST /api/upload/resource/:id
// @access  Private (owner only)
const uploadResourcePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }

  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  if (resource.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this resource');
  }

  resource.verificationPhoto = req.file.path; // Cloudinary gives back the hosted URL here
  await resource.save();

  res.status(200).json({ success: true, resource });
});

// @desc    Upload/attach a verification photo to a need
// @route   POST /api/upload/need/:id
// @access  Private (requester only)
const uploadNeedPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }

  const need = await Need.findById(req.params.id);
  if (!need) {
    res.status(404);
    throw new Error('Need not found');
  }

  if (need.requester.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this need');
  }

  need.verificationPhoto = req.file.path;
  await need.save();

  res.status(200).json({ success: true, need });
});

// @desc    Upload proof-of-fulfillment photo for a need
// @route   POST /api/upload/need/:id/fulfillment
// @access  Private
const uploadFulfillmentPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }

  const need = await Need.findById(req.params.id);
  if (!need) {
    res.status(404);
    throw new Error('Need not found');
  }

  need.fulfillmentPhoto = req.file.path;
  await need.save();

  res.status(200).json({ success: true, need });
});

module.exports = { uploadResourcePhoto, uploadNeedPhoto, uploadFulfillmentPhoto };