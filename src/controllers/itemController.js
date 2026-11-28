const Item = require('../models/item');
const { createItemSchema } = require('../schemas/itemValidators');
const StockLog = require('../models/StockLog');

// Rupees to paise (₹10.50 -> 1050)
const toPaise = (rupees) => Math.round(rupees * 100);

// CREATE ITEM
exports.createItem = async (req, res) => {
  try {
    const result = createItemSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const data = result.data;

    // Block a duplicate name for the same user (case-insensitive)
    const exists = await Item.findOne({
      owner: req.user._id,
      isDeleted: false,
      name: { $regex: `^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });
    if (exists) {
      return res.status(400).json({ message: 'An item with this name already exists' });
    }

    const item = await Item.create({
      owner: req.user._id,
      name: data.name,
      unit: data.unit,
      salePrice: toPaise(data.salePrice),
      purchasePrice: toPaise(data.purchasePrice),
      taxIncluded: data.taxIncluded,
      openingStock: data.openingStock,
      currentStock: data.openingStock, // starts equal to opening stock
      lowStockAlert: data.lowStockAlert,
      photo: data.photo
    });

    if (item.openingStock > 0) {
      await StockLog.create({
        owner: req.user._id,
        item: item._id,
        change: item.openingStock,
        reason: 'opening',
      });
    }

    res.status(201).json({ message: 'Item saved', item });
  } catch (error) {
    console.error('Create item error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// LIST ITEMS (only the logged-in user's items)
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user._id, isDeleted: false })
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (error) {
    console.error('Get items error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE ITEM (soft delete: hidden, not removed)
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Delete item error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// Escapes special characters so a name can be safely used in a regex
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET ONE ITEM
exports.getItem = async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false,
    });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ item });
  } catch (error) {
    console.error('Get item error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE ITEM
exports.updateItem = async (req, res) => {
  try {
    const result = createItemSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const data = result.data;

    const item = await Item.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false,
    });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Block a duplicate name, but ignore this same item
    const duplicate = await Item.findOne({
      _id: { $ne: item._id },
      owner: req.user._id,
      isDeleted: false,
      name: { $regex: `^${escapeRegex(data.name)}$`, $options: 'i' },
    });
    if (duplicate) {
      return res.status(400).json({ message: 'An item with this name already exists' });
    }

    // If opening stock changed, move current stock by the same difference
    const stockDifference = data.openingStock - item.openingStock;

    item.name = data.name;
    item.unit = data.unit;
    item.salePrice = toPaise(data.salePrice);
    item.purchasePrice = toPaise(data.purchasePrice);
    item.taxIncluded = data.taxIncluded;
    item.openingStock = data.openingStock;
    item.currentStock = item.currentStock + stockDifference;
    item.lowStockAlert = data.lowStockAlert;
    item.photo = data.photo

    await item.save();

    if (stockDifference !== 0) {
      await StockLog.create({
        owner: req.user._id,
        item: item._id,
        change: stockDifference,
        reason: 'edit',
      });
    }

    res.json({ message: 'Item updated', item });
  } catch (error) {
    console.error('Update item error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// ADJUST STOCK (+IN / -OUT)
exports.adjustStock = async (req, res) => {
  try {
    const { type, quantity } = req.body;
    const qty = Number(quantity);

    if (!['in', 'out'].includes(type) || !(qty > 0)) {
      return res.status(400).json({ message: 'Enter a valid quantity' });
    }

    const item = await Item.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false,
    });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (type === 'out' && item.currentStock < qty) {
      return res.status(400).json({ message: 'Not enough stock' });
    }

    item.currentStock += type === 'in' ? qty : -qty;
    await item.save();

    await StockLog.create({
      owner: req.user._id,
      item: item._id,
      change: type === 'in' ? qty : -qty,
      reason: type,
    });

    res.json({ message: 'Stock updated', item });
  } catch (error) {
    console.error('Adjust stock error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};