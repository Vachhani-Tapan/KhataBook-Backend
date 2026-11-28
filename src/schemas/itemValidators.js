const { z } = require('zod');

const UNITS = [
  'Number', 'Pieces', 'Liter', 'Box', 'Cans', 'Dozens', 'Meters',
  'Packs', 'Pairs', 'Thousands', 'Tonnes', 'Unit', 'Quantity', 'Other',
];

// The app sends empty strings for blank fields, so we treat "" as 0
const numberField = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
  z.number({ invalid_type_error: 'Enter a valid number' }).min(0, 'Value cannot be negative')
);

exports.createItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required'),
  unit: z.enum(UNITS, { message: 'Select a valid unit' }).default('Pieces'),
  salePrice: numberField,       // in rupees, converted to paise in the controller
  purchasePrice: numberField,   // in rupees
  taxIncluded: z.boolean().default(true),
  openingStock: numberField,
  lowStockAlert: numberField,
  photo: z.string().optional().default(''),
});