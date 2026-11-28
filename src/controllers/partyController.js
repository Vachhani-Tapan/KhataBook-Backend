const Party = require('../models/Party');
const { partySchema } = require('../schemas/partyValidator');

const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// CREATE
exports.createParty = async (req, res) => {
  try {
    const result = partySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const party = await Party.create({ owner: req.user._id, ...result.data });
    res.status(201).json({ message: 'Party saved', party });
  } catch (error) {
    console.error('Create party error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// LIST (?type=customer|supplier&search=ram) + totals for that type
exports.getParties = async (req, res) => {
  try {
    const { type, search } = req.query;
    if (!['customer', 'supplier'].includes(type)) {
      return res.status(400).json({ message: 'type must be customer or supplier' });
    }

    const filter = { owner: req.user._id, type, isDeleted: false };
    if (search && search.trim()) {
      filter.name = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    const parties = await Party.find(filter).sort({ updatedAt: -1 });

    // Totals use ALL parties of this type, not just the searched ones
    const all = await Party.find(
      { owner: req.user._id, type, isDeleted: false },
      'balance'
    );
    const youWillGet = all.reduce((s, p) => s + (p.balance > 0 ? p.balance : 0), 0);
    const youWillGive = all.reduce((s, p) => s + (p.balance < 0 ? -p.balance : 0), 0);

    res.json({ parties, summary: { youWillGet, youWillGive } });
  } catch (error) {
    console.error('Get parties error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ONE
exports.getParty = async (req, res) => {
  try {
    const party = await Party.findOne({
      _id: req.params.id, owner: req.user._id, isDeleted: false,
    });
    if (!party) return res.status(404).json({ message: 'Party not found' });
    res.json({ party });
  } catch (error) {
    console.error('Get party error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE (the balance is never edited here)
exports.updateParty = async (req, res) => {
  try {
    const result = partySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const party = await Party.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, isDeleted: false },
      result.data,
      { new: true }
    );
    if (!party) return res.status(404).json({ message: 'Party not found' });
    res.json({ message: 'Party updated', party });
  } catch (error) {
    console.error('Update party error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE (soft)
exports.deleteParty = async (req, res) => {
  try {
    const party = await Party.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!party) return res.status(404).json({ message: 'Party not found' });
    res.json({ message: 'Party deleted' });
  } catch (error) {
    console.error('Delete party error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};