import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: function() { return this.status === 'active'; }, default: '' },
    role: {
      type: String,
      enum: ['admin', 'supervisor', 'engineer', 'auditor', 'citizen'],
      required: true
    },
    zoneIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Zone' }],
    departmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
    status: {
      type: String,
      enum: ['active', 'invited', 'deactivated'],
      default: 'active'
    },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.index({ orgId: 1, role: 1, status: 1 });

export const User = mongoose.model('User', userSchema);
