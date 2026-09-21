const express = require('express');
const router = express.Router();
const {
  createNeed,
  getMyNeeds,
  getNeeds,
  getNearbyNeeds,
  updateNeed,
  deleteNeed,
} = require('../controllers/needController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createNeed);
router.get('/mine', getMyNeeds);
router.get('/nearby', getNearbyNeeds);
router.get('/', getNeeds);
router.put('/:id', updateNeed);
router.delete('/:id', deleteNeed);

module.exports = router;