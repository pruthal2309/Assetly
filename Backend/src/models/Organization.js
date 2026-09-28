import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    settings: {
      defaultInspectionDays: { type: Number, default: 180 },
      timezone: { type: String, default: 'Asia/Kolkata' }
    }
  },
  { timestamps: true }
);

export const Organization = mongoose.model('Organization', organizationSchema);
