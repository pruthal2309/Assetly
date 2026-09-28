import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const bg =
    type === 'error'
      ? 'var(--health-critical)'
      : type === 'warning'
      ? 'var(--health-watch)'
      : 'var(--deep-teal)';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: bg,
        color: '#fff',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 10px 30px rgba(0, 46, 44, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        minWidth: '280px'
      }}
    >
      {type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'transparent', color: '#fff', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export const Skeleton = ({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)' }) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, rgba(0, 46, 44, 0.04) 25%, rgba(0, 46, 44, 0.09) 50%, rgba(0, 46, 44, 0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite'
      }}
    />
  );
};

export const EmptyState = ({ title = 'No records found', description, actionLabel, onAction, icon: Icon }) => {
  return (
    <div
      className="glass"
      style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        margin: '1.5rem 0',
        background: 'var(--pure-white)',
        border: '1px solid var(--subtle-border)',
        borderRadius: 'var(--radius-lg)'
      }}
    >
      {Icon && <Icon size={44} style={{ color: 'var(--secondary-text)', opacity: 0.7 }} />}
      <h4 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--primary-dark-teal)' }}>{title}</h4>
      {description && <p style={{ color: 'var(--secondary-text)', maxWidth: '400px', fontSize: '0.9rem' }}>{description}</p>}
      {actionLabel && onAction && (
        <button className="btn-primary" onClick={onAction} style={{ marginTop: '0.5rem' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};
