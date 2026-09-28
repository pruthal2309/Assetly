import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String },
    action: { type: String, required: true },
    outcome: { type: String, enum: ['success', 'denied', 'error'], default: 'success' },
    entityType: { type: String },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    changes: {
      before: { type: mongoose.Schema.Types.Mixed },
      after: { type: mongoose.Schema.Types.Mixed }
    },
    requestId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    at: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

auditLogSchema.index({ orgId: 1, at: -1 });
auditLogSchema.index({ orgId: 1, entityType: 1, entityId: 1, at: -1 });
auditLogSchema.index({ orgId: 1, actorId: 1, at: -1 });
auditLogSchema.index({ at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 730 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
