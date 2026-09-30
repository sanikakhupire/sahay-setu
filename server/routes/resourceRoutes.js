const express = require('express');
const router = express.Router();
const {
  createResource,
  getMyResources,
  getWardResources,
  getNearbyResources,
  updateResource,
  deleteResource,
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createResource);
router.get('/mine', getMyResources);
router.get('/nearby', getNearbyResources);
router.get('/', getWardResources);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);

module.exports = router;