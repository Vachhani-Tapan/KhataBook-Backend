    const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
    type: { type: String, enum: ['gave', 'got'], required: true },
    amount: { type: Number, required: true, min: 1 }, // paise
    note: { type: String, trim: true, default: '' },
    date: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

transactionSchema.index({ party: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);