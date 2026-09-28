import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { apiClient } from '../../shared/api/client';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import {
  Shield, User, Lock, ArrowRight, Building, Globe,
  Settings, HardHat, ClipboardList, UserCheck, Zap
} from 'lucide-react';

const DEMO_ROLES = [
  {
    role: 'admin',
    label: 'Admin',
    email: 'admin@demo.com',
    password: 'Admin@123',
    icon: Settings,
    color: '#0d3a35',
    bg: 'rgba(13,58,53,0.08)',
    border: 'rgba(13,58,53,0.2)',
    desc: 'Org-wide management'
  },
  {
    role: 'supervisor',
    label: 'Supervisor',
    email: 'supervisor@demo.com',
    password: 'Super@123',
    icon: ClipboardList,
    color: '#6d28d9',
    bg: 'rgba(109,40,217,0.08)',
    border: 'rgba(109,40,217,0.2)',
    desc: 'Zone & task management'
  },
  {
    role: 'engineer',
    label: 'Engineer',
    email: 'engineer@demo.com',
    password: 'Engineer@123',
    icon: HardHat,
    color: '#b45309',
    bg: 'rgba(180,83,9,0.08)',
    border: 'rgba(180,83,9,0.2)',
    desc: 'Field task execution'
  },
  {
    role: 'auditor',
    label: 'Auditor',
    email: 'auditor@demo.com',
    password: 'Audit@123',
    icon: UserCheck,
    color: '#0e7490',
    bg: 'rgba(14,116,144,0.08)',
    border: 'rgba(14,116,144,0.2)',
    desc: 'Reports & audit logs'
  }
];

const CITIZEN_DEMO = {
  role: 'citizen',
  label: 'Citizen',
  email: 'citizen@demo.com',
  password: 'Citizen@123',
  icon: Globe,
  color: '#059669',
  bg: 'rgba(5,150,105,0.08)',
  border: 'rgba(5,150,105,0.2)',
  desc: 'Submit & track reports'
};

export const LoginPage = () => {
  const [portalMode, setPortalMode] = useState('staff'); // 'staff' or 'citizen'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState(null);

  const setAuthData = useAuthStore((state) => state.setAuthData);
  const navigate = useNavigate();

  const doLogin = async (loginEmail, loginPassword) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', {
        email: loginEmail,
        password: loginPassword
      });
      const { accessToken, user, zones, permissions } = res.data.data;
      setAuthData({ user, zones, permissions, accessToken });
      if (user.role === 'citizen') {
        navigate('/report');
      } else {
        navigate('/');
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Connecting to server... Render instance may be waking up (15-30s). Please try again in a moment.');
      } else {
        setError('Invalid credentials or login failure.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleClick = async (demoUser) => {
    setActiveRole(demoUser.role);
    setEmail(demoUser.email);
    setPassword(demoUser.password);
    await doLogin(demoUser.email, demoUser.password);
    setActiveRole(null);
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    await doLogin(email, password);
  };

  const staffRoles = DEMO_ROLES;
  const citizenRole = CITIZEN_DEMO;

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
          maxWidth: '500px',
          padding: '2.5rem 2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Accent Bar */}
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
            onClick={() => { setPortalMode('staff'); setError(null); setEmail(''); setPassword(''); }}
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
            onClick={() => { setPortalMode('citizen'); setError(null); setEmail(''); setPassword(''); }}
          >
            <Globe size={16} /> Citizen Portal
          </button>
        </div>

        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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
          <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-h1)', color: 'var(--primary-dark-teal)', fontWeight: 700 }}>
            {portalMode === 'staff' ? 'Internal Staff Portal' : 'Public Citizen Portal'}
          </h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {portalMode === 'staff'
              ? 'Select a role below to jump in instantly'
              : 'Sign in to report infrastructure issues and track grievances'}
          </p>
        </div>

        {/* ── Demo Role Cards (Staff) ── */}
        {portalMode === 'staff' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={12} /> Quick Demo Access — Click to Sign In
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {staffRoles.map((r) => {
                const Icon = r.icon;
                const isActive = activeRole === r.role && loading;
                return (
                  <button
                    key={r.role}
                    type="button"
                    disabled={loading}
                    onClick={() => handleRoleClick(r)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '10px',
                      border: `1.5px solid ${r.border}`,
                      background: isActive ? r.bg : 'rgba(255,255,255,0.5)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.18s ease',
                      textAlign: 'left',
                      opacity: loading && !isActive ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = r.bg; }}
                    onMouseLeave={(e) => { if (!loading && !isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: r.bg, border: `1px solid ${r.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isActive
                        ? <div style={{ width: '14px', height: '14px', border: `2px solid ${r.color}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        : <Icon size={16} color={r.color} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: r.color, lineHeight: 1.2 }}>{r.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)', lineHeight: 1.3 }}>{r.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Demo Citizen Card ── */}
        {portalMode === 'citizen' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={12} /> Quick Demo Access — Click to Sign In
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleRoleClick(citizenRole)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: `1.5px solid ${citizenRole.border}`,
                background: activeRole === 'citizen' && loading ? citizenRole.bg : 'rgba(255,255,255,0.5)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = citizenRole.bg; }}
              onMouseLeave={(e) => { if (!loading && !(activeRole === 'citizen')) e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: citizenRole.bg, border: `1px solid ${citizenRole.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {activeRole === 'citizen' && loading
                  ? <div style={{ width: '14px', height: '14px', border: `2px solid ${citizenRole.color}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  : <Globe size={18} color={citizenRole.color} />}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.87rem', fontWeight: 700, color: citizenRole.color }}>Demo Citizen</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>citizen@demo.com — Click to enter portal</div>
              </div>
            </button>
          </div>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--subtle-border)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', fontWeight: 600, whiteSpace: 'nowrap' }}>or sign in manually</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--subtle-border)' }} />
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
                placeholder={portalMode === 'staff' ? 'admin@demo.com' : 'citizen@example.com'}
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
            {loading && !activeRole ? 'Authenticating...' : portalMode === 'staff' ? 'Sign In to Workspace' : 'Sign In as Citizen'} <ArrowRight size={18} />
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

        {/* Spinner keyframe */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </GlassCard>
    </div>
  );
};
