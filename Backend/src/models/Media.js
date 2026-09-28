import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    ownerType: { type: String, enum: ['asset', 'inspection', 'report'], required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    url: { type: String, required: true },
    storageKey: { type: String, required: true },
    mime: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

mediaSchema.index({ ownerType: 1, ownerId: 1 });

export const Media = mongoose.model('Media', mediaSchema);
