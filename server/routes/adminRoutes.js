const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  cancelNeed,
  updateUserRole,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin')); // every route below requires admin role

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.put('/needs/:id/cancel', cancelNeed);
router.put('/users/:id/role', updateUserRole);

module.exports = router;