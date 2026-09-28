import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/api/client';
import { useAuthStore } from '../auth/authStore';
import { KpiCard } from './KpiCard';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Chip } from '../../shared/ui/Chip';
import { Skeleton, EmptyState } from '../../shared/ui/Toast';
import {
  Box,
  Clock,
  Wrench,
  ArrowUpRight,
  ShieldCheck,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Play,
  QrCode,
  MapPin,
  Send,
  Plus
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { WorkOrderDrawer } from '../workorders/WorkOrderDrawer';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [selectedWoId, setSelectedWoId] = useState(null);
  const [engineerFilter, setEngineerFilter] = useState('active'); // 'active' | 'in_progress' | 'submitted' | 'completed'

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/summary');
      return res.data.data;
    }
  });

  const startTaskMutation = useMutation({
    mutationFn: async (woId) => {
      const res = await apiClient.patch(`/work-orders/${woId}`, { status: 'in_progress' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard']);
      queryClient.invalidateQueries(['work-orders']);
    }
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Skeleton height="120px" width="240px" />
          <Skeleton height="120px" width="240px" />
          <Skeleton height="120px" width="240px" />
        </div>
        <Skeleton height="350px" />
      </div>
    );
  }

  if (error) {
    return <EmptyState title="Failed to load dashboard" description={error.message} />;
  }

  const role = data.role || user?.role;

  // ==========================================
  // 1. ADMIN DASHBOARD
  // ==========================================
  if (role === 'admin') {
    const {
      totalAssets = 0,
      byStatus = {},
      byRisk = {},
      overdueCount = 0,
      criticalAssets = [],
      workOrderStats = {},
      maintenanceCostTotal = 0,
      activeEngineersCount = 0,
      activeSupervisorsCount = 0,
      activeZonesCount = 0,
      pendingCitizenReportsCount = 0,
      costTrend = [],
      recentActivity = []
    } = data;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Admin Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', color: 'var(--primary-dark-teal)', fontWeight: 800 }}>
              Organization Control Center
            </h1>
            <p style={{ color: 'var(--secondary-text)', fontSize: '0.95rem' }}>
              High-level management, workforce tracking, risk monitoring, and zone performance across the entire organization.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/admin/operations')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
          >
            <Activity size={18} /> Operations & Workforce Tracking
          </button>
        </div>

        {/* Top KPI Cards Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <KpiCard title="Total Infrastructure Assets" value={totalAssets} icon={Box} color="var(--deep-teal)" />
          <KpiCard title="High-Risk & Critical Assets" value={byRisk.high || 0 + (byRisk.critical || 0)} icon={AlertTriangle} color="var(--health-critical)" />
          <KpiCard title="Open / In-Progress Work Orders" value={(workOrderStats.open || 0) + (workOrderStats.inProgress || 0)} icon={Wrench} color="var(--health-watch)" />
          <KpiCard title="Submitted Work for Review" value={workOrderStats.submitted || 0} icon={FileCheck} color="#3730A3" />
          <KpiCard title="Total Maintenance Cost" value={`₹${maintenanceCostTotal.toLocaleString('en-IN')}`} icon={CheckCircle2} color="var(--health-healthy)" />
        </div>

        {/* Top KPI Cards Row 2 - Workforce & Coverage */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <GlassCard style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Supervisors</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-dark-teal)' }}>{activeSupervisorsCount}</div>
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Field Engineers</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-dark-teal)' }}>{activeEngineersCount}</div>
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Active Zones / Wards</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-dark-teal)' }}>{activeZonesCount}</div>
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Overdue Tasks</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--health-critical)' }}>{workOrderStats.overdue || 0}</div>
            </div>
          </GlassCard>
        </div>

        {/* Charts & Risk Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          <GlassCard>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--primary-dark-teal)' }}>
              Maintenance Cost Trend (₹)
            </h3>
            {costTrend.length === 0 ? (
              <p style={{ color: 'var(--secondary-text)', fontSize: '0.875rem' }}>No completed work order costs recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={costTrend}>
                  <XAxis dataKey="_id" stroke="var(--secondary-text)" fontSize={12} />
                  <YAxis stroke="var(--secondary-text)" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E0E6E4', borderRadius: '8px' }} />
                  <Bar dataKey="cost" fill="var(--deep-teal)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </GlassCard>

          <GlassCard>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--primary-dark-teal)' }}>
              Organization Condition Risk Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Healthy (80-100)', count: byRisk.low || 0, color: 'var(--health-healthy)' },
                { label: 'Watch (60-79)', count: byRisk.medium || 0, color: 'var(--health-watch)' },
                { label: 'High Risk (40-59)', count: byRisk.high || 0, color: 'var(--health-high)' },
                { label: 'Critical (0-39)', count: byRisk.critical || 0, color: 'var(--health-critical)' }
              ].map((r) => {
                const pct = totalAssets ? Math.round((r.count / totalAssets) * 100) : 0;
                return (
                  <div key={r.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--secondary-text)' }}>{r.label}</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-dark-teal)' }}>{r.count} ({pct}%)</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--warm-neutral)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: r.color, borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Bottom Section: High Risk Assets & Operational Activity Feed */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-dark-teal)' }}>High-Risk Assets Needing Attention</h3>
              <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => navigate('/assets')}>
                View All <ArrowUpRight size={14} />
              </button>
            </div>
            {criticalAssets.length === 0 ? (
              <p style={{ color: 'var(--secondary-text)', fontSize: '0.875rem' }}>All assets are operating within healthy limits.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {criticalAssets.map((asset) => (
                  <div
                    key={asset._id}
                    onClick={() => navigate(`/assets/${asset._id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--main-bg)',
                      border: '1px solid var(--subtle-border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-dark-teal)' }}>{asset.assetCode}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', display: 'block' }}>{asset.name}</span>
                    </div>
                    <Chip variant={asset.health?.riskLevel || 'critical'}>Score: {asset.health?.score}</Chip>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-dark-teal)', marginBottom: '1rem' }}>Recent Operational Activity Feed</h3>
            {recentActivity.length === 0 ? (
              <p style={{ color: 'var(--secondary-text)', fontSize: '0.875rem' }}>No recent operational activity.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '320px', overflowY: 'auto' }}>
                {recentActivity.map((act) => (
                  <div key={act._id} style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem', background: 'var(--main-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--subtle-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--primary-dark-teal)' }}>
                      <span>{act.actorId?.name || 'System'} ({act.actorId?.role || 'user'})</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ color: 'var(--main-text)', marginTop: '0.2rem' }}>
                      {act.type.replace('.', ' ').toUpperCase()} on {act.assetId?.name || 'Asset'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. SUPERVISOR DASHBOARD
  // ==========================================
  if (role === 'supervisor') {
    const {
      totalAssets = 0,
      byStatus = {},
      byRisk = {},
      overdueCount = 0,
      criticalAssets = [],
      workOrderStats = {},
      submittedForReview = [],
      myEngineers = [],
      pendingCitizenReportsCount = 0,
      myWorkOrders = []
    } = data;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', color: 'var(--primary-dark-teal)', fontWeight: 800 }}>
              Supervisor Zone Control Center
            </h1>
            <p style={{ color: 'var(--secondary-text)', fontSize: '0.95rem' }}>
              Manage your assigned zones, create tasks, assign field engineers, and review submitted work orders.
            </p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/work-orders')}>
            + Create Work Order
          </button>
        </div>

        {/* SUBMITTED WORK ORDER ALERT BANNER */}
        {submittedForReview.length > 0 && (
          <div
            style={{
              background: '#EEF2FF',
              border: '1.5px solid #6366F1',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileCheck size={24} color="#4F46E5" />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#312E81', margin: 0 }}>
                  {submittedForReview.length} Work Order(s) Submitted for Review!
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#4338CA', margin: 0 }}>
                  Field Engineers have submitted work completion evidence requiring your review and approval.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem' }}>
              {submittedForReview.map((wo) => (
                <div
                  key={wo._id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #C7D2FE',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#1E1B4B' }}>{wo.code}: {wo.title}</span>
                    <Chip variant="healthy">SUBMITTED</Chip>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Submitted by: <b>{wo.submittedBy?.name || 'Engineer'}</b> • Asset: <b>{wo.assetId?.assetCode}</b>
                  </div>
                  {wo.workNotes && (
                    <div style={{ fontSize: '0.8rem', color: '#334155', fontStyle: 'italic', background: '#F8FAFC', padding: '0.4rem', borderRadius: '4px' }}>
                      "{wo.workNotes}"
                    </div>
                  )}
                  <button
                    className="btn-primary"
                    style={{ padding: '0.4rem', fontSize: '0.8rem', justifyContent: 'center', marginTop: '0.25rem' }}
                    onClick={() => setSelectedWoId(wo._id)}
                  >
                    Review & Complete Work Order
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zone KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <KpiCard title="Zone Assets" value={totalAssets} icon={Box} color="var(--deep-teal)" />
          <KpiCard title="High-Risk Assets" value={byRisk.high || 0 + (byRisk.critical || 0)} icon={AlertTriangle} color="var(--health-critical)" />
          <KpiCard title="Active Work Orders" value={(workOrderStats.open || 0) + (workOrderStats.inProgress || 0)} icon={Wrench} color="var(--health-watch)" />
          <KpiCard title="Overdue Tasks" value={workOrderStats.overdue || 0} icon={Clock} color="var(--health-critical)" />
          <KpiCard title="Pending Citizen Reports" value={pendingCitizenReportsCount} icon={Send} color="#4338CA" />
        </div>

        {/* Engineers Workload Table & Active Work Orders */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* My Engineers Workload */}
          <GlassCard>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-dark-teal)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} /> Engineers in My Zones ({myEngineers.length})
            </h3>
            {myEngineers.length === 0 ? (
              <p style={{ color: 'var(--secondary-text)', fontSize: '0.875rem' }}>No engineers assigned to your zones yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myEngineers.map((eng) => (
                  <div
                    key={eng._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--main-bg)',
                      border: '1px solid var(--subtle-border)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-dark-teal)', display: 'block' }}>
                        {eng.name}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>{eng.email}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem' }}>
                      <Chip variant="watch">{eng.activeTasks} Active</Chip>
                      <Chip variant="healthy">{eng.completed} Done</Chip>
                      {eng.overdue > 0 && <Chip variant="critical">{eng.overdue} Overdue</Chip>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Recent Active Work Orders */}
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-dark-teal)' }}>Active Zone Work Orders</h3>
              <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => navigate('/work-orders')}>
                Board View <ArrowUpRight size={14} />
              </button>
            </div>
            {myWorkOrders.length === 0 ? (
              <p style={{ color: 'var(--secondary-text)', fontSize: '0.875rem' }}>No active work orders in your zones.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myWorkOrders.map((wo) => (
                  <div
                    key={wo._id}
                    onClick={() => setSelectedWoId(wo._id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--main-bg)',
                      border: '1px solid var(--subtle-border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary-dark-teal)', display: 'block' }}>
                        {wo.code}: {wo.title}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>
                        Assignee: {wo.assigneeId?.name || 'Unassigned'} • Asset: {wo.assetId?.assetCode || 'N/A'}
                      </span>
                    </div>
                    <Chip variant={wo.status === 'submitted' ? 'healthy' : wo.status === 'in_progress' ? 'watch' : 'info'}>
                      {wo.status.toUpperCase()}
                    </Chip>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {selectedWoId && (
          <WorkOrderDrawer workOrderId={selectedWoId} onClose={() => setSelectedWoId(null)} />
        )}
      </div>
    );
  }

  // ==========================================
  // 3. ENGINEER DASHBOARD ("MY TASKS")
  // ==========================================
  const {
    myTaskStats = {},
    myTasks = [],
    myZoneAssetsCount = 0
  } = data;

  const filteredTasks = myTasks.filter((task) => {
    if (engineerFilter === 'active') return ['assigned', 'in_progress', 'submitted'].includes(task.status);
    if (engineerFilter === 'in_progress') return task.status === 'in_progress';
    if (engineerFilter === 'submitted') return task.status === 'submitted';
    if (engineerFilter === 'completed') return task.status === 'completed';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Field Engineer Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', color: 'var(--primary-dark-teal)', fontWeight: 800 }}>
            Field Execution — My Assigned Tasks
          </h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.95rem' }}>
            Perform field maintenance, update task progress, upload completion photos, and submit completed work.
          </p>
        </div>

        {/* Quick Field Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/assets/new')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} /> Register Asset
          </button>
          <button className="btn-secondary" onClick={() => navigate('/scan')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <QrCode size={16} /> Scan QR / Inspect
          </button>
          <button className="btn-secondary" onClick={() => navigate('/map')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={16} /> GIS Map
          </button>
        </div>
      </div>

      {/* Engineer Task KPI Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <KpiCard title="Active Field Tasks" value={myTaskStats.totalActive || 0} icon={Wrench} color="var(--deep-teal)" />
        <KpiCard title="Urgent / High Priority" value={myTaskStats.urgentCount || 0} icon={AlertTriangle} color="var(--health-high)" />
        <KpiCard title="Tasks Due Today" value={myTaskStats.dueTodayCount || 0} icon={Clock} color="var(--health-watch)" />
        <KpiCard title="Overdue Tasks" value={myTaskStats.overdueCount || 0} icon={Clock} color="var(--health-critical)" />
      </div>

      {/* MY TASKS SECTION */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-dark-teal)', fontWeight: 800 }}>
            MY WORK ORDERS ({filteredTasks.length})
          </h2>

          {/* Task Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'active', label: 'Active Tasks' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'submitted', label: 'Submitted' },
              { id: 'completed', label: 'Completed' }
            ].map((tab) => (
              <button
                key={tab.id}
                className={engineerFilter === tab.id ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setEngineerFilter(tab.id)}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <GlassCard style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <Wrench size={40} style={{ color: 'var(--secondary-text)', marginBottom: '0.75rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-dark-teal)', marginBottom: '0.25rem' }}>No tasks found in this view</h3>
            <p style={{ color: 'var(--secondary-text)', fontSize: '0.85rem' }}>
              You do not have any assigned work orders matching the selected filter.
            </p>
          </GlassCard>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
            {filteredTasks.map((task) => {
              const isUrgent = task.priority === 'urgent' || task.priority === 'high';
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !['completed', 'cancelled'].includes(task.status);

              return (
                <GlassCard
                  key={task._id}
                  style={{
                    borderLeft: isUrgent ? '4px solid var(--health-high)' : isOverdue ? '4px solid var(--health-critical)' : '4px solid var(--deep-teal)',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-dark-teal)' }}>{task.code}</span>
                      <Chip variant={task.status === 'in_progress' ? 'watch' : task.status === 'submitted' ? 'healthy' : isUrgent ? 'high' : 'info'}>
                        {task.status.toUpperCase()}
                      </Chip>
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--main-text)', marginBottom: '0.35rem' }}>
                      {task.title}
                    </h4>

                    <div style={{ fontSize: '0.82rem', color: 'var(--secondary-text)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div>Asset: <b>{task.assetId?.assetCode} — {task.assetId?.name}</b></div>
                      <div>Zone: <b>{task.zoneId?.name || task.zoneId?.code || 'Ward'}</b></div>
                      <div>Assigned By: <b>{task.createdBy?.name || 'Supervisor'}</b></div>
                      <div>Priority: <b style={{ textTransform: 'capitalize', color: isUrgent ? 'var(--health-high)' : 'var(--main-text)' }}>{task.priority}</b></div>
                      {task.dueDate && (
                        <div style={{ color: isOverdue ? 'var(--health-critical)' : 'var(--secondary-text)', fontWeight: isOverdue ? 700 : 400 }}>
                          Due Date: {new Date(task.dueDate).toLocaleDateString()} {isOverdue && '(OVERDUE)'}
                        </div>
                      )}
                    </div>

                    {task.reviewNotes && (
                      <div style={{ marginTop: '0.65rem', background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: '#991B1B' }}>
                        <b>Supervisor Sent Back:</b> "{task.reviewNotes}"
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--subtle-border)' }}>
                    {task.status === 'assigned' && (
                      <button
                        className="btn-primary"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.82rem', justifyContent: 'center' }}
                        onClick={() => startTaskMutation.mutate(task._id)}
                        disabled={startTaskMutation.isLoading}
                      >
                        <Play size={14} /> Start Work
                      </button>
                    )}

                    {task.status === 'in_progress' && (
                      <button
                        className="btn-primary"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.82rem', justifyContent: 'center', background: 'var(--health-healthy)' }}
                        onClick={() => setSelectedWoId(task._id)}
                      >
                        <Send size={14} /> Submit Completion
                      </button>
                    )}

                    <button
                      className="btn-secondary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                      onClick={() => setSelectedWoId(task._id)}
                    >
                      Details & History
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {selectedWoId && (
        <WorkOrderDrawer workOrderId={selectedWoId} onClose={() => setSelectedWoId(null)} />
      )}
    </div>
  );
};
