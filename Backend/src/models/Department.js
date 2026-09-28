import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    zoneIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Zone' }],
    supervisorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    engineerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

departmentSchema.index({ orgId: 1, code: 1 }, { unique: true });
departmentSchema.index({ orgId: 1, name: 1 });

export const Department = mongoose.model('Department', departmentSchema);
