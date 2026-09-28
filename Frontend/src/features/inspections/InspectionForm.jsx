import React, { useState } from 'react';
import { apiClient } from '../../shared/api/client';
import { Button } from '../../shared/ui/Button';
import { Sparkles, Camera, Save } from 'lucide-react';

export const InspectionForm = ({ assetId, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setAiData(null);
    }
  };

  const handleAnalyzePhoto = async () => {
    setAnalyzing(true);
    try {
      const res = await apiClient.post('/ai/detect-damage', { imageUrl: photoPreview || 'demo_photo' });
      setAiData(res.data.data);
    } catch (err) {
      alert('AI Damage Analysis unavailable: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setAnalyzing(false);
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
        formData.append('ownerType', 'inspection');
        formData.append('ownerId', assetId);
        const mediaRes = await apiClient.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        mediaIds.push(mediaRes.data.data._id);
      }

      await apiClient.post(`/assets/${assetId}/inspections`, {
        rating: Number(rating),
        notes,
        ai: aiData || undefined,
        mediaIds
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to log inspection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-laurel)', marginBottom: '0.4rem' }}>
          Condition Rating (1 = Severely Damaged, 5 = Excellent) *
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              className="btn-secondary"
              style={{
                flex: 1,
                background: rating === num ? 'var(--color-cream)' : 'rgba(251,246,240,0.08)',
                color: rating === num ? 'var(--bg-deep)' : 'var(--color-cream)',
                fontWeight: 700
              }}
              onClick={() => setRating(num)}
            >
              {num} ⭐
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-laurel)', marginBottom: '0.4rem' }}>
          Field Inspection Notes
        </label>
        <textarea
          className="glass-input"
          rows={3}
          placeholder="Describe structural condition, observed defects, or servicing needs..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-laurel)', marginBottom: '0.4rem' }}>
          Attach Inspection Photo
        </label>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            <Camera size={16} /> Choose Photo
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />
          </label>
          {photoPreview && (
            <Button type="button" variant="secondary" icon={Sparkles} disabled={analyzing} onClick={handleAnalyzePhoto}>
              {analyzing ? 'Analyzing...' : 'AI Analyze Photo'}
            </Button>
          )}
        </div>
      </div>

      {aiData && (
        <div style={{ padding: '1rem', background: 'rgba(251,246,240,0.08)', borderRadius: 'var(--radius-md)' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} style={{ color: 'var(--health-watch)' }} /> AI Damage Detection Suggestion
          </h4>
          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div><strong>Detected Defect:</strong> {aiData.damageType}</div>
            <div><strong>Confidence:</strong> {Math.round(aiData.confidence * 100)}%</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong>Severity:</strong>
              <select
                className="glass-input"
                style={{ padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.8rem' }}
                value={aiData.severity}
                onChange={(e) => setAiData({ ...aiData, severity: e.target.value })}
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <Button type="submit" disabled={submitting} icon={Save}>
        {submitting ? 'Saving Inspection...' : 'Save Inspection Record'}
      </Button>
    </form>
  );
};
