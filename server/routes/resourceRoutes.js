const express = require('express');
const router = express.Router();
const {
  createResource,
  getMyResources,
  getNearbyResources,
  updateResource,
  deleteResource,
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // every route below requires login

router.post('/', createResource);
router.get('/mine', getMyResources);
router.get('/nearby', getNearbyResources);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);

module.exports = router;