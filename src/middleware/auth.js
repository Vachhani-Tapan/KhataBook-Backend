const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
  try {
    // Token comes in the header as: Authorization: Bearer <token>
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not logged in' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or disabled' });
    }

    req.user = user; // controllers can now use req.user
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired, please login again' });
  }
};

module.exports = protect;