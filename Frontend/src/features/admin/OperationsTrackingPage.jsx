import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Chip } from '../../shared/ui/Chip';
import { Skeleton, EmptyState } from '../../shared/ui/Toast';
import {
  Users,
  ShieldCheck,
  Wrench,
  AlertTriangle,
  Layers,
  ChevronRight,
  UserCheck,
  CheckCircle,
  Clock,
  DollarSign,
  X
} from 'lucide-react';

export const OperationsTrackingPage = () => {
  const [activeTab, setActiveTab] = useState('workforce'); // 'workforce' | 'zones'
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  const { data: workforceData, isLoading: loadingWorkforce } = useQuery({
    queryKey: ['operations-workforce'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/operations/workforce');
      return res.data.data;
    },
    enabled: activeTab === 'workforce'
  });

  const { data: zonesData, isLoading: loadingZones } = useQuery({
    queryKey: ['operations-zones'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/operations/zones');
      return res.data.data;
    },
    enabled: activeTab === 'zones'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', color: 'var(--primary-dark-teal)', fontWeight: 800, marginBottom: '0.25rem' }}>
          Operations & Workforce Tracking
        </h1>
        <p style={{ color: 'var(--secondary-text)', fontSize: '0.95rem' }}>
          Real-time visibility into supervisor management, engineer field activity, and zone-wise performance breakdown.
        </p>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--subtle-border)', paddingBottom: '0.5rem' }}>
        <button
          className={activeTab === 'workforce' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('workforce')}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Users size={16} /> Workforce Hierarchy ("Who is doing what?")
        </button>
        <button
          className={activeTab === 'zones' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('zones')}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ShieldCheck size={16} /> Zone Performance & Overview
        </button>
      </div>

      {/* TAB 1: WORKFORCE HIERARCHY */}
      {activeTab === 'workforce' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {loadingWorkforce ? (
            <Skeleton height="350px" />
          ) : !workforceData ? (
            <EmptyState title="No workforce data" description="Unable to load operations workforce tracking." />
          ) : (
            <>
              {/* Supervisors Section */}
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-dark-teal)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} color="var(--deep-teal)" /> Supervisors & Managed Zones
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {workforceData.supervisors.map((sup) => (
                    <GlassCard key={sup._id} style={{ cursor: 'pointer' }} onClick={() => setSelectedSupervisor(sup)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-dark-teal)' }}>{sup.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>{sup.email}</div>
                        </div>
                        <Chip variant="healthy">Supervisor</Chip>
                      </div>

                      <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--secondary-text)' }}>Assigned Zones: </span>
                        {sup.zones.length === 0 ? (
                          <span style={{ color: 'var(--health-critical)' }}>None</span>
                        ) : (
                          sup.zones.map((z) => z.name || z.code).join(', ')
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', background: 'var(--main-bg)', padding: '0.65rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', textAlign: 'center' }}>
                        <div>
                          <div style={{ color: 'var(--secondary-text)', fontSize: '0.7rem' }}>Active WO</div>
                          <div style={{ fontWeight: 700, color: 'var(--deep-teal)', fontSize: '1rem' }}>{sup.activeWorkOrdersCount}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--secondary-text)', fontSize: '0.7rem' }}>Done</div>
                          <div style={{ fontWeight: 700, color: 'var(--health-healthy)', fontSize: '1rem' }}>{sup.completedCount}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--secondary-text)', fontSize: '0.7rem' }}>Overdue</div>
                          <div style={{ fontWeight: 700, color: sup.overdueCount > 0 ? 'var(--health-critical)' : 'var(--secondary-text)', fontSize: '1rem' }}>{sup.overdueCount}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--secondary-text)', fontSize: '0.7rem' }}>Engineers</div>
                          <div style={{ fontWeight: 700, color: 'var(--primary-dark-teal)', fontSize: '1rem' }}>{sup.engineersCount}</div>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>

              {/* Field Engineers Activity Section */}
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-dark-teal)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck size={20} color="var(--deep-teal)" /> Field Engineers & Current Activity
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
                  {workforceData.engineers.map((eng) => (
                    <GlassCard key={eng._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-dark-teal)' }}>{eng.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>{eng.email}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--deep-teal)', marginTop: '0.2rem' }}>
                            Ward(s): {eng.zones.map((z) => z.name || z.code).join(', ') || 'All Wards'}
                          </div>
                        </div>
                        <button className="btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setSelectedEngineer(eng)}>
                          Full Workload <ChevronRight size={14} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--health-healthy)', fontWeight: 600 }}>Completed: {eng.completedCount}</span>
                        <span style={{ color: 'var(--deep-teal)', fontWeight: 600 }}>Active: {eng.activeCount}</span>
                        <span style={{ color: eng.overdueCount > 0 ? 'var(--health-critical)' : 'var(--secondary-text)', fontWeight: 600 }}>Overdue: {eng.overdueCount}</span>
                      </div>

                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-dark-teal)', marginBottom: '0.5rem' }}>
                        Current Tasks ({eng.currentTasks.length})
                      </div>

                      {eng.currentTasks.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', fontStyle: 'italic' }}>
                          No active field tasks assigned right now.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {eng.currentTasks.slice(0, 3).map((task) => (
                            <div
                              key={task._id}
                              style={{
                                padding: '0.5rem 0.75rem',
                                background: 'var(--main-bg)',
                                border: '1px solid var(--subtle-border)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.8rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 700, color: 'var(--primary-dark-teal)' }}>{task.code}: </span>
                                <span style={{ color: 'var(--main-text)' }}>{task.title}</span>
                                <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>
                                  Asset: {task.assetId?.assetCode || 'N/A'} • Assigned by: {task.createdBy?.name || 'Supervisor'}
                                </div>
                              </div>
                              <Chip variant={task.status === 'in_progress' ? 'watch' : task.status === 'submitted' ? 'healthy' : 'info'}>
                                {task.status.toUpperCase()}
                              </Chip>
                            </div>
                          ))}
                        </div>
                      )}
                    </GlassCard>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: ZONE PERFORMANCE */}
      {activeTab === 'zones' && (
        <div>
          {loadingZones ? (
            <Skeleton height="350px" />
          ) : !zonesData ? (
            <EmptyState title="No zone data" description="Unable to load zone performance overview." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {zonesData.map((zone) => (
                <GlassCard key={zone._id} style={{ cursor: 'pointer' }} onClick={() => setSelectedZone(zone)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-dark-teal)' }}>{zone.name} ({zone.code})</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
                        Supervisor: {zone.supervisor ? zone.supervisor.name : 'Unassigned'}
                      </div>
                    </div>
                    <Chip variant={zone.highRiskAssetsCount > 0 ? 'high' : 'healthy'}>
                      {zone.highRiskAssetsCount} High Risk
                    </Chip>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', margin: '0.75rem 0', background: 'var(--main-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>Assets</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-dark-teal)' }}>{zone.assetsCount}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>Engineers</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--deep-teal)' }}>{zone.engineersCount}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>Cost (₹)</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--health-healthy)' }}>₹{zone.maintenanceCost.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  {/* Work Order breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem', textAlign: 'center', fontSize: '0.75rem' }}>
                    <div style={{ background: '#F3F4F6', padding: '0.4rem', borderRadius: '4px' }}>
                      <div style={{ color: '#6B7280', fontSize: '0.65rem' }}>Open</div>
                      <div style={{ fontWeight: 700 }}>{zone.openWorkOrders}</div>
                    </div>
                    <div style={{ background: '#FEF3C7', padding: '0.4rem', borderRadius: '4px' }}>
                      <div style={{ color: '#92400E', fontSize: '0.65rem' }}>In Prog</div>
                      <div style={{ fontWeight: 700 }}>{zone.inProgressWorkOrders}</div>
                    </div>
                    <div style={{ background: '#E0E7FF', padding: '0.4rem', borderRadius: '4px' }}>
                      <div style={{ color: '#3730A3', fontSize: '0.65rem' }}>Subm</div>
                      <div style={{ fontWeight: 700 }}>{zone.submittedWorkOrders}</div>
                    </div>
                    <div style={{ background: '#D1FAE5', padding: '0.4rem', borderRadius: '4px' }}>
                      <div style={{ color: '#065F46', fontSize: '0.65rem' }}>Done</div>
                      <div style={{ fontWeight: 700 }}>{zone.completedWorkOrders}</div>
                    </div>
                    <div style={{ background: '#FEE2E2', padding: '0.4rem', borderRadius: '4px' }}>
                      <div style={{ color: '#991B1B', fontSize: '0.65rem' }}>Overdue</div>
                      <div style={{ fontWeight: 700 }}>{zone.overdueWorkOrders}</div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ENGINEER DETAIL MODAL */}
      {selectedEngineer && (
        <div className="modal-backdrop" onClick={() => setSelectedEngineer(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-dark-teal)', fontWeight: 800 }}>
                Engineer Activity: {selectedEngineer.name}
              </h3>
              <button className="btn-secondary" style={{ padding: '0.3rem' }} onClick={() => setSelectedEngineer(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--secondary-text)' }}>
              <div>Email: <b>{selectedEngineer.email}</b></div>
              <div>Assigned Zone(s): <b>{selectedEngineer.zones.map((z) => z.name || z.code).join(', ') || 'All Wards'}</b></div>
            </div>

            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--primary-dark-teal)' }}>All Current Tasks</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
              {selectedEngineer.currentTasks.length === 0 ? (
                <p style={{ color: 'var(--secondary-text)', fontSize: '0.85rem' }}>No active tasks.</p>
              ) : (
                selectedEngineer.currentTasks.map((t) => (
                  <div key={t._id} style={{ padding: '0.75rem', background: 'var(--main-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--subtle-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-dark-teal)' }}>{t.code}: {t.title}</span>
                      <Chip variant={t.status === 'in_progress' ? 'watch' : t.status === 'submitted' ? 'healthy' : 'info'}>{t.status}</Chip>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', marginTop: '0.25rem' }}>
                      Asset: {t.assetId?.assetCode || 'N/A'} • Priority: {t.priority} • Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ZONE DRILL-DOWN MODAL */}
      {selectedZone && (
        <div className="modal-backdrop" onClick={() => setSelectedZone(null)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-dark-teal)', fontWeight: 800 }}>
                Zone Breakdown: {selectedZone.name} ({selectedZone.code})
              </h3>
              <button className="btn-secondary" style={{ padding: '0.3rem' }} onClick={() => setSelectedZone(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--main-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>Supervisor</div>
                <div style={{ fontWeight: 700, color: 'var(--primary-dark-teal)' }}>{selectedZone.supervisor ? selectedZone.supervisor.name : 'Unassigned'}</div>
              </div>
              <div style={{ background: 'var(--main-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>Field Engineers</div>
                <div style={{ fontWeight: 700, color: 'var(--deep-teal)' }}>{selectedZone.engineersCount}</div>
              </div>
              <div style={{ background: 'var(--main-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>Maintenance Cost</div>
                <div style={{ fontWeight: 700, color: 'var(--health-healthy)' }}>₹{selectedZone.maintenanceCost.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary-dark-teal)' }}>Assets Metrics</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                  <li style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--subtle-border)' }}>Total Assets: <b>{selectedZone.assetsCount}</b></li>
                  <li style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--subtle-border)', color: 'var(--health-critical)' }}>High Risk Assets: <b>{selectedZone.highRiskAssetsCount}</b></li>
                  <li style={{ padding: '0.3rem 0' }}>Pending Citizen Reports: <b>{selectedZone.pendingReportsCount}</b></li>
                </ul>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary-dark-teal)' }}>Work Order Breakdown</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                  <li style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--subtle-border)' }}>Open: <b>{selectedZone.openWorkOrders}</b></li>
                  <li style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--subtle-border)' }}>In Progress: <b>{selectedZone.inProgressWorkOrders}</b></li>
                  <li style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--subtle-border)' }}>Submitted for Review: <b>{selectedZone.submittedWorkOrders}</b></li>
                  <li style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--subtle-border)', color: 'var(--health-healthy)' }}>Completed: <b>{selectedZone.completedWorkOrders}</b></li>
                  <li style={{ padding: '0.3rem 0', color: 'var(--health-critical)' }}>Overdue: <b>{selectedZone.overdueWorkOrders}</b></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
