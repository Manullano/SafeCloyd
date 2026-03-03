import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company_id?: string;
  is_active?: boolean;
  created_at?: string;
}

interface AuthStore {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  getCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isLoading: false,
      
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
          const response = await fetch(`${apiUrl}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
          }

          const data = await response.json();
          const user: User = {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.full_name,
            role: data.user.role,
            company_id: data.user.company?.id || data.user.company_id,
            is_active: data.user.is_active,
            created_at: data.user.created_at,
          };

          set({
            user,
            access_token: data.access,
            refresh_token: data.refresh,
            isLoading: false,
          });

          // Siempre guardar en localStorage para persistencia
          localStorage.setItem('auth-store', JSON.stringify({
            user,
            access_token: data.access,
            refresh_token: data.refresh,
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, access_token: null, refresh_token: null });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      },

      setUser: (user: User) => {
        set({ user });
      },

      setTokens: (access: string, refresh: string) => {
        set({ access_token: access, refresh_token: refresh });
        // Guardar en cache también para persistencia
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-store', JSON.stringify({
            user: useAuthStore.getState().user,
            access_token: access,
            refresh_token: refresh,
            isLoading: false,
          }));
        }
      },

      getCurrentUser: async () => {
        try {
          set({ isLoading: true });
          const token = localStorage.getItem('accessToken') || 
                       (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('auth-store') || '{}').access_token : null);
          
          if (!token) {
            set({ user: null, isLoading: false });
            return;
          }

          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
          const response = await fetch(`${apiUrl}/auth/me/`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const user: User = {
              id: data.id,
              email: data.email,
              full_name: data.full_name,
              role: data.role,
              company_id: data.company?.id || data.company_id,
              is_active: data.is_active,
              created_at: data.created_at,
            };
            set({ user, isLoading: false });
            localStorage.setItem('auth-store', JSON.stringify({
              user,
              access_token: token,
              refresh_token: localStorage.getItem('refreshToken') || '',
              isLoading: false,
            }));
          } else {
            set({ user: null, isLoading: false });
          }
        } catch (error) {
          console.error('Error fetching current user:', error);
          set({ user: null, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-store',
    }
  )
);

// Alias for convenience
export const useAuth = useAuthStore;
