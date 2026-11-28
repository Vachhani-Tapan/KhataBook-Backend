const { z } = require('zod');

exports.partySchema = z.object({
  name: z.string().trim().min(1, 'Party name is required'),
  phone: z
    .string()
    .trim()
    .regex(/^(\d{10})?$/, 'Phone number must be exactly 10 digits')
    .optional()
    .default(''),
  type: z.enum(['customer', 'supplier'], { message: 'Type must be customer or supplier' }),
  gstin: z.string().trim().optional().default(''),
  address: z.string().trim().optional().default(''),
});