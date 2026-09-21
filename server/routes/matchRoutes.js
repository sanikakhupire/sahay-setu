const express = require('express');
const router = express.Router();
const { getMatchesForNeed, confirmMatch, updateDispatchStatus } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:needId', getMatchesForNeed);
router.post('/:needId/confirm', confirmMatch);
router.put('/:needId/status', updateDispatchStatus);

module.exports = router;