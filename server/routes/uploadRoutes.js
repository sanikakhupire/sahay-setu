const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadResourcePhoto,
  uploadNeedPhoto,
  uploadFulfillmentPhoto,
} = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// 'photo' below is the form field name the file must be sent under
router.post('/resource/:id', upload.single('photo'), uploadResourcePhoto);
router.post('/need/:id', upload.single('photo'), uploadNeedPhoto);
router.post('/need/:id/fulfillment', upload.single('photo'), uploadFulfillmentPhoto);

module.exports = router;