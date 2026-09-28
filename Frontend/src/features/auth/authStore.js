import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  zones: [],
  permissions: {},
  isAuthenticated: false,
  isInitializing: true,

  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: Boolean(token) }),

  setAuthData: ({ user, zones, permissions, accessToken }) =>
    set({
      user,
      zones: zones || [],
      permissions: permissions || {},
      accessToken: accessToken || null,
      isAuthenticated: Boolean(user),
      isInitializing: false
    }),

  setInitializing: (val) => set({ isInitializing: val }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      zones: [],
      permissions: {},
      isAuthenticated: false,
      isInitializing: false
    })
}));
