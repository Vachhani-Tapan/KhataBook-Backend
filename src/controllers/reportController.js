const Item = require('../models/item');
const StockLog = require('../models/StockLog');

exports.stockSummary = async (req, res) => {
  try {
    const start = new Date(req.query.start);
    const end = new Date(req.query.end);

    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: 'Valid start and end dates are required' });
    }

    // Items that already existed before the period ended
    const items = await Item.find({
      owner: req.user._id,
      isDeleted: false,
      createdAt: { $lt: end },
    }).sort({ name: 1 });

    // One pass over the logs, grouped per item
    const logs = await StockLog.aggregate([
      { $match: { owner: req.user._id, createdAt: { $lt: end } } },
      {
        $group: {
          _id: '$item',
          opening: {
            $sum: { $cond: [{ $lt: ['$createdAt', start] }, '$change', 0] },
          },
          stockIn: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$createdAt', start] }, { $gt: ['$change', 0] }] },
                '$change',
                0,
              ],
            },
          },
          stockOut: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$createdAt', start] }, { $lt: ['$change', 0] }] },
                { $abs: '$change' },
                0,
              ],
            },
          },
        },
      },
    ]);

    const byItem = new Map(logs.map((l) => [String(l._id), l]));

    const rows = items.map((item) => {
      const l = byItem.get(String(item._id)) || { opening: 0, stockIn: 0, stockOut: 0 };
      const closing = l.opening + l.stockIn - l.stockOut;
      return {
        _id: item._id,
        name: item.name,
        unit: item.unit,
        photo: item.photo,
        salePrice: item.salePrice,
        purchasePrice: item.purchasePrice,
        opening: l.opening,
        stockIn: l.stockIn,
        stockOut: l.stockOut,
        closing,
        valueOnSale: closing * item.salePrice,         // paise
        valueOnPurchase: closing * item.purchasePrice, // paise
      };
    });

    res.json({
      start,
      end,
      totalItems: rows.length,
      totalStock: rows.reduce((sum, r) => sum + r.closing, 0),
      rows,
    });
  } catch (error) {
    console.error('Stock summary error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};