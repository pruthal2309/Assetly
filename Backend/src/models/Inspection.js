import mongoose from 'mongoose';

const inspectionSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true, index: true },
    inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    notes: { type: String, default: '' },
    ai: {
      damageType: { type: String },
      severity: { type: String, enum: ['none', 'low', 'medium', 'high', 'critical'] },
      confidence: { type: Number },
      model: { type: String }
    },
    mediaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    inspectedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

inspectionSchema.index({ orgId: 1, assetId: 1, inspectedAt: -1 });
inspectionSchema.index({ orgId: 1, zoneId: 1, inspectedAt: -1 });

export const Inspection = mongoose.model('Inspection', inspectionSchema);
