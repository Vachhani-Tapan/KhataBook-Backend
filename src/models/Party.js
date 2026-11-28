const mongoose = require('mongoose');

const partySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    type: { type: String, enum: ['customer', 'supplier'], required: true },
    gstin: { type: String, trim: true, uppercase: true, default: '' },
    address: { type: String, trim: true, default: '' },
    balance: { type: Number, default: 0 }, // paise: + you will get, - you will give
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

partySchema.index({ owner: 1, type: 1, isDeleted: 1 });

module.exports = mongoose.model('Party', partySchema);