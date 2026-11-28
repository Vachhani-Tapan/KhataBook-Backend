const Party = require('../models/Party');
const Transaction = require('../models/Transaction');
const { transactionSchema } = require('../schemas/transactionValidator');

const toPaise = (rupees) => Math.round(rupees * 100);

// ADD (You Gave / You Got)
exports.addTransaction = async (req, res) => {
  try {
    const result = transactionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const { type, amount, note } = result.data;
    const paise = toPaise(amount);

    // gave: balance goes up, got: balance goes down
    const party = await Party.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, isDeleted: false },
      { $inc: { balance: type === 'gave' ? paise : -paise } },
      { new: true }
    );
    if (!party) return res.status(404).json({ message: 'Party not found' });

    const transaction = await Transaction.create({
      owner: req.user._id,
      party: party._id,
      type,
      amount: paise,
      note,
    });

    res.status(201).json({ message: 'Entry saved', transaction, party });
  } catch (error) {
    console.error('Add transaction error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// LIST (newest first)
exports.getTransactions = async (req, res) => {
  try {
    const party = await Party.findOne({
      _id: req.params.id, owner: req.user._id, isDeleted: false,
    });
    if (!party) return res.status(404).json({ message: 'Party not found' });

    const transactions = await Transaction.find({
      party: party._id, owner: req.user._id, isDeleted: false,
    }).sort({ date: -1, createdAt: -1 });

    res.json({ party, transactions });
  } catch (error) {
    console.error('Get transactions error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE an entry (reverses its effect on the balance)
exports.deleteTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findOneAndUpdate(
      { _id: req.params.txId, party: req.params.id, owner: req.user._id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!tx) return res.status(404).json({ message: 'Entry not found' });

    const party = await Party.findOneAndUpdate(
      { _id: tx.party, owner: req.user._id },
      { $inc: { balance: tx.type === 'gave' ? -tx.amount : tx.amount } },
      { new: true }
    );

    res.json({ message: 'Entry deleted', party });
  } catch (error) {
    console.error('Delete transaction error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};