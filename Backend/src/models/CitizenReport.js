import mongoose from 'mongoose';

const citizenReportSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    trackingCode: { type: String, required: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    contact: { type: String, default: '' },
    description: { type: String, required: true },
    mediaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true
      }
    },
    matchedAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
    matchDistanceM: { type: Number, default: null },
    workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder', default: null },
    status: {
      type: String,
      enum: ['received', 'matched', 'in_progress', 'resolved', 'rejected'],
      default: 'received'
    }
  },
  { timestamps: true }
);

citizenReportSchema.index({ trackingCode: 1 }, { unique: true });
citizenReportSchema.index({ location: '2dsphere' });
citizenReportSchema.index({ orgId: 1, status: 1, createdAt: -1 });

export const CitizenReport = mongoose.model('CitizenReport', citizenReportSchema);
