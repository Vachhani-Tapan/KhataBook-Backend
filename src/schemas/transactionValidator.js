const { z } = require('zod');

exports.transactionSchema = z.object({
  type: z.enum(['gave', 'got'], { message: 'Type must be gave or got' }),
  amount: z.coerce.number({ message: 'Enter a valid amount' }).positive('Amount must be greater than 0'),
  note: z.string().trim().optional().default(''),
});