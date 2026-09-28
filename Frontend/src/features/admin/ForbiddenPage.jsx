import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const ForbiddenPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
      <GlassCard>
        <ShieldAlert size={56} style={{ color: 'var(--health-critical)', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>403 - Permission Denied</h1>
        <p style={{ color: 'var(--color-laurel)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Your current user role does not hold permission to access this resource or perform this action.
        </p>
        <Button variant="primary" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Return to Dashboard
        </Button>
      </GlassCard>
    </div>
  );
};

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
      <GlassCard>
        <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>404</h1>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Page Not Found</h2>
        <p style={{ color: 'var(--color-laurel)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          The page or resource you requested does not exist or has been moved.
        </p>
        <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/')}>
          Go to Home
        </Button>
      </GlassCard>
    </div>
  );
};
