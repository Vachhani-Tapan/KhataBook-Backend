const express = require('express');
const protect = require('../middleware/auth');
const {
  createParty, getParties, getParty, updateParty, deleteParty,
} = require('../controllers/partyController');
const {
  addTransaction, getTransactions, deleteTransaction,
} = require('../controllers/transactionController');

const router = express.Router();

router.use(protect);

router.post('/', createParty);
router.get('/', getParties);
router.get('/:id', getParty);
router.put('/:id', updateParty);
router.delete('/:id', deleteParty);

router.post('/:id/transactions', addTransaction);
router.get('/:id/transactions', getTransactions);
router.delete('/:id/transactions/:txId', deleteTransaction);

module.exports = router;