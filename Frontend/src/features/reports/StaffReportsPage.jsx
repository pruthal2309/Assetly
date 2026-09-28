import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import { useCan } from '../../shared/hooks/useCan';
import { DataTable } from '../../shared/ui/DataTable';
import { Chip } from '../../shared/ui/Chip';
import { Button } from '../../shared/ui/Button';
import { Skeleton, EmptyState } from '../../shared/ui/Toast';
import { Modal } from '../../shared/ui/Modal';
import { FileText, Wrench } from 'lucide-react';

export const StaffReportsPage = () => {
  const { can } = useCan();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(null);
  const [triageStatus, setTriageStatus] = useState('matched');
  const [createWO, setCreateWO] = useState(true);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['staff-reports'],
    queryFn: async () => (await apiClient.get('/reports')).data.data
  });

  const triageMutation = useMutation({
    mutationFn: async ({ reportId, status, createWorkOrder }) => {
      const res = await apiClient.post(`/reports/${reportId}/triage`, { status, createWorkOrder });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['staff-reports']);
      setSelectedReport(null);
    }
  });

  const columns = [
    {
      header: 'Code',
      cell: (r) => <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{r.trackingCode}</span>
    },
    {
      header: 'Description',
      cell: (r) => <div style={{ maxWidth: '300px', whiteSpace: 'normal' }}>{r.description}</div>
    },
    {
      header: 'Status',
      cell: (r) => <Chip variant={r.status === 'matched' ? 'healthy' : 'watch'}>{r.status}</Chip>
    },
    {
      header: 'Matched Asset',
      cell: (r) => <span>{r.matchedAssetId?.assetCode || 'Unmatched'}</span>
    },
    {
      header: 'Work Order',
      cell: (r) => <span>{r.workOrderId?.code || 'None'}</span>
    },
    {
      header: 'Action',
      cell: (r) => (
        can('report:triage') && (
          <Button size="sm" variant="secondary" onClick={() => setSelectedReport(r)}>
            Triage
          </Button>
        )
      )
    }
  ];

  if (isLoading) return <Skeleton height="350px" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem' }}>Citizen Reports Triage</h1>
        <p style={{ color: 'var(--color-laurel)', fontSize: '0.9rem' }}>
          Review citizen-submitted issue reports and escalate to work orders
        </p>
      </div>

      <div className="glass" style={{ padding: '1rem' }}>
        <DataTable columns={columns} data={reports} />
      </div>

      {selectedReport && (
        <Modal isOpen={Boolean(selectedReport)} onClose={() => setSelectedReport(null)} title={`Triage Report: ${selectedReport.trackingCode}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p><strong>Description:</strong> {selectedReport.description}</p>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Report Status</label>
              <select className="glass-input" value={triageStatus} onChange={(e) => setTriageStatus(e.target.value)}>
                <option value="received">Received</option>
                <option value="matched">Matched</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={createWO} onChange={(e) => setCreateWO(e.target.checked)} />
              <span>Auto-create Work Order for Matched Asset</span>
            </label>
            <Button
              onClick={() =>
                triageMutation.mutate({
                  reportId: selectedReport._id,
                  status: triageStatus,
                  createWorkOrder: createWO
                })
              }
              disabled={triageMutation.isPending}
            >
              {triageMutation.isPending ? 'Updating...' : 'Save Triage Action'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
