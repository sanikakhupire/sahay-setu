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

  // Broadcast to everyone in this ward's room
  const io = req.app.get('io');
  io.to(`ward-${need.ward}`).emit('matchConfirmed', {
    needId: need._id,
    resourceId: resource._id,
    needType: need.type,
    resourceLabel: resource.label,
    status: 'matched',
    timestamp: new Date(),
  });

  res.status(200).json({
    success: true,
    message: 'Match confirmed',
    need,
    resource,
  });
});

// @desc    Update dispatch status for a matched need (volunteer en route, arrived, fulfilled)
// @route   PUT /api/matches/:needId/status
// @access  Private
const updateDispatchStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // expected: 'dispatched' | 'fulfilled'

  const validStatuses = ['dispatched', 'fulfilled'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  const need = await Need.findById(req.params.needId);
  if (!need) {
    res.status(404);
    throw new Error('Need not found');
  }

  if (need.status === 'fulfilled' || need.status === 'cancelled') {
    res.status(400);
    throw new Error(`Need is already ${need.status}, cannot update further`);
  }

  need.status = status;
  await need.save();

  // If fulfilled, free up the resource for future matches... unless it's fully consumed
  // (For an FYP scope, we'll mark it back to available — a real system might track
  // partial consumption, but that's a reasonable simplification to state in your report.)
  if (status === 'fulfilled' && need.matchedResource) {
    const resource = await Resource.findById(need.matchedResource);
    if (resource) {
      resource.status = 'available';
      await resource.save();
    }
  }

  const io = req.app.get('io');
  io.to(`ward-${need.ward}`).emit('dispatchUpdate', {
    needId: need._id,
    status: need.status,
    timestamp: new Date(),
  });

  res.status(200).json({ success: true, need });
});

module.exports = { getMatchesForNeed, confirmMatch, updateDispatchStatus };