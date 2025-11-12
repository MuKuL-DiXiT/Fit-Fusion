const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface FoodLogEntry {
  log_id: number;
  quantity_grams: number;
  total_calories: number;
  log_date: string;
  food_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
}

export interface ExerciseLogEntry {
  log_id: number;
  duration_minutes: number;
  total_calories_burned: number;
  log_date: string;
  exercise_name: string;
  calories_burned_per_minute: number;
}

export interface DailySummary {
  date: string;
  total_food_calories: number;
  total_exercise_calories: number;
  net_calories: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

class HealthService {
  private async makeRequest<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
      console.error('Health API request failed:', error);
      throw error;
    }
  }

  async getFoodLogs(startDate?: string, endDate?: string, limit = 50): Promise<ApiResponse<FoodLogEntry[]>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit.toString());

    return this.makeRequest(`/api/health/food-logs?${params.toString()}`);
  }

  async addFoodLog(food_name: string, quantity_grams: number): Promise<ApiResponse<FoodLogEntry>> {
    return this.makeRequest('/api/health/food-logs', {
      method: 'POST',
      body: JSON.stringify({ food_name, quantity_grams }),
    });
  }

  async deleteFoodLog(logId: number): Promise<ApiResponse<void>> {
    return this.makeRequest(`/api/health/food-logs/${logId}`, {
      method: 'DELETE',
    });
  }

  async getExerciseLogs(startDate?: string, endDate?: string, limit = 50): Promise<ApiResponse<ExerciseLogEntry[]>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit.toString());

    return this.makeRequest(`/api/health/exercise-logs?${params.toString()}`);
  }

  async addExerciseLog(exercise_name: string, duration_minutes: number): Promise<ApiResponse<ExerciseLogEntry>> {
    return this.makeRequest('/api/health/exercise-logs', {
      method: 'POST',
      body: JSON.stringify({ exercise_name, duration_minutes }),
    });
  }

  async deleteExerciseLog(logId: number): Promise<ApiResponse<void>> {
    return this.makeRequest(`/api/health/exercise-logs/${logId}`, {
      method: 'DELETE',
    });
  }

  async getDailySummary(date?: string): Promise<ApiResponse<DailySummary>> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);

    return this.makeRequest(`/api/health/summary?${params.toString()}`);
  }

  async getTodaysSummary(): Promise<ApiResponse<DailySummary>> {
    const today = new Date().toISOString().split('T')[0];
    return this.getDailySummary(today);
  }

  async getWeeklyLogs(): Promise<{ foodLogs: FoodLogEntry[], exerciseLogs: ExerciseLogEntry[] }> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const startDate = weekAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const [foodResponse, exerciseResponse] = await Promise.all([
      this.getFoodLogs(startDate, endDate, 100),
      this.getExerciseLogs(startDate, endDate, 100)
    ]);

    return {
      foodLogs: foodResponse.data || [],
      exerciseLogs: exerciseResponse.data || []
    };
  }
}

export const healthService = new HealthService();
