const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user')

const {registerSchema , loginSchema} = require('../schemas/authValidators')

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// REGISTER
exports.register = async (req, res) => {
  try {
    // 1. Validate with Zod
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    
    const { name, shopName, email, phone, password } = result.data;

    // 2. Check the email is not already used
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the user
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'owner',
    });

    // 6. Send the response (never the password)
    res.status(201).json({
      message: 'Registration successful',
      token: createToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    // 1. Validate with Zod
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }
    const { email, password } = result.data;

    // 2. Find the user (password is hidden by default, so we ask for it)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Compare the typed password with the saved hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Check the account is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is disabled' });
    }

    res.json({
      message: 'Login successful',
      token: createToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};