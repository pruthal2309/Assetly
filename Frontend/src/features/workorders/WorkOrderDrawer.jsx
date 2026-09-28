import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import { useCan } from '../../shared/hooks/useCan';
import { useAuthStore } from '../auth/authStore';
import { Drawer } from '../../shared/ui/Modal';
import { Button } from '../../shared/ui/Button';
import { Chip } from '../../shared/ui/Chip';
import {
  CheckSquare,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Clock,
  UserCheck,
  FileCheck,
  Image,
  AlertCircle
} from 'lucide-react';

export const WorkOrderDrawer = ({ workOrder, isOpen = true, onClose, zoneUsers = [] }) => {
  const { can } = useCan();
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState('');
  const [actualCost, setActualCost] = useState(workOrder?.actualCost || workOrder?.estimatedCost || '');
  const [workNotes, setWorkNotes] = useState(workOrder?.workNotes || '');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photosList, setPhotosList] = useState(workOrder?.photos || []);
  const [reviewNotes, setReviewNotes] = useState('');
  const [sendBackReason, setSendBackReason] = useState('');
  const [showSendBackInput, setShowSendBackInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEngineer = currentUser?.role === 'engineer';
  const isSupervisorOrAdmin = currentUser?.role === 'supervisor' || currentUser?.role === 'admin';

  const assignMutation = useMutation({
    mutationFn: async (assigneeId) => {
      const res = await apiClient.post(`/work-orders/${workOrder._id}/assign`, { assigneeId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['work-orders']);
      queryClient.invalidateQueries(['dashboard']);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      const res = await apiClient.patch(`/work-orders/${workOrder._id}`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['work-orders']);
      queryClient.invalidateQueries(['dashboard']);
    }
  });

  const submitWorkMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient.post(`/work-orders/${workOrder._id}/submit`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['work-orders']);
      queryClient.invalidateQueries(['dashboard']);
      onClose();
    },
    onError: (err) => setErrorMsg(err.response?.data?.error?.message || 'Submission failed')
  });

  const sendBackMutation = useMutation({
    mutationFn: async (reason) => {
      const res = await apiClient.post(`/work-orders/${workOrder._id}/send-back`, { reason });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['work-orders']);
      queryClient.invalidateQueries(['dashboard']);
      setShowSendBackInput(false);
      onClose();
    },
    onError: (err) => setErrorMsg(err.response?.data?.error?.message || 'Send back failed')
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/work-orders/${workOrder._id}/complete`, {
        actualCost: Number(actualCost) || workOrder.estimatedCost || 0,
        reviewNotes
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['work-orders']);
      queryClient.invalidateQueries(['dashboard']);
      onClose();
    },
    onError: (err) => setErrorMsg(err.response?.data?.error?.message || 'Completion failed')
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/work-orders/${workOrder._id}/cancel`, { reason: cancelReason });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['work-orders']);
      queryClient.invalidateQueries(['dashboard']);
      setShowCancelInput(false);
      onClose();
    },
    onError: (err) => setErrorMsg(err.response?.data?.error?.message || 'Cancellation failed')
  });

  const commentMutation = useMutation({
    mutationFn: async (text) => {
      const res = await apiClient.post(`/work-orders/${workOrder._id}/comments`, { text });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['work-orders']);
      setCommentText('');
    }
  });

  if (!workOrder) return null;

  const handleAddPhoto = () => {
    if (photoUrl.trim()) {
      setPhotosList([...photosList, photoUrl.trim()]);
      setPhotoUrl('');
    }
  };

  const handleEngineerSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    submitWorkMutation.mutate({
      workNotes,
      photos: photosList,
      actualCost: Number(actualCost) || 0
    });
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`${workOrder.code}: ${workOrder.title}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {errorMsg && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '0.65rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {/* Status & Priority Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip variant={workOrder.status === 'completed' ? 'healthy' : workOrder.status === 'submitted' ? 'healthy' : workOrder.status === 'in_progress' ? 'watch' : 'info'}>
            {workOrder.status.toUpperCase()}
          </Chip>
          <Chip variant={workOrder.priority === 'urgent' || workOrder.priority === 'high' ? 'high' : 'watch'}>
            Priority: {workOrder.priority.toUpperCase()}
          </Chip>
        </div>

        {/* Target Asset & Zone */}
        <div style={{ background: 'var(--main-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--subtle-border)', fontSize: '0.85rem' }}>
          <div><span style={{ color: 'var(--secondary-text)' }}>Asset: </span><b>{workOrder.assetId?.assetCode} — {workOrder.assetId?.name}</b></div>
          <div><span style={{ color: 'var(--secondary-text)' }}>Zone: </span><b>{workOrder.zoneId?.name || workOrder.zoneId?.code || 'Assigned Zone'}</b></div>
          <div><span style={{ color: 'var(--secondary-text)' }}>Due Date: </span><b>{workOrder.dueDate ? new Date(workOrder.dueDate).toLocaleDateString() : 'None'}</b></div>
        </div>

        {/* Description */}
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', fontWeight: 600 }}>Description / Task Instructions</span>
          <p style={{ fontSize: '0.88rem', marginTop: '0.2rem', color: 'var(--main-text)' }}>{workOrder.description || 'No description provided.'}</p>
        </div>

        {/* SUPERVISOR / ADMIN REVIEW BANNER FOR SUBMITTED WORK */}
        {workOrder.status === 'submitted' && isSupervisorOrAdmin && (
          <div style={{ background: '#EEF2FF', border: '1.5px solid #6366F1', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: 800, color: '#312E81', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck size={18} color="#4F46E5" /> Engineer Submitted Work for Review
            </div>
            <div style={{ fontSize: '0.82rem', color: '#334155' }}>
              <div>Submitted By: <b>{workOrder.submittedBy?.name || 'Engineer'}</b> on {workOrder.submittedAt ? new Date(workOrder.submittedAt).toLocaleString() : 'Recent'}</div>
              {workOrder.workNotes && <div style={{ marginTop: '0.35rem', fontStyle: 'italic', background: '#FFFFFF', padding: '0.5rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}>"{workOrder.workNotes}"</div>}
              {workOrder.photos?.length > 0 && (
                <div style={{ marginTop: '0.35rem' }}>
                  <b>Attached Evidence ({workOrder.photos.length}):</b>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    {workOrder.photos.map((p, i) => (
                      <a key={i} href={p} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#4F46E5', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Image size={12} /> Evidence #{i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Approval or Send-back Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <div>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Supervisor Review Notes / Approval Comments..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  style={{ marginBottom: '0.5rem' }}
                />
                <input
                  type="number"
                  className="glass-input"
                  placeholder="Actual Cost (₹)"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  style={{ marginBottom: '0.5rem' }}
                />
                <Button variant="primary" icon={CheckCircle} onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending} style={{ width: '100%', justifyContent: 'center' }}>
                  Approve & Mark Work Completed
                </Button>
              </div>

              {!showSendBackInput ? (
                <Button variant="secondary" icon={RotateCcw} onClick={() => setShowSendBackInput(true)} style={{ justifyContent: 'center' }}>
                  Send Back for Revision
                </Button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#FFFFFF', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #FCA5A5' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991B1B' }}>Reason for sending back *</label>
                  <textarea
                    className="glass-input"
                    rows={2}
                    placeholder="e.g. Additional bridge expansion joint alignment check required..."
                    value={sendBackReason}
                    onChange={(e) => setSendBackReason(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="danger" onClick={() => sendBackMutation.mutate(sendBackReason)} disabled={!sendBackReason.trim() || sendBackMutation.isPending} style={{ flex: 1 }}>
                      Confirm Send Back
                    </Button>
                    <Button variant="secondary" onClick={() => setShowSendBackInput(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FIELD ENGINEER SUBMISSION FORM */}
        {isEngineer && (workOrder.status === 'in_progress' || workOrder.status === 'assigned') && (
          <form onSubmit={handleEngineerSubmit} style={{ background: 'var(--main-bg)', border: '1.5px solid var(--deep-teal)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontWeight: 800, color: 'var(--primary-dark-teal)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Send size={16} /> Field Work Completion Submission
            </div>

            {workOrder.status === 'assigned' && (
              <Button type="button" variant="primary" icon={Play} onClick={() => updateStatusMutation.mutate('in_progress')} disabled={updateStatusMutation.isPending} style={{ marginBottom: '0.5rem' }}>
                Click to Start Work (Status ➔ IN PROGRESS)
              </Button>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Work Performed / Field Notes *</label>
              <textarea
                className="glass-input"
                rows={3}
                placeholder="Describe actual maintenance performed, parts replaced, observations..."
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Actual Repair Cost (₹)</label>
              <input
                type="number"
                className="glass-input"
                placeholder="Actual cost incurred"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Completion Evidence / Photo URLs</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="https://... or photo link"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
                <button type="button" className="btn-secondary" onClick={handleAddPhoto} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>Add</button>
              </div>
              {photosList.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>
                  Added: {photosList.join(', ')}
                </div>
              )}
            </div>

            <Button type="submit" variant="primary" icon={Send} disabled={submitWorkMutation.isPending} style={{ marginTop: '0.25rem', justifyContent: 'center' }}>
              {submitWorkMutation.isPending ? 'Submitting Work...' : 'Submit Work for Supervisor Approval'}
            </Button>
          </form>
        )}

        {/* Assignee Picker for Supervisors / Admins */}
        {isSupervisorOrAdmin && (
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              Assigned Engineer
            </span>
            {can('workorder:assign') ? (
              <select
                className="glass-input"
                value={workOrder.assigneeId?._id || workOrder.assigneeId || ''}
                onChange={(e) => assignMutation.mutate(e.target.value)}
              >
                <option value="">Unassigned (Open Request)</option>
                {zoneUsers
                  .filter((u) => u.role === 'engineer' || u.role === 'supervisor')
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role.charAt(0).toUpperCase() + u.role.slice(1)} - {u.zoneIds?.map((z) => z.code || z.name).join(', ') || 'Global'})
                    </option>
                  ))}
              </select>
            ) : (
              <div style={{ fontWeight: 600, color: 'var(--primary-dark-teal)' }}>
                {workOrder.assigneeId?.name || 'Unassigned'}
              </div>
            )}
          </div>
        )}

        {/* Cancel Action for Supervisor / Admin */}
        {isSupervisorOrAdmin && workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
          <div>
            {!showCancelInput ? (
              <Button variant="secondary" icon={XCircle} onClick={() => setShowCancelInput(true)} style={{ width: '100%', justifyContent: 'center' }}>
                Cancel Work Order
              </Button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Reason for cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="danger" onClick={() => cancelMutation.mutate()} disabled={!cancelReason.trim() || cancelMutation.isPending} style={{ flex: 1 }}>
                    Confirm Cancel
                  </Button>
                  <Button variant="secondary" onClick={() => setShowCancelInput(false)}>Close</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WORK ORDER HISTORY & AUDIT TRAIL TIMELINE (Section 23) */}
        <div style={{ borderTop: '1px solid var(--subtle-border)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-dark-teal)' }}>
            <Clock size={16} /> Work Order Audit History & Timeline
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderLeft: '2px solid var(--deep-teal)', paddingLeft: '0.85rem', marginLeft: '0.25rem' }}>
            <div style={{ fontSize: '0.8rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--primary-dark-teal)' }}>Created: </span>
              by {workOrder.createdBy?.name || 'Supervisor'} ({workOrder.createdBy?.role || 'supervisor'}) on {new Date(workOrder.createdAt).toLocaleString()}
            </div>

            {workOrder.assigneeId && (
              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-dark-teal)' }}>Assigned to: </span>
                {workOrder.assigneeId?.name} ({workOrder.assigneeId?.email})
              </div>
            )}

            {workOrder.startedAt && (
              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-dark-teal)' }}>Started Work: </span>
                on {new Date(workOrder.startedAt).toLocaleString()}
              </div>
            )}

            {workOrder.submittedAt && (
              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--health-healthy)' }}>Submitted for Review: </span>
                by {workOrder.submittedBy?.name || 'Engineer'} on {new Date(workOrder.submittedAt).toLocaleString()}
              </div>
            )}

            {workOrder.reviewedAt && (
              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-dark-teal)' }}>Reviewed: </span>
                by {workOrder.reviewedBy?.name || 'Supervisor'} on {new Date(workOrder.reviewedAt).toLocaleString()}
                {workOrder.reviewNotes && <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', fontStyle: 'italic' }}>Notes: "{workOrder.reviewNotes}"</div>}
              </div>
            )}

            {workOrder.completedAt && (
              <div style={{ fontSize: '0.8rem', color: 'var(--health-healthy)' }}>
                <span style={{ fontWeight: 700 }}>Completed: </span>
                on {new Date(workOrder.completedAt).toLocaleString()} • Actual Cost: ₹{(workOrder.actualCost || 0).toLocaleString('en-IN')}
              </div>
            )}

            {workOrder.cancelledAt && (
              <div style={{ fontSize: '0.8rem', color: 'var(--health-critical)' }}>
                <span style={{ fontWeight: 700 }}>Cancelled: </span>
                on {new Date(workOrder.cancelledAt).toLocaleString()} • Reason: "{workOrder.cancelReason}"
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div style={{ borderTop: '1px solid var(--subtle-border)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-dark-teal)' }}>
            <MessageSquare size={16} /> Activity & Comments ({workOrder.comments?.length || 0}/50)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', marginBottom: '1rem' }}>
            {workOrder.comments?.map((c, idx) => (
              <div key={idx} style={{ padding: '0.6rem 0.85rem', background: 'var(--main-bg)', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', border: '1px solid var(--subtle-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--secondary-text)', marginBottom: '0.2rem' }}>
                  <strong>{c.by?.name || 'User'}</strong>
                  <span>{new Date(c.at).toLocaleTimeString()}</span>
                </div>
                <div>{c.text}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="glass-input"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button
              variant="secondary"
              icon={Send}
              disabled={!commentText.trim() || commentMutation.isPending}
              onClick={() => commentMutation.mutate(commentText)}
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
