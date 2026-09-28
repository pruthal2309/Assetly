import mongoose from 'mongoose';

const specSchemaField = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['string', 'number', 'boolean', 'select', 'date'], required: true },
    unit: { type: String },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    min: { type: Number },
    max: { type: Number }
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    key: { type: String, required: true },
    name: { type: String, required: true },
    defaultLifeYears: { type: Number, default: 10 },
    inspectionIntervalDays: { type: Number, default: 180 },
    icon: { type: String, default: 'box' },
    specSchema: [specSchemaField]
  },
  { timestamps: true }
);

categorySchema.index({ orgId: 1, key: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);
