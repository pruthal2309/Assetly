import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/api/client';
import { KpiCard } from './KpiCard';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Chip } from '../../shared/ui/Chip';
import { Skeleton, EmptyState } from '../../shared/ui/Toast';
import { Box, Clock, Wrench, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const DashboardPage = () => {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/summary');
      return res.data.data;
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
        <Skeleton height="300px" />
      </div>
    );
  }

  if (error) {
    return <EmptyState title="Failed to load dashboard" description={error.message} />;
  }

  const { totalAssets, byStatus = {}, byRisk = {}, overdueCount = 0, criticalAssets = [], myWorkOrders = [], costTrend = [] } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', color: 'var(--primary-dark-teal)', fontWeight: 800 }}>
          Executive Dashboard
        </h1>
        <p style={{ color: 'var(--secondary-text)', fontSize: '0.95rem' }}>
          Real-time overview of infrastructure health, risk levels, and active maintenance
        </p>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        <KpiCard title="Total Assets" value={totalAssets} icon={Box} color="var(--deep-teal)" />
        <KpiCard title="In Service" value={byStatus.in_service || 0} icon={Box} color="var(--health-healthy)" />
        <KpiCard title="Under Maintenance" value={byStatus.under_maintenance || 0} icon={Wrench} color="var(--health-watch)" />
        <KpiCard title="Overdue Inspections" value={overdueCount} icon={Clock} color="var(--health-critical)" />
      </div>

      {/* Middle Row: Charts & Risk Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Cost Trend Chart */}
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
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E0E6E4', borderRadius: '8px', color: '#002E2C' }}
                />
                <Bar dataKey="cost" fill="var(--deep-teal)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        {/* Risk Distribution Breakdown */}
        <GlassCard>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--primary-dark-teal)' }}>
            Condition Risk Breakdown
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

      {/* Bottom Grid: Critical Assets & My Work Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* High Risk / Critical Assets List */}
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
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', color: 'var(--primary-dark-teal)' }}>
                      {asset.assetCode}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>{asset.name}</span>
                  </div>
                  <Chip variant={asset.health?.riskLevel || 'critical'}>
                    Score: {asset.health?.score}
                  </Chip>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Assigned Work Orders List */}
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-dark-teal)' }}>Active Work Orders</h3>
            <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => navigate('/work-orders')}>
              Board View <ArrowUpRight size={14} />
            </button>
          </div>
          {myWorkOrders.length === 0 ? (
            <p style={{ color: 'var(--secondary-text)', fontSize: '0.875rem' }}>No open work orders assigned to you.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myWorkOrders.map((wo) => (
                <div
                  key={wo._id}
                  onClick={() => navigate('/work-orders')}
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
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', color: 'var(--primary-dark-teal)' }}>
                      {wo.code}: {wo.title}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
                      Asset: {wo.assetId?.assetCode || 'N/A'} • Status: {wo.status}
                    </span>
                  </div>
                  <Chip variant={wo.priority === 'urgent' || wo.priority === 'high' ? 'high' : 'watch'}>
                    {wo.priority}
                  </Chip>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
