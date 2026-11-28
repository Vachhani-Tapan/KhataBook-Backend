const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    change: { type: Number, required: true }, // + added, - removed
    reason: {
      type: String,
      enum: ['opening', 'in', 'out', 'edit', 'sale', 'purchase'],
      required: true,
    },
  },
  { timestamps: true } // createdAt is the date of the change
);

stockLogSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('StockLog', stockLogSchema);