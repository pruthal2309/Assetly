import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/client';
import { useCan } from '../../shared/hooks/useCan';
import { useAuthStore } from '../auth/authStore';
import { DataTable } from '../../shared/ui/DataTable';
import { Chip } from '../../shared/ui/Chip';
import { Button } from '../../shared/ui/Button';
import { Modal } from '../../shared/ui/Modal';
import { Skeleton } from '../../shared/ui/Toast';
import { UserPlus, Send, AlertCircle, Key } from 'lucide-react';

export const UsersPage = () => {
  const { can } = useCan();
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('engineer');
  const [password, setPassword] = useState('');
  const [selectedZoneIds, setSelectedZoneIds] = useState([]);
  const [error, setError] = useState(null);
  const [resendSuccessId, setResendSuccessId] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await apiClient.get('/users')).data.data
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['zones'],
    queryFn: async () => (await apiClient.get('/zones')).data.data
  });

  const inviteMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient.post('/users/invite', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowInviteModal(false);
      setName('');
      setEmail('');
      setRole('engineer');
      setPassword('');
      setSelectedZoneIds([]);
      setError(null);
    },
    onError: (err) => setError(err.response?.data?.error?.message || 'Failed to send invitation')
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await apiClient.post(`/users/${userId}/resend-invite`);
      return { userId, data: res.data.data };
    },
    onSuccess: ({ userId }) => {
      setResendSuccessId(userId);
      setTimeout(() => setResendSuccessId(null), 3000);
      queryClient.invalidateQueries(['users']);
    },
    onError: (err) => alert(err.response?.data?.error?.message || 'Resend invitation failed')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ userId, updates }) => {
      const res = await apiClient.patch(`/users/${userId}`, updates);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries(['users']),
    onError: (err) => alert(err.response?.data?.error?.message || 'Update failed')
  });

  const deactivateMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await apiClient.post(`/users/${userId}/deactivate`);
      return res.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries(['users']),
    onError: (err) => alert(err.response?.data?.error?.message || 'Deactivation failed')
  });

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (['supervisor', 'engineer'].includes(role) && selectedZoneIds.length === 0) {
      setError(`At least one assigned zone is required for the ${role.charAt(0).toUpperCase() + role.slice(1)} role.`);
      return;
    }

    inviteMutation.mutate({
      name,
      email,
      role,
      password: password.trim() || undefined,
      zoneIds: selectedZoneIds
    });
  };

  const getStatusChipVariant = (status) => {
    switch (status) {
      case 'active':
        return 'healthy';
      case 'invited':
        return 'watch';
      case 'deactivated':
        return 'critical';
      default:
        return 'info';
    }
  };

  const columns = [
    {
      header: 'Name & Email',
      cell: (u) => (
        <div>
          <div style={{ fontWeight: 600 }}>{u.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-laurel)' }}>{u.email}</div>
        </div>
      )
    },
    {
      header: 'Role',
      cell: (u) => {
        const isSelf = currentUser?.id === u._id || currentUser?._id === u._id;
        return can('user:update') && !isSelf ? (
          <select
            className="glass-input"
            style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.825rem' }}
            value={u.role}
            onChange={(e) => updateMutation.mutate({ userId: u._id, updates: { role: e.target.value } })}
          >
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="engineer">Engineer</option>
            <option value="auditor">Auditor</option>
          </select>
        ) : (
          <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{u.role}</span>
        );
      }
    },
    {
      header: 'Assigned Zones',
      cell: (u) => (
        <span>
          {u.zoneIds && u.zoneIds.length > 0
            ? u.zoneIds.map((z) => z.code || z.name).join(', ')
            : 'All / Global'}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (u) => (
        <Chip variant={getStatusChipVariant(u.status)}>
          {u.status}
        </Chip>
      )
    },
    {
      header: 'Created At',
      cell: (u) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-laurel)' }}>
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (u) => {
        const isSelf = currentUser?.id === u._id || currentUser?._id === u._id;
        return (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {can('user:invite') && (
              <Button
                size="sm"
                variant="secondary"
                icon={Send}
                disabled={resendInviteMutation.isPending}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => resendInviteMutation.mutate(u._id)}
              >
                {resendSuccessId === u._id ? 'Sent!' : 'Resend Invite'}
              </Button>
            )}

            {u.status === 'active' && can('user:deactivate') && !isSelf && (
              <Button
                size="sm"
                variant="danger"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => deactivateMutation.mutate(u._id)}
              >
                Deactivate
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  if (isLoading) return <Skeleton height="350px" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem' }}>User & Team Administration</h1>
          <p style={{ color: 'var(--color-laurel)', fontSize: '0.9rem' }}>
            Invite staff members, assign roles/zones, and automatically issue credentials
          </p>
        </div>
        {can('user:invite') && (
          <Button icon={UserPlus} onClick={() => setShowInviteModal(true)}>
            Invite User
          </Button>
        )}
      </div>

      <div className="glass" style={{ padding: '1rem' }}>
        <DataTable columns={columns} data={users} />
      </div>

      {/* Invite User Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite New Staff Member">
        <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div
              style={{
                background: 'var(--health-critical-bg)',
                border: '1px solid #FCA5A5',
                color: 'var(--health-critical)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Full Name *
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Email Address *
            </label>
            <input
              type="email"
              className="glass-input"
              placeholder="rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Role Assignment *
            </label>
            <select
              className="glass-input"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setError(null);
              }}
            >
              <option value="engineer">Engineer (Field Inspections & Work Orders)</option>
              <option value="supervisor">Supervisor (Zone Oversight & Assignments)</option>
              <option value="auditor">Auditor (Organization-Wide Read-Only)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Initial Password (Optional)
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="Auto-generated if left blank (e.g. Assetly@384)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-laurel)', marginTop: '0.3rem' }}>
              Credentials will be emailed directly to the user's Mail ID via SMTP.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Assigned Zones {['supervisor', 'engineer'].includes(role) ? '*' : '(Optional)'}
            </label>
            {['supervisor', 'engineer'].includes(role) && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-laurel)', marginBottom: '0.4rem' }}>
                Select one or more zones assigned to this user.
              </p>
            )}
            {role === 'auditor' && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-laurel)', marginBottom: '0.4rem' }}>
                Auditor has organization-wide read access. Zone assignment is optional.
              </p>
            )}

            <div
              style={{
                maxHeight: '140px',
                overflowY: 'auto',
                border: '1px solid var(--subtle-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              {zones.map((z) => (
                <label
                  key={z._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '4px'
                  }}
                >
                  <input
                    type="checkbox"
                    value={z._id}
                    checked={selectedZoneIds.includes(z._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedZoneIds([...selectedZoneIds, z._id]);
                      } else {
                        setSelectedZoneIds(selectedZoneIds.filter((id) => id !== z._id));
                      }
                    }}
                  />
                  <span>{z.name} ({z.code})</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={inviteMutation.isPending} style={{ marginTop: '0.5rem' }}>
            {inviteMutation.isPending ? 'Sending Invitation...' : 'Send Invitation & Credentials'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
