import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import { useCan } from '../../shared/hooks/useCan';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Chip } from '../../shared/ui/Chip';
import { Modal } from '../../shared/ui/Modal';
import { Skeleton, EmptyState } from '../../shared/ui/Toast';
import {
  Building2,
  Plus,
  Edit2,
  Users,
  ShieldCheck,
  Layers,
  Wrench,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  X
} from 'lucide-react';

export const DepartmentsPage = () => {
  const { can } = useCan();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [viewingDeptId, setViewingDeptId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState([]);
  const [selectedSupervisorIds, setSelectedSupervisorIds] = useState([]);
  const [selectedEngineerIds, setSelectedEngineerIds] = useState([]);
  const [formError, setFormError] = useState('');

  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await apiClient.get('/departments')).data.data
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await apiClient.get('/categories')).data.data
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['zones'],
    queryFn: async () => (await apiClient.get('/zones')).data.data
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await apiClient.get('/users')).data.data
  });

  const { data: deptDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['department-detail', viewingDeptId],
    queryFn: async () => (await apiClient.get(`/departments/${viewingDeptId}`)).data.data,
    enabled: Boolean(viewingDeptId)
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient.post('/departments', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      resetForm();
      setShowCreateModal(false);
    },
    onError: (err) => setFormError(err.response?.data?.error?.message || 'Failed to create department')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await apiClient.patch(`/departments/${id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      queryClient.invalidateQueries(['department-detail']);
      resetForm();
      setEditingDept(null);
    },
    onError: (err) => setFormError(err.response?.data?.error?.message || 'Failed to update department')
  });

  const resetForm = () => {
    setName('');
    setCode('');
    setDescription('');
    setStatus('active');
    setSelectedCategoryIds([]);
    setSelectedZoneIds([]);
    setSelectedSupervisorIds([]);
    setSelectedEngineerIds([]);
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEdit = (dept) => {
    setFormError('');
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description || '');
    setStatus(dept.status || 'active');
    setSelectedCategoryIds((dept.categoryIds || []).map((c) => c._id || c));
    setSelectedZoneIds((dept.zoneIds || []).map((z) => z._id || z));
    setSelectedSupervisorIds((dept.supervisorIds || []).map((s) => s._id || s));
    setSelectedEngineerIds((dept.engineerIds || []).map((e) => e._id || e));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      name,
      code,
      description,
      status,
      categoryIds: selectedCategoryIds,
      zoneIds: selectedZoneIds,
      supervisorIds: selectedSupervisorIds,
      engineerIds: selectedEngineerIds
    };

    if (editingDept) {
      updateMutation.mutate({ id: editingDept._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleCategory = (catId) => {
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  const toggleZone = (zId) => {
    if (selectedZoneIds.includes(zId)) {
      setSelectedZoneIds(selectedZoneIds.filter((id) => id !== zId));
    } else {
      setSelectedZoneIds([...selectedZoneIds, zId]);
    }
  };

  const supervisorsList = users.filter((u) => u.role === 'supervisor');
  const engineersList = users.filter((u) => u.role === 'engineer');

  const totalCategoriesMapped = departments.reduce((acc, d) => acc + (d.categoryIds?.length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary-dark-teal)', fontWeight: 800, marginBottom: '0.25rem' }}>
            Department Management & Routing
          </h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.95rem' }}>
            Organize asset categories, assigned wards, supervisors, and field engineers into functional departments.
          </p>
        </div>
        {can('user:update') && (
          <button className="btn-primary" onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add Department
          </button>
        )}
      </div>

      {/* Top KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <GlassCard style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'var(--deep-teal)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Total Departments</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark-teal)' }}>{departments.length}</div>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Active Departments</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--health-healthy)' }}>
              {departments.filter((d) => d.status === 'active').length}
            </div>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Mapped Categories</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark-teal)' }}>{totalCategoriesMapped}</div>
          </div>
        </GlassCard>
      </div>

      {/* Departments Grid */}
      {loadingDepts ? (
        <Skeleton height="350px" />
      ) : departments.length === 0 ? (
        <EmptyState title="No departments found" description="Create initial departments such as Water Supply, Roads & Transportation, Drainage, Electrical, Public Buildings." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {departments.map((dept) => (
            <GlassCard key={dept._id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-dark-teal)', display: 'block' }}>
                      {dept.name}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--deep-teal)', fontWeight: 700 }}>
                      CODE: {dept.code}
                    </span>
                  </div>
                  <Chip variant={dept.status === 'active' ? 'healthy' : 'critical'}>
                    {dept.status.toUpperCase()}
                  </Chip>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--main-text)', marginBottom: '0.85rem', lineHeight: 1.4 }}>
                  {dept.description || 'No description provided.'}
                </p>

                {/* Mapped Categories */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary-text)', marginBottom: '0.35rem' }}>
                    Mapped Asset Categories ({dept.categoryIds?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {dept.categoryIds?.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--health-critical)' }}>No categories mapped</span>
                    ) : (
                      dept.categoryIds?.map((cat) => (
                        <span key={cat._id} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {cat.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Assigned Supervisors & Engineers summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem', background: 'var(--main-bg)', padding: '0.65rem', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ color: 'var(--secondary-text)' }}>Supervisors: </span>
                    <b>{dept.supervisorIds?.length || 0}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--secondary-text)' }}>Engineers: </span>
                    <b>{dept.engineerIds?.length || 0}</b>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--subtle-border)' }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.82rem', justifyContent: 'center' }}
                  onClick={() => setViewingDeptId(dept._id)}
                >
                  <ChevronRight size={14} /> Department Statistics
                </button>
                {can('user:update') && (
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                    onClick={() => handleOpenEdit(dept)}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* CREATE / EDIT DEPARTMENT MODAL */}
      <Modal
        isOpen={showCreateModal || Boolean(editingDept)}
        onClose={() => {
          setShowCreateModal(false);
          setEditingDept(null);
        }}
        title={editingDept ? `Edit Department: ${editingDept.name}` : 'Create New Department'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {formError && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Department Name *</label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. Water Supply"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Code *</label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. WAT"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Description</label>
            <textarea
              className="glass-input"
              rows={2}
              placeholder="Responsibilities of this department..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Status</label>
            <select className="glass-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Categories Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Map Asset Categories</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', background: 'var(--main-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              {categories.map((cat) => (
                <label key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(cat._id)}
                    onChange={() => toggleCategory(cat._id)}
                  />
                  {cat.name} ({cat.key})
                </label>
              ))}
            </div>
          </div>

          {/* Zones Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Covered Wards / Zones</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', background: 'var(--main-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              {zones.map((z) => (
                <label key={z._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedZoneIds.includes(z._id)}
                    onChange={() => toggleZone(z._id)}
                  />
                  {z.name} ({z.code})
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '0.5rem' }}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingDept ? 'Update Department' : 'Create Department'}
          </button>
        </form>
      </Modal>

      {/* DEPARTMENT DRILL-DOWN STATS MODAL */}
      {viewingDeptId && (
        <div className="modal-backdrop" onClick={() => setViewingDeptId(null)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.35rem', color: 'var(--primary-dark-teal)', fontWeight: 800 }}>
                {deptDetail?.name || 'Department Details'} ({deptDetail?.code})
              </h3>
              <button className="btn-secondary" style={{ padding: '0.3rem' }} onClick={() => setViewingDeptId(null)}>
                <X size={18} />
              </button>
            </div>

            {loadingDetail ? (
              <Skeleton height="300px" />
            ) : !deptDetail ? (
              <p style={{ color: 'var(--secondary-text)' }}>Unable to load department statistics.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--secondary-text)' }}>{deptDetail.description || 'No description.'}</p>

                {/* Stat Counters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'var(--main-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>Total Assets</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark-teal)' }}>{deptDetail.stats?.totalAssets}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>Open Reports</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4338CA' }}>{deptDetail.stats?.openReports}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)' }}>Total Work Orders</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--deep-teal)' }}>{deptDetail.stats?.totalWorkOrders}</div>
                  </div>
                </div>

                {/* Work Order Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
                  <div style={{ background: '#FEF3C7', padding: '0.5rem', borderRadius: '6px' }}>
                    <div style={{ color: '#92400E', fontSize: '0.7rem' }}>Open</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{deptDetail.stats?.openWorkOrders}</div>
                  </div>
                  <div style={{ background: '#EEF2FF', padding: '0.5rem', borderRadius: '6px' }}>
                    <div style={{ color: '#3730A3', fontSize: '0.7rem' }}>In Progress</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{deptDetail.stats?.inProgressWorkOrders}</div>
                  </div>
                  <div style={{ background: '#ECFDF5', padding: '0.5rem', borderRadius: '6px' }}>
                    <div style={{ color: '#065F46', fontSize: '0.7rem' }}>Completed</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{deptDetail.stats?.completedWorkOrders}</div>
                  </div>
                  <div style={{ background: '#FEE2E2', padding: '0.5rem', borderRadius: '6px' }}>
                    <div style={{ color: '#991B1B', fontSize: '0.7rem' }}>Overdue</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{deptDetail.stats?.overdueWorkOrders}</div>
                  </div>
                </div>

                {/* Mapped Categories & Assigned Personnel */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--primary-dark-teal)', marginBottom: '0.4rem' }}>Mapped Categories</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {deptDetail.categoryIds?.map((c) => (
                        <li key={c._id} style={{ padding: '0.25rem 0', borderBottom: '1px solid var(--subtle-border)' }}>
                          • <b>{c.name}</b> ({c.key})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--primary-dark-teal)', marginBottom: '0.4rem' }}>Assigned Personnel</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
                      <div>Supervisors: <b>{deptDetail.supervisorIds?.map((s) => s.name).join(', ') || 'None'}</b></div>
                      <div style={{ marginTop: '0.25rem' }}>Engineers: <b>{deptDetail.engineerIds?.map((e) => e.name).join(', ') || 'None'}</b></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
