import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import { DataTable } from '../../shared/ui/DataTable';
import { Button } from '../../shared/ui/Button';
import { Modal } from '../../shared/ui/Modal';
import { Skeleton } from '../../shared/ui/Toast';
import { Plus } from 'lucide-react';

export const ZonesPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['zones'],
    queryFn: async () => (await apiClient.get('/zones')).data.data
  });

  const createMutation = useMutation({
    mutationFn: async (data) => (await apiClient.post('/zones', data)).data.data,
    onSuccess: () => {
      queryClient.invalidateQueries(['zones']);
      setShowModal(false);
      setName('');
      setCode('');
    }
  });

  const columns = [
    { header: 'Zone Code', accessorKey: 'code' },
    { header: 'Zone / Ward Name', accessorKey: 'name' },
    { header: 'Created Date', cell: (r) => new Date(r.createdAt).toLocaleDateString() }
  ];

  if (isLoading) return <Skeleton height="300px" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Zone & Ward Management</h1>
          <p style={{ color: 'var(--color-laurel)', fontSize: '0.9rem' }}>Configure municipal wards and spatial boundaries</p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>Add Zone</Button>
      </div>

      <div className="glass" style={{ padding: '1rem' }}>
        <DataTable columns={columns} data={zones} />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Zone / Ward">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ name, code }); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Zone Code *</label>
            <input type="text" className="glass-input" placeholder="Z6" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Zone / Ward Name *</label>
            <input type="text" className="glass-input" placeholder="Ward 6 Northeast" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <Button type="submit" disabled={createMutation.isPending}>Save Zone</Button>
        </form>
      </Modal>
    </div>
  );
};

export const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [defaultLifeYears, setDefaultLifeYears] = useState(10);
  const [inspectionIntervalDays, setInspectionIntervalDays] = useState(180);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await apiClient.get('/categories')).data.data
  });

  const createMutation = useMutation({
    mutationFn: async (data) => (await apiClient.post('/categories', data)).data.data,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setShowModal(false);
      setName('');
      setKey('');
    }
  });

  const columns = [
    { header: 'Key', accessorKey: 'key' },
    { header: 'Category Name', accessorKey: 'name' },
    { header: 'Default Life (Years)', accessorKey: 'defaultLifeYears' },
    { header: 'Inspection Interval (Days)', accessorKey: 'inspectionIntervalDays' }
  ];

  if (isLoading) return <Skeleton height="300px" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Category Catalogue & Spec Schema Editor</h1>
          <p style={{ color: 'var(--color-laurel)', fontSize: '0.9rem' }}>Define dynamic category attributes and inspection intervals</p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>Add Category</Button>
      </div>

      <div className="glass" style={{ padding: '1rem' }}>
        <DataTable columns={columns} data={categories} />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Asset Category">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ name, key: key.toLowerCase(), defaultLifeYears: Number(defaultLifeYears), inspectionIntervalDays: Number(inspectionIntervalDays) }); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Category Name *</label>
            <input type="text" className="glass-input" placeholder="Solar Panel" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Category Key *</label>
            <input type="text" className="glass-input" placeholder="solar_panel" value={key} onChange={(e) => setKey(e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Default Life (Years)</label>
              <input type="number" className="glass-input" value={defaultLifeYears} onChange={(e) => setDefaultLifeYears(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Inspection Days</label>
              <input type="number" className="glass-input" value={inspectionIntervalDays} onChange={(e) => setInspectionIntervalDays(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={createMutation.isPending}>Save Category</Button>
        </form>
      </Modal>
    </div>
  );
};
