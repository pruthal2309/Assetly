import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import { useCan } from '../../shared/hooks/useCan';
import { Drawer } from '../../shared/ui/Modal';
import { Button } from '../../shared/ui/Button';
import { Chip } from '../../shared/ui/Chip';
import { CheckSquare, MessageSquare, Send, CheckCircle, XCircle } from 'lucide-react';

export const WorkOrderDrawer = ({ workOrder, isOpen, onClose, zoneUsers = [] }) => {
  const { can } = useCan();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);

  const assignMutation = useMutation({
    mutationFn: async (assigneeId) => {
      const res = await apiClient.post(`/work-orders/${workOrder._id}/assign`, { assigneeId });
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries(['work-orders'])
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/work-orders/${workOrder._id}/complete`, {
        actualCost: Number(actualCost) || workOrder.estimatedCost || 0
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['work-orders']);
      onClose();
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/work-orders/${workOrder._id}/cancel`, { reason: cancelReason });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['work-orders']);
      setShowCancelInput(false);
      onClose();
    }
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

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`${workOrder.code}: ${workOrder.title}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Status & Priority */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip variant={workOrder.status === 'completed' ? 'healthy' : 'watch'}>{workOrder.status}</Chip>
          <Chip variant={workOrder.priority === 'urgent' || workOrder.priority === 'high' ? 'high' : 'watch'}>
            Priority: {workOrder.priority}
          </Chip>
        </div>

        {/* Description */}
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-laurel)' }}>Description</span>
          <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{workOrder.description || 'No description provided.'}</p>
        </div>

        {/* Assignee Picker */}
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-laurel)', display: 'block', marginBottom: '0.3rem' }}>
            Assignee (Zone Technicians)
          </span>
          {can('workorder:assign') ? (
            <select
              className="glass-input"
              value={workOrder.assigneeId?._id || workOrder.assigneeId || ''}
              onChange={(e) => assignMutation.mutate(e.target.value)}
            >
              <option value="">Unassigned</option>
              {zoneUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          ) : (
            <span>{workOrder.assigneeId?.name || 'Unassigned'}</span>
          )}
        </div>

        {/* Action Buttons */}
        {workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem' }}>
            {can('workorder:complete') && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  className="glass-input"
                  placeholder="Actual Cost (₹)"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                />
                <Button variant="primary" icon={CheckCircle} onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
                  Complete
                </Button>
              </div>
            )}

            {can('workorder:cancel') && !showCancelInput && (
              <Button variant="secondary" icon={XCircle} onClick={() => setShowCancelInput(true)}>
                Cancel Work Order
              </Button>
            )}

            {showCancelInput && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Reason for cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <Button variant="danger" onClick={() => cancelMutation.mutate()} disabled={!cancelReason}>
                  Confirm Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Comments Section */}
        <div style={{ borderTop: '1px solid rgba(251,246,240,0.12)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MessageSquare size={16} /> Activity & Comments ({workOrder.comments?.length || 0}/50)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
            {workOrder.comments?.map((c, idx) => (
              <div key={idx} style={{ padding: '0.6rem 0.85rem', background: 'rgba(251,246,240,0.06)', borderRadius: 'var(--radius-md)', fontSize: '0.825rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-laurel)', marginBottom: '0.2rem' }}>
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
              disabled={!commentText.trim()}
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
