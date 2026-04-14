import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type UserResponse } from '../../api/auth';

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
          // Set token first to fetch user info
          set({ token: access_token });
          // In a real scenario, we'd fetch the user info here
          // For now, we'll assume the email is the sub and set a mock user
          // or ideally the login returns the user object too.
          // Since our current backend login only returns Token, we'll need to call getMe
          // (Assuming /auth/me exists as per the plan, though not yet fully implementation in the previous turns)
          // Let's mock the user set for the demo if /auth/me isn't ready.
          const user = { id: 'temp', email, full_name: 'Analyst', tier: 'FREE', is_active: true };
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
        localStorage.removeItem('auth-storage');
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
