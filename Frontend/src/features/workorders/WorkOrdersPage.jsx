import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import { useCan } from '../../shared/hooks/useCan';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Chip } from '../../shared/ui/Chip';
import { Skeleton } from '../../shared/ui/Toast';
import { WorkOrderDrawer } from './WorkOrderDrawer';
import { Wrench, Clock, User, AlertCircle } from 'lucide-react';

const COLUMNS = [
  { key: 'open', title: 'Open Requests' },
  { key: 'assigned', title: 'Assigned' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'completed', title: 'Completed' }
];

export const WorkOrdersPage = () => {
  const { can } = useCan();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => (await apiClient.get('/work-orders')).data.data
  });

  const { data: zoneUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await apiClient.get('/users')).data.data,
    enabled: can('workorder:assign')
  });

  if (isLoading) return <Skeleton height="400px" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem' }}>Maintenance Work Orders</h1>
        <p style={{ color: 'var(--color-laurel)', fontSize: '0.9rem' }}>
          Kanban task management for infrastructure maintenance and field operations
        </p>
      </div>

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

              {colItems.map((wo) => (
                <GlassCard
                  key={wo._id}
                  style={{ cursor: 'pointer', padding: '1rem' }}
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
                    <span>Asset: {wo.assetId?.assetCode || 'N/A'}</span>
                    <span>Assignee: {wo.assigneeId?.name || 'Unassigned'}</span>
                  </div>
                </GlassCard>
              ))}
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
    </div>
  );
};
