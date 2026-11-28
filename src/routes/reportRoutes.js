const express = require('express');
const protect = require('../middleware/auth');
const { stockSummary } = require('../controllers/reportController');

const router = express.Router();

router.use(protect);

router.get('/stock-summary', stockSummary);

module.exports = router;