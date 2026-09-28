import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    boundary: {
      type: {
        type: String,
        enum: ['Polygon'],
        default: 'Polygon'
      },
      coordinates: { type: [[[Number]]], default: undefined }
    }
  },
  { timestamps: true }
);

zoneSchema.index({ orgId: 1, code: 1 }, { unique: true });

export const Zone = mongoose.model('Zone', zoneSchema);
