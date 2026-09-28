import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { set, get } from 'idb-keyval';
import { apiClient } from '../../shared/api/client';
import { useOnline } from '../../shared/hooks/useOnline';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { MapPin, Camera, Save, ArrowLeft } from 'lucide-react';

export const AssetFormPage = () => {
  const navigate = useNavigate();
  const isOnline = useOnline();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [lat, setLat] = useState(12.9141);
  const [lng, setLng] = useState(74.8560);
  const [address, setAddress] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [vendor, setVendor] = useState('');
  const [expectedLifeYears, setExpectedLifeYears] = useState(10);
  const [status, setStatus] = useState('installed');
  const [specs, setSpecs] = useState({});
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await apiClient.get('/categories')).data.data
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['zones'],
    queryFn: async () => (await apiClient.get('/zones')).data.data
  });

  const selectedCategory = categories.find((c) => c._id === categoryId);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) setCategoryId(categories[0]._id);
    if (zones.length > 0 && !zoneId) setZoneId(zones[0]._id);
  }, [categories, zones]);

  const handleGpsFill = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(6)));
          setLng(Number(pos.coords.longitude.toFixed(6)));
        },
        (err) => alert(`GPS Error: ${err.message}`)
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSpecChange = (key, val) => {
    setSpecs((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setToastMessage(null);

    const idempotencyKey = `create-asset-${Date.now()}`;
    const payload = {
      name,
      categoryId,
      zoneId,
      location: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
      address,
      acquisitionCost: Number(acquisitionCost) || 0,
      vendor,
      expectedLifeYears: Number(expectedLifeYears) || 10,
      status,
      specs
    };

    if (!isOnline) {
      // Offline queue in IndexedDB
      const pendingQueue = (await get('offline_queue')) || [];
      pendingQueue.push({ type: 'POST_ASSET', idempotencyKey, payload });
      await set('offline_queue', pendingQueue);
      setToastMessage('Offline: Asset request queued locally.');
      setTimeout(() => navigate('/assets'), 1500);
      return;
    }

    try {
      const res = await apiClient.post('/assets', payload, {
        headers: { 'Idempotency-Key': idempotencyKey }
      });
      const createdAsset = res.data.data;

      // Upload photo if selected
      if (photo && createdAsset._id) {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('ownerType', 'asset');
        formData.append('ownerId', createdAsset._id);
        await apiClient.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setToastMessage(`Asset registered: ${createdAsset.assetCode}`);
      setTimeout(() => navigate(`/assets/${createdAsset._id}`), 1000);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button
        className="btn-secondary"
        style={{ marginBottom: '1.25rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} /> Back to Assets
      </button>

      <GlassCard>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Register New Infrastructure Asset</h1>
        <p style={{ color: 'var(--color-laurel)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
          Capture coordinates, photos, and category specifications in under 60 seconds.
        </p>

        {toastMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--color-moderate)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem'
            }}
          >
            {toastMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Asset Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-laurel)', marginBottom: '0.4rem' }}>
              Asset Name / Title *
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. MG Road Streetlight Unit 42"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Category & Zone Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-laurel)', marginBottom: '0.4rem' }}>
                Category *
              </label>
              <select className="glass-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-laurel)', marginBottom: '0.4rem' }}>
                Assigned Ward / Zone *
              </label>
              <select className="glass-input" value={zoneId} onChange={(e) => setZoneId(e.target.value)} required>
                {zones.map((z) => (
                  <option key={z._id} value={z._id}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & GPS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-laurel)' }}>Geographic Coordinates (GPS) *</label>
              <Button type="button" variant="secondary" size="sm" icon={MapPin} onClick={handleGpsFill}>
                Auto GPS
              </Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="number"
                step="any"
                className="glass-input"
                placeholder="Latitude (e.g. 12.9141)"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
              />
              <input
                type="number"
                step="any"
                className="glass-input"
                placeholder="Longitude (e.g. 74.8560)"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-laurel)', marginBottom: '0.4rem' }}>
              Street Address / Location Notes
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. MG Road Near Sector 4 Junction"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Dynamic Spec Fields based on Category SpecSchema */}
          {selectedCategory?.specSchema?.length > 0 && (
            <div style={{ padding: '1rem', background: 'rgba(251,246,240,0.04)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--color-cream)' }}>
                {selectedCategory.name} Specifications
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {selectedCategory.specSchema.map((field) => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-laurel)', marginBottom: '0.3rem' }}>
                      {field.label} {field.unit ? `(${field.unit})` : ''} {field.required ? '*' : ''}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        className="glass-input"
                        value={specs[field.key] || ''}
                        onChange={(e) => handleSpecChange(field.key, e.target.value)}
                      >
                        <option value="">Select option...</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        className="glass-input"
                        value={specs[field.key] || ''}
                        onChange={(e) => handleSpecChange(field.key, e.target.value)}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Costs & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-laurel)', marginBottom: '0.4rem' }}>
                Acquisition Cost (₹)
              </label>
              <input
                type="number"
                className="glass-input"
                placeholder="15000"
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-laurel)', marginBottom: '0.4rem' }}>
                Expected Life (Years)
              </label>
              <input
                type="number"
                className="glass-input"
                value={expectedLifeYears}
                onChange={(e) => setExpectedLifeYears(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-laurel)', marginBottom: '0.4rem' }}>
                Initial Status
              </label>
              <select className="glass-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="planned">Planned</option>
                <option value="acquired">Acquired</option>
                <option value="installed">Installed</option>
                <option value="in_service">In Service</option>
              </select>
            </div>
          </div>

          {/* Photo Capture / Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-laurel)', marginBottom: '0.4rem' }}>
              Asset Photo Attachment
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                <Camera size={18} /> Select / Capture Photo
                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoSelect} />
              </label>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                />
              )}
            </div>
          </div>

          <Button type="submit" disabled={submitting} icon={Save} style={{ marginTop: '1rem' }}>
            {submitting ? 'Registering Asset...' : 'Save & Generate QR'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};
