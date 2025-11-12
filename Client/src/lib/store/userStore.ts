import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  authService,
  type User as AuthUser,
  type SignupData,
  type LoginData,
} from "@/lib/auth/authService";

export interface User {
  userId: number;
  username: string;
  email: string;
  phone_number?: string;
  address?: string;
  role: string;
  created_at: string;
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    loginData: LoginData
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    signupData: SignupData
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean }>;
  updateProfile: (
    userData: Partial<User>
  ) => Promise<{ success: boolean; error?: string }>;
  checkAuth: () => Promise<void>;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (loginData: LoginData) => {
        set({ isLoading: true });
        try {
          const result = await authService.login(loginData);
          if (result.success && result.user) {
            set({ user: result.user, isAuthenticated: true, isLoading: false });
            return { success: true };
          }
          set({ isLoading: false });
          return { success: false, error: result.message };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : "Login failed",
          };
        }
      },

      signup: async (signupData: SignupData) => {
        set({ isLoading: true });
        try {
          const result = await authService.signup(signupData);
          if (result.success && result.user) {
            set({ user: result.user, isAuthenticated: true, isLoading: false });
            return { success: true };
          }
          set({ isLoading: false });
          return { success: false, error: result.message };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : "Signup failed",
          };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false };
        }
      },

      updateProfile: async (userData: Partial<User>) => {
        set({ isLoading: true });
        try {
          const result = await authService.updateProfile(userData);
          if (result.success && result.user) {
            set({ user: result.user, isLoading: false });
            return { success: true };
          }
          set({ isLoading: false });
          return { success: false, error: result.message };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error instanceof Error ? error.message : "Update failed",
          };
        }
      },

      checkAuth: async () => {
        try {
          const result = await authService.getProfile();
          if (result.success && result.user) {
            set({ user: result.user, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "fitfusion-user-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
