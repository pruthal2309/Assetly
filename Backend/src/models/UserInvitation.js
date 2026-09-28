import mongoose from 'mongoose';

const userInvitationSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userInvitationSchema.index({ userId: 1, expiresAt: 1 });

export const UserInvitation = mongoose.model('UserInvitation', userInvitationSchema);
