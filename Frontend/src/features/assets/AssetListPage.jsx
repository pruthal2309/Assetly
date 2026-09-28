import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/api/client';
import { useCan } from '../../shared/hooks/useCan';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { DataTable } from '../../shared/ui/DataTable';
import { Button } from '../../shared/ui/Button';
import { Chip } from '../../shared/ui/Chip';
import { Skeleton, EmptyState } from '../../shared/ui/Toast';
import { Plus, Search, Filter, QrCode } from 'lucide-react';

export const AssetListPage = () => {
  const navigate = useNavigate();
  const { can } = useCan();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [risk, setRisk] = useState('');
  const [cursor, setCursor] = useState(null);

  const debouncedSearch = useDebounce(search, 350);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await apiClient.get('/categories')).data.data
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['assets', { q: debouncedSearch, category, status, risk, cursor }],
    queryFn: async () => {
      const res = await apiClient.get('/assets', {
        params: { q: debouncedSearch, category, status, risk, cursor, limit: 20 }
      });
      return res.data;
    }
  });

  const columns = [
    {
      header: 'Code',
      cell: (row) => <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{row.assetCode}</span>
    },
    {
      header: 'Name',
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-laurel)' }}>{row.address || 'No address logged'}</div>
        </div>
      )
    },
    {
      header: 'Category',
      cell: (row) => <span style={{ textTransform: 'capitalize' }}>{row.categoryKey}</span>
    },
    {
      header: 'Status',
      cell: (row) => (
        <Chip variant={row.status === 'in_service' ? 'healthy' : row.status === 'under_maintenance' ? 'watch' : 'high'}>
          {row.status.replace('_', ' ')}
        </Chip>
      )
    },
    {
      header: 'Health Score',
      cell: (row) => (
        <Chip variant={row.health?.riskLevel || 'healthy'}>
          Score: {row.health?.score ?? 100}
        </Chip>
      )
    },
    {
      header: 'Zone',
      cell: (row) => <span>{row.zoneId?.code || row.zoneId?.name || 'N/A'}</span>
    },
    {
      header: 'Action',
      cell: (row) => (
        <Button
          variant="secondary"
          size="sm"
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/assets/${row._id}`);
          }}
        >
          Details
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>Infrastructure Asset Inventory</h1>
          <p style={{ color: 'var(--color-laurel)', fontSize: '0.9rem' }}>
            Search, filter, and inspect registered public assets
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {can('asset:read') && (
            <Button variant="secondary" icon={QrCode} onClick={() => navigate('/scan')}>
              Scan QR
            </Button>
          )}
          {can('asset:create') && (
            <Button variant="primary" icon={Plus} onClick={() => navigate('/assets/new')}>
              Add Asset
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="glass"
        style={{
          padding: '1rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
          <input
            type="text"
            className="glass-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by code, name, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="glass-input" style={{ width: 'auto' }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categoriesData?.map((c) => (
            <option key={c._id} value={c.key}>
              {c.name}
            </option>
          ))}
        </select>

        <select className="glass-input" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="planned">Planned</option>
          <option value="acquired">Acquired</option>
          <option value="installed">Installed</option>
          <option value="in_service">In Service</option>
          <option value="under_maintenance">Under Maintenance</option>
          <option value="decommissioned">Decommissioned</option>
          <option value="disposed">Disposed</option>
        </select>

        <select className="glass-input" style={{ width: 'auto' }} value={risk} onChange={(e) => setRisk(e.target.value)}>
          <option value="">All Risk Levels</option>
          <option value="low">Healthy</option>
          <option value="medium">Watch</option>
          <option value="high">High Risk</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Table & Pagination */}
      {isLoading ? (
        <Skeleton height="350px" />
      ) : error ? (
        <EmptyState title="Error fetching assets" description={error.message} />
      ) : data?.data?.length === 0 ? (
        <EmptyState
          title="No matching assets found"
          description="Try relaxing your search terms or filter parameters."
          actionLabel={can('asset:create') ? 'Create New Asset' : null}
          onAction={() => navigate('/assets/new')}
        />
      ) : (
        <>
          <div className="glass" style={{ padding: '1rem' }}>
            <DataTable columns={columns} data={data.data} onRowClick={(row) => navigate(`/assets/${row._id}`)} />
          </div>

          {data?.meta?.nextCursor && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setCursor(data.meta.nextCursor)}>
                Load More Assets
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
