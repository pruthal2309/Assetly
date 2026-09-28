import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import { useCan } from '../../shared/hooks/useCan';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { Chip } from '../../shared/ui/Chip';
import { HealthRing } from '../../shared/ui/HealthRing';
import { LifecycleStepper } from '../../shared/ui/LifecycleStepper';
import { Modal } from '../../shared/ui/Modal';
import { Skeleton, EmptyState } from '../../shared/ui/Toast';
import { InspectionForm } from '../inspections/InspectionForm';
import { QrCode, ArrowLeft, Wrench, Shield, FileText, Activity, Image as ImageIcon } from 'lucide-react';

export const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can, role } = useCan();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusError, setStatusError] = useState(null);

  const { data: asset, isLoading, error } = useQuery({
    queryKey: ['asset', id],
    queryFn: async () => (await apiClient.get(`/assets/${id}`)).data.data
  });

  const { data: events = [] } = useQuery({
    queryKey: ['asset-events', id],
    queryFn: async () => (await apiClient.get(`/assets/${id}/events`)).data.data,
    enabled: activeTab === 'timeline'
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['asset-inspections', id],
    queryFn: async () => (await apiClient.get(`/assets/${id}/inspections`)).data.data,
    enabled: activeTab === 'inspections'
  });

  const { data: qrData } = useQuery({
    queryKey: ['asset-qr', id],
    queryFn: async () => (await apiClient.get(`/assets/${id}/qr`)).data.data,
    enabled: showQrModal
  });

  const statusMutation = useMutation({
    mutationFn: async ({ status, reason }) => {
      const res = await apiClient.patch(`/assets/${id}/status`, { status, reason });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['asset', id]);
      setShowStatusModal(false);
      setStatusReason('');
      setStatusError(null);
    },
    onError: (err) => {
      setStatusError(err.response?.data?.error?.message || 'Failed to update asset status');
    }
  });

  if (isLoading) return <Skeleton height="400px" />;
  if (error) return <EmptyState title="Error loading asset" description={error.message} />;

  const handleStatusChangeSubmit = (e) => {
    e.preventDefault();
    statusMutation.mutate({ status: targetStatus, reason: statusReason });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <button
        className="btn-secondary"
        style={{ width: 'fit-content', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
        onClick={() => navigate('/assets')}
      >
        <ArrowLeft size={16} /> Back to Assets
      </button>

      {/* Top Header Card */}
      <GlassCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <HealthRing score={asset.health?.score || 100} size={100} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800 }}>{asset.assetCode}</span>
                <Chip variant={asset.status === 'in_service' ? 'healthy' : 'watch'}>{asset.status.replace('_', ' ')}</Chip>
                <Chip variant={asset.health?.riskLevel}>{asset.health?.riskLevel} risk</Chip>
              </div>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{asset.name}</h1>
              <p style={{ color: 'var(--color-laurel)', fontSize: '0.9rem' }}>
                Zone: {asset.zoneId?.name || 'N/A'} • Address: {asset.address || 'No street address logged'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button variant="secondary" icon={QrCode} onClick={() => setShowQrModal(true)}>
              QR Code
            </Button>
            {can('inspection:create') && (
              <Button variant="secondary" icon={FileText} onClick={() => setShowInspectionModal(true)}>
                Log Inspection
              </Button>
            )}
            {can('asset:status:operate') && (
              <Button
                variant="primary"
                icon={Wrench}
                onClick={() => {
                  setTargetStatus(asset.status === 'installed' ? 'in_service' : 'under_maintenance');
                  setShowStatusModal(true);
                }}
              >
                Change Status
              </Button>
            )}
          </div>
        </div>

        {/* Lifecycle Stepper Bar */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(251, 246, 240, 0.12)' }}>
          <LifecycleStepper currentStatus={asset.status} />
        </div>
      </GlassCard>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(251, 246, 240, 0.15)', paddingBottom: '0.5rem' }}>
        {[
          { key: 'overview', label: 'Overview', icon: Shield },
          { key: 'timeline', label: 'Timeline Events', icon: Activity },
          { key: 'inspections', label: 'Inspections', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className="btn-secondary"
              style={{
                background: isActive ? 'var(--color-cream)' : 'transparent',
                color: isActive ? 'var(--bg-deep)' : 'var(--color-cream)',
                borderColor: isActive ? 'var(--color-cream)' : 'transparent'
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <GlassCard>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Asset Attributes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div><strong style={{ color: 'var(--color-laurel)' }}>Category:</strong> {asset.categoryId?.name}</div>
              <div><strong style={{ color: 'var(--color-laurel)' }}>Vendor:</strong> {asset.vendor || 'N/A'}</div>
              <div><strong style={{ color: 'var(--color-laurel)' }}>Acquisition Cost:</strong> ₹{(asset.acquisitionCost || 0).toLocaleString()}</div>
              <div><strong style={{ color: 'var(--color-laurel)' }}>Installed Date:</strong> {asset.installDate ? new Date(asset.installDate).toLocaleDateString() : 'N/A'}</div>
              <div><strong style={{ color: 'var(--color-laurel)' }}>Expected Life:</strong> {asset.expectedLifeYears} Years</div>
              <div><strong style={{ color: 'var(--color-laurel)' }}>Next Inspection Due:</strong> {asset.nextInspectionDue ? new Date(asset.nextInspectionDue).toLocaleDateString() : 'Not scheduled'}</div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Category Specifications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              {Object.keys(asset.specs || {}).length === 0 ? (
                <span style={{ color: 'var(--color-laurel)' }}>No custom specifications logged.</span>
              ) : (
                Object.entries(asset.specs).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(251,246,240,0.08)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--color-laurel)', textTransform: 'capitalize' }}>{k}:</span>
                    <span style={{ fontWeight: 600 }}>{String(v)}</span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          <GlassCard style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Health Score Factor Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(251,246,240,0.05)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-laurel)' }}>Age Penalty</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>-{asset.health?.factors?.agePenalty || 0} pts</p>
              </div>
              <div style={{ background: 'rgba(251,246,240,0.05)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-laurel)' }}>Condition Penalty</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>-{asset.health?.factors?.conditionPenalty || 0} pts</p>
              </div>
              <div style={{ background: 'rgba(251,246,240,0.05)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-laurel)' }}>Open WO Penalty</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>-{asset.health?.factors?.openIssuePenalty || 0} pts</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab 2: Timeline Events */}
      {activeTab === 'timeline' && (
        <GlassCard>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Immutable Asset Lifecycle History</h3>
          {events.length === 0 ? (
            <p style={{ color: 'var(--color-laurel)' }}>No timeline events recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {events.map((evt) => (
                <div key={evt._id} style={{ display: 'flex', gap: '1rem', padding: '0.85rem', background: 'rgba(251,246,240,0.05)', borderRadius: 'var(--radius-md)' }}>
                  <Activity size={20} style={{ color: 'var(--color-laurel)', marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <strong style={{ textTransform: 'capitalize' }}>{evt.type.replace('.', ' ')}</strong>
                      <span style={{ color: 'var(--color-laurel)' }}>{new Date(evt.at).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-laurel)', marginTop: '0.25rem' }}>
                      Actor: {evt.actorId?.name || 'System'} ({evt.actorId?.role || 'System'})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Tab 3: Inspections */}
      {activeTab === 'inspections' && (
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Inspection Log Records</h3>
            {can('inspection:create') && (
              <Button size="sm" onClick={() => setShowInspectionModal(true)}>Log Inspection</Button>
            )}
          </div>
          {inspections.length === 0 ? (
            <p style={{ color: 'var(--color-laurel)' }}>No inspections recorded yet for this asset.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {inspections.map((ins) => (
                <div key={ins._id} style={{ padding: '1rem', background: 'rgba(251,246,240,0.06)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700 }}>Rating: {ins.rating} / 5 ⭐</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-laurel)' }}>{new Date(ins.inspectedAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{ins.notes || 'No inspection notes'}</p>
                  {ins.ai?.damageType && (
                    <Chip variant={ins.ai.severity === 'high' || ins.ai.severity === 'critical' ? 'critical' : 'watch'}>
                      AI Detection: {ins.ai.damageType} ({ins.ai.severity} severity)
                    </Chip>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Status Change Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Change Asset Lifecycle Status">
        <form onSubmit={handleStatusChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {statusError && <div style={{ color: 'var(--health-critical)', fontSize: '0.85rem' }}>{statusError}</div>}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Target Status *</label>
            <select className="glass-input" value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)} required>
              <option value="acquired">Acquired</option>
              <option value="installed">Installed</option>
              <option value="in_service">In Service</option>
              <option value="under_maintenance">Under Maintenance</option>
              {role === 'admin' && <option value="decommissioned">Decommissioned</option>}
              {role === 'admin' && <option value="disposed">Disposed</option>}
            </select>
          </div>
          {(targetStatus === 'decommissioned' || targetStatus === 'disposed') && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Mandatory Retirement Reason *</label>
              <textarea
                className="glass-input"
                rows={3}
                placeholder="State specific reason for retirement/disposal..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                required
              />
            </div>
          )}
          <Button type="submit" disabled={statusMutation.isPending}>
            {statusMutation.isPending ? 'Updating...' : 'Confirm Status Change'}
          </Button>
        </form>
      </Modal>

      {/* QR Code Modal */}
      <Modal isOpen={showQrModal} onClose={() => setShowQrModal(false)} title={`QR Code: ${asset.assetCode}`}>
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          {qrData?.qrUrl ? (
            <img src={qrData.qrUrl} alt="QR Code" style={{ width: '220px', height: '220px', borderRadius: '12px' }} />
          ) : (
            <Skeleton height="220px" width="220px" />
          )}
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--color-laurel)' }}>
            Scan to view public asset information
          </p>
          <Button variant="secondary" style={{ marginTop: '1rem' }} onClick={() => window.print()}>
            Print QR Tag
          </Button>
        </div>
      </Modal>

      {/* Inspection Modal */}
      <Modal isOpen={showInspectionModal} onClose={() => setShowInspectionModal(false)} title="Log New Field Inspection">
        <InspectionForm assetId={asset._id} onSuccess={() => {
          setShowInspectionModal(false);
          queryClient.invalidateQueries(['asset', id]);
        }} />
      </Modal>
    </div>
  );
};
