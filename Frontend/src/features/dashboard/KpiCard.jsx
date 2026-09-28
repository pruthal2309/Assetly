import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../shared/ui/GlassCard';

export const KpiCard = ({ title, value = 0, icon: Icon, trend, color = 'var(--primary-dark-teal)' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = typeof value === 'number' ? value : parseInt(value, 10) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }
    const duration = 1000;
    const stepTime = Math.max(10, Math.floor(duration / end));
    const timer = setInterval(() => {
      start += Math.ceil(end / 40);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <GlassCard style={{ flex: 1, minWidth: '220px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--secondary-text)', display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
            {title}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2.2rem',
              fontWeight: 800,
              color: 'var(--primary-dark-teal)'
            }}
          >
            {count.toLocaleString()}
          </span>
        </div>
        {Icon && (
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--main-bg)',
              border: '1px solid var(--subtle-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color
            }}
          >
            <Icon size={22} />
          </div>
        )}
      </div>
    </GlassCard>
  );
};
