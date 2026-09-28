import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Chip } from '../../shared/ui/Chip';
import { Skeleton, EmptyState } from '../../shared/ui/Toast';
import { ShieldCheck } from 'lucide-react';

export const PublicAssetPage = () => {
  const { assetCode } = useParams();

  const { data: asset, isLoading, error } = useQuery({
    queryKey: ['public-asset', assetCode],
    queryFn: async () => (await apiClient.get(`/public/assets/${assetCode}`)).data.data
  });

  if (isLoading) return <Skeleton height="250px" />;
  if (error) return <EmptyState title="Asset Not Found" description={`No public record for asset code ${assetCode}`} />;

  return (
    <div style={{ maxWidth: '500px', margin: '3rem auto', padding: '0 1rem' }}>
      <GlassCard style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Subtle Plum Accent Line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--plum-accent)' }} />

        <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
          <ShieldCheck size={40} style={{ color: 'var(--health-healthy)', marginBottom: '0.5rem' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Verified Public Asset Record
          </span>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginTop: '0.2rem', color: 'var(--primary-dark-teal)', fontWeight: 800 }}>{asset.assetCode}</h1>
          <h2 style={{ fontSize: '1.2rem', marginTop: '0.2rem', fontWeight: 600, color: 'var(--secondary-text)' }}>{asset.name}</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'var(--main-bg)', border: '1px solid var(--subtle-border)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--secondary-text)' }}>Asset Category:</span>
            <strong style={{ color: 'var(--primary-dark-teal)' }}>{asset.category}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--secondary-text)' }}>Current Status:</span>
            <Chip variant={asset.status === 'in_service' ? 'healthy' : 'watch'}>{asset.status.replace('_', ' ')}</Chip>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--secondary-text)' }}>Notice an issue with this asset? </span>
          <Link to="/report" style={{ color: 'var(--deep-teal)', textDecoration: 'underline', fontWeight: 700 }}>
            Report an Issue
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};
