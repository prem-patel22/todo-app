// frontend/src/hooks/useAuth.ts
import { create } from 'zustand';
import { authService } from '../services/authService';

interface AuthState {
  user: any | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  login: async (email: string, password: string) => {
    const user = await authService.login(email, password);
    set({ user });
  },
  register: async (email: string, password: string, name: string) => {
    const user = await authService.register(email, password, name);
    set({ user });
  },
  logout: () => {
    authService.logout();
    set({ user: null });
  },
  checkAuth: async () => {
    try {
      const user = await authService.getCurrentUser();
      set({ user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));