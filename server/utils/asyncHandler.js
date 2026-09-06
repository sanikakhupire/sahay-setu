// Wraps async route handlers so thrown errors are passed to Express's error handler
// instead of crashing the server or hanging the request.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;