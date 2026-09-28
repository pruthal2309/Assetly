import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    assetCode: { type: String, required: true },
    name: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryKey: { type: String, required: true },
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true, index: true },
    status: {
      type: String,
      enum: ['planned', 'acquired', 'installed', 'in_service', 'under_maintenance', 'decommissioned', 'disposed'],
      default: 'planned'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    address: { type: String, default: '' },
    installDate: { type: Date },
    acquisitionCost: { type: Number, default: 0 },
    vendor: { type: String, default: '' },
    expectedLifeYears: { type: Number, default: 10 },
    specs: { type: mongoose.Schema.Types.Mixed, default: {} },
    health: {
      score: { type: Number, default: 100, min: 0, max: 100 },
      riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
      computedAt: { type: Date, default: Date.now },
      factors: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    lastInspection: {
      at: { type: Date },
      rating: { type: Number },
      inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      aiSeverity: { type: String }
    },
    nextInspectionDue: { type: Date },
    openWorkOrderCount: { type: Number, default: 0 },
    replacedByAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    retirement: {
      reason: { type: String },
      at: { type: Date },
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    archivedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

assetSchema.index({ orgId: 1, assetCode: 1 }, { unique: true });
assetSchema.index({ location: '2dsphere' });
assetSchema.index({ orgId: 1, zoneId: 1, status: 1, 'health.riskLevel': 1 });
assetSchema.index({ orgId: 1, categoryKey: 1, status: 1 });
assetSchema.index(
  { orgId: 1, nextInspectionDue: 1 },
  { partialFilterExpression: { status: 'in_service' } }
);
assetSchema.index({ name: 'text', assetCode: 'text', address: 'text' });

export const Asset = mongoose.model('Asset', assetSchema);
