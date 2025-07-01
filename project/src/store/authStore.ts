import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, LoginCredentials, RegisterData, User } from '../services/authService';
import { logAction } from '../utils/logger';
import toast from 'react-hot-toast';

export type UserRole = 'business_person' | 'investor' | 'banker' | 'business_advisor';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);
          if (response.success) {
            set({
              user: response.data.user,
              isLoading: false,
              isAuthenticated: true
            });
            logAction('USER_LOGIN', {
              userId: response.data.user.id,
              email: response.data.user.email
            });
            toast.success(`Welcome back, ${response.data.user.name}!`);
            return true;
          } else {
            set({ isLoading: false });
            toast.error('Login failed');
            return false;
          }
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.message || 'Login failed');
          return false;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);
          if (response.success) {
            set({
              user: response.data.user,
              isLoading: false,
              isAuthenticated: true
            });
            logAction('USER_REGISTER', {
              userId: response.data.user.id,
              email: response.data.user.email,
              role: response.data.user.role
            });
            toast.success(`Welcome, ${response.data.user.name}!`);
            return true;
          } else {
            set({ isLoading: false });
            toast.error('Registration failed');
            return false;
          }
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.message || 'Registration failed');
          return false;
        }
      },

      logout: async () => {
        const { user } = get();
        try {
          await authService.logout();
          if (user) {
            logAction('USER_LOGOUT', { userId: user.id });
          }
          set({ user: null, isAuthenticated: false });
          toast.success('Logged out successfully');
        } catch (error: any) {
          console.error('Logout error:', error);
          set({ user: null, isAuthenticated: false });
          toast.success('Logged out successfully');
        }
      },

      getCurrentUser: async () => {
        if (!authService.isAuthenticated()) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        try {
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: true });
        } catch (error: any) {
          console.error('Get current user error:', error);
          set({ user: null, isAuthenticated: false });
          localStorage.removeItem('token');
        }
      },

      updateProfile: async (profileData: Partial<User>) => {
        const { user } = get();
        if (!user) return false;
        try {
          const updatedUser = await authService.updateProfile(profileData);
          set({ user: updatedUser });
          logAction('PROFILE_UPDATED', {
            userId: user.id,
            updatedFields: Object.keys(profileData)
          });
          toast.success('Profile updated successfully');
          return true;
        } catch (error: any) {
          toast.error(error.message || 'Failed to update profile');
          return false;
        }
      },

      clearAuth: () => {
        set({ user: null, isAuthenticated: false });
        localStorage.removeItem('token');
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);

export const initializeAuth = async () => {
  const { getCurrentUser } = useAuthStore.getState();
  await getCurrentUser();
};