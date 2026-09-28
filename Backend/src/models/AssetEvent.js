import mongoose from 'mongoose';

const assetEventSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
    type: {
      type: String,
      enum: [
        'asset.created',
        'asset.updated',
        'status.changed',
        'inspection.logged',
        'workorder.created',
        'workorder.completed',
        'health.changed',
        'media.added',
        'report.linked'
      ],
      required: true
    },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, default: Date.now },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: false }
);

assetEventSchema.index({ orgId: 1, assetId: 1, at: -1 });

export const AssetEvent = mongoose.model('AssetEvent', assetEventSchema);
