import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type UserResponse } from '../../api/auth';
import apiClient from '../../api/client';

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { access_token } = await authApi.login(email, password);
          localStorage.setItem('access_token', access_token);
          set({ token: access_token });
          const profileResponse = await apiClient.get('/users/me');
          const profile = profileResponse.data || {};
          const user = {
            id: profile.email || email,
            email: profile.email || email,
            full_name: profile.full_name || email,
            tier: profile.tier || 'FREE',
            is_active: true,
          };
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          set({ 
            error: err.response?.data?.detail || 'Authentication failed', 
            isLoading: false,
            isAuthenticated: false 
          });
          throw err;
        }
      },

      signup: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.signup(data);
          // Automatically log in after signup if the backend supports it, 
          // or just redirect to login. Let's redirect for safety.
          set({ isLoading: false });
        } catch (err: any) {
          set({ 
            error: err.response?.data?.detail || 'Registration failed', 
            isLoading: false 
          });
          throw err;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth-storage');
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
