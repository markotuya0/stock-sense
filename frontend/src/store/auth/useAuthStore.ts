import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          set({ user: session?.user ?? null, isInitialized: true });

          supabase.auth.onAuthStateChange((_event, session) => {
            set({ user: session?.user ?? null });
          });
        } catch (error) {
          set({ isInitialized: true });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          set({ user: data.user, isLoading: false });
        } catch (err: any) {
          set({
            error: err.message || 'Authentication failed',
            isLoading: false,
          });
          throw err;
        }
      },

      signup: async (email, password, fullName) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                tier: 'FREE',
              },
            },
          });
          if (error) throw error;
          set({ user: data.user, isLoading: false });
        } catch (err: any) {
          set({
            error: err.message || 'Registration failed',
            isLoading: false,
          });
          throw err;
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'supabase-auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
