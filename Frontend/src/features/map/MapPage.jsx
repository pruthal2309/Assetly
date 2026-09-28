import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiClient } from '../../shared/api/client';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Chip } from '../../shared/ui/Chip';
import { HealthRing } from '../../shared/ui/HealthRing';
import { LifecycleStepper } from '../../shared/ui/LifecycleStepper';
import { getHealthColor } from '../../shared/lib/health';
import { Search, X, ArrowRight } from 'lucide-react';

const createCustomIcon = (riskLevel, categoryKey) => {
  const color = getHealthColor(riskLevel);
  const isCritical = riskLevel === 'critical';
  const html = `
    <div style="
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: ${color};
      border: 2px solid #FBF6F0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0D3A35;
      font-size: 11px;
      font-weight: 800;
    " class="${isCritical ? 'pulse-critical' : ''}">
      ●
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

function MapEventsHandler({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      onBoundsChange(bbox);
    }
  });
  return null;
}

export const MapPage = () => {
  const navigate = useNavigate();
  const [bbox, setBbox] = useState('');
  const [category, setCategory] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [search, setSearch] = useState('');

  const { data: mapPoints = [] } = useQuery({
    queryKey: ['assets-map', { bbox, category }],
    queryFn: async () => {
      const res = await apiClient.get('/assets/map', { params: { bbox, category } });
      return res.data.data;
    }
  });

  const { data: selectedAsset } = useQuery({
    queryKey: ['asset', selectedAssetId],
    queryFn: async () => (await apiClient.get(`/assets/${selectedAssetId}`)).data.data,
    enabled: Boolean(selectedAssetId)
  });

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 120px)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Map Filter & Search Bar Floating Header */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 400,
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <div className="glass" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={16} style={{ color: 'var(--color-laurel)' }} />
          <input
            type="text"
            placeholder="Search map markers..."
            style={{ background: 'transparent', border: 'none', color: 'var(--color-cream)', outline: 'none', fontSize: '0.85rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="glass"
          style={{ padding: '0.5rem 1rem', color: 'var(--color-cream)', outline: 'none', border: '1px solid rgba(251,246,240,0.2)' }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="" style={{ background: '#0D3A35' }}>All Categories</option>
          <option value="streetlight" style={{ background: '#0D3A35' }}>Streetlights</option>
          <option value="road" style={{ background: '#0D3A35' }}>Roads</option>
          <option value="drain" style={{ background: '#0D3A35' }}>Drains</option>
          <option value="pipeline" style={{ background: '#0D3A35' }}>Pipelines</option>
          <option value="bridge" style={{ background: '#0D3A35' }}>Bridges</option>
          <option value="building" style={{ background: '#0D3A35' }}>Buildings</option>
        </select>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={[12.9141, 74.8560]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-tile-layer"
        />
        <MapEventsHandler onBoundsChange={setBbox} />

        {mapPoints.map((point) => {
          const coords = point.location?.coordinates;
          if (!coords || coords.length < 2) return null;

          return (
            <Marker
              key={point._id}
              position={[coords[1], coords[0]]}
              icon={createCustomIcon(point.health?.riskLevel, point.categoryKey)}
              eventHandlers={{
                click: () => setSelectedAssetId(point._id)
              }}
            >
              <Popup>
                <div style={{ color: '#0D3A35' }}>
                  <strong>{point.assetCode}</strong>
                  <div>{point.name}</div>
                  <div>Health: {point.health?.score}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Right Glass Detail Panel for Selected Marker */}
      {selectedAsset && (
        <div
          className="glass"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            bottom: '16px',
            width: '380px',
            zIndex: 500,
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-laurel)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Asset Details
            </span>
            <button onClick={() => setSelectedAssetId(null)} style={{ background: 'transparent', color: 'var(--color-cream)' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <HealthRing score={selectedAsset.health?.score || 100} size={80} strokeWidth={8} />
            <div>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem' }}>{selectedAsset.assetCode}</span>
              <h3 style={{ fontSize: '1rem', marginTop: '0.2rem' }}>{selectedAsset.name}</h3>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                <Chip variant={selectedAsset.health?.riskLevel}>{selectedAsset.health?.riskLevel}</Chip>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(251,246,240,0.1)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--color-laurel)', marginBottom: '0.5rem' }}>Lifecycle Progress</h4>
            <LifecycleStepper currentStatus={selectedAsset.status} />
          </div>

          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div><strong>Category:</strong> {selectedAsset.categoryKey}</div>
            <div><strong>Address:</strong> {selectedAsset.address || 'N/A'}</div>
            <div><strong>Open Work Orders:</strong> {selectedAsset.openWorkOrderCount || 0}</div>
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: 'auto', width: '100%' }}
            onClick={() => navigate(`/assets/${selectedAsset._id}`)}
          >
            Full Asset View <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Dark Filter Style for OSM Tiles */}
      <style>{`
        .dark-tile-layer {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
      `}</style>
    </div>
  );
};
