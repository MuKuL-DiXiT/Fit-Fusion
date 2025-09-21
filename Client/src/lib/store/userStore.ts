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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
}

interface Meal {
  name: string;
  foods: string[];
  calories: number;
}

interface Order {
  id: string;
  date: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
}

interface DietPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // in days
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  type: "Weight Loss" | "Muscle Gain" | "Maintenance" | "General Health";
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks: Meal;
  };
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  rating: number;
  isCustom: boolean;
  createdAt: Date;
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  cart: CartItem[];
  orders: Order[];
  dietPlans: DietPlan[];
  currentDietPlan: DietPlan | null;

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

  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;

  addDietPlan: (plan: DietPlan) => void;
  removeDietPlan: (planId: string) => void;
  setCurrentDietPlan: (planId: string) => void;
  updateDietPlan: (planId: string, updates: Partial<DietPlan>) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      cart: [],
      orders: [],
      dietPlans: [],
      currentDietPlan: null,

      login: async (loginData: LoginData) => {
        set({ isLoading: true });
        try {
          const result = await authService.login(loginData);
          if (result.success && result.user) {
            set({ user: result.user, isAuthenticated: true, isLoading: false });
            return { success: true, user: result.user };
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
            cart: [],
            dietPlans: [],
            currentDietPlan: null,
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

      addToCart: (item: CartItem) => {
        const existingItem = get().cart.find(
          (cartItem) => cartItem.id === item.id
        );

        if (existingItem) {
          get().updateCartQuantity(
            item.id,
            existingItem.quantity + item.quantity
          );
        } else {
          set({ cart: [...get().cart, item] });
        }
      },

      removeFromCart: (itemId: string) => {
        set({ cart: get().cart.filter((item) => item.id !== itemId) });
      },

      updateCartQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }

        set({
          cart: get().cart.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ cart: [] });
      },

      // Diet plan actions
      addDietPlan: (plan: DietPlan) => {
        set({ dietPlans: [...get().dietPlans, plan] });
      },

      removeDietPlan: (planId: string) => {
        const currentPlans = get().dietPlans.filter(
          (plan) => plan.id !== planId
        );
        const currentPlan = get().currentDietPlan;

        set({
          dietPlans: currentPlans,
          currentDietPlan: currentPlan?.id === planId ? null : currentPlan,
        });
      },

      setCurrentDietPlan: (planId: string) => {
        const plan = get().dietPlans.find((p) => p.id === planId);
        set({ currentDietPlan: plan || null });
      },

      updateDietPlan: (planId: string, updates: Partial<DietPlan>) => {
        set({
          dietPlans: get().dietPlans.map((plan) =>
            plan.id === planId ? { ...plan, ...updates } : plan
          ),
        });

        const currentPlan = get().currentDietPlan;
        if (currentPlan?.id === planId) {
          set({ currentDietPlan: { ...currentPlan, ...updates } });
        }
      },
    }),
    {
      name: "fitfusion-user-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        cart: state.cart,
        dietPlans: state.dietPlans,
        currentDietPlan: state.currentDietPlan,
      }),
    }
  )
);
