import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { apiClient } from '../../shared/api/client';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { Shield, User, Lock, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const setAuthData = useAuthStore((state) => state.setAuthData);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', {
        email,
        password
      });

      const { accessToken, user, zones, permissions } = res.data.data;
      setAuthData({ user, zones, permissions, accessToken });

      if (user.role === 'citizen') {
        navigate('/report');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid credentials or login failure.');
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
          maxWidth: '440px',
          padding: '2.5rem 2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Top Accent Line in Plum */}
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
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-h1)', color: 'var(--primary-dark-teal)', fontWeight: 700 }}>
            Assetly
          </h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Infrastructure Asset Inventory Platform
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

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-text)' }} />
              <input
                type="email"
                className="glass-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="name@organization.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Password
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
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
          </Button>
        </form>

        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--subtle-border)', textAlign: 'center', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div>
            <span style={{ color: 'var(--secondary-text)' }}>Don't have an account? </span>
            <Link to="/register" style={{ color: 'var(--deep-teal)', textDecoration: 'underline', fontWeight: 700 }}>
              Create Account / Sign Up
            </Link>
          </div>
          <div>
            <span style={{ color: 'var(--secondary-text)' }}>Citizen reporting issue? </span>
            <Link to="/report" style={{ color: 'var(--deep-teal)', textDecoration: 'underline', fontWeight: 700 }}>
              Public Citizen Portal
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
