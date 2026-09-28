import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { useCan } from '../shared/hooks/useCan';
import { useOnline } from '../shared/hooks/useOnline';
import {
  LayoutDashboard,
  Map,
  Box,
  Wrench,
  FileText,
  Users,
  ShieldCheck,
  LogOut,
  WifiOff
} from 'lucide-react';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { can } = useCan();
  const isOnline = useOnline();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, perm: 'dashboard:read' },
    { label: 'GIS Map', path: '/map', icon: Map, perm: 'asset:read' },
    { label: 'Asset Registry', path: '/assets', icon: Box, perm: 'asset:read' },
    { label: 'Work Orders', path: '/work-orders', icon: Wrench, perm: 'workorder:read' },
    { label: 'Citizen Reports', path: '/reports/staff', icon: FileText, perm: 'report:read' },
    { label: 'Users', path: '/admin/users', icon: Users, perm: 'user:read' },
    { label: 'Zones', path: '/admin/zones', icon: ShieldCheck, perm: 'zone:manage' },
    { label: 'Categories', path: '/admin/categories', icon: Box, perm: 'category:manage' },
    { label: 'Audit Trail', path: '/admin/audit', icon: ShieldCheck, perm: 'audit:read' }
  ].filter((item) => !item.perm || can(item.perm));

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        {/* Subtle Plum Accent Line at top of sidebar */}
        <div style={{ height: '3px', background: 'var(--plum-accent)', borderRadius: '2px', width: '100%', marginBottom: '-0.75rem' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="logo-container">
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--deep-teal)',
              color: 'var(--pure-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)'
            }}
          >
            A
          </div>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--primary-dark-teal)',
              letterSpacing: '-0.02em'
            }}
            className="logo-text"
          >
            Assetly
          </span>
        </div>

        {/* Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, marginTop: '0.5rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: 'var(--font-heading)',
                  background: isActive ? 'var(--deep-teal)' : 'transparent',
                  color: isActive ? 'var(--pure-white)' : 'var(--secondary-text)',
                  border: isActive ? '1px solid var(--deep-teal)' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--pure-white)' : 'var(--secondary-text)' }} />
                <span className="logo-text">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        {user && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--subtle-border)'
            }}
          >
            <div style={{ fontSize: '0.85rem' }} className="user-profile-text">
              <div style={{ fontWeight: 700, color: 'var(--primary-dark-teal)' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', textTransform: 'capitalize' }}>
                Role: {user.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{ padding: '0.5rem', justifyContent: 'center', fontSize: '0.8rem', width: '100%' }}
              title="Logout"
            >
              <LogOut size={16} /> <span className="logo-text">Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Body */}
      <main className="main-content">
        {/* Offline Chip Header Indicator */}
        {!isOnline && (
          <div
            style={{
              background: 'var(--health-watch-bg)',
              color: 'var(--health-watch)',
              border: '1px solid #FDE68A',
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            <WifiOff size={16} /> You are currently offline. New asset registrations will be queued locally.
          </div>
        )}

        <Outlet />
      </main>
    </div>
  );
};
