import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import { DataTable } from '../../shared/ui/DataTable';
import { Chip } from '../../shared/ui/Chip';
import { Skeleton, EmptyState } from '../../shared/ui/Toast';
import { ShieldAlert, Filter } from 'lucide-react';

export const AuditLogPage = () => {
  const [outcome, setOutcome] = useState('');
  const [entityType, setEntityType] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', { outcome, entityType }],
    queryFn: async () => {
      const res = await apiClient.get('/audit', { params: { outcome, entityType } });
      return res.data.data;
    }
  });

  const columns = [
    {
      header: 'Timestamp',
      cell: (r) => <span style={{ fontSize: '0.8rem', color: 'var(--color-laurel)' }}>{new Date(r.at).toLocaleString()}</span>
    },
    {
      header: 'Actor',
      cell: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.actorId?.name || 'System / Unauthenticated'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-laurel)' }}>Role: {r.actorRole}</div>
        </div>
      )
    },
    {
      header: 'Action',
      cell: (r) => <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{r.action}</span>
    },
    {
      header: 'Outcome',
      cell: (r) => (
        <Chip variant={r.outcome === 'denied' ? 'critical' : r.outcome === 'error' ? 'high' : 'healthy'}>
          {r.outcome.toUpperCase()}
        </Chip>
      )
    },
    {
      header: 'Target Entity',
      cell: (r) => <span>{r.entityType ? `${r.entityType} (${r.entityId || 'N/A'})` : '-'}</span>
    },
    {
      header: 'Details / Reason',
      cell: (r) => <div style={{ fontSize: '0.8rem', maxWidth: '250px' }}>{JSON.stringify(r.changes || {})}</div>
    }
  ];

  if (isLoading) return <Skeleton height="400px" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem' }}>Security & Audit Trail</h1>
        <p style={{ color: 'var(--color-laurel)', fontSize: '0.9rem' }}>
          Immutable log of all system mutations, security events, and denied authorization attempts
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <select className="glass-input" style={{ width: 'auto' }} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
          <option value="">All Outcomes</option>
          <option value="success">Success Only</option>
          <option value="denied">Denied Attempts (Highlighted)</option>
          <option value="error">Errors Only</option>
        </select>

        <select className="glass-input" style={{ width: 'auto' }} value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          <option value="">All Entity Types</option>
          <option value="Asset">Asset</option>
          <option value="Inspection">Inspection</option>
          <option value="WorkOrder">Work Order</option>
          <option value="User">User</option>
        </select>
      </div>

      <div className="glass" style={{ padding: '1rem' }}>
        <DataTable columns={columns} data={logs} />
      </div>
    </div>
  );
};
