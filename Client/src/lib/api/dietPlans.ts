const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface DietPlan {
  plan_id: number;
  user_id: number;
  plan_name: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  item_count?: number;
  total_calories?: number;
  is_ai_generated?: boolean;
}

export interface DietPlanItem {
  item_id: number;
  plan_id: number;
  food_id?: number;
  product_id?: number;
  meal_time: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';
  quantity: number;
  calories: number;
  food_name?: string;
  product_name?: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fats_per_100g?: number;
}

export interface FoodData {
  food_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
}

export interface CreateDietPlanData {
  planName: string;
  startDate?: string;
  endDate?: string;
  items?: Omit<DietPlanItem, 'item_id' | 'plan_id'>[];
  foods?: FoodData[];
}

export interface AIGenerationData {
  goals: string;
  dietType: string;
  restrictions?: string[];
  targetCalories?: number;
}

class DietPlanService {
  private baseUrl = 'http://localhost:3001';

  private async makeRequest<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        const msg = data && typeof data === 'object' && 'message' in (data as Record<string, unknown>) ? String((data as Record<string, unknown>).message) : 'Request failed';
        throw new Error(msg);
      }
      
      return data as T;
    } catch (error) {
      console.error('Diet Plan API request failed:', error);
      throw error;
    }
  }

  async getAllPlans(): Promise<{ success: boolean; plans: DietPlan[]; message?: string }> {
    return this.makeRequest('/api/diet-plans');
  }

  async getRecentPlans(): Promise<{ success: boolean; plans: DietPlan[]; message?: string }> {
    return this.makeRequest('/api/diet-plans/recent');
  }

  async getPlan(planId: number): Promise<{ success: boolean; plan: DietPlan; items: DietPlanItem[]; message?: string }> {
    return this.makeRequest(`/api/diet-plans/${planId}`);
  }

  async createPlan(planData: CreateDietPlanData): Promise<{ success: boolean; plan: DietPlan; message?: string }> {
    return this.makeRequest('/api/diet-plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async updatePlan(planId: number, planData: Partial<CreateDietPlanData>): Promise<{ success: boolean; plan: DietPlan; message?: string }> {
    return this.makeRequest(`/api/diet-plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    });
  }

  async deletePlan(planId: number): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/api/diet-plans/${planId}`, {
      method: 'DELETE',
    });
  }

  async addItemToPlan(planId: number, item: Omit<DietPlanItem, 'item_id' | 'plan_id'>): Promise<{ success: boolean; item: DietPlanItem; message?: string }> {
    return this.makeRequest(`/api/diet-plans/${planId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async removeItemFromPlan(planId: number, itemId: number): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest(`/api/diet-plans/${planId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async generateAIPlan(aiData: AIGenerationData): Promise<{ success: boolean; plan: DietPlan; message?: string }> {
    return this.makeRequest('/api/diet-plans/generate-ai', {
      method: 'POST',
      body: JSON.stringify(aiData),
    });
  }
}

export const dietPlanService = new DietPlanService();