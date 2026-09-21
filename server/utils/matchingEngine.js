const Resource = require('../models/Resource');

// Urgency affects how far we're willing to search and how heavily distance
// is weighted vs quantity-fit. Critical needs cast a wider net.
const URGENCY_CONFIG = {
  critical: { radiusMultiplier: 2.5, urgencyWeight: 1.5 },
  high: { radiusMultiplier: 1.8, urgencyWeight: 1.25 },
  medium: { radiusMultiplier: 1.2, urgencyWeight: 1.0 },
  low: { radiusMultiplier: 1.0, urgencyWeight: 0.75 },
};

const BASE_RADIUS_METERS = 2000; // 2km base search radius

/**
 * Finds and ranks candidate resources for a given need.
 * @param {Object} need - a Need document (must have location, type, quantity, urgency)
 * @returns {Array} ranked list of { resource, distance, score }
 */
const findMatches = async (need) => {
  const config = URGENCY_CONFIG[need.urgency] || URGENCY_CONFIG.medium;
  const searchRadius = BASE_RADIUS_METERS * config.radiusMultiplier;

  // $geoNear must be the FIRST stage in the pipeline, and requires a 2dsphere index
  const candidates = await Resource.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: need.location.coordinates },
        distanceField: 'distance', // meters, added to each result
        maxDistance: searchRadius,
        spherical: true,
        query: {
          type: need.type,
          status: 'available',
        },
      },
    },
    { $limit: 20 }, // don't over-fetch; cap candidate pool
  ]);

  if (candidates.length === 0) {
    return [];
  }

  // Score each candidate
  const scored = candidates.map((resource) => {
    // Distance score: closer = higher score. Normalize against search radius.
    // A resource at distance 0 scores 1.0; at maxDistance it approaches 0.
    const distanceScore = 1 - resource.distance / searchRadius;

    // Quantity fit: 1.0 if resource fully covers the need, partial otherwise
    const quantityFitScore = Math.min(resource.quantity / need.quantity, 1);

    // Combined score, weighted by urgency
    const rawScore =
      (distanceScore * 0.6 + quantityFitScore * 0.4) * config.urgencyWeight;

    return {
      resource,
      distance: Math.round(resource.distance),
      score: Math.round(rawScore * 100) / 100, // round to 2 decimals
    };
  });

  // Rank highest score first
  scored.sort((a, b) => b.score - a.score);

  return scored;
};

module.exports = { findMatches };