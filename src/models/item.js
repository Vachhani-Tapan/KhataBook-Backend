const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    photo: { type: String, default: '' },
    unit: {
      type: String,
      enum: [
        'Number', 'Pieces', 'Liter', 'Box', 'Cans', 'Dozens', 'Meters',
        'Packs', 'Pairs', 'Thousands', 'Tonnes', 'Unit', 'Quantity', 'Other',
      ],
      default: 'Pieces',
    },
    salePrice: { type: Number, default: 0, min: 0 },      // stored in paise
    purchasePrice: { type: Number, default: 0, min: 0 },  // stored in paise
    taxIncluded: { type: Boolean, default: true },
    openingStock: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    lowStockAlert: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One user cannot have two items with the same name
itemSchema.index({ owner: 1, name: 1 });

module.exports = mongoose.model('Item', itemSchema);