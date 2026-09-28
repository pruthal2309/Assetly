import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Chip } from '../../shared/ui/Chip';
import { Skeleton, EmptyState } from '../../shared/ui/Toast';
import { Button } from '../../shared/ui/Button';
import { ArrowLeft, Clock } from 'lucide-react';

export const ReportStatusPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['public-report', code],
    queryFn: async () => (await apiClient.get(`/public/reports/${code}`)).data.data
  });

  if (isLoading) return <Skeleton height="300px" />;
  if (error) return <EmptyState title="Report Not Found" description={`No report matches code ${code}`} />;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
      <button className="btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => navigate('/report')}>
        <ArrowLeft size={16} /> Back to Portal
      </button>

      <GlassCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-laurel)' }}>Tracking Code</span>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)' }}>{report.trackingCode}</h1>
          </div>
          <Chip variant={report.status === 'matched' || report.status === 'resolved' ? 'healthy' : 'watch'}>
            Status: {report.status}
          </Chip>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
          <div>
            <strong style={{ color: 'var(--color-laurel)' }}>Submitted Issue Description:</strong>
            <p style={{ marginTop: '0.25rem' }}>{report.description}</p>
          </div>

          {report.matchedAsset && (
            <div style={{ padding: '0.85rem', background: 'rgba(251,246,240,0.06)', borderRadius: 'var(--radius-md)' }}>
              <strong>Matched Asset:</strong> {report.matchedAsset.assetCode} ({report.matchedAsset.name})
            </div>
          )}

          {report.workOrder && (
            <div style={{ padding: '0.85rem', background: 'rgba(251,246,240,0.06)', borderRadius: 'var(--radius-md)' }}>
              <strong>Generated Work Order:</strong> {report.workOrder.code} ({report.workOrder.status})
            </div>
          )}

          <div style={{ fontSize: '0.8rem', color: 'var(--color-laurel)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={14} /> Created: {new Date(report.createdAt).toLocaleString()}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
