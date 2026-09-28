import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    done: { type: Boolean, default: false }
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, default: Date.now },
    text: { type: String, required: true }
  },
  { _id: false }
);

const logSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    cost: { type: Number, default: 0 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const workOrderSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true, index: true },
    code: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'open'
    },
    source: {
      type: String,
      enum: ['inspection', 'citizen_report', 'scheduled', 'manual'],
      default: 'manual'
    },
    sourceRef: { type: mongoose.Schema.Types.ObjectId, default: null },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date },
    estimatedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    checklist: [checklistItemSchema],
    comments: [commentSchema],
    logs: [logSchema],
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String }
  },
  { timestamps: true }
);

workOrderSchema.index({ orgId: 1, code: 1 }, { unique: true });
workOrderSchema.index({ orgId: 1, assetId: 1, status: 1 });
workOrderSchema.index({ orgId: 1, assigneeId: 1, status: 1, dueDate: 1 });
workOrderSchema.index({ orgId: 1, zoneId: 1, status: 1, priority: 1 });

export const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);
