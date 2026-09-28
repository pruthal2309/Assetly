import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

const LIFECYCLE_STAGES = [
  { key: 'planned', label: 'Planned' },
  { key: 'acquired', label: 'Acquired' },
  { key: 'installed', label: 'Installed' },
  { key: 'in_service', label: 'In Service' },
  { key: 'under_maintenance', label: 'Under Maintenance' },
  { key: 'decommissioned', label: 'Decommissioned' },
  { key: 'disposed', label: 'Disposed' }
];

export const LifecycleStepper = ({ currentStatus = 'installed' }) => {
  const getStageIndex = (status) => LIFECYCLE_STAGES.findIndex((s) => s.key === status);
  const currentIndex = getStageIndex(currentStatus);

  return (
    <div style={{ width: '100%', overflowX: 'auto', padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', minWidth: '650px', gap: '0.25rem' }}>
        {LIFECYCLE_STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex && currentStatus !== 'under_maintenance';
          const isActive = idx === currentIndex;
          const isMaintenance = stage.key === 'under_maintenance' && currentStatus === 'under_maintenance';

          let circleBg = 'rgba(251, 246, 240, 0.12)';
          let circleColor = 'var(--color-laurel)';
          let border = '1px solid rgba(251, 246, 240, 0.2)';

          if (isDone) {
            circleBg = 'var(--color-laurel)';
            circleColor = 'var(--bg-deep)';
            border = 'none';
          } else if (isMaintenance) {
            circleBg = 'var(--health-watch)';
            circleColor = '#000';
            border = 'none';
          } else if (isActive) {
            circleBg = 'var(--color-cream)';
            circleColor = 'var(--bg-deep)';
            border = 'none';
          }

          return (
            <React.Fragment key={stage.key}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  flex: 1
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: circleBg,
                    color: circleColor,
                    border,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {isDone ? <Check size={14} /> : isMaintenance ? <AlertTriangle size={14} /> : idx + 1}
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--color-cream)' : 'var(--color-laurel)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {stage.label}
                </span>
              </div>
              {idx < LIFECYCLE_STAGES.length - 1 && (
                <div
                  style={{
                    height: '2px',
                    flex: 1,
                    background: idx < currentIndex ? 'var(--color-laurel)' : 'rgba(251, 246, 240, 0.15)',
                    marginTop: '-1.25rem'
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
