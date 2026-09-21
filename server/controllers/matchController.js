const Need = require('../models/Need');
const Resource = require('../models/Resource');
const { findMatches } = require('../utils/matchingEngine');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get ranked resource matches for a specific need
// @route   GET /api/matches/:needId
// @access  Private
const getMatchesForNeed = asyncHandler(async (req, res) => {
  const need = await Need.findById(req.params.needId);

  if (!need) {
    res.status(404);
    throw new Error('Need not found');
  }

  const matches = await findMatches(need);

  res.status(200).json({
    success: true,
    need: { id: need._id, type: need.type, urgency: need.urgency, quantity: need.quantity },
    count: matches.length,
    matches,
  });
});

// @desc    Confirm a match — links a resource to a need, updates both statuses
// @route   POST /api/matches/:needId/confirm
// @access  Private
const confirmMatch = asyncHandler(async (req, res) => {
  const { resourceId } = req.body;

  const need = await Need.findById(req.params.needId);
  if (!need) {
    res.status(404);
    throw new Error('Need not found');
  }

  if (need.status !== 'open') {
    res.status(400);
    throw new Error(`Need is already ${need.status}, cannot match again`);
  }

  const resource = await Resource.findById(resourceId);
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  if (resource.status !== 'available') {
    res.status(400);
    throw new Error('Resource is no longer available');
  }

  // Link them
  need.status = 'matched';
  need.matchedResource = resource._id;
  await need.save();

  resource.status = 'reserved';
  await resource.save();

  res.status(200).json({
    success: true,
    message: 'Match confirmed',
    need,
    resource,
  });
});

module.exports = { getMatchesForNeed, confirmMatch };