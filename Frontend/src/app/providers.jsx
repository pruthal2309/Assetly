import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../features/auth/authStore';
import { apiClient } from '../shared/api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

export const AppProviders = ({ children }) => {
  const { setAuthData, setInitializing } = useAuthStore();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const bootstrapAuth = async () => {
      try {
        // Try silent refresh
        const refreshRes = await apiClient.post('/auth/refresh');
        const newAccessToken = refreshRes.data.data.accessToken;

        // Fetch current user and permission matrix
        const meRes = await apiClient.get('/auth/me', {
          headers: { Authorization: `Bearer ${newAccessToken}` }
        });

        const { user, zones, permissions } = meRes.data.data;
        setAuthData({ user, zones, permissions, accessToken: newAccessToken });
      } catch (err) {
        // Unauthenticated session
        setInitializing(false);
      }
    };

    bootstrapAuth();
  }, [setAuthData, setInitializing]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
