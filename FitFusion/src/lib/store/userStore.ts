import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  provider?: 'google' | 'credentials';
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
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
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
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  type: 'Weight Loss' | 'Muscle Gain' | 'Maintenance' | 'General Health';
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
  // User authentication
  user: User | null;
  isAuthenticated: boolean;
  
  // Cart management
  cart: CartItem[];
  
  // Orders
  orders: Order[];
  
  // Diet plans
  dietPlans: DietPlan[];
  currentDietPlan: DietPlan | null;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  
  // Cart actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Diet plan actions
  addDietPlan: (plan: DietPlan) => void;
  removeDietPlan: (planId: string) => void;
  setCurrentDietPlan: (planId: string) => void;
  updateDietPlan: (planId: string, updates: Partial<DietPlan>) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      cart: [],
      orders: [],
      dietPlans: [],
      currentDietPlan: null,
      
      // Authentication actions
      login: (user: User) => {
        set({ user, isAuthenticated: true });
      },
      
      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false,
          cart: [],
          dietPlans: [],
          currentDietPlan: null
        });
      },
      
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
      
      // Cart actions
      addToCart: (item: CartItem) => {
        const currentCart = get().cart;
        const existingItem = currentCart.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
          set({
            cart: currentCart.map(cartItem =>
              cartItem.id === item.id
                ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                : cartItem
            )
          });
        } else {
          set({ cart: [...currentCart, item] });
        }
      },
      
      removeFromCart: (itemId: string) => {
        set({ cart: get().cart.filter(item => item.id !== itemId) });
      },
      
      updateCartQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }
        
        set({
          cart: get().cart.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          )
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
        const currentPlans = get().dietPlans.filter(plan => plan.id !== planId);
        const currentPlan = get().currentDietPlan;
        
        set({
          dietPlans: currentPlans,
          currentDietPlan: currentPlan?.id === planId ? null : currentPlan
        });
      },
      
      setCurrentDietPlan: (planId: string) => {
        const plan = get().dietPlans.find(p => p.id === planId);
        set({ currentDietPlan: plan || null });
      },
      
      updateDietPlan: (planId: string, updates: Partial<DietPlan>) => {
        set({
          dietPlans: get().dietPlans.map(plan =>
            plan.id === planId ? { ...plan, ...updates } : plan
          )
        });
        
        const currentPlan = get().currentDietPlan;
        if (currentPlan?.id === planId) {
          set({ currentDietPlan: { ...currentPlan, ...updates } });
        }
      }
    }),
    {
      name: 'fitfusion-user-store',
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
