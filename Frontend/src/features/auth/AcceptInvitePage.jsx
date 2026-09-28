import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { apiClient } from '../../shared/api/client';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { Shield, Lock, CheckCircle, AlertTriangle, ArrowRight, User, Mail, ShieldCheck, MapPin } from 'lucide-react';

export const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [inviteState, setInviteState] = useState(null); // 'valid', 'expired', 'already_used', 'invalid'
  const [inviteUser, setInviteUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const setAuthData = useAuthStore((state) => state.setAuthData);
  const navigate = useNavigate();

  useEffect(() => {
    const checkInvitation = async () => {
      if (!token) {
        setInviteState('invalid');
        setErrorMessage('Invitation token is missing from URL.');
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.get('/auth/verify-invite', { params: { token } });
        const data = res.data.data;

        if (data.valid) {
          setInviteState('valid');
          setInviteUser(data.user);
        } else {
          setInviteState(data.status || 'invalid');
          setErrorMessage(data.message || 'Invitation is invalid.');
        }
      } catch (err) {
        const msg = err.response?.data?.error?.message || 'Failed to verify invitation.';
        if (msg.toLowerCase().includes('expired')) {
          setInviteState('expired');
        } else if (msg.toLowerCase().includes('already used')) {
          setInviteState('already_used');
        } else {
          setInviteState('invalid');
        }
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    };

    checkInvitation();
  }, [token]);

  const handleActivate = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please verify your password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/auth/accept-invite', {
        token,
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
      setFormError(err.response?.data?.error?.message || 'Account activation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--main-bg)' }}>
        <GlassCard style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ color: 'var(--deep-teal)', fontSize: '1.1rem', fontWeight: 600 }}>Verifying your invitation...</div>
        </GlassCard>
      </div>
    );
  }

  // 1. Expired State
  if (inviteState === 'expired') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backgroundColor: 'var(--main-bg)' }}>
        <GlassCard style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--health-critical-bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--health-critical)' }}>
            <AlertTriangle size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-h1)', color: 'var(--primary-dark-teal)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Invitation Expired
          </h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.925rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            This invitation is no longer valid. Please ask your Assetly administrator to send a new invitation.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/login">
              <Button style={{ width: '100%' }}>Back to Login</Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  // 2. Already Used State
  if (inviteState === 'already_used') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backgroundColor: 'var(--main-bg)' }}>
        <GlassCard style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--health-watch-bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--health-watch)' }}>
            <CheckCircle size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-h1)', color: 'var(--primary-dark-teal)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Invitation Already Used
          </h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.925rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            This invitation has already been used to activate an account.
          </p>
          <Link to="/login">
            <Button style={{ width: '100%' }}>Sign In to Your Account</Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  // 3. Invalid Token State
  if (inviteState === 'invalid') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backgroundColor: 'var(--main-bg)' }}>
        <GlassCard style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--health-critical-bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--health-critical)' }}>
            <AlertTriangle size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-h1)', color: 'var(--primary-dark-teal)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Invalid Invitation Link
          </h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.925rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {errorMessage || 'The invitation token provided is invalid or corrupted.'}
          </p>
          <Link to="/login">
            <Button style={{ width: '100%' }}>Return to Login</Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  // 4. Valid Invitation State - Account Activation Form
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backgroundColor: 'var(--main-bg)' }}>
      <GlassCard style={{ width: '100%', maxWidth: '480px', padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--deep-teal)' }} />

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--deep-teal)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--pure-white)', boxShadow: '0 4px 12px rgba(0,70,67,0.15)' }}>
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '1.85rem', fontFamily: 'var(--font-h1)', color: 'var(--primary-dark-teal)', fontWeight: 700 }}>
            Welcome to Assetly
          </h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            You've been invited to join Assetly. Please create your password to activate your account.
          </p>
        </div>

        {/* Read-Only Account Details Card */}
        <div style={{ background: 'rgba(13, 58, 53, 0.04)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid var(--subtle-border)' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--color-laurel)', fontWeight: 700, marginBottom: '0.75rem' }}>
            Assigned User Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', fontWeight: 500 }}>Name</div>
              <div style={{ fontWeight: 600, color: 'var(--primary-dark-teal)' }}>{inviteUser?.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', fontWeight: 500 }}>Email</div>
              <div style={{ fontWeight: 600, color: 'var(--primary-dark-teal)', wordBreak: 'break-all' }}>{inviteUser?.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', fontWeight: 500 }}>Role</div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--primary-dark-teal)' }}>{inviteUser?.role}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', fontWeight: 500 }}>Assigned Zone(s)</div>
              <div style={{ fontWeight: 600, color: 'var(--primary-dark-teal)' }}>
                {inviteUser?.zones && inviteUser.zones.length > 0
                  ? inviteUser.zones.map((z) => z.code || z.name).join(', ')
                  : 'All / Global'}
              </div>
            </div>
          </div>
        </div>

        {formError && (
          <div style={{ background: 'var(--health-critical-bg)', border: '1px solid #FCA5A5', color: 'var(--health-critical)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleActivate}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Create Password (min. 6 characters) *
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Confirm Password *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-text)' }} />
              <input
                type="password"
                className="glass-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Activating Account...' : 'Activate Account'} <ArrowRight size={18} />
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};
