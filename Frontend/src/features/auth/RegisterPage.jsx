import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { apiClient } from '../../shared/api/client';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { Shield, User, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const setAuthData = useAuthStore((state) => state.setAuthData);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Register citizen account
      await apiClient.post('/auth/register-citizen', {
        name,
        email,
        password
      });

      // 2. Automatically log in after registration
      const loginRes = await apiClient.post('/auth/login', {
        email,
        password
      });

      const { accessToken, user, zones, permissions } = loginRes.data.data;
      setAuthData({ user, zones, permissions, accessToken });

      setSuccess(true);
      setTimeout(() => {
        navigate('/report');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create citizen account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--main-bg)'
      }}
    >
      <GlassCard
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem 2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--plum-accent)' }} />

        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '0.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'var(--deep-teal)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
              color: 'var(--pure-white)',
              boxShadow: '0 4px 12px rgba(0,70,67,0.15)'
            }}
          >
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '1.85rem', fontFamily: 'var(--font-h1)', color: 'var(--primary-dark-teal)', fontWeight: 700 }}>
            Citizen Registration
          </h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Register to report infrastructure issues and track updates
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--health-critical-bg)',
              border: '1px solid #FCA5A5',
              color: 'var(--health-critical)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: 'var(--health-healthy-bg)',
              border: '1px solid #A7F3D0',
              color: 'var(--health-healthy)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <CheckCircle size={18} /> Citizen account created! Redirecting to report portal...
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Full Name *
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-text)' }} />
              <input
                type="text"
                className="glass-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Email Address *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-text)' }} />
              <input
                type="email"
                className="glass-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="rahul@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Password (min. 6 characters) *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-text)' }} />
              <input
                type="password"
                className="glass-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading || success} style={{ width: '100%' }}>
            {loading ? 'Creating Account...' : 'Sign Up & Continue'} <ArrowRight size={18} />
          </Button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--subtle-border)', textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--secondary-text)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--deep-teal)', textDecoration: 'underline', fontWeight: 700 }}>
            Sign In Here
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};
