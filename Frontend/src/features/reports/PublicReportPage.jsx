import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/api/client';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { MapPin, Camera, Send, Search } from 'lucide-react';

export const PublicReportPage = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [lat, setLat] = useState(12.9141);
  const [lng, setLng] = useState(74.8560);
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [lookupCode, setLookupCode] = useState('');

  const handleGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let mediaIds = [];
      if (photo) {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('ownerType', 'report');
        const mediaRes = await apiClient.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        mediaIds.push(mediaRes.data.data._id);
      }

      const res = await apiClient.post('/public/reports', {
        description,
        contact,
        location: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        mediaIds
      });

      setTrackingCode(res.data.data.trackingCode);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '2rem auto', padding: '0 1rem' }}>
      <GlassCard style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Subtle Top Plum Bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--plum-accent)' }} />

        <div style={{ textAlign: 'center', marginBottom: '1.75rem', marginTop: '0.5rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', color: 'var(--primary-dark-teal)', fontWeight: 800 }}>
            Public Citizen Grievance Portal
          </h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Report infrastructure issues (damaged roads, non-working streetlights, pipeline leaks)
          </p>
        </div>

        {/* Lookup Existing Report Status */}
        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--main-bg)', border: '1px solid var(--subtle-border)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--secondary-text)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
            Already have a tracking code?
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. R-8F3K2"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
            />
            <Button variant="secondary" icon={Search} onClick={() => navigate(`/report/${lookupCode}`)}>
              Check
            </Button>
          </div>
        </div>

        {trackingCode ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary-dark-teal)' }}>Report Received Successfully!</h2>
            <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your issue has been logged and automatically matched to nearest infrastructure assets.
            </p>
            <div style={{ background: 'var(--main-bg)', border: '1px solid var(--subtle-border)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Your Unique Tracking Code:</span>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark-teal)' }}>
                {trackingCode}
              </div>
            </div>
            <Button variant="primary" onClick={() => navigate(`/report/${trackingCode}`)}>
              View Live Report Status
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 600, marginBottom: '0.4rem' }}>
                Issue Description *
              </label>
              <textarea
                className="glass-input"
                rows={4}
                placeholder="Describe the issue clearly (e.g. Broken lamp pole hanging dangerously near MG Road Sector 4)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 600 }}>Location Coordinates *</label>
                <Button type="button" variant="secondary" size="sm" icon={MapPin} onClick={handleGps}>
                  Use My Current GPS
                </Button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input type="number" step="any" className="glass-input" value={lat} onChange={(e) => setLat(e.target.value)} required />
                <input type="number" step="any" className="glass-input" value={lng} onChange={(e) => setLng(e.target.value)} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 600, marginBottom: '0.4rem' }}>
                Your Email / Phone (Optional for Updates)
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="citizen@example.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 600, marginBottom: '0.4rem' }}>
                Attach Issue Photo
              </label>
              <label className="btn-secondary" style={{ cursor: 'pointer', width: 'fit-content' }}>
                <Camera size={16} /> Attach Photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setPhoto(e.target.files[0])} />
              </label>
              {photo && <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: 'var(--primary-dark-teal)' }}>{photo.name}</span>}
            </div>

            <Button type="submit" disabled={submitting} icon={Send} style={{ marginTop: '1rem' }}>
              {submitting ? 'Submitting Report...' : 'Submit Citizen Report'}
            </Button>
          </form>
        )}
      </GlassCard>
    </div>
  );
};
