import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import { useCan } from '../../shared/hooks/useCan';
import { useAuthStore } from '../auth/authStore';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Chip } from '../../shared/ui/Chip';
import { Button } from '../../shared/ui/Button';
import { Modal } from '../../shared/ui/Modal';
import { Skeleton } from '../../shared/ui/Toast';
import { WorkOrderDrawer } from './WorkOrderDrawer';
import { Wrench, Plus, Calendar, AlertCircle, Bell, UserCheck } from 'lucide-react';

const COLUMNS = [
  { key: 'open', title: 'Open Requests' },
  { key: 'assigned', title: 'Assigned' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'submitted', title: 'Submitted for Review' },
  { key: 'completed', title: 'Completed' }
];

export const WorkOrdersPage = () => {
  const { can } = useCan();
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [assetId, setAssetId] = useState('');
  const [priority, setPriority] = useState('high');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [error, setError] = useState(null);

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => (await apiClient.get('/work-orders')).data.data
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => (await apiClient.get('/assets')).data.data,
    enabled: can('workorder:create')
  });

  const { data: zoneUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await apiClient.get('/users')).data.data,
    enabled: can('workorder:assign') || can('workorder:create') || can('user:read')
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient.post('/work-orders', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['work-orders']);
      setShowCreateModal(false);
      setTitle('');
      setAssetId('');
      setPriority('high');
      setAssigneeId('');
      setDueDate('');
      setDescription('');
      setEstimatedCost('');
      setError(null);
    },
    onError: (err) => setError(err.response?.data?.error?.message || 'Failed to create work order')
  });

  const selectedAssetObj = assets.find((a) => a._id === assetId);

  // Filter engineers by zone if asset is selected, or all engineers
  const availableEngineers = zoneUsers.filter((u) => {
    if (u.role !== 'engineer' && u.role !== 'supervisor') return false;
    if (!selectedAssetObj) return true;
    const assetZoneId = selectedAssetObj.zoneId?._id || selectedAssetObj.zoneId;
    return u.zoneIds?.some((z) => (z._id || z).toString() === assetZoneId?.toString());
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!assetId) {
      setError('Please select an asset for this work order.');
      return;
    }

    createMutation.mutate({
      title,
      assetId,
      priority,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate || undefined,
      description,
      estimatedCost: Number(estimatedCost) || 0
    });
  };

  if (isLoading) return <Skeleton height="400px" />;

  // Filter my assigned work orders for engineer
  const myAssignedOrders = workOrders.filter(
    (wo) => (wo.assigneeId?._id || wo.assigneeId) === currentUser?.id || (wo.assigneeId?._id || wo.assigneeId) === currentUser?._id
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Maintenance Work Orders</h1>
          <p style={{ color: 'var(--color-laurel)', fontSize: '0.9rem' }}>
            Kanban task management for infrastructure maintenance and field operations
          </p>
        </div>
        {can('workorder:create') && (
          <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
            Create Work Order
          </Button>
        )}
      </div>

      {/* Engineer Assigned Tasks Alert Banner */}
      {currentUser?.role === 'engineer' && (
        <div
          style={{
            background: 'var(--health-watch-bg)',
            border: '1px solid #FDE68A',
            color: 'var(--primary-dark-teal)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--health-watch)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <Bell size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                You have {myAssignedOrders.length} active Work Orders assigned in your ward
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
                Click on any work order card below to review details, post comments, or complete field maintenance.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Board Columns Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          alignItems: 'flex-start'
        }}
      >
        {COLUMNS.map((col) => {
          const colItems = workOrders.filter((wo) => wo.status === col.key);
          return (
            <div
              key={col.key}
              className="glass"
              style={{
                padding: '1rem',
                minHeight: '450px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <h3 style={{ fontSize: '1rem' }}>{col.title}</h3>
                <span
                  style={{
                    background: 'rgba(251,246,240,0.1)',
                    borderRadius: '999px',
                    padding: '0.15rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {colItems.length}
                </span>
              </div>

              {colItems.map((wo) => {
                const isMyOrder = (wo.assigneeId?._id || wo.assigneeId) === currentUser?.id || (wo.assigneeId?._id || wo.assigneeId) === currentUser?._id;
                return (
                  <GlassCard
                    key={wo._id}
                    style={{
                      cursor: 'pointer',
                      padding: '1rem',
                      borderLeft: isMyOrder ? '4px solid var(--deep-teal)' : undefined
                    }}
                    onClick={() => setSelectedWorkOrder(wo)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.9rem' }}>{wo.code}</span>
                      <Chip variant={wo.priority === 'urgent' || wo.priority === 'high' ? 'high' : 'watch'}>
                        {wo.priority}
                      </Chip>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>{wo.title}</h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-laurel)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span>Asset: {wo.assetId?.name || wo.assetId?.assetCode || 'N/A'}</span>
                      <span style={{ fontWeight: isMyOrder ? 700 : 400, color: isMyOrder ? 'var(--deep-teal)' : undefined }}>
                        Assignee: {wo.assigneeId?.name || 'Unassigned'} {isMyOrder ? '(You)' : ''}
                      </span>
                      {wo.dueDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                          <Calendar size={12} /> Due: {new Date(wo.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Drawer Details Modal */}
      <WorkOrderDrawer
        workOrder={selectedWorkOrder}
        isOpen={Boolean(selectedWorkOrder)}
        onClose={() => setSelectedWorkOrder(null)}
        zoneUsers={zoneUsers}
      />

      {/* Create Work Order Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Work Order">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div
              style={{
                background: 'var(--health-critical-bg)',
                border: '1px solid #FCA5A5',
                color: 'var(--health-critical)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Work Order Title *
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. Repair bridge support cracks"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Target Infrastructure Asset *
            </label>
            <select
              className="glass-input"
              value={assetId}
              onChange={(e) => {
                setAssetId(e.target.value);
                setAssigneeId('');
              }}
              required
            >
              <option value="">Select Asset...</option>
              {assets.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.assetCode})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Priority Level *
              </label>
              <select className="glass-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Due Date
              </label>
              <input
                type="date"
                className="glass-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Assignee (Available Zone Engineers)
            </label>
            <select className="glass-input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned (Open Request)</option>
              {availableEngineers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role.charAt(0).toUpperCase() + u.role.slice(1)} - {u.zoneIds?.map((z) => z.code || z.name).join(', ') || 'Global'})
                </option>
              ))}
            </select>
            {selectedAssetObj && availableEngineers.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--health-critical)', marginTop: '0.3rem' }}>
                No active engineers are currently assigned to this asset's ward.
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Detailed Description / Instructions
            </label>
            <textarea
              className="glass-input"
              rows={3}
              placeholder="Provide specific instructions for field engineers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Estimated Maintenance Cost (₹)
            </label>
            <input
              type="number"
              className="glass-input"
              placeholder="e.g. 25000"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={createMutation.isPending} style={{ marginTop: '0.5rem' }}>
            {createMutation.isPending ? 'Creating Work Order...' : 'Create & Dispatch Work Order'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
