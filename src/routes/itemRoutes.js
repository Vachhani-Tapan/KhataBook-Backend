const express = require('express');
const protect = require('../middleware/auth');
const {
  createItem, getItems, getItem, updateItem, deleteItem, adjustStock,
} = require('../controllers/itemController');

const router = express.Router();

router.use(protect);

router.post('/', createItem);
router.get('/', getItems);
router.get('/:id', getItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);
router.post('/:id/stock', adjustStock);

module.exports = router;