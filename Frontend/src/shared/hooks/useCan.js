import { useAuthStore } from '../../features/auth/authStore';

export const useCan = () => {
  const permissions = useAuthStore((state) => state.permissions) || {};
  const role = useAuthStore((state) => state.user?.role);

  const can = (perm) => {
    if (!perm) return true;
    if (role === 'admin') return true;
    return Boolean(permissions[perm]);
  };

  return { can, permissions, role };
};
