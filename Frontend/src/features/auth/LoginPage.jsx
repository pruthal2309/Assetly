import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { apiClient } from '../../shared/api/client';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { Shield, User, Lock, ArrowRight, Building, Globe, CheckCircle } from 'lucide-react';

export const LoginPage = () => {
  const [portalMode, setPortalMode] = useState('staff'); // 'staff' or 'citizen'
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

      // Redirect directly based on server-authenticated user role
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
          maxWidth: '460px',
          padding: '2.5rem 2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Accent Bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: portalMode === 'staff' ? 'var(--deep-teal)' : 'var(--plum-accent)' }} />

        {/* Portal Mode Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(13, 58, 53, 0.06)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '1.75rem',
            border: '1px solid var(--subtle-border)'
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.6rem 0.5rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
              background: portalMode === 'staff' ? 'var(--deep-teal)' : 'transparent',
              color: portalMode === 'staff' ? '#FFFFFF' : 'var(--secondary-text)',
              boxShadow: portalMode === 'staff' ? '0 2px 8px rgba(13, 58, 53, 0.2)' : 'none'
            }}
            onClick={() => {
              setPortalMode('staff');
              setError(null);
            }}
          >
            <Building size={16} /> Staff / Admin Login
          </button>

          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.6rem 0.5rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
              background: portalMode === 'citizen' ? 'var(--deep-teal)' : 'transparent',
              color: portalMode === 'citizen' ? '#FFFFFF' : 'var(--secondary-text)',
              boxShadow: portalMode === 'citizen' ? '0 2px 8px rgba(13, 58, 53, 0.2)' : 'none'
            }}
            onClick={() => {
              setPortalMode('citizen');
              setError(null);
            }}
          >
            <Globe size={16} /> Citizen Portal
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
            {portalMode === 'staff' ? 'Internal Staff Portal' : 'Public Citizen Portal'}
          </h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {portalMode === 'staff'
              ? 'Sign in to access Admin, Supervisor, Engineer & Auditor Workspaces'
              : 'Sign in to report infrastructure issues and track grievances'}
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
                placeholder={portalMode === 'staff' ? 'admin@demo.com or engineer@demo.com' : 'citizen@example.com'}
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
            {loading ? 'Authenticating...' : portalMode === 'staff' ? 'Sign In to Workspace' : 'Sign In as Citizen'} <ArrowRight size={18} />
          </Button>
        </form>

        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--subtle-border)', textAlign: 'center', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {portalMode === 'citizen' ? (
            <div>
              <span style={{ color: 'var(--secondary-text)' }}>New Citizen User? </span>
              <Link to="/register" style={{ color: 'var(--deep-teal)', textDecoration: 'underline', fontWeight: 700 }}>
                Register Citizen Account
              </Link>
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-laurel)' }}>
              Staff accounts are created by your Admin via Email Invitation.
            </div>
          )}

          <div>
            <span style={{ color: 'var(--secondary-text)' }}>Public Report Portal? </span>
            <Link to="/report" style={{ color: 'var(--deep-teal)', textDecoration: 'underline', fontWeight: 700 }}>
              Submit Grievance Report
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
