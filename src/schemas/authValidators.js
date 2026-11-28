const { z } = require('zod');

// Rules for REGISTER
exports.registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  shopName: z.string().trim().min(2, 'Shop name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Rules for LOGIN
exports.loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});